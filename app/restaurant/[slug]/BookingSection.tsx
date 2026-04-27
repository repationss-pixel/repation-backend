"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const CardForm = dynamic(() => import("./CardForm"), { ssr: false });

interface Restaurant {
  id: string;
  nom: string;
}

interface ReservationInfo {
  id: string;
  userId: string;
  annulationDeadline: string | null;
}

const CRENEAUX = ["12:00", "12:30", "13:00", "19:30", "20:00", "20:30"];

type Step = "slots" | "phone" | "card" | "success" | "cancelled" | "error";

interface CardPayload {
  clientSecret: string;
  message: string;
  userId: string;
}

export default function BookingSection({
  restaurant,
  dateBase,
}: {
  restaurant: Restaurant;
  dateBase: string;
}) {
  const [step, setStep] = useState<Step>("slots");
  const [selectedCreneau, setSelectedCreneau] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cardPayload, setCardPayload] = useState<CardPayload | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [reservationInfo, setReservationInfo] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function buildCreneauISO(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(dateBase);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  function canCancel(): boolean {
    if (!reservationInfo?.annulationDeadline) return true;
    return new Date() < new Date(reservationInfo.annulationDeadline);
  }

  async function createReservation(identifier: { phone?: string; userId?: string }) {
    const res = await fetch("/api/reservation/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...identifier,
        restaurantId: restaurant.id,
        creneau: buildCreneauISO(selectedCreneau!),
      }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  }

  async function handleConfirm() {
    const normalized = phone.replace(/\s/g, "");
    if (!/^(\+33|0)[1-9](\d{8})$/.test(normalized)) {
      setPhoneError("Numéro invalide (ex : 06 12 34 56 78)");
      return;
    }
    setPhoneError("");
    setLoading(true);

    try {
      const { ok, data } = await createReservation({ phone: normalized });

      if (!ok) {
        setErrorMsg(data.error ?? "Une erreur est survenue.");
        setStep("error");
        return;
      }

      if (data.requiresCard) {
        setCardPayload({
          clientSecret: data.clientSecret,
          message: data.message,
          userId: data.userId,
        });
        setStep("card");
        return;
      }

      setReservationInfo({
        id: data.reservation.id,
        userId: data.reservation.userId,
        annulationDeadline: data.reservation.annulationDeadline,
      });
      setSuccessMsg("Votre réservation est confirmée !");
      setStep("success");
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCardSuccess() {
    const { ok, data } = await createReservation({ userId: cardPayload!.userId });

    if (!ok) {
      setErrorMsg(data.error ?? "Carte enregistrée mais réservation échouée.");
      setStep("error");
      return;
    }

    setReservationInfo({
      id: data.reservation.id,
      userId: data.reservation.userId,
      annulationDeadline: data.reservation.annulationDeadline,
    });
    setSuccessMsg("Carte enregistrée ✓ Votre réservation est confirmée !");
    setStep("success");
  }

  async function handleCancel() {
    if (!reservationInfo) return;
    setCancelLoading(true);

    try {
      const res = await fetch("/api/reservation/annuler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservationInfo.id,
          userId: reservationInfo.userId,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Annulation échouée.");
        setStep("error");
        return;
      }

      setStep("cancelled");
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStep("error");
    } finally {
      setCancelLoading(false);
    }
  }

  function reset() {
    setStep("slots");
    setSelectedCreneau(null);
    setPhone("");
    setPhoneError("");
    setErrorMsg("");
    setCardPayload(null);
    setSuccessMsg("");
    setReservationInfo(null);
  }

  // ── États terminaux ──────────────────────────────────────────────────────

  if (step === "cancelled") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Réservation annulée</h3>
        <p className="text-gray-500 text-sm mb-4">
          Votre réservation a bien été annulée. Aucun frais ne vous a été prélevé.
        </p>
        <button onClick={reset} className="text-sm text-[#1D9E75] font-medium hover:underline">
          Faire une nouvelle réservation
        </button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/30 rounded-2xl p-8 text-center space-y-2">
        <div className="text-4xl mb-1">🎉</div>
        <h3 className="text-xl font-bold text-gray-900">Réservation confirmée !</h3>
        <p className="text-gray-600 text-sm">
          Créneau <strong>{selectedCreneau}</strong> chez <strong>{restaurant.nom}</strong>.
        </p>
        {successMsg && (
          <p className="text-[#1D9E75] text-sm font-medium">{successMsg}</p>
        )}
        <p className="text-[#1D9E75] text-sm font-medium">
          📧 Un email de confirmation vous a été envoyé.
        </p>

        {/* Bouton annulation */}
        <div className="pt-4 border-t border-[#1D9E75]/20 mt-4">
          {canCancel() ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                Annulation gratuite jusqu&apos;à 20 minutes avant votre réservation.
              </p>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50 underline underline-offset-2"
              >
                {cancelLoading ? "Annulation en cours…" : "Annuler ma réservation"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Le délai d&apos;annulation gratuite est dépassé.
            </p>
          )}
        </div>

        <button onClick={reset} className="pt-2 block w-full text-sm text-[#1D9E75] font-medium hover:underline">
          Réserver un autre créneau
        </button>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 text-sm font-medium mb-4">{errorMsg}</p>
        <button onClick={reset} className="text-sm text-[#1D9E75] font-medium hover:underline">
          ← Retour
        </button>
      </div>
    );
  }

  if (step === "card" && cardPayload) {
    return (
      <CardForm
        clientSecret={cardPayload.clientSecret}
        message={cardPayload.message}
        userId={cardPayload.userId}
        onSuccess={handleCardSuccess}
        onCancel={reset}
      />
    );
  }

  // ── Vue principale ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Créneaux disponibles</h2>
        <div className="grid grid-cols-3 gap-3">
          {CRENEAUX.map((c) => (
            <button
              key={c}
              onClick={() => {
                setSelectedCreneau(c);
                setStep("phone");
                setPhoneError("");
              }}
              className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                selectedCreneau === c && step === "phone"
                  ? "bg-[#1D9E75] text-white border-[#1D9E75]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {step === "phone" && selectedCreneau && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-600">
            Créneau sélectionné : <strong>{selectedCreneau}</strong>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Votre numéro de téléphone
            </label>
            <input
              type="tel"
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError("");
              }}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent ${
                phoneError ? "border-red-400" : "border-gray-200"
              }`}
            />
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            <p className="text-xs text-gray-400 mt-1.5">
              Utilisé pour identifier votre compte Repation.
            </p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Vérification…" : "Continuer"}
          </button>

          <button onClick={reset} className="w-full text-xs text-gray-400 hover:text-gray-600">
            Annuler
          </button>
        </div>
      )}
    </div>
  );
}
