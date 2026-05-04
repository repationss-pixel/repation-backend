'use client'

export default function MapInteractive() {
  return (
    <iframe
      src="https://www.openstreetmap.org/export/embed.html?bbox=-5.0,41.0,10.0,51.5&layer=mapnik"
      style={{ width: '100%', height: '500px', border: 'none', borderRadius: '16px' }}
      title="Carte Repation"
    />
  )
}
