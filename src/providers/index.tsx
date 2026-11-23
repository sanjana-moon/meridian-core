"use client";

import { SessionProvider } from "next-auth/react";
import { Provider } from "react-redux";
import type { ReactNode } from "react";
import { store } from "@/store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>{children}</Provider>
    </SessionProvider>
  );
}
