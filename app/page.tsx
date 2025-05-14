"use client";

import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import { useMsal } from "@azure/msal-react";
import { DashboardLayout } from "./components/DashboardLayout";
import { SMSPanel } from "./components/SMSPanel";
import { TeamsChat } from "./components/TeamsChat";
import { ContactProfiles } from "./components/ContactProfiles";
import { UserManagement } from "./components/UserManagement";
import { Profile } from "./components/Profile";
import Image from "next/image";

const ALLOWED_DOMAIN = "flyonit.com.au";

export default function Home() {
  const { instance, accounts } = useMsal();
  const [isInTeams, setIsInTeams] = useState<boolean | null>(null);
  const [activePage, setActivePage] = useState("sms");
  const [loginStatus, setLoginStatus] = useState<
    "idle" | "loading" | "success" | "error" | "domain_error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsInTeams(true);
      } catch (error) {
        console.log(error, "Not in Teams environment");
        setIsInTeams(false);
      }
    };

    initializeTeams();
  }, []);

  // When accounts change, check domain
  useEffect(() => {
    if (accounts.length > 0) {
      const userEmail = accounts[0].username.toLowerCase();
      if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
        setLoginStatus("domain_error");
        setError(`Access is limited to @${ALLOWED_DOMAIN} users only.`);
      } else {
        setLoginStatus("success");
      }
    }
  }, [accounts]);

  const handleLogin = async () => {
    setLoginStatus("loading");
    setError(null);

    try {
      // Request login with MSAL
      const result = await instance.loginPopup();

      // Check domain after login
      if (result.account) {
        const userEmail = result.account.username.toLowerCase();
        if (!userEmail.endsWith(`@${ALLOWED_DOMAIN}`)) {
          setLoginStatus("domain_error");
          setError(`Access is limited to @${ALLOWED_DOMAIN} users only.`);
          await instance.logoutPopup(); // Log out the non-domain user
        } else {
          setLoginStatus("success");
        }
      }
    } catch (e) {
      console.error(e);
      setLoginStatus("error");
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  if (isInTeams === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If not in Teams and not logged in, show login screen
  if (!isInTeams && accounts.length === 0) {
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
              <div className="rounded-md p-4 bg-gray-700/50">
                <p className="text-sm text-gray-200">
                  Please sign in to access the KAPCHA tools
                </p>
              </div>

              {loginStatus === "domain_error" && (
                <div className="rounded-md p-4 bg-red-900/50">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {loginStatus === "error" && (
                <div className="rounded-md p-4 bg-red-900/50">
                  <p className="text-sm text-red-300">
                    {error || "Login failed, please try again."}
                  </p>
                </div>
              )}

              <div>
                <button
                  onClick={handleLogin}
                  disabled={loginStatus === "loading"}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {loginStatus === "loading" ? (
                    <>
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
                    </>
                  ) : (
                    "Sign in with Microsoft"
                  )}
                </button>
              </div>

              <div className="mt-4">
                <p className="text-xs text-gray-400 text-center">
                  Only users with @{ALLOWED_DOMAIN} email addresses can access
                  this application
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render dashboard content based on activePage
  let pageContent;
  switch (activePage) {
    case "teams-chat":
      pageContent = <TeamsChat />;
      break;
    case "contacts":
      pageContent = <ContactProfiles />;
      break;
    case "sms":
      pageContent = <SMSPanel />;
      break;
    case "users":
      pageContent = <UserManagement />;
      break;
    case "profile":
      pageContent = <Profile />;
      break;
    default:
      pageContent = <SMSPanel />;
  }

  return (
    <DashboardLayout setActivePage={setActivePage}>
      {pageContent}
    </DashboardLayout>
  );
}
