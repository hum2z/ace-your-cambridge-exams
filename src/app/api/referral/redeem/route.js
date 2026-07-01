import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

// Grants both sides of a referral a bonus extraction + notes generation.
// One-time per new user: guarded by the referrals/{newUserUid} doc, which
// only the server (Admin SDK) ever writes.
export async function POST(request) {
  try {
    const { newUserUid, referrerUid } = await request.json();

    if (!newUserUid || !referrerUid) {
      return NextResponse.json({ error: "Missing user IDs." }, { status: 400 });
    }
    if (newUserUid === referrerUid) {
      return NextResponse.json({ error: "Cannot refer yourself." }, { status: 400 });
    }

    const db = getAdminDb();
    const referralRef = db.collection("referrals").doc(newUserUid);

    const alreadyRedeemed = await referralRef.get();
    if (alreadyRedeemed.exists) {
      return NextResponse.json({ error: "Referral already redeemed." }, { status: 409 });
    }

    const referrerSub = await db.collection("subscriptions").doc(referrerUid).get();
    if (!referrerSub.exists) {
      return NextResponse.json({ error: "Referrer not found." }, { status: 404 });
    }

    const bonus = { topicalUsesRemaining: FieldValue.increment(1), notesUsesRemaining: FieldValue.increment(1) };

    await Promise.all([
      referralRef.set({ referrerUid, newUserUid, redeemedAt: new Date().toISOString() }),
      db.collection("subscriptions").doc(referrerUid).set(bonus, { merge: true }),
      db.collection("subscriptions").doc(newUserUid).set(bonus, { merge: true }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Referral redeem error:", error);
    return NextResponse.json({ error: "Failed to redeem referral." }, { status: 500 });
  }
}
