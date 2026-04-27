import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface RestaurantNotificationPayload {
  to: string
  restaurantNom: string
  creneau: string // ISO string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatHeure(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function buildHtml(restaurantNom: string, creneau: string): string {
  const date = formatDate(creneau)
  const heure = formatHeure(creneau)

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouvelle réservation Repation</title>
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:26px;font-weight:800;color:#1D9E75;letter-spacing:-0.5px;">Repation</span>
              <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Le hasard vous met à table.</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);overflow:hidden;">

              <!-- Bandeau vert -->
              <div style="background:#1D9E75;padding:28px 32px;">
                <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">🍽️ Nouvelle réservation !</p>
              </div>

              <!-- Contenu -->
              <div style="padding:32px;">
                <p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;">
                  Bonjour,
                </p>

                <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                  Une nouvelle table Repation a été réservée dans votre établissement
                  <strong style="color:#1D9E75;">${restaurantNom}</strong>.
                </p>

                <!-- Bloc date -->
                <div style="background:#f0fdf4;border-left:4px solid #1D9E75;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
                  <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:600;">Date et heure</p>
                  <p style="margin:0;font-size:15px;color:#166534;font-weight:700;">
                    ${date} à ${heure}
                  </p>
                </div>

                <!-- Bloc convives -->
                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:28px;">
                  <p style="margin:0;font-size:14px;color:#374151;">
                    👥 <strong>Deux convives</strong> seront présents à cette table.
                  </p>
                </div>

                <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:14px 16px;margin-bottom:28px;">
                  <p style="margin:0;font-size:13px;color:#854d0e;">
                    ✅ <strong>Aucune action requise de votre part.</strong>
                    Repation gère la mise en relation entre les convives.
                  </p>
                </div>

                <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
                  À bientôt,<br />
                  <strong style="color:#1D9E75;">L'équipe Repation 🍽️</strong>
                </p>
              </div>

              <!-- Footer carte -->
              <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
                <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                  © ${new Date().getFullYear()} Repation · Tous droits réservés
                </p>
              </div>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  let body: Partial<RestaurantNotificationPayload>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { to, restaurantNom, creneau } = body

  if (!to || !restaurantNom || !creneau) {
    return NextResponse.json(
      { error: 'to, restaurantNom et creneau sont requis' },
      { status: 400 }
    )
  }

  const { data, error } = await resend.emails.send({
    from: 'Repation <onboarding@resend.dev>',
    to,
    subject: '🍽️ Nouvelle réservation Repation !',
    html: buildHtml(restaurantNom, creneau),
  })

  if (error) {
    console.error('[email/restaurant-notification]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data?.id })
}
