import { NextResponse } from "next/server";
import { createZiinaPaymentIntent } from "@/lib/ziina";
import { getAdminDb } from "@/lib/firebaseAdmin";

const MAX_SEATS = 500;

export async function POST(request) {
  try {
    const { classId, teacherUid } = await request.json();

    if (!classId || !teacherUid) {
      return NextResponse.json({ error: "Missing classroom or teacher ID." }, { status: 400 });
    }

    const classroomSnap = await getAdminDb().collection("classrooms").doc(classId).get();
    if (!classroomSnap.exists) {
      return NextResponse.json({ error: "Classroom not found." }, { status: 404 });
    }
    const classroom = classroomSnap.data();
    if (classroom.teacherUid !== teacherUid) {
      return NextResponse.json({ error: "Not authorized for this classroom." }, { status: 403 });
    }

    const seatCount = Number(classroom.seatCount) || 0;
    if (seatCount <= 0 || seatCount > MAX_SEATS) {
      return NextResponse.json({ error: `Seat count must be between 1 and ${MAX_SEATS}.` }, { status: 400 });
    }
    const pricePerSeatFils = Number(classroom.pricePerSeatFils) || 300;
    const amountFils = seatCount * pricePerSeatFils;

    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/[^/]*$/, "") ||
      "https://past-paper-hum2z.vercel.app";

    const { redirectUrl, paymentIntentId } = await createZiinaPaymentIntent({
      amountFils,
      message: `PastPaper Classroom - ${seatCount} seats / 30 days`,
      successUrl: `${origin}/subscription/success?pi={PAYMENT_INTENT_ID}&classId=${classId}`,
      cancelUrl: `${origin}/teacher?cancelled=true`,
    });

    return NextResponse.json({ redirect_url: redirectUrl, payment_intent_id: paymentIntentId });
  } catch (error) {
    console.error("Create classroom payment error:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: error.status || 500 });
  }
}
