import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(request) {
  try {
    const { uid, classId } = await request.json();
    if (!uid || !classId) {
      return NextResponse.json({ error: "Missing user or classroom ID." }, { status: 400 });
    }

    const db = getAdminDb();
    await Promise.all([
      db.collection("classrooms").doc(classId).set(
        { studentUids: FieldValue.arrayRemove(uid) },
        { merge: true }
      ),
      db.collection("subscriptions").doc(uid).update({ classroomId: FieldValue.delete() }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Classroom leave error:", error);
    return NextResponse.json({ error: "Failed to leave classroom." }, { status: 500 });
  }
}
