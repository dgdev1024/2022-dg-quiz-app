/**
 * @file pages/_app.tsx
 */

import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import "@styles/global.scss";

const App = ({ Component, pageProps: { session, ...pageProps } }: AppProps) => {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
};

export default App;
