import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

function getAllowlist() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
    }

    const allowlist = getAllowlist();
    if (allowlist.length === 0) {
      return NextResponse.json(
        { error: "Admin access is not configured on this deployment." },
        { status: 503 }
      );
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const email = (decoded.email || "").toLowerCase();
    if (!decoded.email_verified || !allowlist.includes(email)) {
      return NextResponse.json(
        { error: "You are not authorized to grant premium access." },
        { status: 403 }
      );
    }

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

    await getAdminDb().collection("subscriptions").doc(decoded.uid).set(subscriptionData, { merge: true });

    return NextResponse.json({ success: true, uid: decoded.uid, subscription: subscriptionData });
  } catch (error) {
    console.error("Admin grant-premium error:", error);
    return NextResponse.json({ error: "Failed to grant premium access." }, { status: 500 });
  }
}
