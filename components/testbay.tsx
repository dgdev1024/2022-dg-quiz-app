/**
 * @file components/testbay.tsx
 */

import { useState } from "react";
import { TestPostQuizBody, TestPutQuizBody } from "@lib/testing";
import {
  DeleteQuizResponseBody,
  GetQuizResponseBody,
  PostQuizResponseBody,
  PutQuizResponseBody,
  SearchQuizResponseBody,
} from "types/quiz-app-types";

const Testbay = () => {
  const [postResponse, setPostResponse] = useState<
    PostQuizResponseBody | PutQuizResponseBody | null
  >(null);
  const [getResponse, setGetResponse] = useState<GetQuizResponseBody | null>(
    null
  );
  const [deleteResponse, setDeleteResponse] =
    useState<DeleteQuizResponseBody | null>(null);
  const [searchResponse, setSearchResponse] =
    useState<SearchQuizResponseBody | null>(null);

  const onPostClicked = async () => {
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TestPostQuizBody),
    });
    const data = await res.json();

    setPostResponse(data);
  };

  const onGetClicked = async () => {
    if (postResponse) {
      const res = await fetch(`api/quiz?id=${postResponse.id}`);
      const data = await res.json();

      setGetResponse(data);
    }
  };

  const onPutClicked = async () => {
    if (postResponse) {
      const res = await fetch(`/api/quiz?id=${postResponse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(TestPutQuizBody),
      });
      const data = await res.json();

      setPostResponse(data);
    }
  };

  const onDeleteClicked = async () => {
    if (postResponse) {
      const res = await fetch(`/api/quiz?id=${postResponse.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      setDeleteResponse(data);
    }
  };

  const onSearchClicked = async () => {
    const res = await fetch(`/api/search?query=edited`);
    const data = await res.json();

    setSearchResponse(data);
  };

  return (
    <>
      <div>
        <button onClick={onPostClicked}>Post Test Quiz</button>
        {postResponse && <code>{JSON.stringify(postResponse)}</code>}
        {postResponse && (
          <>
            <div>
              <button onClick={onGetClicked}>Get Test Quiz</button>
              {getResponse && <code>{JSON.stringify(getResponse)}</code>}
            </div>
            <div>
              <button onClick={onPutClicked}>Put Test Quiz</button>
            </div>
            <div>
              <button onClick={onDeleteClicked}>Delete Test Quiz</button>
              {deleteResponse && <code>{JSON.stringify(deleteResponse)}</code>}
            </div>
          </>
        )}
        <button onClick={onSearchClicked}>Search Quizzes</button>
        {searchResponse && (
          <code>
            <pre>{JSON.stringify(searchResponse, null, 2)}</pre>
          </code>
        )}
      </div>
    </>
  );
};

export default Testbay;