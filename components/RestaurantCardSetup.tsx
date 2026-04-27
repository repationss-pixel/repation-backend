"use client";

import { useEffect, useState } from "react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "15px",
      color: "#1a1a1a",
      fontFamily: "system-ui, sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#ef4444" },
  },
};

function CardFormInner({
  clientSecret,
  setupIntentClientSecret,
  restaurantId,
  onSuccess,
}: {
  clientSecret: string;
  setupIntentClientSecret: string;
  restaurantId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setLoading(false); return; }

    const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Erreur lors de la validation de la carte.");
      setLoading(false);
      return;
    }

    if (!setupIntent?.id) {
      setError("Impossible de récupérer le SetupIntent.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/stripe/confirm-restaurant-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId, setupIntentId: setupIntent.id }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erreur lors de l'enregistrement de la carte.");
      setLoading(false);
      return;
    }

    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-200 rounded-xl px-4 py-3.5 bg-white focus-within:ring-2 focus-within:ring-[#1D9E75] focus-within:border-transparent transition-all">
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      {error && (
        <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Enregistrement en cours…
          </>
        ) : (
          "Valider mon inscription →"
        )}
      </button>
    </form>
  );
}

export default function RestaurantCardSetup({
  restaurantId,
  onSuccess,
}: {
  restaurantId: string;
  onSuccess: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetch("/api/stripe/setup-restaurant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setLoadError(data.error ?? "Impossible de préparer le formulaire de paiement.");
        }
      })
      .catch(() => setLoadError("Erreur réseau. Veuillez réessayer."));
  }, [restaurantId]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1D9E75]/10 mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Dernière étape</h3>
        <p className="text-base font-semibold text-[#1D9E75]">Enregistrez votre carte bancaire</p>
      </div>

      {/* Explication */}
      <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-xl p-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          Repation ne vous facture que si nous vous amenons des clients.{" "}
          <strong>Aucun frais tant que 5 clients confirmés ne sont pas atteints dans le mois.</strong>{" "}
          Votre carte sera débitée automatiquement le 1<sup>er</sup> du mois uniquement si ce seuil est dépassé.
        </p>
      </div>

      {/* Formulaire carte */}
      {loadError ? (
        <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {loadError}
        </p>
      ) : !clientSecret ? (
        <div className="flex items-center justify-center py-6 gap-2 text-sm text-gray-400">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Chargement du formulaire…
        </div>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CardFormInner
            clientSecret={clientSecret}
            setupIntentClientSecret={clientSecret}
            restaurantId={restaurantId}
            onSuccess={onSuccess}
          />
        </Elements>
      )}

      {/* Sécurité */}
      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        Paiement sécurisé par Stripe — vos données bancaires ne transitent jamais par nos serveurs.
      </p>
    </div>
  );
}
