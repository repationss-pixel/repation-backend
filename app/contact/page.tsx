"use client";

import { useState } from "react";
import Link from "next/link";

const SUJETS = ["Question générale", "Problème technique", "Signaler un utilisateur", "Autre"];

type Status = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState(SUJETS[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, email, sujet, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Une erreur est survenue.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStatus("error");
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    background: "white",
    border: "1px solid #D4BFA0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1C1009",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "#7A6A55",
    marginBottom: "6px",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#D4BFA0]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <img src="/logo-repation.png" alt="Repation" style={{ height: "32px", width: "auto" }} />
          </Link>
          <span style={{ color: "#D4BFA0" }}>|</span>
          <span className="text-sm font-semibold" style={{ color: "#1C1009" }}>Contact</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#1C1009" }}>Contactez-nous</h1>
          <p className="text-sm" style={{ color: "#7A6A55" }}>
            Une question, un problème ? On vous répond sous 24h.
          </p>
        </div>

        {status === "success" ? (
          <div style={{
            background: "#F2EAD9",
            border: "1px solid #D4BFA0",
            borderRadius: "16px",
            padding: "40px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1C1009" }}>Message envoyé !</h2>
            <p className="text-sm mb-4" style={{ color: "#7A6A55" }}>
              Merci <strong style={{ color: "#8B5E3C" }}>{prenom}</strong>. Nous vous répondrons à {email} sous 24h.
            </p>
            <Link href="/" style={{ fontSize: "13px", color: "#8B5E3C", fontWeight: 600, textDecoration: "none" }}>
              ← Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: "white",
            border: "1px solid #D4BFA0",
            borderRadius: "16px",
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}>
            <div>
              <label style={labelStyle}>Prénom <span style={{ color: "#8B5E3C" }}>*</span></label>
              <input
                type="text"
                autoComplete="given-name"
                placeholder="Marie"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email <span style={{ color: "#8B5E3C" }}>*</span></label>
              <input
                type="email"
                autoComplete="email"
                placeholder="marie@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Sujet <span style={{ color: "#8B5E3C" }}>*</span></label>
              <select
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                style={{ ...inputStyle, appearance: "none" as const }}
              >
                {SUJETS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Message <span style={{ color: "#8B5E3C" }}>*</span></label>
              <textarea
                placeholder="Décrivez votre demande..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            {status === "error" && (
              <div style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                borderRadius: "10px",
                padding: "10px 14px",
                fontSize: "13px",
                color: "#B91C1C",
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              style={{
                width: "100%",
                background: status === "loading" ? "#7A6A55" : "#2C1A0A",
                color: "#F2EAD9",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: status === "loading" ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {status === "loading" ? "Envoi en cours…" : "Envoyer →"}
            </button>
          </form>
        )}
      </main>

      <footer className="mt-12 pb-8 text-center">
        <Link href="/" style={{ fontSize: "13px", color: "#8B5E3C", textDecoration: "underline" }}>
          ← Retour à l&apos;accueil
        </Link>
      </footer>
    </div>
  );
}
