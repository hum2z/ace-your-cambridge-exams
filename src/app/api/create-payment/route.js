import { NextResponse } from "next/server";
import { createZiinaPaymentIntent } from "@/lib/ziina";

const AMOUNT_FILS = 500; // $5 USD in cents

export async function POST(request) {
  try {
    const { userId, userEmail } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User must be authenticated to make a payment." },
        { status: 401 }
      );
    }

    // Determine the base URL for redirects
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      "https://past-paper-hum2z.vercel.app";

    const successUrl = `${origin}/subscription/success?pi={PAYMENT_INTENT_ID}&uid=${userId}`;
    const cancelUrl = `${origin}/subscription?cancelled=true`;

    const { redirectUrl, paymentIntentId } = await createZiinaPaymentIntent({
      amountFils: AMOUNT_FILS,
      message: "PastPaper Pro - 30 Day Pass",
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      redirect_url: redirectUrl,
      payment_intent_id: paymentIntentId,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
