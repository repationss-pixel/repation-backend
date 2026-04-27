"use client";

import { useState } from "react";
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
  userId,
  onSuccess,
}: {
  clientSecret: string;
  userId: string;
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
    if (!cardElement) return;

    const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (stripeError) {
      setError(stripeError.message ?? "Erreur lors de la validation de la carte.");
      setLoading(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;

    if (!paymentMethodId) {
      setError("Impossible de récupérer la méthode de paiement.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/stripe/save-payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, paymentMethodId }),
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

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? "Validation en cours…" : "Confirmer et réserver"}
      </button>
    </form>
  );
}

export default function CardForm({
  clientSecret,
  message,
  userId,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  message: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
      {/* Message d'information */}
      <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-xl p-4">
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{message}</p>
      </div>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CardFormInner clientSecret={clientSecret} userId={userId} onSuccess={onSuccess} />
      </Elements>

      <button onClick={onCancel} className="w-full text-xs text-gray-400 hover:text-gray-600">
        Annuler
      </button>
    </div>
  );
}
