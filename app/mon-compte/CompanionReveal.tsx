'use client'

import { useEffect, useState } from 'react'

interface CompanionProfile {
  prenom: string
  photoUrl: string | null
  age: number | null
  profession: string | null
  bio: string | null
  interets: string | null
}

interface Props {
  hasCompanion: boolean
  creneau: string // ISO string
  companion: CompanionProfile | null
}

function Countdown({ targetMs }: { targetMs: number }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()))

  useEffect(() => {
    if (remaining <= 0) return
    const id = setInterval(() => {
      setRemaining(prev => {
        const next = Math.max(0, targetMs - Date.now())
        if (next <= 0) clearInterval(id)
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [targetMs, remaining])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return (
    <span className="font-bold tabular-nums">
      {mins > 0 ? `${mins} min ${secs < 10 ? '0' : ''}${secs} s` : `${secs} s`}
    </span>
  )
}

function MatchAnimation({ companion }: { companion: CompanionProfile | null }) {
  const [phase, setPhase] = useState<'silhouettes' | 'flash' | 'done'>('silhouettes')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('flash'), 600)
    const t2 = setTimeout(() => setPhase('done'), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div className="relative">
      {/* Flash overlay */}
      <div
        className="absolute inset-0 rounded-2xl z-10 pointer-events-none transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, #1D9E75 0%, transparent 70%)',
          opacity: phase === 'flash' ? 0.25 : 0,
        }}
      />

      <div className="flex items-center justify-center gap-6 py-4">
        {/* Silhouette vous */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-700"
            style={{
              background: phase === 'done' ? '#1D9E75' : '#d1d5db',
              color: 'white',
              transform: phase === 'silhouettes' ? 'scale(0.85)' : 'scale(1)',
            }}
          >
            {phase === 'done' ? 'Vous' : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 opacity-60">
                <path d="M12 12c2.7 0 4-1.8 4-4s-1.3-4-4-4-4 1.8-4 4 1.3 4 4 4zm0 2c-2.7 0-8 1.3-8 4v1h16v-1c0-2.7-5.3-4-8-4z"/>
              </svg>
            )}
          </div>
          <span className="text-xs text-gray-500">Vous</span>
        </div>

        {/* Icône match */}
        <div
          className="transition-all duration-500"
          style={{
            transform: phase === 'done' ? 'scale(1.2)' : 'scale(0.8)',
            opacity: phase === 'done' ? 1 : 0.4,
          }}
        >
          <span className="text-2xl">🤝</span>
        </div>

        {/* Silhouette convive */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden transition-all duration-700"
            style={{
              background: phase === 'done' ? '#1D9E75' : '#d1d5db',
              color: 'white',
              transform: phase === 'silhouettes' ? 'scale(0.85)' : 'scale(1)',
            }}
          >
            {phase === 'done' && companion?.photoUrl ? (
              <img src={companion.photoUrl} alt={companion.prenom} className="w-full h-full object-cover" />
            ) : phase === 'done' ? (
              companion?.prenom[0].toUpperCase()
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 opacity-60">
                <path d="M12 12c2.7 0 4-1.8 4-4s-1.3-4-4-4-4 1.8-4 4 1.3 4 4 4zm0 2c-2.7 0-8 1.3-8 4v1h16v-1c0-2.7-5.3-4-8-4z"/>
              </svg>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {phase === 'done' ? companion?.prenom ?? 'Convive' : 'Convive'}
          </span>
        </div>
      </div>

      {phase === 'done' && (
        <p className="text-center text-sm font-semibold text-[#1D9E75] mt-1 animate-pulse">
          Votre table est complète !
        </p>
      )}
    </div>
  )
}

export default function CompanionReveal({ hasCompanion, creneau, companion }: Props) {
  const creneauMs = new Date(creneau).getTime()
  const revealMs = creneauMs - 20 * 60 * 1000
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const isRevealed = now >= revealMs

  if (!hasCompanion) {
    return (
      <p className="text-xs text-gray-400 mt-1 italic">En attente d&apos;un convive…</p>
    )
  }

  if (!isRevealed) {
    return (
      <div className="mt-3 rounded-2xl border border-[#1D9E75]/20 bg-[#F0FAF5] p-4">
        <MatchAnimation companion={null} />
        <p className="text-center text-xs text-gray-500 mt-3">
          Votre table est complète ! Vous découvrirez votre convive{' '}
          <span className="font-semibold text-[#1D9E75]">20 minutes</span> avant votre repas.
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          Profil révélé dans <Countdown targetMs={revealMs} />
        </p>
      </div>
    )
  }

  // Profil révélé
  return (
    <div className="mt-3 rounded-2xl border border-[#1D9E75]/30 bg-[#F0FAF5] p-4 space-y-3">
      <MatchAnimation companion={companion} />

      {companion && (
        <div className="flex items-start gap-3 pt-2 border-t border-[#1D9E75]/10">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1D9E75]/20 flex items-center justify-center shrink-0">
            {companion.photoUrl ? (
              <img src={companion.photoUrl} alt={companion.prenom} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-[#1D9E75]">{companion.prenom[0].toUpperCase()}</span>
            )}
          </div>

          {/* Infos */}
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm">
              {companion.prenom}
              {companion.age && <span className="font-normal text-gray-500">, {companion.age} ans</span>}
            </p>
            {companion.profession && (
              <p className="text-xs text-gray-500">{companion.profession}</p>
            )}
            {companion.bio && (
              <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{companion.bio}&rdquo;</p>
            )}
            {companion.interets && (
              <div className="flex flex-wrap gap-1 mt-2">
                {companion.interets.split(',').map(i => i.trim()).filter(Boolean).map(interet => (
                  <span key={interet} className="px-2 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75] text-xs rounded-full font-medium">
                    {interet}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
