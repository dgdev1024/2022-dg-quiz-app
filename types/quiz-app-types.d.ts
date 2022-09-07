/**
 * @file types/quiz-app-types.d.ts
 */

/** The type of the data used to update the logged-in user. */
export type UserUpdateData = {
  name?: string;
  image?: string;
};

/** The type of the quiz question. Used by the POST and PUT method functions. */
export type QuizQuestion = {
  body: string;
  choices: string[];
  id?: string;
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
};

/** The type of the response returned by the GET method function. */
export type GetQuizResponseBody = {
  quiz?: {
    isAuthor: boolean;
    name: string;
    description: string;
    keywords: string[];
    dateCreated: Date;
    dateUpdated: Date;
    dateOpens: Date;
    dateCloses?: Date | null;
    questions?: QuizQuestion[];
  };
  error?: string;
};

/** The type of the response returned by the POST method function. */
export type PostQuizResponseBody = {
  id?: string;
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

/**
 * The type of the response returned by GET /api/search.
 */
export type SearchQuizResponseBody = {
  quizzes?: {
    name: string;
    description: string;
    authorId: string;
    authorName: string;
    dateCreated: Date;
    dateUpdated: Date;
    dateOpens: Date;
    dateCloses: Date | null | undefined;
  }[];
  page?: number;
  lastPage?: boolean;
  error?: string;
};
