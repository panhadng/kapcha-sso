export const TeamsChat = () => (
  <div className="w-full max-w-md md:max-w-3xl mx-auto px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 pb-36 sm:pb-40 md:pb-6">
    <div className="bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg border border-gray-700 shadow-lg min-h-0 h-auto max-h-[calc(100vh-160px)] md:max-h-none overflow-y-auto">
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-3 sm:mb-4 md:mb-6 flex items-center">
        Teams Chat
      </h2>

      <div className="bg-gray-700/50 p-4 sm:p-6 md:p-8 rounded-lg border border-gray-600 text-center flex flex-col items-center justify-center">
        <div className="text-gray-400 text-3xl sm:text-4xl mb-3 sm:mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 sm:h-16 w-12 sm:w-16"
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
        <p className="text-sm sm:text-base text-gray-300 font-medium">
          Chat Integration Coming Soon
        </p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">
          This feature is currently under development
        </p>
      </div>
    </div>
  </div>
);
