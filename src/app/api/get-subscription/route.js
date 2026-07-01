import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

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
