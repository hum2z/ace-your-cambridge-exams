"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function GrantPremiumPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function grant() {
      if (!user) return;

      try {
        setStatus("writing");

        const subscriptionData = {
          status: "active",
          plan: "premium",
          startDate: "2026-01-01",
          endDate: "2099-12-31",
          expiresAt: "2099-12-31T23:59:59.000Z",
          createdAt: new Date().toISOString(),
          grantedManually: true,
        };

        const docRef = doc(db, "subscriptions", user.uid);
        await setDoc(docRef, subscriptionData, { merge: true });

        // Also cache in localStorage
        localStorage.setItem(
          `pastpaper_subscription_${user.uid}`,
          JSON.stringify(subscriptionData)
        );

        setStatus("done");
      } catch (err) {
        console.error("Grant premium error:", err);
        setError(err.message);
        setStatus("error");
      }
    }

    grant();
  }, [user]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        textAlign: "center",
        padding: "40px",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        maxWidth: "500px",
      }}>
        {!user && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>⏳ Waiting for sign-in...</h1>
            <p style={{ color: "#999" }}>Please sign in first, then revisit this page.</p>
          </>
        )}
        {status === "writing" && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>⏳ Granting premium...</h1>
            <p style={{ color: "#999" }}>Writing to Firestore...</p>
          </>
        )}
        {status === "done" && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>🎉 Done!</h1>
            <p style={{ color: "#4ade80", marginBottom: "8px" }}>Premium access granted permanently.</p>
            <p style={{ color: "#999", fontSize: "14px" }}>UID: {user?.uid}</p>
            <a href="/" style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "10px 24px",
              background: "#6c63ff",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
            }}>
              Go to Dashboard →
            </a>
          </>
        )}
        {status === "error" && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>❌ Error</h1>
            <p style={{ color: "#f87171" }}>{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
