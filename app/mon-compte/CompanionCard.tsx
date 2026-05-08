'use client'

import { useEffect, useState } from 'react'
import type { CompanionData } from './page'

interface Props {
  hasCompanion: boolean
  companion: CompanionData | null
  creneau: string
}

function useNow() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

function Countdown({ targetMs }: { targetMs: number }) {
  const now = useNow()
  const rem = Math.max(0, targetMs - now)
  const mins = Math.floor(rem / 60000)
  const secs = Math.floor((rem % 60000) / 1000)
  return <span className="font-bold tabular-nums text-[#1D9E75]">{mins > 0 ? `${mins} min ${secs.toString().padStart(2, '0')} s` : `${secs} s`}</span>
}

function MatchBanner() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-700"
      style={{
        background: 'linear-gradient(135deg, #e6f7f1 0%, #d0f0e4 100%)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      <span className="text-lg" style={{ animation: 'spin-once 0.6s ease-out 0.3s both' }}>✨</span>
      <div>
        <p className="text-sm font-bold text-[#1D9E75]">Table complète !</p>
        <p className="text-xs text-gray-500">Vous découvrirez votre convive 20 minutes avant votre repas.</p>
      </div>
      <style>{`@keyframes spin-once{from{transform:rotate(-180deg) scale(0)}to{transform:rotate(0deg) scale(1)}}`}</style>
    </div>
  )
}

export default function CompanionCard({ hasCompanion, companion, creneau }: Props) {
  const now = useNow()
  const revealMs = new Date(creneau).getTime() - 20 * 60 * 1000
  const isRevealed = now >= revealMs

  if (!hasCompanion) {
    return (
      <p className="text-xs text-gray-400 mt-2 italic">En attente d&apos;un convive…</p>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <MatchBanner />

      {!isRevealed ? (
        /* Silhouette floue + compte à rebours */
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0" style={{ filter: 'blur(2px)' }}>
            <svg viewBox="0 0 24 24" fill="#9ca3af" className="w-6 h-6">
              <path d="M12 12c2.7 0 4-1.8 4-4s-1.3-4-4-4-4 1.8-4 4 1.3 4 4 4zm0 2c-2.7 0-8 1.3-8 4v1h16v-1c0-2.7-5.3-4-8-4z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500" style={{ filter: 'blur(3px)', userSelect: 'none' }}>Votre convive</p>
            <p className="text-xs text-gray-400">Profil révélé dans <Countdown targetMs={revealMs} /></p>
          </div>
        </div>
      ) : (
        /* Profil révélé */
        companion && (
          <div className="flex items-start gap-3 px-4 py-3 bg-[#F0FAF5] rounded-2xl border border-[#1D9E75]/20">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1D9E75]/20 flex items-center justify-center shrink-0">
              {companion.photoUrl
                ? <img src={companion.photoUrl} alt={companion.prenom} className="w-full h-full object-cover" />
                : <span className="text-lg font-bold text-[#1D9E75]">{companion.prenom[0].toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm">
                {companion.prenom}
                {companion.age && <span className="font-normal text-gray-500 ml-1">{companion.age} ans</span>}
              </p>
              {companion.profession && <p className="text-xs text-gray-500">{companion.profession}</p>}
              {companion.bio && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{companion.bio}&rdquo;</p>}
              {companion.interets && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {companion.interets.split(',').map(i => i.trim()).filter(Boolean).map(interet => (
                    <span key={interet} className="px-2 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75] text-xs rounded-full">{interet}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  )
}
