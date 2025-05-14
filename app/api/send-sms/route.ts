import { NextResponse } from "next/server";
import twilio from "twilio";

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// SMS Gateway URLs from environment variables
const DEFAULT_LOCAL_SMS_GATEWAY_URL = process.env.LOCAL_SMS_GATEWAY_URL || "";
const DEFAULT_CLOUD_SMS_GATEWAY_URL = process.env.CLOUD_SMS_GATEWAY_URL || "";

// Fallback credentials from environment variables
const LOCAL_SMS_USERNAME = process.env.LOCAL_SMS_USERNAME || "";
const LOCAL_SMS_PASSWORD = process.env.LOCAL_SMS_PASSWORD || "";
const CLOUD_SMS_USERNAME = process.env.CLOUD_SMS_USERNAME || "";
const CLOUD_SMS_PASSWORD = process.env.CLOUD_SMS_PASSWORD || "";

// Initialize Twilio client only if credentials are available
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function POST(request: Request) {
  try {  
    const { 
      to, 
      message, 
      provider = "twilio"
    } = await request.json();

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Handle different SMS providers
    switch (provider) {
      case "twilio":
        return await sendViaTwilio(to, message);
      
      case "local":
        return await sendViaLocalGateway(to, message);
      
      case "cloud":
        return await sendViaCloudGateway(to, message);
      
      default:
        return NextResponse.json(
          { error: 'Invalid SMS provider' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Send SMS using Twilio
async function sendViaTwilio(to: string, message: string) {
  if (!client) {
    return NextResponse.json(
      { error: 'Twilio credentials not configured' },
      { status: 500 }
    );
  }

  const result = await client.messages.create({
    body: message,
    to: to,
    from: fromNumber,
  });

  return NextResponse.json({ success: true, messageId: result.sid, provider: 'twilio' });
}

// Send SMS using Local SMS Gateway
async function sendViaLocalGateway(
  to: string, 
  message: string
) {
  const serverUrl = DEFAULT_LOCAL_SMS_GATEWAY_URL;
  
  if (!serverUrl) {
    return NextResponse.json(
      { error: 'Local SMS Gateway URL not configured' },
      { status: 500 }
    );
  }

  // Create basic auth header if credentials are available
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  // Use environment variables for credentials
  if (LOCAL_SMS_USERNAME && LOCAL_SMS_PASSWORD) {
    const authString = Buffer.from(`${LOCAL_SMS_USERNAME}:${LOCAL_SMS_PASSWORD}`).toString('base64');
    headers['Authorization'] = `Basic ${authString}`;
  }

  const response = await fetch(`${serverUrl}/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      phoneNumbers: Array.isArray(to) ? to : [to]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local SMS Gateway error: ${errorText}`);
  }

  const result = await response.json();
  return NextResponse.json({ 
    success: true, 
    result, 
    provider: 'local' 
  });
}

// Send SMS using Cloud SMS Gateway
async function sendViaCloudGateway(
  to: string, 
  message: string
) {
  const cloudUrl = DEFAULT_CLOUD_SMS_GATEWAY_URL;
  
  if (!cloudUrl) {
    return NextResponse.json(
      { error: 'Cloud SMS Gateway URL not configured' },
      { status: 500 }
    );
  }
  
  // Create basic auth header if credentials are available
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };

  // Use environment variables for credentials
  if (CLOUD_SMS_USERNAME && CLOUD_SMS_PASSWORD) {
    const authString = Buffer.from(`${CLOUD_SMS_USERNAME}:${CLOUD_SMS_PASSWORD}`).toString('base64');
    headers['Authorization'] = `Basic ${authString}`;
  }

  // Format phone numbers for Cloud SMS Gateway (ensure +61 format for Australian numbers)
  const formattedPhoneNumbers = Array.isArray(to) 
    ? to.map(num => formatPhoneNumber(num))
    : [formatPhoneNumber(to)];

  const response = await fetch(cloudUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      phoneNumbers: formattedPhoneNumbers
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloud SMS Gateway error: ${errorText}`);
  }

  const result = await response.json();
  return NextResponse.json({ 
    success: true, 
    result, 
    provider: 'cloud' 
  });
}

// Helper function to format phone numbers to international format for Australia
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any spaces, dashes, or other non-digit characters except the plus sign
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it's already in international format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // Handle Australian numbers
  if (cleaned.startsWith('0')) {
    // Replace the leading 0 with +61
    return '+61' + cleaned.substring(1);
  }
  
  // For numbers without country code or leading zero, assume Australian and add +61
  if (!cleaned.startsWith('0') && !cleaned.startsWith('+')) {
    // If number looks like a mobile number (starts with 4), add +61 directly
    if (cleaned.startsWith('4')) {
      return '+61' + cleaned;
    }
    // Otherwise, add as is
    return '+' + cleaned;
  }
  
  // Return as is for other cases
  return cleaned;
} 