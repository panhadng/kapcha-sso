"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import Image from "next/image";
import { BsChatDots } from "react-icons/bs";
import { HiUsers } from "react-icons/hi";
import { FaUsersCog, FaUser } from "react-icons/fa";
import { IoMdSend, IoMdArrowUp } from "react-icons/io";
import { useMsal } from "@azure/msal-react";
import * as microsoftTeams from "@microsoft/teams-js";

interface DashboardLayoutProps {
  children: ReactNode;
  setActivePage: (page: string) => void;
  activePage?: string;
}

const ALLOWED_DOMAIN = "flyonit.com.au";

export const DashboardLayout: FC<DashboardLayoutProps> = ({
  children,
  setActivePage,
  activePage = "sms", // Default to SMS panel
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
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll events for mobile nav
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show nav when scrolling up or at top, hide when scrolling down
      if (currentScrollY <= 10) {
        // Always show at top of page
        setShowMobileNav(true);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setShowMobileNav(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and not at top
        setShowMobileNav(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Function to scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
      {/* Sidebar - visible on desktop only */}
      <div className="hidden md:flex md:w-64 bg-gray-800 flex-col border-r border-gray-700">
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
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                activePage === item.id
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon
                className={`mr-3 ${
                  activePage === item.id ? "text-blue-400" : "text-gray-400"
                }`}
              />
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

      {/* Mobile Header - Logo only, visible on mobile */}
      <div className="md:hidden bg-gray-800 p-2 sm:p-3 border-b border-gray-700 flex justify-center items-center">
        <Image
          src="/images/kapcha-logo.png"
          alt="KAPCHA Logo"
          width={120}
          height={48}
          className="mx-auto max-h-[48px] w-auto"
        />
      </div>

      {/* Main content - centered vertically and horizontally */}
      <div className="flex-1 overflow-auto flex items-start md:items-center justify-center py-2 pb-20 md:pb-6 md:py-6">
        <div className="w-full h-full flex items-start md:items-center justify-center">
          {children}
        </div>
      </div>

      {/* Scroll to top button - appears when scrolled down */}
      {lastScrollY > 300 && (
        <button
          onClick={scrollToTop}
          className="md:hidden fixed bottom-20 right-3 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50 w-8 h-8 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <IoMdArrowUp size={16} />
        </button>
      )}

      {/* Floating Bottom Navigation - Mobile only - wider with icons only */}
      <div
        className={`md:hidden fixed bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg z-50 transition-all duration-300 px-3 py-1 border border-gray-700/50 w-[90%] sm:w-4/5 ${
          showMobileNav
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="flex justify-around items-center h-12">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`flex flex-col items-center justify-center transition-all ${
                activePage === item.id
                  ? "text-blue-400 scale-110"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setActivePage(item.id)}
              aria-label={item.label}
            >
              <div
                className={`relative ${
                  activePage === item.id
                    ? "after:absolute after:w-1 after:h-1 after:bg-blue-400 after:rounded-full after:-bottom-3 after:left-1/2 after:-translate-x-1/2"
                    : ""
                }`}
              >
                <item.icon size={20} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
