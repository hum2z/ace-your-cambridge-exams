import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

const PROJECT_ID = "studio-8021146580-c5c2b";

function ensureAdminApp() {
  if (getApps().length === 0) {
    initializeApp({ projectId: PROJECT_ID });
  }
}

export function getAdminDb() {
  ensureAdminApp();
  return getFirestore();
}

export function getAdminAuth() {
  ensureAdminApp();
  return getAuth();
}
