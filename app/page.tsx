"use client";

import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import Image from "next/image";
import {
  InteractionStatus,
  InteractionRequiredAuthError,
  SilentRequest,
} from "@azure/msal-browser";

export default function Home() {
  const { instance, accounts, inProgress } = useMsal();
  const [isInTeams, setIsInTeams] = useState<boolean | null>(null);
  const [loginStatus, setLoginStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Silent authentication logic
  useEffect(() => {
    const attemptSilentLogin = async () => {
      if (accounts.length === 0 && inProgress === InteractionStatus.None) {
        try {
          // Try silent token acquisition
          const silentRequest: SilentRequest = {
            scopes: ["User.Read"], // Add any other scopes you need
            account: accounts[0] ?? null,
          };

          await instance.acquireTokenSilent(silentRequest);
          setLoginStatus("success");
        } catch (e) {
          if (e instanceof InteractionRequiredAuthError) {
            // Silent token acquisition failed, user needs to sign in interactively
            console.log(
              "Silent token acquisition failed, user needs to sign in interactively"
            );
          } else {
            console.error("Silent token acquisition failed:", e);
          }
        }
      }
    };

    attemptSilentLogin();
  }, [accounts, inProgress, instance]);

  // Teams initialization
  useEffect(() => {
    const initializeTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsInTeams(true);
        const context = await microsoftTeams.app.getContext();
        console.log("Teams context:", context);

        // If in Teams, attempt SSO
        if (context.user?.userPrincipalName) {
          // You can use the UPN for additional context or validation
          console.log("Teams user:", context.user.userPrincipalName);
        }
      } catch (e) {
        console.log(e, "Not in Teams environment");
        setIsInTeams(false);
      }
    };

    initializeTeams();
  }, []);

  const handleLogin = async () => {
    setLoginStatus("loading");
    setError(null);

    try {
      if (isInTeams) {
        // Use Teams SSO if in Teams
        await instance.loginPopup({
          scopes: ["User.Read"], // Add any other scopes your app needs
          prompt: "none", // Prevents additional prompts if possible
        });
      } else {
        // Regular popup login for browser
        await instance.loginPopup();
      }
      setLoginStatus("success");
    } catch (e) {
      console.error(e);
      setLoginStatus("error");
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Logo container */}
        <div className="text-center mb-8">
          <Image
            src="/images/kapcha-logo.png"
            alt="KAPCHA Logo"
            width={250}
            height={100}
            className="mx-auto"
            priority
          />
        </div>

        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-700">
          <div className="space-y-6">
            {/* Environment indicator */}
            {isInTeams !== null && (
              <div
                className={`rounded-md p-4 ${
                  isInTeams ? "bg-blue-900/50" : "bg-gray-700/50"
                }`}
              >
                <p className="text-sm text-gray-200">
                  {isInTeams
                    ? "✓ Running in Microsoft Teams"
                    : "Running in browser"}
                </p>
              </div>
            )}

            {/* Login status */}
            {accounts.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-green-900/50 rounded-md p-4">
                  <p className="text-green-300">
                    ✓ Logged in as {accounts[0].username}
                  </p>
                </div>
                <button
                  onClick={() => instance.logout()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleLogin}
                  disabled={loginStatus === "loading"}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
                    ${
                      loginStatus === "loading"
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
                    }`}
                >
                  {loginStatus === "loading" ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    "Sign in with Microsoft"
                  )}
                </button>

                {/* Error message */}
                {error && (
                  <div className="rounded-md bg-red-900/50 p-4">
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} KAPCHA. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
