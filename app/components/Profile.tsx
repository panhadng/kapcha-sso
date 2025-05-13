"use client";

import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaBuilding,
} from "react-icons/fa";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

interface TeamsUserInfo {
  displayName?: string;
  userPrincipalName?: string;
  id?: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  phoneNumber?: string;
  tenantName?: string;
  mail?: string;
  officeLocation?: string;
  preferredLanguage?: string;
  businessPhones?: string[];
  mobilePhone?: string;
}

export const Profile = () => {
  const [teamsUser, setTeamsUser] = useState<TeamsUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInTeams, setIsInTeams] = useState<boolean | null>(null);
  const { accounts, instance } = useMsal();

  // Function to get token from Teams and exchange it for Graph access
  const getGraphProfileFromTeams = async () => {
    try {
      // 1. Get the SSO token from Teams
      const token = await microsoftTeams.authentication.getAuthToken();

      // 2. Exchange the token for Microsoft Graph token through a server-side API
      // Create a secure API endpoint to exchange the token using OBO flow
      const response = await fetch("/api/graph/getGraphProfileOnBehalfOf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ssoToken: token,
        }),
      });

      if (response.ok) {
        // Your API should return the profile data directly, not the token
        // This is more secure than returning the token to the client
        return await response.json();
      } else {
        console.error("Failed to exchange token:", await response.text());
        return null;
      }
    } catch (error: unknown) {
      console.error("Error getting Teams token or profile:", error);
      return null;
    }
  };

  const getGraphProfileData = async () => {
    if (accounts.length === 0) return null;

    const accessTokenRequest = {
      scopes: ["User.Read"],
      account: accounts[0],
    };

    try {
      // Get token silently
      const response = await instance.acquireTokenSilent(accessTokenRequest);

      // Call Microsoft Graph API with the token
      const graphResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: {
          Authorization: `Bearer ${response.accessToken}`,
        },
      });

      if (graphResponse.ok) {
        return await graphResponse.json();
      } else {
        console.error("Graph API error:", await graphResponse.text());
        return null;
      }
    } catch (error) {
      // If silent token acquisition fails, acquire token using popup
      if (error instanceof InteractionRequiredAuthError) {
        try {
          const response = await instance.acquireTokenPopup(accessTokenRequest);

          // Call Microsoft Graph with the token
          const graphResponse = await fetch(
            "https://graph.microsoft.com/v1.0/me",
            {
              headers: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            }
          );

          if (graphResponse.ok) {
            return await graphResponse.json();
          }
        } catch (popupError) {
          console.error("Error during popup authentication:", popupError);
        }
      } else {
        console.error("Token acquisition error:", error);
      }
      return null;
    }
  };

  useEffect(() => {
    const getTeamsUser = async () => {
      try {
        setIsLoading(true);

        // Check if we're in Teams (with proper error handling)
        let inTeams = false;
        try {
          await microsoftTeams.app.initialize();
          inTeams = true;
        } catch (error) {
          console.log(error, "Not in Teams environment");
          inTeams = false;
        }

        setIsInTeams(inTeams);

        if (inTeams) {
          // In Teams - get user from Teams context AND Graph API
          const context = await microsoftTeams.app.getContext();

          // First set basic info from Teams context
          if (context.user) {
            setTeamsUser({
              displayName: context.user.displayName,
              userPrincipalName: context.user.userPrincipalName,
              id: context.user.id,
            });
          }

          // Then try to get additional data from Graph
          const graphData = await getGraphProfileFromTeams();

          if (graphData) {
            // Update with the rich profile data
            setTeamsUser((prevState) => ({
              ...prevState,
              displayName: graphData.displayName || prevState?.displayName,
              userPrincipalName:
                graphData.userPrincipalName || prevState?.userPrincipalName,
              id: graphData.id || prevState?.id,
              givenName: graphData.givenName,
              surname: graphData.surname,
              jobTitle: graphData.jobTitle,
              mail: graphData.mail,
              businessPhones: graphData.businessPhones,
              mobilePhone: graphData.mobilePhone,
              officeLocation: graphData.officeLocation,
              preferredLanguage: graphData.preferredLanguage,
              tenantName: context.user?.tenant?.id || "",
            }));
          }
        } else if (accounts.length > 0) {
          // Not in Teams but logged in via MSAL - get additional profile data from Graph API
          const graphData = await getGraphProfileData();
          if (graphData) {
            setTeamsUser({
              displayName: graphData.displayName,
              userPrincipalName: graphData.userPrincipalName,
              id: graphData.id,
              givenName: graphData.givenName,
              surname: graphData.surname,
              jobTitle: graphData.jobTitle,
              mail: graphData.mail,
              businessPhones: graphData.businessPhones,
              mobilePhone: graphData.mobilePhone,
              officeLocation: graphData.officeLocation,
              preferredLanguage: graphData.preferredLanguage,
              // Add tenant name if available
              tenantName: accounts[0].tenantId || "",
            });
          } else {
            // Fallback to basic account info if Graph API call fails
            setTeamsUser({
              displayName: accounts[0].name || accounts[0].username,
              userPrincipalName: accounts[0].username,
              id: accounts[0].localAccountId,
            });
          }
        }
      } catch (error) {
        console.error("Failed to get user info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getTeamsUser();
  }, [accounts, instance]);

  const handleLogout = () => {
    instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <FaUser className="mr-2" />
          User Profile
        </h2>

        {teamsUser ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4 pb-6 border-b border-gray-700">
              <div className="bg-blue-600 rounded-full h-16 w-16 flex items-center justify-center text-white text-2xl font-bold">
                {teamsUser.displayName?.charAt(0) || "?"}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {teamsUser.displayName || "User"}
                </h3>
                <p className="text-gray-300">
                  {teamsUser.jobTitle || "No job title available"}
                </p>
              </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-gray-400 mb-1">
                    <FaEnvelope className="mr-2" />
                    <span className="text-sm">Email</span>
                  </div>
                  <p className="text-white break-all">
                    {teamsUser.mail ||
                      teamsUser.userPrincipalName ||
                      "Not available"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-gray-400 mb-1">
                    <FaPhone className="mr-2" />
                    <span className="text-sm">Phone</span>
                  </div>
                  <p className="text-white">
                    {teamsUser.businessPhones &&
                    teamsUser.businessPhones.length > 0
                      ? teamsUser.businessPhones[0]
                      : teamsUser.mobilePhone || "Not available"}
                  </p>
                </div>

                {teamsUser.officeLocation && (
                  <div>
                    <div className="flex items-center text-gray-400 mb-1">
                      <FaBuilding className="mr-2" />
                      <span className="text-sm">Office Location</span>
                    </div>
                    <p className="text-white">{teamsUser.officeLocation}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-gray-400 mb-1">
                    <FaBriefcase className="mr-2" />
                    <span className="text-sm">Job Title</span>
                  </div>
                  <p className="text-white">
                    {teamsUser.jobTitle || "Not available"}
                  </p>
                </div>

                <div>
                  <div className="flex items-center text-gray-400 mb-1">
                    <FaBuilding className="mr-2" />
                    <span className="text-sm">Organization</span>
                  </div>
                  <p className="text-white">
                    {teamsUser.tenantName || "Not available"}
                  </p>
                </div>

                {teamsUser.preferredLanguage && (
                  <div>
                    <div className="flex items-center text-gray-400 mb-1">
                      <span className="text-sm">Preferred Language</span>
                    </div>
                    <p className="text-white">{teamsUser.preferredLanguage}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="bg-gray-700/50 rounded-md p-4">
                <h4 className="text-white font-medium mb-2">User ID</h4>
                <code className="text-xs text-gray-300 block overflow-x-auto">
                  {teamsUser.id}
                </code>
              </div>
            </div>

            {/* Add the logout button at the end, only if not in Teams */}
            {isInTeams === false && (
              <div className="pt-6">
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-700/50 p-6 rounded-md text-center">
            <p className="text-gray-300">
              Unable to retrieve user profile information.
            </p>
            <p className="text-gray-400 mt-2 text-sm">
              This may happen if you&apos;re not using Microsoft Teams or are
              not signed in.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
