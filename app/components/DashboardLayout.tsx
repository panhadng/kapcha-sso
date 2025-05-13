"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import Link from "next/link";
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

  useEffect(() => {
    const checkTeams = async () => {
      try {
        await microsoftTeams.app.initialize();
        setIsInTeams(true);
      } catch (error) {
        console.log(error, "Not in Teams environment");
        setIsInTeams(false);
      }
    };

    checkTeams();
  }, []);

  useEffect(() => {
    if (isInTeams === false && accounts.length === 0) {
      window.location.href = "/";
    }
  }, [isInTeams, accounts]);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-4">
          <div className="mb-6">
            <Image
              src="/images/kapcha-logo.png"
              alt="KAPCHA Logo"
              width={150}
              height={60}
              className="mx-auto"
            />
          </div>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-300 hover:bg-gray-700"
                  onClick={() => setActivePage(item.id)}
                >
                  <Icon className="text-xl" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};
