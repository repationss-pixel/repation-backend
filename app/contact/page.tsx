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

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/">
            <img src="/logo-repation.png" alt="Repation" style={{ height: "32px", width: "auto" }} />
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-700">Contact</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Contactez-nous</h1>
          <p className="text-gray-500 text-sm">
            Une question, un problème ? On vous répond sous 24h.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/30 rounded-2xl p-10 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <h2 className="text-xl font-bold text-gray-900">Message envoyé !</h2>
            <p className="text-gray-500 text-sm">
              Merci <strong className="text-[#1D9E75]">{prenom}</strong>. Nous vous répondrons à {email} sous 24h.
            </p>
            <Link href="/" className="inline-block mt-2 text-sm text-[#1D9E75] hover:underline font-medium">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
            {/* Prénom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Prénom <span className="text-[#1D9E75]">*</span>
              </label>
              <input
                type="text"
                autoComplete="given-name"
                placeholder="Marie"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-[#1D9E75]">*</span>
              </label>
              <input
                type="email"
                autoComplete="email"
                placeholder="marie@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
              />
            </div>

            {/* Sujet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Sujet <span className="text-[#1D9E75]">*</span>
              </label>
              <select
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent appearance-none bg-white"
              >
                {SUJETS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Message <span className="text-[#1D9E75]">*</span>
              </label>
              <textarea
                placeholder="Décrivez votre demande..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent resize-none"
              />
            </div>

            {status === "error" && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
              {status === "loading" ? "Envoi en cours…" : "Envoyer →"}
            </button>
          </form>
        )}
      </main>

      <footer className="mt-12 pb-8 text-center">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 underline">
          ← Retour à l&apos;accueil
        </Link>
      </footer>
    </div>
  );
}
