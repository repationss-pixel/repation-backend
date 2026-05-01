import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Repation <contact@repation.fr>'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtHeure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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

// ─── Templates ────────────────────────────────────────────────────────────────

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
