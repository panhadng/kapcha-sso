"use client";

import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import Image from "next/image";

interface TeamsUserInfo {
  displayName?: string;
  userPrincipalName?: string;
  id?: string;
}

export default function Home() {
  const { instance, accounts } = useMsal();
  const [isInTeams, setIsInTeams] = useState<boolean | null>(null);
  const [teamsUser, setTeamsUser] = useState<TeamsUserInfo | null>(null);
  const [loginStatus, setLoginStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  // Teams initialization and context
  useEffect(() => {
    const initializeTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsInTeams(true);
        const context = await microsoftTeams.app.getContext();

        if (context.user) {
          setTeamsUser({
            displayName: context.user.displayName,
            userPrincipalName: context.user.userPrincipalName,
            id: context.user.id,
          });
          setLoginStatus("success"); // Auto-set success if we have Teams context
        }

        console.log("Teams context:", context);
      } catch (error) {
        console.log(error, "Not in Teams environment");
        setIsInTeams(false);
      }
    };

    initializeTeams();
  }, []);

  const handleLogin = async () => {
    setLoginStatus("loading");
    setError(null);

    try {
      await instance.loginPopup();
      setLoginStatus("success");
    } catch (e) {
      console.error(e);
      setLoginStatus("error");
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  // Determine user info to display
  const userDisplayInfo =
    teamsUser ||
    (accounts.length > 0
      ? {
          displayName: accounts[0].name,
          userPrincipalName: accounts[0].username,
        }
      : null);

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

            {/* User Info Display */}
            {userDisplayInfo ? (
              <div className="space-y-4">
                <div className="bg-green-900/50 rounded-md p-4">
                  <div className="space-y-2">
                    <p className="text-green-300">
                      ✓ Signed in as {userDisplayInfo.displayName}
                    </p>
                    <p className="text-sm text-green-200/80">
                      {userDisplayInfo.userPrincipalName}
                    </p>
                  </div>
                </div>
                {!isInTeams && (
                  <button
                    onClick={() => instance.logout()}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            ) : (
              !isInTeams && (
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

                  {error && (
                    <div className="rounded-md bg-red-900/50 p-4">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}
                </div>
              )
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
