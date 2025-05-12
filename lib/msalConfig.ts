if (!process.env.NEXT_PUBLIC_AZURE_CLIENT_ID) {
  throw new Error('Missing NEXT_PUBLIC_AZURE_CLIENT_ID environment variable');
}

if (!process.env.NEXT_PUBLIC_AZURE_TENANT_ID) {
  throw new Error('Missing NEXT_PUBLIC_AZURE_TENANT_ID environment variable');
}

if (!process.env.NEXT_PUBLIC_REDIRECT_URI) {
  throw new Error('Missing NEXT_PUBLIC_REDIRECT_URI environment variable');
}

export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`,
    redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true, // Required for IE11 and Edge
  },
};

// Add login request configuration
export const loginRequest = {
  scopes: ["User.Read"] // Add any other scopes your app needs
}; 