import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(request) {
  try {
    await requireAdmin(request);

    const db = getAdminDb();
    const subscriptions = db.collection("subscriptions");

    const [totalUsers, activeStatusSnap, trialCount, referralCount, classroomsSnap] = await Promise.all([
      subscriptions.count().get(),
      // Fetch (not just count) "active"-status docs — status is never reset
      // to anything else on expiry, so a raw count would include long-lapsed
      // subscriptions. Filter by actual expiresAt below for an honest number.
      subscriptions.where("status", "==", "active").get(),
      subscriptions.where("status", "==", "trial").count().get(),
      db.collection("referrals").count().get(),
      db.collection("classrooms").get(),
    ]);

    const now = Date.now();
    const activePremium = activeStatusSnap.docs.filter((doc) => {
      const expiresAt = doc.data().expiresAt;
      return expiresAt && new Date(expiresAt).getTime() > now;
    }).length;

    let activeClassrooms = 0;
    let totalSeats = 0;
    let studentsEnrolled = 0;
    classroomsSnap.forEach((doc) => {
      const c = doc.data();
      totalSeats += Number(c.seatCount) || 0;
      studentsEnrolled += (c.studentUids || []).length;
      if (c.status === "active" && c.expiresAt && new Date(c.expiresAt).getTime() > now) {
        activeClassrooms += 1;
      }
    });

    return NextResponse.json({
      totalSignups: totalUsers.data().count,
      activePremium,
      onTrial: trialCount.data().count,
      successfulReferrals: referralCount.data().count,
      classrooms: {
        total: classroomsSnap.size,
        active: activeClassrooms,
        totalSeats,
        studentsEnrolled,
      },
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load metrics." },
      { status: error.status || 500 }
    );
  }
}
