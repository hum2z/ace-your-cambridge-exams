"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function GrantPremiumPage() {
  const { user, loginWithGoogle } = useAuth();
  const [status, setStatus] = useState("waiting");
  const [error, setError] = useState(null);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      setError(null);
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please check pop-up settings.");
    } finally {
      setSigningIn(false);
    }
  };

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
      background: "var(--bg-color)",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        textAlign: "center",
        padding: "40px",
        borderRadius: "2px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        maxWidth: "500px",
        width: "90%",
      }}>
        {!user && (
          <>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>🔒 Admin Access</h1>
            <p style={{ color: "#999", marginBottom: "24px" }}>Please sign in to grant premium status to your account.</p>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              style={{
                width: "100%",
                background: "white",
                color: "black",
                border: "none",
                borderRadius: "2px",
                padding: "14px 20px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: signingIn ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {signingIn ? (
                <div style={{ width: "18px", height: "18px", border: "2px solid rgba(0,0,0,0.1)", borderLeftColor: "black", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with Google
                </>
              )}
            </button>
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
              borderRadius: "2px",
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
