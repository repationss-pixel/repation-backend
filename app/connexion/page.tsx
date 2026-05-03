"use client";

import { useState } from "react";
import Link from "next/link";

type UserType = "convive" | "restaurateur";

export default function ConnexionPage() {
  const [userType, setUserType] = useState<UserType>("convive");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body =
        userType === "convive"
          ? { email: email.trim(), password, type: "convive" }
          : { email: email.trim(), phone, type: "restaurateur" };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur de connexion.");
        return;
      }

      if (data.user.type === "RESTAURATEUR") {
        window.location.href = "/dashboard/restaurateur";
      } else {
        window.location.href = "/mon-compte";
      }
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img
              src="/logo-repation.png"
              alt="Repation"
              style={{ height: "48px", width: "auto", display: "inline-block" }}
            />
          </Link>
          <p className="mt-2 text-sm text-gray-500">Le hasard vous met à table.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-5">Se connecter</h1>

          {/* Toggle convive / restaurateur */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden mb-6">
            {(["convive", "restaurateur"] as UserType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setUserType(t); setError(""); }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-all ${
                  userType === t
                    ? "bg-[#1D9E75] text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t === "convive" ? "👤 Convive" : "🍴 Restaurateur"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email
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

            {userType === "convive" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="06 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
                />
              </div>
            )}

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
              {loading ? "Connexion…" : "Se connecter →"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-400 mt-6">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-[#1D9E75] hover:underline font-medium">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
