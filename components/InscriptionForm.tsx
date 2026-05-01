"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import AddressAutocomplete from "./AddressAutocomplete";

const RestaurantCardSetup = dynamic(() => import("./RestaurantCardSetup"), { ssr: false });

type UserType = "particulier" | "restaurateur";
type CategorieRestaurant = "RESTAURANT" | "FAST_FOOD" | "CAFE";

const CATEGORIES: { value: CategorieRestaurant; label: string }[] = [
  { value: "RESTAURANT", label: "Restaurant / Brasserie / Bistrot" },
  { value: "FAST_FOOD",  label: "Fast-food / Snack"                },
  { value: "CAFE",       label: "Café / Bar / Boulangerie"          },
];

interface FormData {
  prenom: string;
  email: string;
  phone: string;
  type: UserType;
  categorie: CategorieRestaurant;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
}

interface FormErrors {
  prenom?: string;
  email?: string;
  phone?: string;
  adresse?: string;
}

// idle → (particulier) otp-send → otp-verify → creating → success
// idle → (restaurateur) loading → card → complete
type Status =
  | "idle"
  | "otp-send"      // envoi du code en cours
  | "otp-sent"      // code envoyé, attente saisie
  | "otp-verify"    // vérification en cours
  | "otp-verified"  // téléphone validé, prêt à créer le compte
  | "loading"       // création du compte en cours
  | "card"          // restaurateur : étape carte
  | "complete"      // restaurateur : bienvenue final
  | "success"       // convive : bienvenue
  | "error";

function validatePhone(phone: string): boolean {
  return /^(\+33|0)[1-9](\d{8})$/.test(phone.replace(/\s/g, ""));
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InscriptionForm() {
  const [formData, setFormData] = useState<FormData>({
    prenom: "",
    email: "",
    phone: "",
    type: "particulier",
    categorie: "RESTAURANT",
    adresse: "",
    latitude: null,
    longitude: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!formData.prenom.trim()) newErrors.prenom = "Votre prénom est requis.";
    if (!formData.email.trim()) {
      newErrors.email = "L'adresse email est requise.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Adresse email invalide.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Le numéro de téléphone est requis.";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "Numéro invalide (ex: 06 12 34 56 78 ou +33612345678).";
    }
    if (formData.type === "restaurateur") {
      if (!formData.adresse || formData.latitude === null || formData.longitude === null) {
        newErrors.adresse = "Veuillez sélectionner votre adresse via l'autocomplétion.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Envoi du code OTP (convive uniquement) ────────────────────────────────
  async function handleSendOtp() {
    if (!validate()) return;
    setStatus("otp-send");
    setOtpError("");
    try {
      const res = await fetch("/api/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Impossible d'envoyer le SMS.");
        setStatus("idle");
        return;
      }
      setStatus("otp-sent");
    } catch {
      setOtpError("Erreur réseau. Veuillez réessayer.");
      setStatus("idle");
    }
  }

  // ── Vérification du code OTP ──────────────────────────────────────────────
  async function handleVerifyOtp() {
    if (!otpCode.trim()) { setOtpError("Entrez le code reçu par SMS."); return; }
    setStatus("otp-verify");
    setOtpError("");
    try {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formData.phone, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error ?? "Code incorrect.");
        setStatus("otp-sent");
        return;
      }
      setStatus("otp-verified");
    } catch {
      setOtpError("Erreur réseau. Veuillez réessayer.");
      setStatus("otp-sent");
    }
  }

  // ── Création du compte ────────────────────────────────────────────────────
  async function handleCreateAccount() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const payload =
        formData.type === "restaurateur"
          ? {
              prenom: formData.prenom,
              email: formData.email,
              phone: formData.phone,
              type: formData.type,
              categorie: formData.categorie,
              adresse: formData.adresse,
              latitude: formData.latitude,
              longitude: formData.longitude,
            }
          : {
              prenom: formData.prenom,
              email: formData.email,
              phone: formData.phone,
              type: formData.type,
            };

      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");

      if (formData.type === "restaurateur" && data.restaurantId) {
        setRestaurantId(data.restaurantId);
        setStatus("card");
      } else {
        setStatus("success");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Erreur inattendue.");
    }
  }

  // ── Soumission du formulaire ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.type === "restaurateur") {
      // restaurateurs : pas d'OTP, création directe
      if (!validate()) return;
      await handleCreateAccount();
    } else {
      // convives : déclenche l'OTP si pas encore vérifié
      if (status !== "otp-verified") {
        await handleSendOtp();
      } else {
        await handleCreateAccount();
      }
    }
  }

  // ── Écran carte bancaire (restaurateur) ───────────────────────────────────
  if (status === "card" && restaurantId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
        <RestaurantCardSetup
          restaurantId={restaurantId}
          onSuccess={() => setStatus("complete")}
        />
      </div>
    );
  }

  // ── Écran de bienvenue final (restaurateur) ───────────────────────────────
  if (status === "complete") {
    return (
      <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/30 rounded-2xl p-10 text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue sur Repation,{" "}
            <span className="text-[#1D9E75]">{formData.prenom}</span>&nbsp;!
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
            Votre établissement est enregistré. Nous vous contacterons dès le lancement dans votre ville.
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3 text-left shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            <p className="text-sm font-semibold text-gray-900">Vos QR codes arrivent par email</p>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Vous recevrez <strong>2 QR codes</strong> à imprimer et disposer sur vos tables — un par convive. Les convives les scannent pour confirmer leur présence et activer votre compteur mensuel.
          </p>
        </div>
        <div className="space-y-2">
          <a
            href="/dashboard/restaurateur"
            className="block w-full bg-[#1D9E75] hover:bg-[#178560] text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
          >
            Accéder à mon tableau de bord →
          </a>
          <p className="text-xs text-gray-400">
            Surveillez votre boîte mail ({formData.email})
          </p>
        </div>
      </div>
    );
  }

  // ── Écran succès (convive) ────────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="bg-[#1D9E75]/5 border border-[#1D9E75]/30 rounded-2xl p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Vous êtes inscrit(e) !</h3>
        <p className="text-gray-600">
          Merci{" "}
          <span className="font-semibold text-[#1D9E75]">{formData.prenom}</span>
          , nous vous contacterons dès le lancement dans votre ville.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Surveillez votre boîte mail ({formData.email})
        </p>
      </div>
    );
  }

  // ── Formulaire principal ──────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8 space-y-5"
    >
      {/* Choix de profil */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden">
        {(["particulier", "restaurateur"] as UserType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setFormData((d) => ({ ...d, type: t }));
              setStatus("idle");
              setOtpCode("");
              setOtpError("");
            }}
            className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 ${
              formData.type === t
                ? "bg-[#1D9E75] text-white shadow-inner"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            {t === "particulier" ? "👤 Je suis un convive" : "🍴 Je suis restaurateur"}
          </button>
        ))}
      </div>

      {/* Prénom / Nom établissement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {formData.type === "restaurateur" ? "Nom de votre établissement" : "Prénom"}{" "}
          <span className="text-[#1D9E75]">*</span>
        </label>
        <input
          type="text"
          autoComplete="given-name"
          placeholder={formData.type === "restaurateur" ? "Le Bistrot Parisien" : "Marie"}
          value={formData.prenom}
          disabled={status === "otp-sent" || status === "otp-send" || status === "otp-verify" || status === "otp-verified"}
          onChange={(e) => {
            setFormData((d) => ({ ...d, prenom: e.target.value }));
            if (errors.prenom) setErrors((er) => ({ ...er, prenom: undefined }));
          }}
          className={`input-field ${errors.prenom ? "border-red-400 focus:ring-red-400" : ""} disabled:bg-gray-50 disabled:text-gray-400`}
        />
        {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
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
          value={formData.email}
          disabled={status === "otp-sent" || status === "otp-send" || status === "otp-verify" || status === "otp-verified"}
          onChange={(e) => {
            setFormData((d) => ({ ...d, email: e.target.value }));
            if (errors.email) setErrors((er) => ({ ...er, email: undefined }));
          }}
          className={`input-field ${errors.email ? "border-red-400 focus:ring-red-400" : ""} disabled:bg-gray-50 disabled:text-gray-400`}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Téléphone <span className="text-[#1D9E75]">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="tel"
            autoComplete="tel"
            placeholder="06 12 34 56 78"
            value={formData.phone}
            disabled={status === "otp-sent" || status === "otp-send" || status === "otp-verify" || status === "otp-verified"}
            onChange={(e) => {
              setFormData((d) => ({ ...d, phone: e.target.value }));
              setOtpCode("");
              setOtpError("");
              if (status !== "idle") setStatus("idle");
              if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
            }}
            className={`input-field flex-1 ${errors.phone ? "border-red-400 focus:ring-red-400" : ""} disabled:bg-gray-50 disabled:text-gray-400`}
          />
          {/* Bouton "Recevoir le code" — convive uniquement */}
          {formData.type === "particulier" && (status === "otp-sent" || status === "otp-verified") && (
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setOtpCode("");
                setOtpError("");
              }}
              className="shrink-0 text-xs text-gray-400 hover:text-gray-600 underline px-2"
            >
              Modifier
            </button>
          )}
        </div>
        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
      </div>

      {/* Bloc OTP — convive uniquement, après envoi */}
      {formData.type === "particulier" && (status === "otp-sent" || status === "otp-verify" || status === "otp-verified") && (
        <div className="rounded-xl border border-[#1D9E75]/30 bg-[#1D9E75]/5 px-4 py-4 space-y-3">
          {status !== "otp-verified" ? (
            <>
              <p className="text-sm text-gray-700 font-medium">
                Code envoyé par SMS au{" "}
                <span className="font-semibold text-[#1D9E75]">{formData.phone}</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ""));
                    setOtpError("");
                  }}
                  className="input-field flex-1 tracking-widest text-center text-lg font-bold"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={status === "otp-verify" || otpCode.length < 4}
                  className="shrink-0 bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-50 text-white text-sm font-semibold px-4 rounded-xl transition-colors"
                >
                  {status === "otp-verify" ? "…" : "Valider"}
                </button>
              </div>
              {otpError && <p className="text-red-500 text-xs">{otpError}</p>}
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={status === "otp-verify"}
                className="text-xs text-gray-400 hover:text-[#1D9E75] underline disabled:opacity-50"
              >
                Renvoyer le code
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[#1D9E75]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 shrink-0">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="text-sm font-semibold">Numéro vérifié ✓</p>
            </div>
          )}
        </div>
      )}

      {/* Champs restaurateur */}
      {formData.type === "restaurateur" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catégorie de l&apos;établissement <span className="text-[#1D9E75]">*</span>
            </label>
            <select
              value={formData.categorie}
              onChange={(e) =>
                setFormData((d) => ({ ...d, categorie: e.target.value as CategorieRestaurant }))
              }
              className="input-field appearance-none bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1.5">
              Le tarif Repation est calculé selon la catégorie de votre établissement.
              Toute fausse déclaration entraîne la résiliation du partenariat.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse de votre établissement <span className="text-[#1D9E75]">*</span>
            </label>
            <AddressAutocomplete
              onPlaceSelected={({ address, lat, lng }) => {
                setFormData((d) => ({ ...d, adresse: address, latitude: lat, longitude: lng }));
                setErrors((er) => ({ ...er, adresse: undefined }));
              }}
              className={`input-field ${errors.adresse ? "border-red-400 focus:ring-red-400" : ""}`}
              placeholder="Ex : Le Bistrot Parisien, 12 rue de Rivoli, Paris"
            />
            {errors.adresse ? (
              <p className="text-red-500 text-xs mt-1">{errors.adresse}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-1.5">
                Sélectionnez votre adresse dans les suggestions.
              </p>
            )}
          </div>
        </>
      )}

      {/* Erreur globale */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {otpError && status === "idle" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {otpError}
        </div>
      )}

      {/* Bouton principal */}
      <button
        type="submit"
        disabled={
          status === "loading" ||
          status === "otp-send" ||
          status === "otp-verify" ||
          (formData.type === "particulier" && status === "otp-sent")
        }
        className="btn-primary w-full text-base py-4 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "loading" ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Inscription en cours…
          </>
        ) : status === "otp-send" ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Envoi du SMS…
          </>
        ) : formData.type === "particulier" && status === "otp-verified" ? (
          "Créer mon compte →"
        ) : formData.type === "particulier" && (status === "otp-sent" || status === "otp-verify") ? (
          "Valider le code ci-dessus"
        ) : formData.type === "particulier" ? (
          "Recevoir le code SMS →"
        ) : (
          "Je rejoins la liste d'attente →"
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        En vous inscrivant, vous acceptez nos{" "}
        <a href="/cgu" target="_blank" className="underline hover:text-gray-600">CGU</a>
        {" "}et notre{" "}
        <a href="/confidentialite" target="_blank" className="underline hover:text-gray-600">
          politique de confidentialité
        </a>
        .
      </p>
    </form>
  );
}
