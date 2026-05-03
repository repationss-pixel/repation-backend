import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const SUJETS_VALIDES = ['Question générale', 'Problème technique', 'Signaler un utilisateur', 'Autre']

export async function POST(req: NextRequest) {
  let body: { prenom?: string; email?: string; sujet?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  const { prenom, email, sujet, message } = body

  if (!prenom?.trim()) return NextResponse.json({ error: 'Prénom requis.' }, { status: 422 })
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email invalide.' }, { status: 422 })
  }
  if (!sujet || !SUJETS_VALIDES.includes(sujet)) {
    return NextResponse.json({ error: 'Sujet invalide.' }, { status: 422 })
  }
  if (!message?.trim() || message.trim().length < 10) {
    return NextResponse.json({ error: 'Message trop court (min 10 caractères).' }, { status: 422 })
  }

  try {
    await resend.emails.send({
      from: 'Repation <contact@repation.fr>',
      to: 'contact@repation.fr',
      replyTo: email.trim(),
      subject: `[Contact] ${sujet} — ${prenom.trim()}`,
      html: `<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;font-family:system-ui,sans-serif;background:#F8F9FA;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.07);overflow:hidden;">
  <tr><td style="background:#1D9E75;padding:28px 32px;">
    <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">📬 Nouveau message de contact</p>
  </td></tr>
  <tr><td style="padding:32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="padding-bottom:12px;">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Expéditeur</p>
        <p style="margin:4px 0 0;font-size:15px;color:#111827;font-weight:600;">${prenom.trim()} &lt;${email.trim()}&gt;</p>
      </td></tr>
      <tr><td style="padding-bottom:12px;border-top:1px solid #f3f4f6;padding-top:12px;">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Sujet</p>
        <p style="margin:4px 0 0;font-size:15px;color:#111827;">${sujet}</p>
      </td></tr>
      <tr><td style="border-top:1px solid #f3f4f6;padding-top:12px;">
        <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
        <p style="margin:4px 0 0;font-size:15px;color:#374151;line-height:1.6;white-space:pre-wrap;">${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
      Répondre directement à cet email pour contacter ${prenom.trim()}
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
    })

    console.log('[contact] message envoyé de', email.trim(), '— sujet:', sujet)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact] erreur Resend:', JSON.stringify(err))
    return NextResponse.json({ error: 'Erreur lors de l\'envoi. Veuillez réessayer.' }, { status: 500 })
  }
}
