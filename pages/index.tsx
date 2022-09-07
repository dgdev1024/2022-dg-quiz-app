/**
 * @file pages/index.tsx
 *
 * Presents the web application's home page.
 */

import Testbay from "@com/testbay";
import type { GetServerSideProps } from "next";
import { unstable_getServerSession as getServerSession } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { authOptions } from "./api/auth/[...nextauth]";

const IndexPage = () => {
  const { data: session } = useSession();

  if (!session) {
    return (
      <>
        <button onClick={() => signIn()}>Sign In</button>
      </>
    );
  }

  return (
    <>
      <Testbay />
      <button onClick={() => signOut()}>Sign Out</button>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  console.log(session);

  return {
    props: {
      session,
    },
  };
};

export default IndexPage;
