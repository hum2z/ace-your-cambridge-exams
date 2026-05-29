import { NextResponse } from "next/server";
import crypto from "crypto";

// Ziina webhook IPs for optional IP whitelisting
const ZIINA_WEBHOOK_IPS = [
  "3.29.184.186",
  "3.29.190.95",
  "20.233.47.127",
  "13.202.161.181",
];

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hmac-signature");

    // Verify HMAC signature if webhook secret is configured
    const webhookSecret = process.env.ZIINA_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error("Webhook signature verification failed");
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    console.log("Ziina webhook received:", JSON.stringify(payload, null, 2));

    const { id, status } = payload;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    // Store payment status update via our verify endpoint logic
    // We use the Ziina API to get full payment details and update Firestore
    if (status === "completed") {
      console.log(`Payment ${id} completed successfully`);

      // Call our own verify endpoint to update Firestore
      const origin =
        request.headers.get("origin") ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "https://past-paper-hum2z.vercel.app";

      await fetch(`${origin}/api/verify-payment?pi=${id}`, {
        method: "GET",
        headers: {
          "x-webhook-internal": "true",
        },
      });
    } else if (status === "failed") {
      console.error(`Payment ${id} failed`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
