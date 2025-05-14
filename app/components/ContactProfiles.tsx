export const ContactProfiles = () => (
  <div className="w-full max-w-md md:max-w-3xl mx-auto px-4 sm:px-6 py-6">
    <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 shadow-lg max-h-[650px] md:max-h-none overflow-y-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
        Contact Profiles
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="text-gray-300 font-medium">
          Contact Management Coming Soon
        </p>
        <p className="text-xs text-gray-400 mt-2">
          This feature is currently under development
        </p>
      </div>
    </div>
  </div>
);
