import { getAdminAuth } from "@/lib/firebaseAdmin";

class AdminAuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function getAllowlist() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

// Verifies the Bearer ID token on `request` belongs to an allowlisted admin.
// Throws AdminAuthError (with a `.status` matching the right HTTP code) on
// any failure — callers should catch and respond with error.status/message.
export async function requireAdmin(request) {
  const authHeader = request.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    throw new AdminAuthError("Missing authorization token.", 401);
  }

  const allowlist = getAllowlist();
  if (allowlist.length === 0) {
    throw new AdminAuthError("Admin access is not configured on this deployment.", 503);
  }

  const decoded = await getAdminAuth().verifyIdToken(idToken);
  const email = (decoded.email || "").toLowerCase();
  if (!decoded.email_verified || !allowlist.includes(email)) {
    throw new AdminAuthError("You are not authorized for admin access.", 403);
  }

  return { uid: decoded.uid, email };
}
