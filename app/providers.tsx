"use client";

import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../lib/msalConfig";
import { ReactNode } from "react";

const msalInstance = new PublicClientApplication(msalConfig);

export default function Providers({ children }: { children: ReactNode }) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
