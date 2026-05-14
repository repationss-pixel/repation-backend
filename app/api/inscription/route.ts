import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserType, RestaurantCategorie } from "@prisma/client";
import { sendWelcomeRestaurantEmail, sendWelcomeConviveEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

interface InscriptionBody {
  prenom: string;
  email: string;
  password?: string;
  phone?: string;
  type: "particulier" | "restaurateur";
  categorie?: "RESTAURANT" | "FAST_FOOD" | "CAFE";
  adresse?: string;
  latitude?: number;
  longitude?: number;
  photoUrl?: string;
}

const CATEGORIES_VALIDES: RestaurantCategorie[] = [
  RestaurantCategorie.RESTAURANT,
  RestaurantCategorie.FAST_FOOD,
  RestaurantCategorie.CAFE,
];

const PHONE_RE = /^(\+33|0)[1-9](\d{8})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, "");
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await prisma.restaurant.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  console.log("[POST /api/inscription] Requête reçue")
  let body: InscriptionBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { prenom, email, password, phone, type, categorie, adresse, latitude, longitude, photoUrl } = body;

  // ── Validation commune ──────────────────────────────────────────────────────
  if (!prenom?.trim()) {
    return NextResponse.json({ error: "Le prénom est requis." }, { status: 422 });
  }
  if (!email?.trim() || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 422 });
  }
  if (!["particulier", "restaurateur"].includes(type)) {
    return NextResponse.json({ error: "Type de compte invalide." }, { status: 422 });
  }

  const userType: UserType =
    type === "restaurateur" ? UserType.RESTAURATEUR : UserType.PARTICULIER;

  // ── Validation spécifique par type ──────────────────────────────────────────
  if (userType === UserType.PARTICULIER) {
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 422 }
      );
    }
  }

  if (userType === UserType.RESTAURATEUR) {
    const normalizedPhone = normalizePhone(phone ?? "");
    if (!PHONE_RE.test(normalizedPhone)) {
      return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 422 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 422 }
      );
    }
  }

  // ── Persistence ─────────────────────────────────────────────────────────────
  try {
    const phoneNormalized = phone ? normalizePhone(phone) : null;

    const userData =
      userType === UserType.PARTICULIER
        ? {
            prenom: prenom.trim(),
            email: email.trim().toLowerCase(),
            passwordHash: await bcrypt.hash(password!, 10),
            phone: phoneNormalized,
            type: userType,
          }
        : {
            prenom: prenom.trim(),
            email: email.trim().toLowerCase(),
            passwordHash: await bcrypt.hash(password!, 10),
            phone: normalizePhone(phone!),
            type: userType,
          };

    const user = await prisma.user.create({
      data: userData,
      select: { id: true, prenom: true, email: true, type: true, createdAt: true },
    });

    let restaurantId: string | undefined;

    if (userType === UserType.PARTICULIER) {
      try {
        await sendWelcomeConviveEmail(user.email, user.prenom);
        console.log("[inscription] email bienvenue envoyé à", user.email);
      } catch (emailErr) {
        console.error("[inscription] email bienvenue échoué:", emailErr);
        // On continue même si l'email échoue
      }
    }

    if (userType === UserType.RESTAURATEUR) {
      const categorieEnum =
        categorie && CATEGORIES_VALIDES.includes(categorie as RestaurantCategorie)
          ? (categorie as RestaurantCategorie)
          : RestaurantCategorie.RESTAURANT;

      const slug = await uniqueSlug(toSlug(prenom.trim()));
      const restaurant = await prisma.restaurant.create({
        data: {
          nom: prenom.trim(),
          adresse: adresse?.trim() || "À compléter",
          latitude: latitude ?? 0,
          longitude: longitude ?? 0,
          categorie: categorieEnum,
          slug,
          photoUrl: photoUrl ?? null,
          restaurateurId: user.id,
        },
        select: { id: true, slug: true },
      });
      restaurantId = restaurant.id;

      try {
        await sendWelcomeRestaurantEmail(
          email.trim().toLowerCase(),
          prenom.trim(),
          restaurant.slug
        );
        console.log("[inscription] email bienvenue restaurateur envoyé à", email);
      } catch (emailErr) {
        console.error("[inscription] email bienvenue échoué:", emailErr);
        // On continue même si l'email échoue
      }
    }

    const sessionValue = JSON.stringify({ userId: user.id, type: user.type, prenom: user.prenom });
    const res = NextResponse.json(
      { message: "Inscription enregistrée avec succès.", user, restaurantId },
      { status: 201 }
    );
    res.cookies.set('repation_session', sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    return res;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      const target = (err as { meta?: { target?: string[] } }).meta?.target ?? [];
      if (target.includes("email")) {
        return NextResponse.json(
          { error: "Cette adresse email est déjà inscrite." },
          { status: 409 }
        );
      }
      if (target.includes("phone")) {
        return NextResponse.json(
          { error: "Ce numéro de téléphone est déjà inscrit." },
          { status: 409 }
        );
      }
    }

    console.error("[POST /api/inscription] ERREUR COMPLETE:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json({ error: "Erreur interne. Veuillez réessayer." }, { status: 500 });
  }
}
