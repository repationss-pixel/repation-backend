"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelButton({
  reservationId,
  userId,
  isLate,
}: {
  reservationId: string;
  userId: string;
  isLate: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    const msg = isLate
      ? "Annulation tardive : 1€ sera prélevé. Confirmer ?"
      : "Confirmer l'annulation gratuite ?";
    if (!confirm(msg)) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reservation/annuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'annulation.");
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCancel}
        disabled={loading}
        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          isLate
            ? "border-red-200 text-red-600 hover:bg-red-50"
            : "border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-red-500 hover:border-red-200"
        }`}
      >
        {loading ? "Annulation…" : isLate ? "Annuler (1€)" : "Annuler"}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
