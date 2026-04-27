'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

type State = 'idle' | 'loading' | 'waiting-partner' | 'validated' | 'error'

export default function CheckInPage() {
  const { slug } = useParams<{ slug: string }>()
  const [phone, setPhone] = useState('')
  const [state, setState] = useState<State>('idle')
  const [message, setMessage] = useState('')
  const [prenom, setPrenom] = useState('')
  const [partnerPrenom, setPartnerPrenom] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')

    if (!navigator.geolocation) {
      setState('error')
      setMessage("La géolocalisation n'est pas supportée par votre navigateur.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch('/api/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              restaurantSlug: slug,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          })
          const data = await res.json()
          if (!res.ok) {
            setState('error')
            setMessage(data.error)
          } else {
            setPrenom(data.prenom)
            if (data.validated) {
              setPartnerPrenom(data.partnerPrenom)
              setState('validated')
            } else {
              setState('waiting-partner')
            }
          }
        } catch {
          setState('error')
          setMessage('Erreur de connexion. Réessayez.')
        }
      },
      () => {
        setState('error')
        setMessage('Impossible d\'obtenir votre position GPS. Autorisez la géolocalisation et réessayez.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  if (state === 'validated') {
    return (
      <div className="min-h-screen bg-green-500 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-9xl mb-6 leading-none">✓</div>
          <h1 className="text-3xl font-bold mb-3">Présence confirmée !</h1>
          <p className="text-xl mb-2">Bonne dégustation {prenom} &amp; {partnerPrenom} !</p>
          <p className="text-lg opacity-80 mt-4">Visite certifiée Repation</p>
        </div>
      </div>
    )
  }

  if (state === 'waiting-partner') {
    return (
      <div className="min-h-screen bg-blue-500 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-8xl mb-6">⏳</div>
          <h1 className="text-3xl font-bold mb-3">Présence enregistrée !</h1>
          <p className="text-xl mb-2">Bonjour {prenom} !</p>
          <p className="text-lg opacity-90 mt-3">
            En attente que votre convive scanne le QR code.
          </p>
          <p className="text-sm opacity-70 mt-2">La visite sera certifiée quand les deux convives auront scanné.</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-red-500 flex items-center justify-center p-6">
        <div className="text-center text-white">
          <div className="text-9xl mb-6 leading-none">✗</div>
          <h1 className="text-3xl font-bold mb-4">Check-in impossible</h1>
          <p className="text-lg mb-8 opacity-90">{message}</p>
          <button
            onClick={() => setState('idle')}
            className="bg-white text-red-500 px-8 py-3 rounded-full font-semibold text-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1D9E75] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1D9E75] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Check-in Repation</h1>
          <p className="text-gray-500 mt-2 text-sm">Confirmez votre présence au restaurant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Votre numéro de téléphone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={state === 'loading'}
            className="w-full bg-[#1D9E75] text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-60 transition-opacity"
          >
            {state === 'loading' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Localisation…
              </span>
            ) : (
              'Confirmer ma présence'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
          Votre position GPS sera vérifiée pour certifier votre présence dans le restaurant.
        </p>
      </div>
    </div>
  )
}
