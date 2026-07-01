import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { createZiinaPaymentIntent } from "@/lib/ziina";

const AMOUNT_FILS = 500; // $5 USD in cents
const RENEWAL_WINDOW_DAYS = 3;
// Keep generating a renewal link for a while after actual expiry too — if the
// cron missed its window (deploy outage, etc.) the user shouldn't permanently
// lose the "Renew now" reminder just because they're now a few days late.
const POST_EXPIRY_GRACE_DAYS = 7;
const REGENERATE_AFTER_HOURS = 24;

// Ziina's public API is hosted-checkout/one-time only — there is no
// card-on-file token to silently re-charge, so "auto-renew" here means:
// a few days before a subscription lapses, pre-generate a fresh Ziina
// checkout link and surface it as a one-click "Renew now" banner in the app
// (see PremiumGate / subscription page). This is scheduled via vercel.json
// and requires CRON_SECRET to be set in the Vercel project env vars.
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://past-paper-hum2z.vercel.app";
  const db = getAdminDb();
  const now = Date.now();

  try {
    const snapshot = await db
      .collection("subscriptions")
      .where("autoRenew", "==", true)
      .where("status", "==", "active")
      .get();

    let processed = 0;
    const errors = [];

    for (const docSnap of snapshot.docs) {
      const sub = docSnap.data();
      const uid = docSnap.id;

      const expiresAt = sub.expiresAt ? new Date(sub.expiresAt).getTime() : null;
      if (!expiresAt) continue;

      const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry > RENEWAL_WINDOW_DAYS || daysUntilExpiry < -POST_EXPIRY_GRACE_DAYS) continue;

      const lastGenerated = sub.pendingRenewalGeneratedAt ? new Date(sub.pendingRenewalGeneratedAt).getTime() : 0;
      if (now - lastGenerated < REGENERATE_AFTER_HOURS * 60 * 60 * 1000) continue;

      try {
        const { redirectUrl, paymentIntentId } = await createZiinaPaymentIntent({
          amountFils: AMOUNT_FILS,
          message: "PastPaper Pro - 30 Day Renewal",
          successUrl: `${appUrl}/subscription/success?pi={PAYMENT_INTENT_ID}&uid=${uid}`,
          cancelUrl: `${appUrl}/subscription`,
        });

        await docSnap.ref.set(
          {
            pendingRenewalUrl: redirectUrl,
            pendingRenewalPaymentIntentId: paymentIntentId,
            pendingRenewalGeneratedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        processed += 1;
      } catch (err) {
        console.error(`Renewal generation failed for ${uid}:`, err);
        errors.push(uid);
      }
    }

    return NextResponse.json({ checked: snapshot.size, processed, errors });
  } catch (error) {
    console.error("Renewal cron error:", error);
    return NextResponse.json({ error: "Renewal cron failed" }, { status: 500 });
  }
}
