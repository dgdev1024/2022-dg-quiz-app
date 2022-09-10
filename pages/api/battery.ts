/**
 * @file pages/api/battery.ts
 */

import * as uuid from "uuid";
import moment from "moment";
import { NextApiRequest, NextApiResponse } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { authOptions } from "@api/auth/[...nextauth]";
import { prisma } from "@lib/prisma";
import {
  RequestBatteryResponseBody,
  ResolveBatteryResponseBody,
  SubmitBatteryRequestBody,
  SubmitBatteryResponseBody,
} from "types/quiz-app-types";
import { Battery, Quiz } from "@prisma/client";
import { getRandomInclusiveInt } from "@lib/random";

/**
 * Compares the present time to the opening and closing date of a fetched quiz to determine if it's open.
 * @param dateOpens The date when the quiz opened or will open.
 * @param dateCloses The date when the quiz closed or will close, or null if the quiz has no close date.
 * @returns A string indicating if the quiz is not yet open or has closed, or a blank string if the
 * quiz is currently open.
 */
const checkQuizDateRange = (
  dateOpens: Date,
  dateCloses: Date | null
): string => {
  const now = new Date();

  if (now.getTime() < dateOpens.getTime()) {
    return `The quiz is not yet open. It will open ${moment(
      dateOpens
    ).fromNow()}.`;
  }

  if (dateCloses) {
    if (now.getTime() >= dateCloses.getTime()) {
      return `The quiz has closed. It closed ${moment(dateCloses).fromNow()}.`;
    }
  }

  return "";
};

/**
 * Generates a new quiz battery from the given quiz.
 * @param fromQuiz The quiz to generate the battery from.
 * @returns The generated battery.
 */
const generateQuizBattery = (fromQuiz: Quiz): Battery => {
  // Create the battery object to be returned.
  const returnBattery: Battery = {
    id: uuid.v4(),
    quizId: fromQuiz.id,
    quizVersion: fromQuiz.version,
    questions: [],
    answers: [],
    complete: false,
    correct: -1,
  };

  // Pull the quiz questions from the quiz's bank.
  const questionBank = fromQuiz.questions;

  // How many questions should be in the battery?
  const questionCount =
    fromQuiz.batteryCount < questionBank.length
      ? fromQuiz.batteryCount
      : questionBank.length;

  while (returnBattery.questions.length < questionCount) {
    // Check to see if the question bank has been exhausted. This should not happen.
    if (questionBank.length === 0) {
      throw new Error("Quiz question bank has been exhausted unexpectedly!");
    }

    // Generate a random index and grab the question from that index.
    const randomIndex = getRandomInclusiveInt(0, questionBank.length - 1);
    const randomQuestion = questionBank[randomIndex];

    // Get the choices from this question, excluding the correct answer.
    const choiceBank = randomQuestion.choices.map((_, index) => index).slice(1);
    console.log(choiceBank);

    // An array to store the indices of the selected choices. The 0th index
    // is always the correct answer.
    const selectedChoices = [0];

    // Each question will have five choices.
    while (selectedChoices.length < 5) {
      // Generate two random numbers.
      //
      // The first random number is the index of the next choice to grab.
      const randomChoiceIndex = getRandomInclusiveInt(0, choiceBank.length - 1);

      // The second random number determines whether that choice should be added
      // to the beginning or end of the selected choices array.
      const insertAtEnd = getRandomInclusiveInt(0, 1000) > 500;

      // Insert the choice at either the start or end of the selected choices array.
      if (insertAtEnd === true) {
        selectedChoices.push(choiceBank[randomChoiceIndex]);
      } else {
        selectedChoices.unshift(choiceBank[randomChoiceIndex]);
      }

      // Splice the choice with the generated index from the choice bank.
      choiceBank.splice(randomChoiceIndex, 1);
    }

    // Insert the question and generated choices into the battery.
    returnBattery.questions.push({
      id: randomQuestion.guid,
      choices: selectedChoices,
    });

    // Also insert a null answer into the answers array.
    returnBattery.answers.push(-1);

    // Now splice the question with the generated index from the question bank,
    // so that it cannot be selected again in future iterations of this loop.
    questionBank.splice(randomIndex, 1);
  }

  return returnBattery;
};

const resolveQuizBattery = (
  fromBattery: Battery,
  fromQuiz: Quiz
): ResolveBatteryResponseBody => {
  const resolvedBattery: ResolveBatteryResponseBody = {
    name: fromQuiz.name,
    description: fromQuiz.description,
    questions: [],
    answers: fromBattery.answers,
    outdated: false,
    complete: fromBattery.complete,
    correct: fromBattery.correct as number,
    open: checkQuizDateRange(fromQuiz.dateOpens, fromQuiz.dateCloses) === "",
  };

  if (fromBattery.quizVersion < fromQuiz.version) {
    resolvedBattery.outdated = true;
    return resolvedBattery;
  }

  for (const batteryQuestion of fromBattery.questions) {
    const quizQuestion = fromQuiz.questions.find(
      (question) => question.guid === batteryQuestion.id
    );

    if (!quizQuestion) {
      throw new Error("Failed to resolve battery question!");
    }

    resolvedBattery.questions?.push({
      guid: quizQuestion.guid,
      body: quizQuestion.body,
      choices: batteryQuestion.choices.map(
        (choice) => quizQuestion.choices[choice]
      ),
    });
  }

  return resolvedBattery;
};

const methods = {
  async post(
    req: NextApiRequest,
    res: NextApiResponse<RequestBatteryResponseBody>
  ) {
    // Make sure our author is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // First and foremost, we will need to fetch the logged-in user in order to get
      // that user's quiz batteries.
      const fetchedUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { batteries: true },
      });
      if (!fetchedUser) {
        // The user should exist. If it doesn't, then throw.
        throw new Error(
          "Expected the logged-in user to be present in the database, but did not find one!"
        );
      }

      // Get the ID of the quiz to request a battery for from the query parameters.
      const quizId = req.query?.id as string;
      if (!quizId || quizId === "undefined") {
        return res.status(400).json({ error: "Please provide a quiz ID." });
      }

      // Attempt to fetch the quiz from the database.
      const fetchedQuiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });
      if (!fetchedQuiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      // Check to see if the quiz is open.
      const openStatusString = checkQuizDateRange(
        fetchedQuiz.dateOpens,
        fetchedQuiz.dateCloses
      );
      if (openStatusString !== "") {
        return res.status(403).json({ error: openStatusString });
      }

      // First, check to see if the user already has a battery for this quiz.
      const { batteries } = fetchedUser;
      const existingBatteryIndex = batteries.findIndex(
        (battery) => battery.quizId === fetchedQuiz.id
      );

      if (existingBatteryIndex !== -1) {
        // Check to see if the battery was from the current version of the fetched quiz.
        const battery = batteries[existingBatteryIndex];
        if (battery.quizVersion === fetchedQuiz.version) {
          const { id, quizId, quizVersion, questions, complete, correct } =
            battery;

          return res.status(200).json({
            id,
            quizId,
            quizVersion,
            questions,
            complete,
            correct: (complete ? correct : -1) as number,
          });
        } else {
          // If a new version of the quiz is available, then remove the old
          // battery before creating a new battery.
          batteries.splice(existingBatteryIndex, 1);
        }
      }

      // Generate a new quiz battery and push it into the user's batteries array.
      const newBattery = generateQuizBattery(fetchedQuiz);
      batteries.push(newBattery);

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          batteries,
        },
      });

      return res.status(201).json({
        id: newBattery.id,
        quizId: newBattery.quizId,
        quizVersion: newBattery.quizVersion,
        questions: newBattery.questions,
        complete: newBattery.complete,
        correct: newBattery.correct as number,
      });
    } catch (err) {
      console.error(`POST /api/battery: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },

  async get(
    req: NextApiRequest,
    res: NextApiResponse<ResolveBatteryResponseBody>
  ) {
    // Make sure our author is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // First and foremost, we will need to fetch the logged-in user in order to get
      // that user's quiz batteries.
      const fetchedUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { batteries: true },
      });
      if (!fetchedUser) {
        // The user should exist. If it doesn't, then throw.
        throw new Error(
          "Expected the logged-in user to be present in the database, but did not find one!"
        );
      }

      // Get the ID of the battery to fetch.
      const batteryId = req.query?.id as string;
      if (!batteryId || batteryId === "undefined") {
        return res.status(404).json({ error: "Please provide a battery ID." });
      }

      // Find the battery in the fetched user object.
      const fetchedBattery = fetchedUser.batteries.find(
        (battery) => battery.id === batteryId
      );
      if (!fetchedBattery) {
        return res.status(404).json({ error: "Battery not found." });
      }

      // Fetch the quiz for which this battery was generated.
      const fetchedQuiz = await prisma.quiz.findUnique({
        where: { id: fetchedBattery.quizId },
      });
      if (!fetchedQuiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      // Resolve the IDs and indices in the quiz battery to the proper questions in the quiz.
      const resolvedBattery = resolveQuizBattery(fetchedBattery, fetchedQuiz);
      return res.status(200).json(resolvedBattery);
    } catch (err) {
      console.error(`GET /api/battery: ${err}`);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },

  async put(
    req: NextApiRequest,
    res: NextApiResponse<SubmitBatteryResponseBody>
  ) {
    // Make sure our author is logged in.
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "You are not logged in." });
    }

    try {
      // First and foremost, we will need to fetch the logged-in user in order to get
      // that user's quiz batteries.
      const fetchedUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { batteries: true },
      });
      if (!fetchedUser) {
        // The user should exist. If it doesn't, then throw.
        throw new Error(
          "Expected the logged-in user to be present in the database, but did not find one!"
        );
      }

      // Get the ID of the battery to fetch.
      const batteryId = req.query?.id as string;
      if (!batteryId || batteryId === "undefined") {
        return res.status(404).json({ error: "Please provide a battery ID." });
      }

      // Find the battery in the fetched user object.
      const fetchedBatteryIndex = fetchedUser.batteries.findIndex(
        (battery) => battery.id === batteryId
      );
      if (fetchedBatteryIndex === -1) {
        return res.status(404).json({ error: "Battery not found." });
      }
      const fetchedBattery = fetchedUser.batteries[fetchedBatteryIndex];

      // Make sure the user hasn't already completed this battery.
      if (fetchedBattery.complete === true) {
        return res
          .status(409)
          .json({ error: "This battery has already been completed." });
      }

      // Fetch the quiz for which this battery was generated.
      const fetchedQuiz = await prisma.quiz.findUnique({
        where: { id: fetchedBattery.quizId },
      });
      if (!fetchedQuiz) {
        return res.status(404).json({ error: "Quiz not found." });
      }

      // Make sure this battery is not out of date.
      if (fetchedBattery.quizVersion !== fetchedQuiz.version) {
        return res
          .status(409)
          .json({
            error:
              "This quiz battery is from an outdated version of the quiz. Request a new quiz battery.",
          });
      }

      // Make sure the quiz is still open.
      const openStatusString = checkQuizDateRange(
        fetchedQuiz.dateOpens,
        fetchedQuiz.dateCloses
      );
      if (openStatusString !== "") {
        return res.status(403).json({ error: openStatusString });
      }

      // Get the array of answers submitted by the user.
      const body = req.body as SubmitBatteryRequestBody;

      // Since there are only five choices per question, the answers found in the array in
      // the request body above should be represented by only the numbers zero through four
      // (arrays are base-zero). That said, filter out any elements in this array which
      // are null/undefined, or are out of the range of zero to four.
      const answers = body.answers.filter(
        (id) => typeof id === "number" && id >= 0 && id <= 4
      );

      // Update the answers array found in the user's batteries array.
      fetchedUser.batteries[fetchedBatteryIndex].answers = answers;

      // Check to see if the filtered answers array has the same number of elements as in
      // the battery questions array. If so, then the battery has been completed.
      const isComplete: boolean =
        answers.length === fetchedBattery.questions.length;
      let correct: number = 0;
      if (isComplete === true) {
        // Grade the submission.
        for (let i = 0; i < answers.length; ++i) {
          const question = fetchedBattery.questions[i];
          const answerIndex = answers[i];

          if (question.choices[answerIndex] === 0) {
            correct++;
          }
        }

        // Update the user to reflect the newly-completed battery.
        fetchedUser.batteries[fetchedBatteryIndex].complete = true;
        fetchedUser.batteries[fetchedBatteryIndex].correct = correct;
      }

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          batteries: fetchedUser.batteries,
        },
      });

      // Return the grade in the response body.
      return res.status(200).json({
        correct: isComplete === true ? correct : -1,
        possible: fetchedBattery.questions.length,
        percent:
          isComplete === true
            ? (correct / fetchedBattery.questions.length) * 100
            : -1,
        complete: isComplete,
      });
    } catch (err) {
      console.error("PUT /api/battery:", err);
      return res
        .status(500)
        .json({ error: "Something went wrong. Try again later." });
    }
  },
};

export default async (req: NextApiRequest, res: NextApiResponse) => {
  switch (req.method) {
    case "POST":
      return await methods.post(req, res);
    case "GET":
      return await methods.get(req, res);
    case "PUT":
      return await methods.put(req, res);
  }

  return res.status(405).json({ error: "This method is not allowed." });
};
