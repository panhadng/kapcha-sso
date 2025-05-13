import { NextApiRequest, NextApiResponse } from 'next';
import { ConfidentialClientApplication } from '@azure/msal-node';

interface MSALError {
  errorCode?: string;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ssoToken } = req.body;

    if (!ssoToken) {
      return res.status(400).json({ error: 'SSO token is required' });
    }

    // Initialize MSAL confidential client
    const msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID as string,
        clientSecret: process.env.AZURE_CLIENT_SECRET as string,
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_TENANT_ID}`
      }
    });

    // Exchange the SSO token for an access token using OBO flow
    const result = await msalClient.acquireTokenOnBehalfOf({
      oboAssertion: ssoToken,
      scopes: [
        process.env.AZURE_API_SCOPE as string,
      ],
      skipCache: true,
    });

    if (!result || !result.accessToken) {
      return res.status(401).json({ error: 'Failed to acquire token' });
    }

    // Use the access token to call Microsoft Graph
    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${result.accessToken}`
      }
    });

    if (!graphResponse.ok) {
      const errorText = await graphResponse.text();
      console.error('Graph API error:', errorText);
      return res.status(graphResponse.status).json({ error: 'Error calling Graph API', details: errorText });
    }

    // Return the profile data to the client
    const profileData = await graphResponse.json();
    return res.status(200).json(profileData);
  } catch (error: unknown) {
    console.error("OBO flow error:", error);

    // Handle AADSTS65001 error (consent required)
    if (
      (error as MSALError).errorCode === "invalid_grant" ||
      (error as MSALError).errorCode === "interaction_required"
    ) {
      return res.status(401).json({
        error: "consent_required",
        message: "User consent required for Graph permissions",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: (error as Error).message || "Unknown error",
    });
  }
} 