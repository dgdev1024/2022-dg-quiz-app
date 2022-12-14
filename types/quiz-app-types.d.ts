/**
 * @file types/quiz-app-types.d.ts
 */

import { Quiz } from "@prisma/client";

/** The type of the data used to update the logged-in user. */
export type UserUpdateData = {
  name?: string;
  image?: string;
};

/** The type of the quiz question. Used by the POST and PUT method functions. */
export type QuizQuestion = {
  body: string;
  choices: string[];
  guid: string;
};

/** The type of the battery question. Used by the /api/battery endpoints. */
export type BatteryQuestion = {
  id: string;
  choices: number[];
};

/** The type of the newly-generated battery returned by 'generateQuizBattery' */
export type GeneratedBattery = {
  quizId: string;
  quizVersion: number;
  questions: BatteryQuestion[];
  answers: number[];
  complete: boolean;
  correct: number;
};

/** The type of the request body used by the POST method function. */
export type PostQuizRequestBody = {
  name: string;
  description: string;
  keywords?: string[];
  private: boolean;
  dateOpens?: Date;
  dateCloses?: Date | null;
  questions: QuizQuestion[];
  batteryCount?: number;
};

/** The type of the request body used by the PUT method function. */
export type PutQuizRequestBody = {
  name: string;
  description: string;
  private: boolean;
  keywords?: string[];
  dateOpens?: Date;
  dateCloses?: Date | null;
  questions: QuizQuestion[];
  batteryCount: number;
};

/** The type of the response returned by the GET method function. */
export type GetQuizResponseBody = {
  quiz?: {
    isAuthor: boolean;
    name: string;
    description: string;
    version: number;
    keywords: string[];
    dateCreated: Date;
    dateUpdated: Date;
    dateOpens: Date;
    dateCloses?: Date | null;
    questions?: QuizQuestion[];
    batteryCount: number;
  };
  error?: string;
};

/** The type of the response returned by the POST method function. */
export type PostQuizResponseBody = {
  quiz?: {
    id: string;
  };
  error?: string;
  issues?: string[];
};

/**
 * The type of the response returned by the PUT method function will be the
 * same as in the POST method function.
 */
export type PutQuizResponseBody = PostQuizResponseBody;

/**
 * The type of the response returned by the DELETE method function will be the
 * same as in the GET method function.
 */
export type DeleteQuizResponseBody = {
  quiz?: {
    isAuthor: boolean;
    name: string;
    description: string;
    questions?: QuizQuestion[];
  };
  error?: string;
};

/**
 * The type of the request body passed into GET /api/serach.
 */
export type SearchQuizRequestBody = {
  query: string;
  page: number;
};

/** The type of the request body passed into PUT /api/battery */
export type SubmitBatteryRequestBody = {
  answers: number[];
};

/** The type of the response returned by GET /api/user. */
export type GetUserResponseBody = {
  error?: string;
  user?: {
    id: string;
    name: string;
    image: string;
    emailAddress: string;
    isSelf: boolean;
  };
};

/** The type of the response returned by PUT /api/user */
export type PutUserResponseBody = {
  error?: string;
  user?: {
    id: string;
    name: string;
    image: string;
    emailAddress: string;
    isSelf: boolean;
  };
};

/**
 * The type of the response returned by GET /api/search.
 */
export type SearchQuizResponseBody = {
  results?: {
    quizzes: {
      name: string;
      description: string;
      authorId: string;
      authorName: string;
      dateCreated: Date;
      dateUpdated: Date;
      dateOpens: Date;
      dateCloses: Date | null | undefined;
    }[];
    page: number;
    lastPage: boolean;
  };
  error?: string;
};

/** The type of the response body returned by POST /api/battery. */
export type RequestBatteryResponseBody = {
  battery?: {
    id: string;
    quizId: string;
    quizVersion: number;
    questions: BatteryQuestion[];
    complete: boolean;
    correct?: number;
  };
  error?: string;
};

/** The type of the response body returned by GET /api/battery. */
export type ResolveBatteryResponseBody = {
  battery?: {
    name: string;
    description: string;
    questions: QuizQuestion[];
    answers: number[];
    outdated: boolean;
    complete: boolean;
    correct: number;
    open: boolean;
  };
  error?: string;
};

/** The type of the response body returned by PUT /api/battery */
export type SubmitBatteryResponseBody = {
  error?: string;
  correct?: number;
  possible?: number;
  percent?: number;
  complete?: boolean;
};
