import { NextRequest, NextResponse } from 'next/server'
import { sendConfirmationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  let body: { to?: string; prenom?: string; restaurantNom?: string; creneau?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const { to, prenom, restaurantNom, creneau } = body

  if (!to || !prenom || !restaurantNom || !creneau) {
    return NextResponse.json(
      { error: 'to, prenom, restaurantNom et creneau sont requis' },
      { status: 400 }
    )
  }

  const { data, error } = await sendConfirmationEmail(to, prenom, restaurantNom, creneau)

  if (error) {
    console.error('[email/confirmation]', error)
    return NextResponse.json({ error: (error as { message?: string }).message ?? 'Erreur envoi email' }, { status: 500 })
  }

  return NextResponse.json({ id: data?.id })
}
