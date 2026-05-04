'use client'

import { useEffect, useRef, useState } from 'react'

interface Restaurant {
  id: string
  nom: string
  slug: string
  latitude: number
  longitude: number
  categorie: string
  photoUrl: string | null
}

const MARKER_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" width="32" height="42">
  <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 26 16 26S32 26 32 16C32 7.163 24.837 0 16 0z"
    fill="#1D9E75" stroke="#ffffff" stroke-width="2"/>
  <circle cx="16" cy="16" r="6" fill="#ffffff"/>
</svg>
`)

export default function MapInteractive() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let map: L.Map

    async function init() {
      try {
        // Import dynamique côté client uniquement
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')

        const restaurants: Restaurant[] = await fetch('/api/restaurants/map')
          .then(r => r.json())
          .catch(() => [])

        setLoading(false)

        if (!containerRef.current) return

        // Initialisation de la carte
        map = L.map(containerRef.current, {
          center: [46.5, 2.5],
          zoom: 6,
          scrollWheelZoom: false,
          zoomControl: true,
        })

        // Tuiles OpenStreetMap — gratuit, sans clé API
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        // Icône marker vert custom
        const greenIcon = L.icon({
          iconUrl: `data:image/svg+xml;charset=utf-8,${MARKER_SVG}`,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -44],
        })

        // Ajout des markers
        const validRestaurants = restaurants.filter(
          r => r.latitude !== 0 && r.longitude !== 0
        )

        validRestaurants.forEach(r => {
          const categLabel = r.categorie.replace(/_/g, ' ')
          const photoHtml = r.photoUrl
            ? `<img src="${r.photoUrl}" alt="${r.nom}" style="width:100%;height:72px;object-fit:cover;border-radius:6px;margin-bottom:8px;display:block"/>`
            : ''

          const popupHtml = `
            <div style="min-width:160px;max-width:200px;font-family:system-ui,sans-serif">
              ${photoHtml}
              <p style="margin:0 0 2px;font-weight:700;font-size:13px;color:#111827">${r.nom}</p>
              <p style="margin:0 0 8px;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px">${categLabel}</p>
              <a href="/restaurant/${r.slug}"
                style="display:block;background:#1D9E75;color:#fff;text-align:center;padding:6px 10px;border-radius:7px;font-size:12px;font-weight:600;text-decoration:none">
                Voir la table →
              </a>
            </div>
          `

          L.marker([r.latitude, r.longitude], { icon: greenIcon })
            .addTo(map)
            .bindPopup(popupHtml, { maxWidth: 210 })
        })

        // Auto-zoom sur les markers si plus d'un restaurant
        if (validRestaurants.length > 1) {
          const bounds = L.latLngBounds(
            validRestaurants.map(r => [r.latitude, r.longitude] as [number, number])
          )
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
        } else if (validRestaurants.length === 1) {
          map.setView([validRestaurants[0].latitude, validRestaurants[0].longitude], 13)
        }

        mapRef.current = map
      } catch (e) {
        console.error('[MapInteractive] init error:', e)
        setError(true)
        setLoading(false)
      }
    }

    init()

    return () => {
      // Nettoyage lors du démontage
      if (mapRef.current) {
        ;(mapRef.current as L.Map).remove()
        mapRef.current = null
      }
    }
  }, [])

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F0ECE4] rounded-3xl">
        <p className="text-sm text-gray-400">Carte indisponible</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#F0ECE4] rounded-3xl gap-3">
          <svg className="animate-spin w-8 h-8 text-[#1D9E75]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span className="text-sm font-medium text-gray-500">Chargement de la carte…</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
