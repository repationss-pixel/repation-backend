'use client'
import { useEffect, useState } from 'react'

interface Restaurant {
  id: string
  nom: string
  slug: string
  latitude: number
  longitude: number
}

export default function MapInteractive() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])

  useEffect(() => {
    fetch('/api/restaurants/map').then(r => r.json()).then(setRestaurants).catch(() => {})
  }, [])

  return (
    <div style={{ width: '100%', height: '500px', background: '#e8f5e9', borderRadius: '16px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '48px' }}>🗺️</p>
        <p style={{ fontSize: '18px', fontWeight: 700, color: '#1D9E75' }}>Carte des restaurants</p>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>{restaurants.length} restaurant{restaurants.length > 1 ? 's' : ''} partenaire{restaurants.length > 1 ? 's' : ''}</p>
        {restaurants.map(r => (
          <a key={r.id} href={`/restaurant/${r.slug}`} style={{ display: 'block', margin: '4px auto', color: '#1D9E75', fontSize: '13px' }}>
            📍 {r.nom}
          </a>
        ))}
      </div>
    </div>
  )
}
