import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Initialize Supabase (Service Role for admin access to profiles)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Initialize Twilio
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;

const client = (TWILIO_SID && TWILIO_TOKEN) ? twilio(TWILIO_SID, TWILIO_TOKEN) : null;

/**
 * Sends an SMS notification to a specific user based on their preferences.
 * @param userId The UUID of the user in Supabase
 * @param message The text content to send
 */
export async function sendSMSNotification(userId: string, message: string) {
  if (!client || !TWILIO_PHONE) {
    console.warn("[Twilio] Service not configured. Skipping SMS.");
    return;
  }

  try {
    // 1. Fetch user notification preferences
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("phone_number, sms_notifications_enabled")
      .eq("id", userId)
      .single();

    if (error) {
      console.error(`[Twilio] Failed to fetch profile for ${userId}:`, error.message);
      return;
    }

    // 2. Validate preferences
    if (!profile?.sms_notifications_enabled) {
      console.log(`[Twilio] SMS disabled for user ${userId}.`);
      return;
    }

    if (!profile?.phone_number) {
      console.warn(`[Twilio] No phone number found for user ${userId}.`);
      return;
    }

    // 3. Dispatch SMS
    const response = await client.messages.create({
      body: `[CropPulse Alert] ${message}`,
      from: TWILIO_PHONE,
      to: profile.phone_number
    });

    console.log(`[Twilio] SMS sent to ${profile.phone_number}. SID: ${response.sid}`);
    return response;
  } catch (error: any) {
    console.error("[Twilio] Critical dispatch error:", error.message);
    throw error;
  }
}

/**
 * Verifies if the Twilio service is correctly configured.
 */
export function isTwilioReady(): boolean {
  return !!(client && TWILIO_PHONE);
}
