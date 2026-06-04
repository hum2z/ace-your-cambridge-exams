import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (server-side)
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: "studio-8021146580-c5c2b",
    });
  }
  return getFirestore();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("uid");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const docSnap = await db.collection("subscriptions").doc(userId).get();

    if (!docSnap.exists) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription: docSnap.data() });
  } catch (error) {
    console.error("Get subscription error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    );
  }
}
