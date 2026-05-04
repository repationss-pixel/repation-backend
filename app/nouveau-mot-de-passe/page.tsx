"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function NouveauMotDePasseForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Lien invalide. Veuillez demander un nouveau lien.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/nouveau-mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      router.push("/connexion?reset=1");
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h1>
      <p className="text-sm text-gray-500 mb-6">Choisissez un nouveau mot de passe pour votre compte Repation.</p>

      {!token || error === "Lien invalide. Veuillez demander un nouveau lien." ? (
        <div className="text-center space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            Ce lien est invalide ou a expiré.
          </div>
          <Link
            href="/mot-de-passe-oublie"
            className="block text-sm text-[#1D9E75] hover:underline font-medium"
          >
            Demander un nouveau lien →
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Au moins 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Répétez le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe →"}
          </button>
        </form>
      )}

      <p className="text-sm text-center text-gray-400 mt-6">
        <Link href="/connexion" className="text-[#1D9E75] hover:underline font-medium">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}

export default function NouveauMotDePassePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img src="/logo-repation.png" alt="Repation" style={{ height: "48px", width: "auto", display: "inline-block" }} />
          </Link>
          <p className="mt-2 text-sm text-gray-500">Le hasard vous met à table.</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-sm text-gray-400">Chargement…</div>}>
          <NouveauMotDePasseForm />
        </Suspense>
      </div>
    </div>
  );
}
