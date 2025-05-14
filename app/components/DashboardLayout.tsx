"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import { BsChatDots } from "react-icons/bs";
import { HiUsers } from "react-icons/hi";
import { FaUsersCog, FaUser } from "react-icons/fa";
import { IoMdSend } from "react-icons/io";
import { useMsal } from "@azure/msal-react";
import * as microsoftTeams from "@microsoft/teams-js";

interface DashboardLayoutProps {
  children: ReactNode;
  setActivePage: (page: string) => void;
}

const ALLOWED_DOMAIN = "flyonit.com.au";

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  children,
  setActivePage,
}) => {
  const menuItems = [
    { id: "teams-chat", label: "Teams Chat", icon: BsChatDots },
    { id: "contacts", label: "Contact Profiles", icon: HiUsers },
    { id: "sms", label: "SMS", icon: IoMdSend },
    { id: "users", label: "User Management", icon: FaUsersCog },
    { id: "profile", label: "My Profile", icon: FaUser },
  ];

  const { accounts } = useMsal();
  const [isInTeams, setIsInTeams] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [teamsUserEmail, setTeamsUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsInTeams(true);

        // Get Teams context to check user email
        const context = await microsoftTeams.app.getContext();
        if (context?.user?.userPrincipalName) {
          setTeamsUserEmail(context.user.userPrincipalName.toLowerCase());
        }
      } catch (error) {
        console.log(error, "Not in Teams environment");
        setIsInTeams(false);
      }
    };

    checkTeams();
  }, []);

  useEffect(() => {
    // Check if user has access based on domain
    const checkAccess = () => {
      // If in Teams, check Teams user email
      if (isInTeams === true && teamsUserEmail) {
        const hasDomain = teamsUserEmail.endsWith(`@${ALLOWED_DOMAIN}`);
        setHasAccess(hasDomain);
        return;
      }

      // If not in Teams, check MSAL account
      if (isInTeams === false && accounts.length > 0) {
        const email = accounts[0].username.toLowerCase();
        const hasDomain = email.endsWith(`@${ALLOWED_DOMAIN}`);
        setHasAccess(hasDomain);
        return;
      }

      // Default to null if we can't determine yet
      setHasAccess(null);
    };

    checkAccess();
  }, [isInTeams, accounts, teamsUserEmail]);

  useEffect(() => {
    if (isInTeams === false && accounts.length === 0) {
      window.location.href = "/";
    }
  }, [isInTeams, accounts]);

  // Show loading state while checking access
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show access denied message
  if (hasAccess === false) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg max-w-md w-full text-center">
          <Image
            src="/images/kapcha-logo.png"
            alt="KAPCHA Logo"
            width={200}
            height={80}
            className="mx-auto mb-6"
          />
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-300 mb-4">
            Sorry, this application is only available to {ALLOWED_DOMAIN} users.
          </p>
          <p className="text-gray-400 text-sm">
            You are currently signed in with:{" "}
            {isInTeams ? teamsUserEmail : accounts[0]?.username}
          </p>

          {!isInTeams && (
            <button
              onClick={() => (window.location.href = "/")}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show dashboard for authorized users
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 flex flex-col border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <Image
            src="/images/kapcha-logo.png"
            alt="KAPCHA Logo"
            width={150}
            height={60}
            className="mx-auto"
          />
        </div>

        <nav className="flex-1 py-6 px-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className="mr-3 text-gray-400" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400">
            © {new Date().getFullYear()} KAPCHA
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto py-6">{children}</div>
    </div>
  );
};
