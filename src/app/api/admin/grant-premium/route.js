import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'studio-8021146580-c5c2b';

// Admins allowed to grant premium. Override with the ADMIN_EMAILS env var
// (comma-separated). The owner is the default.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'mhamzashoaibkhan@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Parse the Firebase service account from env. Accepts raw JSON or base64.
function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }
}

function getAdminApp(serviceAccount) {
  if (getApps().length) return getApps()[0];
  return initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id || PROJECT_ID });
}

export async function POST(request) {
  try {
    const { email, idToken } = await request.json();
    if (!email || !idToken) {
      return NextResponse.json({ error: 'Email and auth token are required.' }, { status: 400 });
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
      return NextResponse.json(
        { error: 'Server not configured. Add the FIREBASE_SERVICE_ACCOUNT environment variable (the Firebase service account JSON) to enable email-based granting.' },
        { status: 500 }
      );
    }

    const app = getAdminApp(serviceAccount);
    const adminAuth = getAuth(app);

    // 1) Verify the caller is a signed-in admin.
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: 'Your session is invalid or expired. Sign in again.' }, { status: 401 });
    }
    const callerEmail = (decoded.email || '').toLowerCase();
    if (!ADMIN_EMAILS.includes(callerEmail)) {
      return NextResponse.json({ error: 'You are not authorized to grant premium.' }, { status: 403 });
    }

    // 2) Resolve the target user by email.
    let target;
    try {
      target = await adminAuth.getUserByEmail(email.trim());
    } catch {
      return NextResponse.json(
        { error: `No account found for ${email}. Ask them to sign in to the app once first.` },
        { status: 404 }
      );
    }

    // 3) Write the premium subscription (same shape as the existing grants).
    const db = getFirestore(app);
    const subscriptionData = {
      status: 'active',
      plan: 'premium',
      startDate: '2026-01-01',
      endDate: '2099-12-31',
      expiresAt: '2099-12-31T23:59:59.000Z',
      createdAt: new Date().toISOString(),
      grantedManually: true,
      grantedBy: callerEmail,
    };
    await db.collection('subscriptions').doc(target.uid).set(subscriptionData, { merge: true });

    return NextResponse.json({ success: true, email: target.email, uid: target.uid });
  } catch (err) {
    console.error('[admin/grant-premium] error:', err);
    return NextResponse.json({ error: `Internal error: ${err.message}` }, { status: 500 });
  }
}
