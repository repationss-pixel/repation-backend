"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ConnexionForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "1") setResetSuccess(true);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur de connexion.");
        return;
      }

      window.location.href = data.redirect;
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F2EAD9" }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/logo-repation.png"
              alt="Repation"
              style={{ height: "44px", width: "auto", display: "inline-block" }}
            />
          </Link>
          <p className="mt-2 text-sm" style={{ color: "#7A6A55" }}>Le hasard vous met à table.</p>
        </div>

        {/* Card */}
        <div style={{
          background: "#FBF5E6",
          border: "1px solid #D4BFA0",
          borderRadius: "16px",
          padding: "32px",
          boxShadow: "0 2px 12px rgba(44,26,10,0.06)",
        }}>
          {resetSuccess && (
            <div style={{
              background: "#F2EAD9",
              border: "1px solid #D4BFA0",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "13px",
              color: "#8B5E3C",
              marginBottom: "20px",
            }}>
              ✅ Mot de passe modifié avec succès ! Connectez-vous avec votre nouveau mot de passe.
            </div>
          )}

          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "24px",
            fontStyle: "italic",
            fontWeight: 700,
            color: "#1C1009",
            marginBottom: "20px",
          }}>
            Se connecter
          </h1>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#7A6A55", marginBottom: "6px" }}>
                Adresse email
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="marie@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "#FBF5E6",
                  border: "1px solid #D4BFA0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#1C1009",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "#7A6A55" }}>
                  Mot de passe
                </label>
                <Link href="/mot-de-passe-oublie" style={{ fontSize: "12px", color: "#8B5E3C", textDecoration: "none" }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "#FBF5E6",
                  border: "1px solid #D4BFA0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  color: "#1C1009",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#B91C1C",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#7A6A55" : "#2C1A0A",
                color: "#F2EAD9",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {loading ? "Connexion…" : "Se connecter →"}
            </button>
          </form>

          <p style={{ fontSize: "13px", textAlign: "center", color: "#B0A090", marginTop: "20px" }}>
            Pas encore de compte ?{" "}
            <Link href="/inscription" style={{ color: "#8B5E3C", fontWeight: 600, textDecoration: "none" }}>
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={null}>
      <ConnexionForm />
    </Suspense>
  );
}
