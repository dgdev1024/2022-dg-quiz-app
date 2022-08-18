/**
 * @file pages/index.tsx
 *
 * The application's home page.
 */

import { unstable_getServerSession as getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { useSession, signIn, signOut } from "next-auth/react";

function IndexPage(): JSX.Element {
  const { data: session } = useSession();

  return session ? (
    <>
      <p>Signed in as '{session.user.email}'</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </>
  ) : (
    <>
      <button onClick={() => signIn()}>Sign In</button>
    </>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      session: await getServerSession(context.req, context.res, authOptions),
    },
  };
}

export default IndexPage;
