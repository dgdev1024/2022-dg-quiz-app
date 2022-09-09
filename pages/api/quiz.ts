/**
 * @file api/quiz.ts
 */

import * as uuid from "uuid";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@lib/prisma";
import {
  DeleteQuizResponseBody,
  GetQuizResponseBody,
  PostQuizRequestBody,
  PostQuizResponseBody,
  PutQuizRequestBody,
  PutQuizResponseBody,
} from "types/quiz-app-types";
import {
  validateQuizDates,
  validateQuizDescription,
  validateQuizName,
  validateQuizQuestions,
} from "@lib/quiz-validation";
import { scrubHtmlString } from "@lib/sanitize-html";

const methods = {
  async get(req: NextApiRequest, res: NextApiResponse<GetQuizResponseBody>) {
    // Make sure the caller is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // Get the ID of the quiz to be fetched from the query parameters. Make sure it exists, too.
      const quizId = req.query?.id as string;
      if (!quizId || quizId === "undefined") {
        return res.status(400).json({ error: "Please provide a quiz ID." });
      }

      // Look for a quiz with the given ID in the database.
      const getQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });

      // Make sure the quiz was found.
      if (!getQuiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      // Check to see if the logged-in user is the author of this quiz.
      const isAuthor = getQuiz.authorId === session.user.id;

      // Construct the response to be returned.
      const response: GetQuizResponseBody = {
        quiz: {
          isAuthor,
          name: getQuiz.name,
          description: getQuiz.description,
          version: getQuiz.version,
          keywords: getQuiz.keywords,
          dateCreated: getQuiz.dateCreated,
          dateUpdated: getQuiz.dateUpdated,
          dateOpens: getQuiz.dateOpens,
          dateCloses: getQuiz.dateCloses,
          questions: isAuthor === true ? getQuiz.questions : [],
          batteryCount: getQuiz.batteryCount,
        },
      };

      // Return the response.
      return res.status(200).json(response);
    } catch (err) {
      console.error(`GET /api/quiz: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },

  async post(req: NextApiRequest, res: NextApiResponse<PostQuizResponseBody>) {
    // Make sure our author is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // Grab the new quiz's name, description and questions from the request body.
      const quiz = req.body as PostQuizRequestBody;

      // Validate the quiz's input.
      const issues: string[] = [
        validateQuizName(quiz.name),
        validateQuizDescription(quiz.description),
        validateQuizDates(quiz.dateOpens, quiz.dateCloses),
        ...validateQuizQuestions(quiz.questions),
      ].filter((issue) => issue !== "");

      if (issues.length > 0) {
        return res.status(400).json({
          error: "There were issues validating your submission.",
          issues,
        });
      }

      const keywordSet: string[] = [
        ...new Set([
          ...quiz.name
            .split(" ")
            .map((keyword) =>
              keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
            ),
          ...quiz.description
            .split(" ")
            .map((keyword) =>
              keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
            ),
          ...(quiz?.keywords || []).map((keyword) =>
            keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
          ),
        ]),
      ];

      // Assign GUIDs to the new quiz's questions.
      quiz.questions = quiz.questions.map((question) => ({
        ...question,
        guid: uuid.v4(),
      }));

      // Upload the quiz.
      const postedQuiz = await prisma.quiz.create({
        data: {
          authorId: session.user.id,
          ...quiz,
          keywords: keywordSet,
        },
      });

      // Return the posted quiz's ID in the response body.
      return res.status(201).json({
        id: postedQuiz.id,
      });
    } catch (err) {
      console.error(`POST /api/quiz: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },

  async put(req: NextApiRequest, res: NextApiResponse<PutQuizResponseBody>) {
    // Make sure our author is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // Get the ID of the quiz and fetch it, first. We need to determine if...
      //
      // - ...a quiz with the given ID exists in the database.
      // - ...the logged-in user is the author of that quiz.
      const quizId = req.query?.id as string;
      if (!quizId || quizId === "undefined") {
        return res.status(400).json({ error: "Please provide a quiz ID." });
      }

      // Grab the details of the edited quiz from the request body.
      const editedQuiz = req.body as PutQuizRequestBody;
      console.log(editedQuiz);

      // Validate the quiz's input.
      const issues: string[] = [
        validateQuizName(editedQuiz.name),
        validateQuizDescription(editedQuiz.description),
        validateQuizDates(editedQuiz.dateOpens, editedQuiz.dateCloses),
        ...validateQuizQuestions(editedQuiz.questions),
      ].filter((issue) => issue !== "");

      if (issues.length > 0) {
        return res.status(400).json({
          error: "There were issues validating your submission.",
          issues,
        });
      }

      const keywordSet: string[] = [
        ...new Set([
          ...editedQuiz.name
            .split(" ")
            .map((keyword) =>
              keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
            ),
          ...editedQuiz.description
            .split(" ")
            .map((keyword) =>
              keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
            ),
          ...(editedQuiz?.keywords || []).map((keyword) =>
            keyword.toLowerCase().replace(/[^a-zA-Z0-9]/g, "")
          ),
        ]),
      ];

      // Fetch the quiz and get its author ID.
      const fetchedQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: {
          authorId: true,
          dateOpens: true,
          dateCloses: true,
          version: true,
          batteryCount: true,
        },
      });

      // Make sure the quiz is present...
      if (!fetchedQuiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      // ...and that the logged-in user is the author of that quiz.
      if (fetchedQuiz.authorId !== session.user.id) {
        return res
          .status(403)
          .json({ error: "You are not the author of this quiz." });
      }

      // If this quiz has a closure date, then make sure that the current
      // date is not in between this quiz's open and closure times.
      if (fetchedQuiz.dateCloses) {
        const currentTime = Date.now();

        if (
          currentTime >= fetchedQuiz.dateOpens.getTime() &&
          currentTime <= fetchedQuiz.dateCloses.getTime()
        ) {
          return res.status(403).json({
            error:
              "This quiz is currently open and has a closure date. You must wait until after the quiz has closed before you can update it.",
          });
        }
      }

      // Check to see if new questions were added to the quiz. New questions will have no
      // GUID assigned to them.
      let hasNewQuestions = editedQuiz.questions.some(
        (question) => question.guid === ""
      );

      // If there are new questions in this quiz, then assign new GUIDs to them.
      if (hasNewQuestions === true) {
        editedQuiz.questions = editedQuiz.questions.map((question) => {
          if (question.guid === "") {
            return question;
          } else {
            hasNewQuestions = true;
            return { ...question, guid: uuid.v4() };
          }
        });
      }

      console.log(editedQuiz.questions);

      // Update the quiz and questions in the database.
      const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          name: editedQuiz.name,
          description: editedQuiz.description,
          keywords: keywordSet,
          dateUpdated: new Date(),
          questions: editedQuiz.questions,
          version:
            hasNewQuestions === true ||
            editedQuiz.batteryCount !== fetchedQuiz.batteryCount
              ? fetchedQuiz.version + 1
              : fetchedQuiz.version,
        },
      });

      // Return the updated quiz's ID in the response body.
      return res.status(200).json({ id: updatedQuiz.id });
    } catch (err) {
      console.error(`PUT /api/quiz: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },

  async remove(
    req: NextApiRequest,
    res: NextApiResponse<DeleteQuizResponseBody>
  ) {
    // Make sure our author is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // Get the ID of the quiz to be deleted from the request query.
      const quizId = req.query?.id as string;
      if (!quizId || quizId === "undefined") {
        return res.status(400).json({ error: "Please provide a quiz ID." });
      }

      // Make sure the quiz with the given ID exists in the database.
      const fetchedQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { authorId: true, dateOpens: true, dateCloses: true },
      });

      if (!fetchedQuiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      // Make sure that the logged-in user is the author of this quiz.
      if (fetchedQuiz.authorId !== session.user.id) {
        return res
          .status(403)
          .json({ error: "You are not the author of this quiz." });
      }

      // If this quiz has a closure date, then make sure that the current
      // date is not in between this quiz's open and closure times.
      if (fetchedQuiz.dateCloses) {
        const currentTime = Date.now();

        if (
          currentTime >= fetchedQuiz.dateOpens.getTime() &&
          currentTime <= fetchedQuiz.dateCloses.getTime()
        ) {
          return res.status(403).json({
            error:
              "This quiz is currently open and has a closure date. You must wait until after the quiz has closed before you can delete it.",
          });
        }
      }

      // Now delete the quiz.
      const deletedQuiz = await prisma.quiz.delete({
        where: { id: quizId },
      });

      // Return the deleted quiz in the response body.
      return res.status(200).json({
        quiz: {
          isAuthor: true,
          name: deletedQuiz.name,
          description: deletedQuiz.description,
          questions: deletedQuiz.questions,
        },
      });
    } catch (err) {
      console.error(`DELETE /api/quiz: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "GET":
      return await methods.get(req, res);
    case "POST":
      return await methods.post(req, res);
    case "PUT":
      return await methods.put(req, res);
    case "DELETE":
      return await methods.remove(req, res);
  }

  return res.status(405).json({ error: "This method is not allowed." });
};
