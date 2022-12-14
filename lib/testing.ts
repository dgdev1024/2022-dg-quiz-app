import {
  PostQuizRequestBody,
  PutQuizRequestBody,
  SubmitBatteryRequestBody,
} from "types/quiz-app-types";

export const TestPostQuizBody: PostQuizRequestBody = {
  name: "The Test Quiz From React",
  description: "This is the test quiz from React. Does it work?",
  private: false,
  questions: [
    {
      body: "This is the first question",
      choices: [
        "This is the correct answer",
        "This is wrong answer 1",
        "This is wrong answer 2",
        "This is wrong answer 3",
        "This is wrong answer 4",
        "This is wrong answer 5",
        "This is wrong answer 6",
        "This is wrong answer 7",
        "This is wrong answer 8",
        "This is wrong answer 9",
      ],
      guid: "",
    },
    {
      body: "This is the second question",
      choices: [
        "This is the correct answer",
        "This is wrong answer 1",
        "This is wrong answer 2",
        "This is wrong answer 3",
        "This is wrong answer 4",
        "This is wrong answer 5",
        "This is wrong answer 6",
        "This is wrong answer 7",
        "This is wrong answer 8",
        "This is wrong answer 9",
      ],
      guid: "",
    },
    {
      body: "This is the third question",
      choices: [
        "This is the correct answer",
        "This is wrong answer 1",
        "This is wrong answer 2",
        "This is wrong answer 3",
        "This is wrong answer 4",
        "This is wrong answer 5",
        "This is wrong answer 6",
        "This is wrong answer 7",
        "This is wrong answer 8",
        "This is wrong answer 9",
      ],
      guid: "",
    },
  ],
};

export const TestSubmitBatteryBody: SubmitBatteryRequestBody = {
  answers: [1, 2, 3],
};

export const TestPutQuizBody: PutQuizRequestBody = {
  name: "The Edited Test Quiz From React",
  description: "This is the edited test quiz from React. Does it still work?",
  private: false,
  batteryCount: 50,
  questions: [
    {
      body: "This is the first question",
      choices: [
        "This is the correct answer",
        "This is wrong answer 1",
        "This is wrong answer 2",
        "This is wrong answer 3",
        "This is wrong answer 4",
        "This is wrong answer 5",
        "This is wrong answer 6",
        "This is wrong answer 7",
        "This is wrong answer 8",
        "This is wrong answer 9",
      ],
      guid: "",
    },
    {
      body: "This is the edited second question",
      choices: [
        "This is the edited correct answer",
        "This is wrong answer 1",
        "This is wrong answer 2",
        "This is wrong answer 3",
        "This is wrong answer 4",
        "This is wrong answer 5",
        "This is wrong answer 6",
        "This is wrong answer 7",
        "This is wrong answer 8",
        "This is wrong answer 9",
        "This is wrong answer 10",
      ],
      guid: "",
    },
    {
      body: "This is the edited third question",
      choices: [
        "This is the correct answer",
        "This is wrong answer 1",
        "This is wrong answer 2",
        "This is wrong answer 3",
        "This is wrong answer 6",
        "This is wrong answer 7",
        "This is wrong answer 8",
        "This is wrong answer 9",
      ],
      guid: "",
    },
  ],
};
