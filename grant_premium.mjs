#!/usr/bin/env node
/**
 * One-off script to grant yourself permanent premium access.
 * 
 * Usage: node grant_premium.mjs
 * 
 * It lists all users from the Firebase Auth REST API using the API key,
 * then writes a subscription document for each user (or you can pick one).
 * 
 * Since we can't use Admin SDK without a service account, this script
 * uses the Firestore REST API with a custom token workaround.
 * 
 * Actually, the simplest approach: we'll use the Firebase client SDK
 * and sign in with email/password or Google to get an authenticated session,
 * then write the doc.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { createInterface } from "readline";

const firebaseConfig = {
  apiKey: "AIzaSyBGFw-QVH-ySNF07BH0tPr_yAmh_trlagQ",
  authDomain: "studio-8021146580-c5c2b.firebaseapp.com",
  projectId: "studio-8021146580-c5c2b",
  storageBucket: "studio-8021146580-c5c2b.firebasestorage.app",
  messagingSenderId: "878583748075",
  appId: "1:878583748075:web:608dd745af82434409f5ae"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log("\n🔑 Grant Premium Access Script\n");
  
  const email = await ask("Enter your Firebase account email: ");
  const password = await ask("Enter your Firebase account password: ");

  try {
    console.log("\n⏳ Signing in...");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ Signed in as: ${user.email}`);
    console.log(`   UID: ${user.uid}\n`);

    const subscriptionData = {
      status: "active",
      plan: "premium",
      startDate: "2026-01-01",
      endDate: "2099-12-31",
      expiresAt: "2099-12-31T23:59:59.000Z",
      createdAt: new Date().toISOString(),
      grantedManually: true,
    };

    console.log("⏳ Writing subscription to Firestore...");
    const docRef = doc(db, "subscriptions", user.uid);
    await setDoc(docRef, subscriptionData, { merge: true });

    console.log("✅ Done! Your subscription document has been created:");
    console.log(JSON.stringify(subscriptionData, null, 2));
    console.log("\n🎉 You now have permanent premium access!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      console.log("   Check your email and password and try again.");
    }
    if (error.code === "auth/user-not-found") {
      console.log("   No account found with that email. Sign up in the app first.");
    }
  }

  rl.close();
  process.exit(0);
}

main();
