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
  password: string;
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
  password?: string;
  phone?: string;
  adresse?: string;
}

type Status = "idle" | "loading" | "card" | "complete" | "success" | "error";

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
    password: "",
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

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!formData.prenom.trim()) newErrors.prenom = "Votre prénom est requis.";
    if (!formData.email.trim()) {
      newErrors.email = "L'adresse email est requise.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Adresse email invalide.";
    }
    if (formData.type === "particulier") {
      if (!formData.password) {
        newErrors.password = "Le mot de passe est requis.";
      } else if (formData.password.length < 6) {
        newErrors.password = "Le mot de passe doit contenir au moins 6 caractères.";
      }
    }
    if (formData.type === "restaurateur") {
      if (!formData.phone.trim()) {
        newErrors.phone = "Le numéro de téléphone est requis.";
      } else if (!validatePhone(formData.phone)) {
        newErrors.phone = "Numéro invalide (ex: 06 12 34 56 78 ou +33612345678).";
      }
      if (!formData.adresse || formData.latitude === null || formData.longitude === null) {
        newErrors.adresse = "Veuillez sélectionner votre adresse via l'autocomplétion.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

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
              password: formData.password,
              type: formData.type,
            };

      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

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
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Compte créé !</h3>
        <p className="text-gray-600 mb-6">
          Bienvenue{" "}
          <span className="font-semibold text-[#1D9E75]">{formData.prenom}</span>
          &nbsp;! Votre compte est prêt.
        </p>
        <a
          href="/connexion"
          className="inline-block bg-[#1D9E75] hover:bg-[#178560] text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Se connecter →
        </a>
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
            onClick={() => { setFormData((d) => ({ ...d, type: t })); setErrors({}); }}
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
          onChange={(e) => {
            setFormData((d) => ({ ...d, prenom: e.target.value }));
            if (errors.prenom) setErrors((er) => ({ ...er, prenom: undefined }));
          }}
          className={`input-field ${errors.prenom ? "border-red-400 focus:ring-red-400" : ""}`}
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
          onChange={(e) => {
            setFormData((d) => ({ ...d, email: e.target.value }));
            if (errors.email) setErrors((er) => ({ ...er, email: undefined }));
          }}
          className={`input-field ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Mot de passe — convive uniquement */}
      {formData.type === "particulier" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mot de passe <span className="text-[#1D9E75]">*</span>
          </label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Au moins 6 caractères"
            value={formData.password}
            onChange={(e) => {
              setFormData((d) => ({ ...d, password: e.target.value }));
              if (errors.password) setErrors((er) => ({ ...er, password: undefined }));
            }}
            className={`input-field ${errors.password ? "border-red-400 focus:ring-red-400" : ""}`}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>
      )}

      {/* Champs restaurateur */}
      {formData.type === "restaurateur" && (
        <>
          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Téléphone <span className="text-[#1D9E75]">*</span>
            </label>
            <input
              type="tel"
              autoComplete="tel"
              placeholder="06 12 34 56 78"
              value={formData.phone}
              onChange={(e) => {
                setFormData((d) => ({ ...d, phone: e.target.value }));
                if (errors.phone) setErrors((er) => ({ ...er, phone: undefined }));
              }}
              className={`input-field ${errors.phone ? "border-red-400 focus:ring-red-400" : ""}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Catégorie */}
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

          {/* Adresse */}
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

      <button
        type="submit"
        disabled={status === "loading"}
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
        ) : formData.type === "particulier" ? (
          "Créer mon compte →"
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
