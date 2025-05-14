export const TeamsChat = () => (
  <div className="w-full max-w-md md:max-w-3xl mx-auto px-4 sm:px-6 py-6">
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 shadow-lg max-h-[650px] md:max-h-none overflow-y-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
        Teams Chat
      </h2>

      <div className="bg-gray-700/50 p-8 rounded-lg border border-gray-600 text-center flex flex-col items-center justify-center">
        <div className="text-gray-400 text-4xl mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <p className="text-gray-300 font-medium">
          Chat Integration Coming Soon
        </p>
        <p className="text-xs text-gray-400 mt-2">
          This feature is currently under development
        </p>
      </div>
    </div>
  </div>
);
