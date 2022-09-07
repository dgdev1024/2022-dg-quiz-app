/**
 * @file lib/quiz-validation.ts
 */

import { QuizQuestion } from "types/quiz-app-types";
import { sanitizeHtmlString } from "./sanitize-html";

// Source: https://stackoverflow.com/a/6053606/2868302
// By Tudor Constantin on Stack Overflow
// Licensed by CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/
const nonAlphanumericRegex = /[^a-zA-Z\d\s.,!?:]/g;

export const validateQuizName = (quizName: string): string => {
  const minimumLength = 10,
    maximumLength = 140;

  if (!quizName) {
    return "Please provide a name for your quiz.";
  }

  if (quizName.length < minimumLength || quizName.length > maximumLength) {
    return `Quiz names must be between ${minimumLength} and ${maximumLength} characters in length.`;
  }

  if (nonAlphanumericRegex.test(quizName) === true) {
    return "Quiz names may only contain letters and numbers.";
  }

  return "";
};

export const validateQuizDescription = (quizDescription: string): string => {
  const minimumLength = 20,
    maximumLength = 280;

  if (!quizDescription) {
    return "Please provide a description for your quiz.";
  }

  if (
    quizDescription.length < minimumLength ||
    quizDescription.length > maximumLength
  ) {
    return `Quiz descriptions must be between ${minimumLength} and ${maximumLength} characters in length.`;
  }

  if (nonAlphanumericRegex.test(quizDescription) === true) {
    return "Quiz descriptions may only contain letters and numbers.";
  }

  return "";
};

export const validateQuizDates = (
  quizOpen: Date | null | undefined,
  quizClose: Date | null | undefined
): string => {
  if (!quizOpen || !quizClose) {
    return "";
  }

  if (quizOpen.getTime() >= quizClose.getTime()) {
    return "The quiz's open time must be before its closing time.";
  }

  return "";
};

export const validateQuizQuestions = (
  questions: QuizQuestion[],
  annotation: string = ""
): string[] => {
  const minimumLength = 10,
    maximumLength = 140;

  const issues: string[] = [];

  for (let i = 0; i < questions.length; ++i) {
    const question = questions[i];

    if (!question.body) {
      issues.push(`${annotation}Question #${i + 1} has no body.`);
    } else if (
      question.body.length < minimumLength ||
      question.body.length > maximumLength
    ) {
      issues.push(
        `${annotation}Question #${
          i + 1
        } must be between ${minimumLength} and ${maximumLength} characters in length.`
      );
    } else if (nonAlphanumericRegex.test(question.body) === true) {
      issues.push(
        `${annotation}Question #${i + 1} contains non-alphanumeric characters.`
      );
    }

    for (let j = 0; j < question.choices.length; ++j) {
      const choice = question.choices[j];

      if (!choice) {
        issues.push(
          `${annotation}Question #${i + 1}, choice #${j + 1} has no body.`
        );
      } else if (
        choice.length < minimumLength ||
        choice.length > maximumLength
      ) {
        issues.push(
          `${annotation}Question #${i + 1}, choice #${
            j + 1
          } must be between ${minimumLength} and ${maximumLength} characters in length.`
        );
      } else if (nonAlphanumericRegex.test(choice) === true) {
        issues.push(
          `${annotation}Question #${i + 1}, choice #${
            j + 1
          } contains non-alphanumeric characters.`
        );
      }
    }
  }

  return issues;
};
