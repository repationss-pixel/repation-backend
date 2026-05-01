import { NextRequest, NextResponse } from 'next/server'
import { sendRestaurantNotificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  let body: { to?: string; restaurantNom?: string; creneau?: string }
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

  const { data, error } = await sendRestaurantNotificationEmail(to, restaurantNom, creneau)

  if (error) {
    console.error('[email/restaurant-notification]', error)
    return NextResponse.json({ error: (error as { message?: string }).message ?? 'Erreur envoi email' }, { status: 500 })
  }

  return NextResponse.json({ id: data?.id })
}
