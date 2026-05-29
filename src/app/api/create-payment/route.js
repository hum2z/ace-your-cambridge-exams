import { NextResponse } from "next/server";

const ZIINA_API_URL = "https://api-v2.ziina.com/api/payment_intent";
const AMOUNT_FILS = 2000; // 20 AED in fils (1 AED = 100 fils)
const CURRENCY = "AED";

export async function POST(request) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User must be authenticated to make a payment." },
        { status: 401 }
      );
    }

    const apiKey = process.env.ZIINA_API_KEY;
    if (!apiKey) {
      console.error("ZIINA_API_KEY is not configured");
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 500 }
      );
    }

    // Determine the base URL for redirects
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      "https://past-paper-hum2z.vercel.app";

    const successUrl = `${origin}/subscription/success?pi={PAYMENT_INTENT_ID}&uid=${userId}`;
    const cancelUrl = `${origin}/subscription?cancelled=true`;

    const response = await fetch(ZIINA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: AMOUNT_FILS,
        currency_code: CURRENCY,
        message: "PastPaper Pro - 30 Day Pass",
        success_url: successUrl,
        cancel_url: cancelUrl,
        test: process.env.ZIINA_TEST_MODE !== "false", // Default to test mode
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Ziina API error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to create payment." },
        { status: response.status }
      );
    }

    return NextResponse.json({
      redirect_url: data.redirect_url,
      payment_intent_id: data.id,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
