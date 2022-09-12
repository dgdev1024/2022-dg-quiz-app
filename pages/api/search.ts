/**
 * @file api/search.ts
 */

import { NextApiRequest, NextApiResponse } from "next";
import {
  SearchQuizRequestBody,
  SearchQuizResponseBody,
} from "types/quiz-app-types";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { prisma } from "@lib/prisma";
import { scrubHtmlString } from "@lib/sanitize-html";

export default async (
  req: NextApiRequest,
  res: NextApiResponse<SearchQuizResponseBody>
) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "This method is not allowed." });
  }

  // Make sure our author is logged in.
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "You are not logged in." });
  }

  try {
    // The number of quizzes to fetch per page.
    const quizzesPerPage = 20;

    // Grab the search details from the request body.
    const query = scrubHtmlString((req.query?.query as string) || "");
    const page = parseInt((req.query?.page as string) || "0");

    // Make sure the page given is a valid number.
    if (page < 0) {
      return res
        .status(400)
        .json({ error: "The page number cannot be below zero." });
    }

    // Use the details to search the database.
    const fetchedQuizzes = await prisma.quiz.findMany({
      where: {
        AND: [
          {
            keywords: { hasSome: query.split(" ") },
          },
          {
            private: false,
          },
        ],
      },
      select: {
        name: true,
        description: true,
        dateCreated: true,
        dateUpdated: true,
        dateOpens: true,
        dateCloses: true,
        authorId: true,
        author: true,
      },
      orderBy: {
        dateUpdated: "desc",
      },
      skip: page * quizzesPerPage,
      take: quizzesPerPage + 1,
    });

    // Return a 404 if no quizzes were found.
    if (fetchedQuizzes.length === 0) {
      const errorString =
        page > 0
          ? "There were no quizzes found which match your query at this page. Try a lower page number."
          : "There were no quizzes found which match your query.";

      return res.status(404).json({ error: errorString });
    }

    // Return the fetched quizzes in the response.
    return res.status(200).json({
      results: {
        quizzes: fetchedQuizzes.map((quiz) => ({
          name: quiz.name,
          description: quiz.description,
          authorId: quiz.authorId,
          authorName: quiz.author.name as string,
          authorEmail: quiz.author.email as string,
          dateCreated: quiz.dateCreated,
          dateUpdated: quiz.dateUpdated,
          dateOpens: quiz.dateOpens,
          dateCloses: quiz.dateCloses,
        })),
        page: page,
        lastPage: fetchedQuizzes.length < quizzesPerPage + 1,
      },
    });
  } catch (err) {
    console.error(`GET /api/search: ${err}`);
    return res
      .status(500)
      .json({ error: "Something went wrong. Try again later." });
  }
};
