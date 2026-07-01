const ZIINA_API_URL = "https://api-v2.ziina.com/api/payment_intent";

class ZiinaApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// Shared helper for creating a Ziina hosted-checkout payment intent. Ziina's
// public API is one-time/hosted-checkout only (no card-on-file tokens), so
// there is no way to silently re-charge a saved card — this just generates a
// fresh checkout link, which is reused both for the manual "Upgrade" button
// and for pre-generating renewal links ahead of expiry (see /api/cron/renewals).
export async function createZiinaPaymentIntent({ amountFils, message, successUrl, cancelUrl }) {
  const apiKey = process.env.ZIINA_API_KEY;
  if (!apiKey) {
    throw new ZiinaApiError("ZIINA_API_KEY is not configured", 500);
  }

  const response = await fetch(ZIINA_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountFils,
      currency_code: "USD",
      message,
      success_url: successUrl,
      cancel_url: cancelUrl,
      test: process.env.ZIINA_TEST_MODE !== "false",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ZiinaApiError(data.message || "Failed to create Ziina payment intent", response.status);
  }

  return { redirectUrl: data.redirect_url, paymentIntentId: data.id };
}

export async function getZiinaPaymentIntent(paymentIntentId) {
  const apiKey = process.env.ZIINA_API_KEY;
  if (!apiKey) {
    throw new ZiinaApiError("ZIINA_API_KEY is not configured", 500);
  }

  const response = await fetch(`${ZIINA_API_URL}/${paymentIntentId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new ZiinaApiError(data.message || "Failed to verify payment", response.status);
  }

  return data;
}
