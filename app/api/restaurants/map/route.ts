import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    where: {
      latitude: { not: 0 },
      longitude: { not: 0 },
    },
    select: {
      id: true,
      nom: true,
      slug: true,
      latitude: true,
      longitude: true,
      categorie: true,
      photoUrl: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(restaurants)
}
