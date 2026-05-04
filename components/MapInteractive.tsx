'use client'

export default function MapInteractive() {
  return (
    <div style={{ width: '100%', height: '500px', borderRadius: '16px', overflow: 'hidden' }}>
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src="https://www.openstreetmap.org/export/embed.html?bbox=-5.142,41.333,9.560,51.124&layer=mapnik"
        style={{ border: 'none' }}
        title="Carte Repation"
      />
    </div>
  )
}
