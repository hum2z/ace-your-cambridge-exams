import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(request) {
  try {
    const { uid, email } = await requireAdmin(request);

    const now = new Date();
    const subscriptionData = {
      status: "active",
      plan: "premium",
      startDate: now.toISOString(),
      endDate: "2099-12-31",
      expiresAt: "2099-12-31T23:59:59.000Z",
      createdAt: now.toISOString(),
      grantedManually: true,
      grantedBy: email,
    };

    await getAdminDb().collection("subscriptions").doc(uid).set(subscriptionData, { merge: true });

    return NextResponse.json({ success: true, uid, subscription: subscriptionData });
  } catch (error) {
    console.error("Admin grant-premium error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to grant premium access." },
      { status: error.status || 500 }
    );
  }
}
