"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

// Client-side admin list (UX only — the API enforces this server-side too).
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "mhamzashoaibkhan@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const panelStyle = {
  textAlign: "center",
  padding: "40px",
  borderRadius: "2px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  maxWidth: "520px",
  width: "90%",
};

export default function GrantPremiumPage() {
  const { user, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }
  const [signingIn, setSigningIn] = useState(false);

  const isAdmin = !!user && ADMIN_EMAILS.includes((user.email || "").toLowerCase());

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      setResult(null);
      await loginWithGoogle();
    } catch (err) {
      setResult({ ok: false, message: err.message || "Failed to sign in." });
    } finally {
      setSigningIn(false);
    }
  };

  const grant = async (targetEmail) => {
    if (!targetEmail || !targetEmail.trim()) {
      setResult({ ok: false, message: "Enter an email address." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/grant-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim(), idToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Grant failed.");
      setResult({ ok: true, message: `Premium granted to ${data.email}.` });
    } catch (err) {
      setResult({ ok: false, message: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-color)", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <div style={panelStyle}>
        <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>🔑 Grant Premium</h1>

        {!user && (
          <>
            <p style={{ color: "#999", marginBottom: "24px" }}>Sign in with an admin account to continue.</p>
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              style={{ width: "100%", background: "white", color: "black", border: "none", borderRadius: "2px", padding: "14px 20px", fontSize: "1rem", fontWeight: "700", cursor: signingIn ? "not-allowed" : "pointer" }}
            >
              {signingIn ? "Signing in…" : "Sign In with Google"}
            </button>
          </>
        )}

        {user && !isAdmin && (
          <p style={{ color: "#f87171" }}>
            Signed in as {user.email}. This account does not have admin access.
          </p>
        )}

        {user && isAdmin && (
          <>
            <p style={{ color: "#999", marginBottom: "20px", fontSize: "14px" }}>
              Signed in as {user.email}. Enter the email of the person to grant premium (they must have signed in to the app at least once).
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@example.com"
              style={{ width: "100%", padding: "12px 14px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: "1rem", marginBottom: "12px" }}
            />
            <button
              onClick={() => grant(email)}
              disabled={busy}
              style={{ width: "100%", background: "#6c63ff", color: "#fff", border: "none", borderRadius: "2px", padding: "14px 20px", fontSize: "1rem", fontWeight: "700", cursor: busy ? "not-allowed" : "pointer", marginBottom: "10px" }}
            >
              {busy ? "Granting…" : "Grant Premium"}
            </button>
            <button
              onClick={() => grant(user.email)}
              disabled={busy}
              style={{ width: "100%", background: "transparent", color: "#aaa", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "2px", padding: "10px 20px", fontSize: "0.85rem", cursor: busy ? "not-allowed" : "pointer" }}
            >
              Grant to my own account
            </button>

            {result && (
              <p style={{ marginTop: "18px", color: result.ok ? "#4ade80" : "#f87171" }}>
                {result.ok ? "🎉 " : "❌ "}{result.message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
