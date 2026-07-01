import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const { uid, classId, inviteCode } = await request.json();
    if (!uid || !classId || !inviteCode) {
      return NextResponse.json({ error: "Missing join details." }, { status: 400 });
    }

    const db = getAdminDb();
    const classroomRef = db.collection("classrooms").doc(classId);
    const classroomSnap = await classroomRef.get();
    if (!classroomSnap.exists) {
      return NextResponse.json({ error: "Classroom not found." }, { status: 404 });
    }

    const classroom = classroomSnap.data();
    if (classroom.inviteCode !== inviteCode) {
      return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
    }
    if (classroom.status !== "active") {
      return NextResponse.json({ error: "This classroom isn't active yet." }, { status: 403 });
    }
    const studentUids = classroom.studentUids || [];
    if (!studentUids.includes(uid) && studentUids.length >= (classroom.seatCount || 0)) {
      return NextResponse.json({ error: "This classroom is full." }, { status: 409 });
    }

    await Promise.all([
      classroomRef.set({ studentUids: FieldValue.arrayUnion(uid) }, { merge: true }),
      db.collection("subscriptions").doc(uid).set({ classroomId: classId }, { merge: true }),
    ]);

    return NextResponse.json({ success: true, expiresAt: classroom.expiresAt });
  } catch (error) {
    console.error("Classroom join error:", error);
    return NextResponse.json({ error: "Failed to join classroom." }, { status: 500 });
  }
}
