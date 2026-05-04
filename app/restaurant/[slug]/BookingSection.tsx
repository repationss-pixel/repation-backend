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

const CRENEAUX_MIDI = ["11:30", "12:00", "12:30", "13:00", "13:30"];
const CRENEAUX_SOIR = ["19:00", "19:30", "20:00", "20:30", "21:00"];

type Step = "slots" | "phone" | "card" | "success" | "cancelled" | "error";

interface CardPayload {
  clientSecret: string;
  message: string;
  userId: string;
}

function SlotCard({
  time,
  rawCount,
  selected,
  onSelect,
}: {
  time: string;
  rawCount: number;
  selected: boolean;
  onSelect: () => void;
}) {
  // Le créneau n'est jamais bloqué — chaque paire de convives forme une nouvelle table.
  // count % 2 = 0 → nouvelle table vide ; count % 2 = 1 → 1 convive attend
  const openSeat = rawCount % 2; // 0 = vide, 1 = 1 convive attend
  const completedTables = Math.floor(rawCount / 2);
  const hasConvive = openSeat === 1;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        flex flex-col items-center gap-2 rounded-xl border p-3 w-full transition-all
        ${selected
          ? "border-[#1D9E75] bg-[#1D9E75]/5 shadow-sm"
          : "border-gray-200 bg-white hover:border-[#1D9E75] hover:shadow-sm"
        }
      `}
    >
      {/* Heure */}
      <span className="text-sm font-bold text-gray-900">{time}</span>

      {/* 2 places de la table ouverte */}
      <div className="flex gap-1.5">
        <div className={`w-5 h-5 rounded-full border-2 ${hasConvive ? "bg-[#1D9E75] border-[#1D9E75]" : "bg-white border-gray-300"}`} />
        <div className="w-5 h-5 rounded-full border-2 bg-white border-gray-300" />
      </div>

      {/* Statut */}
      {hasConvive ? (
        <>
          <span className="text-xs text-[#1D9E75] font-semibold text-center leading-tight">1 convive attend !</span>
          <span className="w-full bg-[#1D9E75] text-white text-xs font-bold py-1.5 rounded-lg animate-pulse text-center">
            Rejoindre la table
          </span>
        </>
      ) : (
        <>
          <span className="text-xs text-gray-400 text-center leading-tight">Table libre</span>
          <span className="w-full bg-[#1D9E75] text-white text-xs font-bold py-1.5 rounded-lg text-center">
            Rejoindre
          </span>
        </>
      )}

      {/* Tables déjà complètes */}
      {completedTables > 0 && (
        <span className="text-xs text-gray-400 leading-tight">
          +{completedTables} table{completedTables > 1 ? "s" : ""} complète{completedTables > 1 ? "s" : ""}
        </span>
      )}
    </button>
  );
}

export default function BookingSection({
  restaurant,
  dateBase,
  slotCounts,
}: {
  restaurant: Restaurant;
  dateBase: string;
  slotCounts: Record<string, number>;
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
        setCardPayload({ clientSecret: data.clientSecret, message: data.message, userId: data.userId });
        setStep("card");
        return;
      }

      setReservationInfo({ id: data.reservation.id, userId: data.reservation.userId, annulationDeadline: data.reservation.annulationDeadline });
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
    if (!ok) { setErrorMsg(data.error ?? "Carte enregistrée mais réservation échouée."); setStep("error"); return; }
    setReservationInfo({ id: data.reservation.id, userId: data.reservation.userId, annulationDeadline: data.reservation.annulationDeadline });
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
        body: JSON.stringify({ reservationId: reservationInfo.id, userId: reservationInfo.userId }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Annulation échouée."); setStep("error"); return; }
      setStep("cancelled");
    } catch {
      setErrorMsg("Impossible de contacter le serveur.");
      setStep("error");
    } finally {
      setCancelLoading(false);
    }
  }

  function selectSlot(hhmm: string) {
    setSelectedCreneau(hhmm);
    setStep("phone");
    setPhoneError("");
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
        <p className="text-gray-500 text-sm mb-4">Votre réservation a bien été annulée. Aucun frais ne vous a été prélevé.</p>
        <button onClick={reset} className="text-sm text-[#1D9E75] font-medium hover:underline">Faire une nouvelle réservation</button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/30 rounded-2xl p-8 text-center space-y-2">
        <div className="text-4xl mb-1">🎉</div>
        <h3 className="text-xl font-bold text-gray-900">Réservation confirmée !</h3>
        <p className="text-gray-600 text-sm">Créneau <strong>{selectedCreneau}</strong> chez <strong>{restaurant.nom}</strong>.</p>
        {successMsg && <p className="text-[#1D9E75] text-sm font-medium">{successMsg}</p>}
        <p className="text-[#1D9E75] text-sm font-medium">📧 Un email de confirmation vous a été envoyé.</p>
        <div className="pt-4 border-t border-[#1D9E75]/20 mt-4">
          {canCancel() ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Annulation gratuite jusqu&apos;à 20 minutes avant votre réservation.</p>
              <button onClick={handleCancel} disabled={cancelLoading}
                className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50 underline underline-offset-2"
              >
                {cancelLoading ? "Annulation en cours…" : "Annuler ma réservation"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Le délai d&apos;annulation gratuite est dépassé.</p>
          )}
        </div>
        <button onClick={reset} className="pt-2 block w-full text-sm text-[#1D9E75] font-medium hover:underline">Réserver un autre créneau</button>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-600 text-sm font-medium mb-4">{errorMsg}</p>
        <button onClick={reset} className="text-sm text-[#1D9E75] font-medium hover:underline">← Retour</button>
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
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-gray-900">Créneaux disponibles</h2>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Midi</p>
          <div className="grid grid-cols-5 gap-2">
            {CRENEAUX_MIDI.map((c) => (
              <SlotCard
                key={c}
                time={c}
                rawCount={slotCounts[c] ?? 0}
                selected={selectedCreneau === c && step === "phone"}
                onSelect={() => selectSlot(c)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Soir</p>
          <div className="grid grid-cols-5 gap-2">
            {CRENEAUX_SOIR.map((c) => (
              <SlotCard
                key={c}
                time={c}
                rawCount={slotCounts[c] ?? 0}
                selected={selectedCreneau === c && step === "phone"}
                onSelect={() => selectSlot(c)}
              />
            ))}
          </div>
        </div>
      </div>

      {step === "phone" && selectedCreneau && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <p className="text-sm text-gray-600">
            Créneau sélectionné : <strong>{selectedCreneau}</strong>
            {(slotCounts[selectedCreneau] ?? 0) % 2 === 1 && (
              <span className="ml-2 text-[#1D9E75] font-semibold">· 1 convive vous attend !</span>
            )}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Votre numéro de téléphone</label>
            <input
              type="tel"
              placeholder="06 12 34 56 78"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }}
              className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent ${phoneError ? "border-red-400" : "border-gray-200"}`}
            />
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            <p className="text-xs text-gray-400 mt-1.5">Utilisé pour identifier votre compte Repation.</p>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Vérification…" : "Continuer"}
          </button>

          <button onClick={reset} className="w-full text-xs text-gray-400 hover:text-gray-600">Annuler</button>
        </div>
      )}
    </div>
  );
}
