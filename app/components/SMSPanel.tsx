"use client";

import { useState, useEffect } from "react";
import { IoMdSend, IoMdClose } from "react-icons/io";
import { IoAddCircle } from "react-icons/io5";
import * as microsoftTeams from "@microsoft/teams-js";
import { useMsal } from "@azure/msal-react";
import { FaCloud, FaServer, FaPhone } from "react-icons/fa";

interface TeamsUserInfo {
  displayName?: string;
  userPrincipalName?: string;
}

type SmsProvider = "twilio" | "local" | "cloud";

interface SmsProviderOption {
  id: SmsProvider;
  name: string;
  icon: React.ReactNode;
  description: string;
}

export const SMSPanel = () => {
  const [newNumber, setNewNumber] = useState("");
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [useSignature, setUseSignature] = useState(false);
  const [teamsUser, setTeamsUser] = useState<TeamsUserInfo | null>(null);
  const [selectedProvider, setSelectedProvider] =
    useState<SmsProvider>("twilio");
  const { accounts } = useMsal();

  const smsProviders: SmsProviderOption[] = [
    {
      id: "twilio",
      name: "Twilio",
      icon: <FaPhone size={24} className="sm:size-8" />,
      description: "Send SMS via Twilio API (requires account)",
    },
    {
      id: "local",
      name: "Local SMS Gateway",
      icon: <FaServer size={24} className="sm:size-8" />,
      description: "Send via local SMS Gateway app on the same network",
    },
    {
      id: "cloud",
      name: "Cloud SMS Gateway",
      icon: <FaCloud size={24} className="sm:size-8" />,
      description: "Send via cloud-hosted SMS Gateway service",
    },
  ];

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        await microsoftTeams.app.initialize();
        // Get Teams user info
        const context = await microsoftTeams.app.getContext();
        if (context.user) {
          setTeamsUser({
            displayName: context.user.displayName,
            userPrincipalName: context.user.userPrincipalName,
          });
        }
      } catch (error) {
        console.log(error, "Not in Teams environment");

        // Not in Teams - check if we have MSAL account info
        if (accounts.length > 0) {
          setTeamsUser({
            displayName: accounts[0].name || accounts[0].username,
            userPrincipalName: accounts[0].username,
          });
        }
      }
    };

    getUserInfo();
  }, [accounts]);

  const handleAddNumber = () => {
    if (newNumber.trim() && !phoneNumbers.includes(newNumber.trim())) {
      setPhoneNumbers([...phoneNumbers, newNumber.trim()]);
      setNewNumber("");
    }
  };

  const handleRemoveNumber = (numberToRemove: string) => {
    setPhoneNumbers(phoneNumbers.filter((num) => num !== numberToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddNumber();
    }
  };

  const getSignature = () => {
    if (!useSignature) return "";

    // No user info available
    if (!teamsUser && accounts.length === 0) {
      return "No signature available. Please sign in.";
    }

    // Use either Teams user or MSAL account
    const userName =
      teamsUser?.displayName ||
      accounts[0]?.name ||
      accounts[0]?.username ||
      "User";
    const userEmail =
      teamsUser?.userPrincipalName ||
      accounts[0]?.username ||
      "email@example.com";
    const timestamp = new Date().toLocaleString();

    return `${userName}\n${userEmail}\nSent at: ${timestamp}`;
  };

  const handleSendSMS = async () => {
    if (phoneNumbers.length === 0) {
      setStatus("error");
      setErrorMessage("Please add at least one phone number");
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    const messageWithSignature =
      message + "\n\n" + (useSignature ? getSignature() : "");

    try {
      let results;

      switch (selectedProvider) {
        case "twilio":
          // Use Twilio API via our backend
          results = await Promise.all(
            phoneNumbers.map((to) =>
              fetch("/api/send-sms", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  to,
                  message: messageWithSignature,
                  provider: "twilio",
                }),
              })
            )
          );
          break;

        case "local":
        case "cloud":
          // Use our backend API for SMS gateway
          const phoneNumbersArray = phoneNumbers.map((number) => number.trim());

          results = await Promise.all([
            fetch("/api/send-sms", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                to: phoneNumbersArray,
                message: messageWithSignature,
                provider: selectedProvider,
              }),
            }),
          ]);
          break;

        default:
          throw new Error("Invalid SMS provider selected");
      }

      const hasError = results.some((res) => !res.ok);
      if (hasError) {
        // Try to get more detailed error message
        const errorDetails = await Promise.all(
          results
            .filter((res) => !res.ok)
            .map(async (res) => {
              try {
                const errorData = await res.json();
                return (
                  errorData.error ||
                  errorData.details ||
                  `Error ${res.status}: ${res.statusText}`
                );
              } catch (err) {
                return `Error: ${err}`;
              }
            })
        );

        throw new Error(`Failed to send messages: ${errorDetails.join(", ")}`);
      }

      setStatus("success");
      setPhoneNumbers([]);
      setMessage("");

      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to send SMS"
      );
    }
  };

  const renderSignaturePreview = () => {
    if (!useSignature) return null;

    const signature = getSignature();
    const isPlaceholder =
      signature === "No signature available. Please sign in.";

    return (
      <div className="bg-gray-700 p-3 sm:p-4 rounded-md border border-gray-600">
        <p className="text-xs sm:text-sm font-medium text-gray-200 mb-2">
          Signature Preview:
        </p>
        <pre
          className={`text-xs sm:text-sm ${
            isPlaceholder ? "text-gray-500" : "text-gray-300"
          } bg-gray-800 p-2 sm:p-3 rounded whitespace-pre-wrap font-mono`}
        >
          {signature}
        </pre>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md md:max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 shadow-lg max-h-[650px] md:max-h-none overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
          <IoMdSend className="mr-2" />
          Send Bulk SMS
        </h2>

        <div className="space-y-4 sm:space-y-6">
          {/* SMS Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2 sm:mb-3">
              Select SMS Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {smsProviders.map((provider) => (
                <div
                  key={provider.id}
                  className={`flex flex-row sm:flex-col items-center p-3 sm:p-4 border rounded-md cursor-pointer transition-colors ${
                    selectedProvider === provider.id
                      ? "border-blue-500 bg-blue-900/30"
                      : "border-gray-600 bg-gray-700 hover:bg-gray-600"
                  }`}
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <div className="text-white mr-3 sm:mr-0 sm:mb-3 h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center flex-shrink-0">
                    {provider.icon}
                  </div>
                  <div className="sm:text-center">
                    <p className="text-sm sm:text-base text-white font-medium">
                      {provider.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {provider.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Add Phone Numbers
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  selectedProvider !== "twilio"
                    ? "Enter mobile number (will format to +61)"
                    : "Enter mobile number (e.g. 0412345678)"
                }
                className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddNumber}
                disabled={!newNumber.trim()}
                className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
              >
                <IoAddCircle className="mr-1" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>

            {/* Phone Number Cards */}
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {phoneNumbers.map((number, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-700 p-2 sm:p-3 rounded-md group hover:bg-gray-600 transition-colors"
                >
                  <span className="text-sm sm:text-base text-white truncate">
                    {number}
                    {selectedProvider !== "twilio" &&
                      !number.startsWith("+") && (
                        <span className="ml-1 text-xs text-blue-400">
                          {number.startsWith("0")
                            ? `(→ +61${number.substring(1)})`
                            : number.startsWith("4")
                            ? `(→ +61${number})`
                            : ""}
                        </span>
                      )}
                  </span>
                  <button
                    onClick={() => handleRemoveNumber(number)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    aria-label="Remove number"
                  >
                    <IoMdClose size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>
              ))}
            </div>
            {phoneNumbers.length > 0 && (
              <p className="mt-2 text-xs sm:text-sm text-gray-400">
                {phoneNumbers.length} number
                {phoneNumbers.length !== 1 ? "s" : ""} added
                {selectedProvider !== "twilio" && (
                  <span className="ml-1 text-blue-400">
                    (Australian numbers will be formatted to +61 format)
                  </span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message here..."
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="signature"
              checked={useSignature}
              onChange={(e) => setUseSignature(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="signature"
              className="ml-2 block text-xs sm:text-sm text-gray-200"
            >
              Add signature (name, email, and timestamp)
            </label>
          </div>

          {useSignature && renderSignaturePreview()}

          <button
            onClick={handleSendSMS}
            disabled={
              status === "sending" || phoneNumbers.length === 0 || !message
            }
            className={`w-full flex justify-center items-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition-colors
              ${
                status === "sending" || phoneNumbers.length === 0 || !message
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
              }`}
          >
            {status === "sending" ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                <span className="truncate">Sending...</span>
              </>
            ) : (
              <>
                <IoMdSend className="mr-2 flex-shrink-0" />
                <span className="truncate">
                  Send SMS via{" "}
                  {smsProviders.find((p) => p.id === selectedProvider)?.name} (
                  {phoneNumbers.length} recipient
                  {phoneNumbers.length !== 1 ? "s" : ""})
                </span>
              </>
            )}
          </button>
        </div>

        {status === "success" && (
          <div className="mt-4 rounded-md bg-green-900/50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-300">
              SMS sent successfully!
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-4 rounded-md bg-red-900/50 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-300">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
