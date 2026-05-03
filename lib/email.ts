import { Resend } from 'resend'
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Repation <contact@repation.fr>'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Europe/Paris',
  })
}

function fmtHeure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Paris',
  })
}

function layout(bandeau: string, bandeauColor: string, body: string): string {
  return `<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
  <tr><td align="center" style="padding-bottom:32px;">
    <span style="font-size:26px;font-weight:800;color:#1D9E75;letter-spacing:-0.5px;">Repation</span>
    <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Le hasard vous met à table.</p>
  </td></tr>
  <tr><td style="background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);overflow:hidden;">
    <div style="background:${bandeauColor};padding:28px 32px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">${bandeau}</p>
    </div>
    <div style="padding:32px;">${body}</div>
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        © ${new Date().getFullYear()} Repation · Tous droits réservés
      </p>
    </div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

function send(to: string, subject: string, html: string) {
  return resend.emails.send({ from: FROM, to, subject, html })
}

// ─── Confirmation de réservation (convive) ────────────────────────────────────

export async function sendConfirmationEmail(
  to: string, prenom: string, restaurantNom: string, creneau: string
) {
  const html = layout(
    '✅ Réservation confirmée !', '#1D9E75',
    `<p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;">Bonjour <strong>${prenom}</strong>,</p>
     <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
       Votre réservation au
       <strong style="color:#1D9E75;">${restaurantNom}</strong>
       est confirmée pour le <strong>${fmtDate(creneau)}</strong>
       à <strong>${fmtHeure(creneau)}</strong>.
     </p>
     <div style="background:#f0fdf4;border-left:4px solid #1D9E75;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
       <p style="margin:0;font-size:14px;color:#166534;">
         🤝 Votre convive vous rejoindra à la même table.
       </p>
     </div>
     <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:14px 16px;margin-bottom:28px;">
       <p style="margin:0;font-size:13px;color:#854d0e;line-height:1.5;">
         ⚠️ <strong>Annulation gratuite</strong> jusqu'à 20 minutes avant votre réservation.
         Au-delà, <strong>1€ sera prélevé automatiquement</strong>.
       </p>
     </div>
     <p style="margin:0;font-size:14px;color:#6b7280;">À tout à l'heure,<br/>
       <strong style="color:#1D9E75;">L'équipe Repation 🍽️</strong>
     </p>`
  )
  return send(to, '✅ Votre réservation Repation est confirmée !', html)
}

// ─── Génération PDF avec les 2 QR codes du restaurant ────────────────────────

async function generateQRCodesPDF(slug: string): Promise<Buffer> {
  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    width: 280, margin: 2, errorCorrectionLevel: 'M',
  }
  const [qrCheckin, qrPromo] = await Promise.all([
    QRCode.toDataURL(`https://www.repation.fr/check-in/${slug}`, {
      ...qrOptions, color: { dark: '#1D9E75', light: '#FFFFFF' },
    }),
    QRCode.toDataURL('https://www.repation.fr', {
      ...qrOptions, color: { dark: '#1a1a1a', light: '#FFFFFF' },
    }),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Titre
  doc.setFontSize(22)
  doc.setTextColor(29, 158, 117)
  doc.text('Repation — Vos QR codes', 105, 22, { align: 'center' })

  // QR 1
  doc.setFontSize(13)
  doc.setTextColor(17, 24, 39)
  doc.text('QR Code 1 — Validation de présence', 105, 40, { align: 'center' })
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('Les convives scannent ce code dès leur arrivée', 105, 47, { align: 'center' })
  doc.addImage(qrCheckin, 'PNG', 60, 52, 90, 90)
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text(`repation.fr/check-in/${slug}`, 105, 147, { align: 'center' })

  // Séparateur
  doc.setDrawColor(229, 231, 235)
  doc.line(20, 155, 190, 155)

  // QR 2
  doc.setFontSize(13)
  doc.setTextColor(17, 24, 39)
  doc.text('QR Code 2 — Découvrir Repation', 105, 168, { align: 'center' })
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('À afficher en salle pour inviter vos clients à rejoindre Repation', 105, 175, { align: 'center' })
  doc.addImage(qrPromo, 'PNG', 60, 180, 90, 90)
  doc.setFontSize(9)
  doc.setTextColor(107, 114, 128)
  doc.text('repation.fr', 105, 275, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

// ─── Notification nouvelle réservation (restaurateur) ─────────────────────────

export async function sendRestaurantNotificationEmail(
  to: string, restaurantNom: string, creneau: string, slug: string
) {
  const html = layout(
    '🍽️ Nouvelle réservation !', '#1D9E75',
    `<p style="margin:0 0 20px;font-size:16px;color:#1a1a1a;">Bonjour,</p>
     <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
       Une nouvelle table Repation a été réservée dans votre établissement
       <strong style="color:#1D9E75;">${restaurantNom}</strong>.
     </p>
     <div style="background:#f0fdf4;border-left:4px solid #1D9E75;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
       <p style="margin:0 0 4px;font-size:13px;color:#166534;font-weight:600;">Date et heure</p>
       <p style="margin:0;font-size:15px;color:#166534;font-weight:700;">
         ${fmtDate(creneau)} à ${fmtHeure(creneau)}
       </p>
     </div>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
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
     <p style="margin:0;font-size:14px;color:#6b7280;">À bientôt,<br/>
       <strong style="color:#1D9E75;">L'équipe Repation 🍽️</strong>
     </p>`
  )

  const pdfBuffer = await generateQRCodesPDF(slug)

  return resend.emails.send({
    from: FROM,
    to,
    subject: '🍽️ Nouvelle réservation Repation !',
    html,
    attachments: [{
      filename: `qr-codes-${slug}.pdf`,
      content: pdfBuffer,
    }],
  })
}

// ─── Email de bienvenue restaurateur avec QR codes ────────────────────────────

export async function sendWelcomeRestaurantEmail(
  to: string, nomEtablissement: string, slug: string
) {
  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    width: 260,
    margin: 2,
    errorCorrectionLevel: 'M',
  }

  const [qrCheckin, qrRepation] = await Promise.all([
    QRCode.toDataURL(`https://www.repation.fr/check-in/${slug}`, {
      ...qrOptions,
      color: { dark: '#1D9E75', light: '#FFFFFF' },
    }),
    QRCode.toDataURL('https://www.repation.fr', {
      ...qrOptions,
      color: { dark: '#1a1a1a', light: '#FFFFFF' },
    }),
  ])

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#1D9E75;padding:32px 40px;text-align:center;">
            <p style="margin:0;font-size:32px;">🎉</p>
            <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
              Bienvenue sur Repation !
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
              Tout est prêt ! Voici vos <strong>2 QR codes</strong> à imprimer et disposer sur vos tables.
              Chaque table accueillant 2 convives Repation doit avoir <strong>un QR code par convive</strong>.
            </p>
            <p style="margin:0;color:#6B7280;font-size:14px;line-height:1.6;">
              Repation ne vous facture rien tant que vous n'atteignez pas 5 visites certifiées dans le mois.
              Au-delà, un prélèvement automatique est effectué le 1er du mois suivant.
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
                  <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#111827;">Scan de confirmation</h2>
                  <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.5;">
                    Les convives scannent ce QR code dès leur arrivée pour <strong>confirmer leur présence</strong>
                    et activer votre compteur mensuel. Sans scan dans les 30 minutes, la réservation passe en absence non justifiée.
                  </p>
                  <div style="text-align:center;">
                    <img src="${qrCheckin}" alt="QR code de validation" width="200" height="200"
                      style="display:block;margin:0 auto;border-radius:8px;" />
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
                  <h2 style="margin:0 0 8px;font-size:18px;font-weight:800;color:#111827;">Invitation pour vos clients</h2>
                  <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.5;">
                    Affichez ce QR code en salle ou en vitrine pour inviter vos clients habituels
                    à découvrir Repation et réserver une table chez vous.
                  </p>
                  <div style="text-align:center;">
                    <img src="${qrRepation}" alt="QR code Repation" width="200" height="200"
                      style="display:block;margin:0 auto;border-radius:8px;" />
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
            <a href="https://www.repation.fr/dashboard/restaurateur"
              style="display:inline-block;background:#1D9E75;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 32px;border-radius:10px;">
              Accéder à mon tableau de bord →
            </a>
            <p style="margin:16px 0 0;font-size:13px;color:#9CA3AF;">
              Des questions ? <a href="https://www.repation.fr/contact" style="color:#1D9E75;text-decoration:underline;">Contactez-nous</a>
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
    </td></tr>
  </table>
</body>
</html>`

  return resend.emails.send({
    from: FROM,
    to,
    subject: '🎉 Bienvenue sur Repation — Vos 2 QR codes sont prêts !',
    html,
  })
}

// ─── Email de bienvenue convive ───────────────────────────────────────────────

export async function sendWelcomeConviveEmail(to: string, prenom: string) {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

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

            <!-- Bandeau -->
            <div style="background:#1D9E75;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:32px;">🎉</p>
              <p style="margin:12px 0 0;font-size:22px;font-weight:700;color:#ffffff;">
                Bienvenue, ${prenom} !
              </p>
            </div>

            <!-- Contenu -->
            <div style="padding:32px;">
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
                Vous venez de rejoindre Repation, la plateforme qui transforme un repas solitaire
                en moment de convivialité.
              </p>

              <!-- Comment ça marche -->
              <div style="margin-bottom:24px;">
                <div style="display:flex;margin-bottom:16px;">
                  <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:12px;width:100%;box-sizing:border-box;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1D9E75;">
                      1. Je réserve
                    </p>
                    <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">
                      Choisissez un restaurant partenaire et un créneau disponible près de chez vous.
                    </p>
                  </div>
                </div>
                <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:12px;">
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1D9E75;">
                    2. Je rencontre
                  </p>
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">
                    Repation vous met en relation avec un autre convive au même créneau.
                  </p>
                </div>
                <div style="background:#f0fdf4;border-radius:12px;padding:16px;">
                  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1D9E75;">
                    3. Je partage
                  </p>
                  <p style="margin:0;font-size:13px;color:#374151;line-height:1.5;">
                    Vous vous retrouvez à table et partagez un bon repas. Simple, gratuit, convivial.
                  </p>
                </div>
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-top:28px;">
                <a
                  href="https://www.repation.fr/recherche"
                  style="display:inline-block;background:#1D9E75;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:10px;"
                >
                  Trouver une table →
                </a>
              </div>

              <p style="margin:28px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
                À très bientôt à table,<br />
                <strong style="color:#1D9E75;">L'équipe Repation 🍽️</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Repation · Vous recevez cet email car vous venez de créer un compte.
              </p>
            </div>

          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  return send(to, '🎉 Bienvenue sur Repation !', html)
}

// ─── Rappel scan QR (T+20 min) ────────────────────────────────────────────────

export async function sendScanReminderEmail(
  to: string, prenom: string, restaurantNom: string, creneau: string
) {
  const html = layout(
    '⏰ Rappel : confirmez votre présence', '#f59e0b',
    `<p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Bonjour <strong>${prenom}</strong>,</p>
     <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
       Il vous reste <strong>10 minutes</strong> pour scanner le QR code de votre table Repation chez
       <strong style="color:#1D9E75;">${restaurantNom}</strong>
       (créneau du <strong>${fmtDate(creneau)} à ${fmtHeure(creneau)}</strong>).
     </p>
     <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
       <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
         ⚠️ Sans scan du QR code dans les 10 prochaines minutes,
         <strong>1€ sera prélevé automatiquement</strong> sur votre carte.
       </p>
     </div>
     <p style="margin:0;font-size:14px;color:#6b7280;">L'équipe Repation 🍽️</p>`
  )
  return send(to, '⏰ Rappel : confirmez votre présence Repation', html)
}

// ─── Prélèvement absence non justifiée (T+30 min) ────────────────────────────

export async function sendNoScanChargeEmail(
  to: string, prenom: string, restaurantNom: string, creneau: string
) {
  const html = layout(
    '📋 Présence non confirmée', '#ef4444',
    `<p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Bonjour <strong>${prenom}</strong>,</p>
     <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
       Votre présence n'a pas été confirmée pour votre réservation du
       <strong>${fmtDate(creneau)} à ${fmtHeure(creneau)}</strong>
       au <strong style="color:#1D9E75;">${restaurantNom}</strong>.
     </p>
     <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
       <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.5;">
         <strong>1€ a été prélevé</strong> conformément à nos conditions d'utilisation
         (absence sans annulation dans les délais).
       </p>
     </div>
     <p style="margin:0;font-size:14px;color:#6b7280;">L'équipe Repation 🍽️</p>`
  )
  return send(to, '📋 Présence non confirmée — 1€ prélevé', html)
}

// ─── Annulation en cascade — convive partenaire ───────────────────────────────

export async function sendCascadeCancelConviveEmail(
  to: string, prenom: string, restaurantNom: string, creneau: string
) {
  const html = layout(
    '😔 Votre table a été annulée', '#6b7280',
    `<p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Bonjour <strong>${prenom}</strong>,</p>
     <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
       Votre convive a annulé sa réservation au
       <strong style="color:#1D9E75;">${restaurantNom}</strong>
       du <strong>${fmtDate(creneau)} à ${fmtHeure(creneau)}</strong>.
       Votre table a donc été automatiquement annulée.
     </p>
     <div style="background:#f0fdf4;border-left:4px solid #1D9E75;border-radius:0 8px 8px 0;padding:14px 16px;margin-bottom:24px;">
       <p style="margin:0;font-size:13px;color:#166534;">
         ✅ <strong>Aucun frais ne vous sera prélevé.</strong>
       </p>
     </div>
     <p style="margin:0 0 20px;font-size:14px;color:#374151;">
       Nous espérons vous retrouver bientôt sur Repation !
     </p>
     <p style="margin:0;font-size:14px;color:#6b7280;">L'équipe Repation 🍽️</p>`
  )
  return send(to, '😔 Votre table Repation a été annulée', html)
}

// ─── Annulation en cascade — restaurant ──────────────────────────────────────

export async function sendCascadeCancelRestaurantEmail(
  to: string, restaurantNom: string, creneau: string
) {
  const html = layout(
    'ℹ️ Table annulée', '#6b7280',
    `<p style="margin:0 0 16px;font-size:16px;color:#1a1a1a;">Bonjour,</p>
     <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
       La table Repation du <strong>${fmtDate(creneau)} à ${fmtHeure(creneau)}</strong>
       dans votre établissement <strong style="color:#1D9E75;">${restaurantNom}</strong>
       a été annulée suite à l'annulation d'un convive.
     </p>
     <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
       <p style="margin:0;font-size:13px;color:#374151;">
         Les deux convives ont été informés. Aucune action requise de votre part.
       </p>
     </div>
     <p style="margin:0;font-size:14px;color:#6b7280;">L'équipe Repation 🍽️</p>`
  )
  return send(to, 'ℹ️ Table Repation annulée', html)
}
