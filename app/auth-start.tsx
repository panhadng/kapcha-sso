"use client";

import { useEffect } from "react";
import * as microsoftTeams from "@microsoft/teams-js";

export default function AuthStart() {
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize the Teams SDK
        await microsoftTeams.app.initialize();

        // Get authentication token using the correct API
        const token = await microsoftTeams.authentication.getAuthToken({
          resources: [process.env.NEXT_PUBLIC_APP_URI as string],
        });

        // Notify success and close the popup
        microsoftTeams.authentication.notifySuccess(token);
      } catch (error) {
        console.error("Authentication error:", error);
        // Notify failure and close the popup
        microsoftTeams.authentication.notifyFailure(
          typeof error === "string" ? error : JSON.stringify(error)
        );
      }
    };

    initialize();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-white max-w-md w-full text-center">
        <h1 className="text-xl font-semibold mb-4">Authenticating...</h1>
        <p className="text-gray-300 mb-4">
          Please wait while we complete the authentication process.
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}
