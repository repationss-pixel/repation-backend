import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserType, RestaurantCategorie } from "@prisma/client";

interface InscriptionBody {
  prenom: string;
  email: string;
  phone: string;
  type: "particulier" | "restaurateur";
  categorie?: "RESTAURANT" | "FAST_FOOD" | "CAFE";
  adresse?: string;
  latitude?: number;
  longitude?: number;
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
  let body: InscriptionBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { prenom, email, phone, type, categorie, adresse, latitude, longitude } = body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!prenom?.trim()) {
    return NextResponse.json({ error: "Le prénom est requis." }, { status: 422 });
  }

  if (!email?.trim() || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 422 });
  }

  const normalizedPhone = normalizePhone(phone ?? "");
  if (!PHONE_RE.test(normalizedPhone)) {
    return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 422 });
  }

  if (!["particulier", "restaurateur"].includes(type)) {
    return NextResponse.json({ error: "Type de compte invalide." }, { status: 422 });
  }

  const userType: UserType =
    type === "restaurateur" ? UserType.RESTAURATEUR : UserType.PARTICULIER;

  // ── Persistence ─────────────────────────────────────────────────────────────
  try {
    const user = await prisma.user.create({
      data: {
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone,
        type: userType,
      },
      select: {
        id: true,
        prenom: true,
        email: true,
        type: true,
        createdAt: true,
      },
    });

    let restaurantId: string | undefined;

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
          restaurateurId: user.id,
        },
        select: { id: true },
      });
      restaurantId = restaurant.id;
    }

    return NextResponse.json(
      { message: "Inscription enregistrée avec succès.", user, restaurantId },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Prisma unique constraint violation (P2002)
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

    console.error("[POST /api/inscription]", err);
    return NextResponse.json(
      { error: "Erreur interne. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
