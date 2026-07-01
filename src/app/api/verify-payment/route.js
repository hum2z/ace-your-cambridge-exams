import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("pi");
    const userId = searchParams.get("uid");
    const classId = searchParams.get("classId");

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZIINA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Payment service not configured" },
        { status: 500 }
      );
    }

    // Verify payment status with Ziina
    const response = await fetch(
      `https://api-v2.ziina.com/api/payment_intent/${paymentIntentId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const paymentData = await response.json();

    if (!response.ok) {
      console.error("Ziina verification error:", paymentData);
      return NextResponse.json(
        { error: "Failed to verify payment" },
        { status: response.status }
      );
    }

    const isCompleted = paymentData.status === "completed";

    // If payment is completed, activate the relevant record in Firestore —
    // either an individual subscription, or (for teacher bulk purchases) the
    // classroom itself, whose active status all of its students inherit.
    if (isCompleted && (userId || classId)) {
      try {
        const db = getAdminDb();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

        if (classId) {
          await db
            .collection("classrooms")
            .doc(classId)
            .set(
              {
                status: "active",
                paymentIntentId,
                activatedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                updatedAt: now.toISOString(),
              },
              { merge: true }
            );
          console.log(`Classroom ${classId} activated, expires ${expiresAt.toISOString()}`);
        } else {
          await db
            .collection("subscriptions")
            .doc(userId)
            .set(
              {
                status: "active",
                paymentIntentId,
                activatedAt: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                updatedAt: now.toISOString(),
              },
              { merge: true }
            );
          console.log(`Subscription activated for user ${userId}, expires ${expiresAt.toISOString()}`);
        }
      } catch (dbError) {
        console.error("Firestore update error:", dbError);
        // Don't fail the response — payment was still verified
      }
    }

    return NextResponse.json({
      status: paymentData.status,
      completed: isCompleted,
      expiresAt: isCompleted
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
