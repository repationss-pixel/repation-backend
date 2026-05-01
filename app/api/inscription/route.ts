import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserType, RestaurantCategorie } from "@prisma/client";
import { Resend } from "resend";
import QRCode from "qrcode";

const resend = new Resend(process.env.RESEND_API_KEY);

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

async function sendWelcomeEmail(params: {
  to: string;
  nomEtablissement: string;
  slug: string;
}) {
  const { to, nomEtablissement, slug } = params;

  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    width: 260,
    margin: 2,
    errorCorrectionLevel: "M",
  };

  const [qrCheckin, qrRepation] = await Promise.all([
    QRCode.toDataURL(`https://repation.fr/check-in/${slug}`, {
      ...qrOptions,
      color: { dark: "#1D9E75", light: "#FFFFFF" },
    }),
    QRCode.toDataURL("https://repation.fr", {
      ...qrOptions,
      color: { dark: "#1a1a1a", light: "#FFFFFF" },
    }),
  ]);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue sur Repation</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#1D9E75;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:32px;">🎉</p>
              <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                Bienvenue sur Repation&nbsp;!
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;">
                ${nomEtablissement} est maintenant partenaire
              </p>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                Tout est prêt&nbsp;! Voici vos <strong>2 QR codes</strong> à imprimer et disposer sur vos tables.
                Chaque table accueillant 2 convives Repation doit avoir <strong>un QR code par convive</strong>.
              </p>
              <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
                Repation ne vous facture rien tant que vous n'atteignez pas 5 visites certifiées dans le mois.
                Au-delà, un prélèvement automatique est effectué le 1<sup>er</sup> du mois suivant.
              </p>
            </td>
          </tr>

          <!-- QR 1 — Validation -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF9;border:1px solid #A7F3D0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#1D9E75;">
                      QR Code n°1 — Validation de présence
                    </p>
                    <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#111827;">
                      Scan de confirmation
                    </h2>
                    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.5;">
                      Les convives scannent ce QR code dès leur arrivée pour <strong>confirmer leur présence</strong>
                      et activer votre compteur mensuel. Sans scan dans les 30 minutes, la réservation passe en absence non justifiée.
                    </p>
                    <div style="text-align:center;">
                      <img
                        src="${qrCheckin}"
                        alt="QR code de validation — repation.fr/check-in/${slug}"
                        width="200"
                        height="200"
                        style="display:block;margin:0 auto;border-radius:8px;"
                      />
                      <p style="margin:12px 0 0;font-size:11px;color:#6B7280;font-family:monospace;">
                        repation.fr/check-in/${slug}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- QR 2 — Promotion -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6B7280;">
                      QR Code n°2 — Découvrir Repation
                    </p>
                    <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#111827;">
                      Invitation pour vos clients
                    </h2>
                    <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.5;">
                      Affichez ce QR code en salle ou en vitrine pour inviter vos clients habituels
                      à découvrir Repation et réserver une table chez vous.
                    </p>
                    <div style="text-align:center;">
                      <img
                        src="${qrRepation}"
                        alt="QR code Repation — repation.fr"
                        width="200"
                        height="200"
                        style="display:block;margin:0 auto;border-radius:8px;"
                      />
                      <p style="margin:12px 0 0;font-size:11px;color:#6B7280;font-family:monospace;">
                        repation.fr
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 40px 32px;text-align:center;">
              <a
                href="https://repation.fr/dashboard/restaurateur"
                style="display:inline-block;background:#1D9E75;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:10px;"
              >
                Accéder à mon tableau de bord →
              </a>
              <p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;">
                Des questions ? Contactez-nous via le formulaire sur repation.fr
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;border-top:1px solid #F3F4F6;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;">
                © ${new Date().getFullYear()} Repation · Vous recevez cet email car vous venez de créer un compte restaurateur.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: "Repation <contact@repation.fr>",
    to,
    subject: "🎉 Bienvenue sur Repation — Vos 2 QR codes sont prêts !",
    html,
  });
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
        select: { id: true, slug: true },
      });
      restaurantId = restaurant.id;

      // Fire-and-forget — l'email n'est pas critique pour la réponse
      sendWelcomeEmail({
        to: email.trim().toLowerCase(),
        nomEtablissement: prenom.trim(),
        slug: restaurant.slug,
      }).catch((err) => console.error("[inscription] welcome email failed:", err));
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
