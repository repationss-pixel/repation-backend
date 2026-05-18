'use client'

import { useEffect, useState } from 'react'
import type { CompanionData } from './page'

interface Props {
  hasCompanion: boolean
  companion: CompanionData | null
  creneau: string
  restaurantNom: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'Europe/Paris',
  })
}

function fmtHeure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Paris',
  })
}

function MatchAnimation({ companion, creneau, restaurantNom }: {
  companion: CompanionData
  creneau: string
  restaurantNom: string
}) {
  const storageKey = `companion_shown_${creneau}`

  const [phase, setPhase] = useState<'merge' | 'reveal'>(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(storageKey)) return 'reveal'
    return 'merge'
  })

  useEffect(() => {
    if (phase === 'merge') {
      const t = setTimeout(() => {
        setPhase('reveal')
        sessionStorage.setItem(storageKey, '1')
      }, 1400)
      return () => clearTimeout(t)
    }
  }, [])

  return (
    <div style={{ marginTop: '12px' }}>
      <style>{`
        @keyframes slideFromLeft {
          from { transform: translateX(-32px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideFromRight {
          from { transform: translateX(32px); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes sparkPop {
          0%   { transform: scale(0) rotate(-40deg); opacity: 0; }
          55%  { transform: scale(1.5) rotate(15deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg);   opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);  }
        }
        @keyframes matchBanner {
          0%   { opacity: 0; transform: scale(0.94); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Phase 1 : animation des 2 cercles */}
      {phase === 'merge' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          padding: '20px 0',
        }}>
          {/* Cercle gauche */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: '#F2EAD9', border: '2px solid #D4BFA0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
            animation: 'slideFromLeft 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
          }}>
            👤
          </div>

          {/* Étincelle centrale */}
          <div style={{
            fontSize: '24px', lineHeight: 1,
            animation: 'sparkPop 0.45s cubic-bezier(0.22,1,0.36,1) 0.55s both',
          }}>
            ✨
          </div>

          {/* Cercle droit */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: '#F2EAD9', border: '2px solid #D4BFA0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px',
            animation: 'slideFromRight 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
          }}>
            👤
          </div>
        </div>
      )}

      {/* Phase 2 : profil révélé */}
      {phase === 'reveal' && (
        <div style={{ animation: 'fadeUp 0.45s ease-out forwards' }}>
          {/* Banner "Table complète" */}
          <div style={{
            background: '#F2EAD9', border: '1px solid #D4BFA0',
            borderRadius: '12px', padding: '10px 14px', marginBottom: '10px',
            display: 'flex', alignItems: 'center', gap: '8px',
            animation: 'matchBanner 0.4s ease-out forwards',
          }}>
            <span style={{ fontSize: '16px' }}>✨</span>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#8B5E3C' }}>
              Votre table est complète !
            </p>
          </div>

          {/* Carte profil du convive */}
          <div style={{
            background: '#FBF5E6', border: '1px solid #D4BFA0',
            borderRadius: '12px', padding: '14px',
            display: 'flex', alignItems: 'flex-start', gap: '12px',
          }}>
            {/* Avatar */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
              background: '#F2EAD9', border: '2px solid #D4BFA0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {companion.photoUrl
                ? <img src={companion.photoUrl} alt={companion.prenom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '20px', fontWeight: 700, color: '#8B5E3C' }}>{companion.prenom[0].toUpperCase()}</span>
              }
            </div>

            {/* Infos */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#1C1009' }}>
                {companion.prenom}
                {companion.age && (
                  <span style={{ fontWeight: 400, color: '#7A6A55', marginLeft: '6px', fontSize: '13px' }}>
                    {companion.age} ans
                  </span>
                )}
              </p>
              {companion.profession && (
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#7A6A55' }}>{companion.profession}</p>
              )}
              {companion.bio && (
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#8B5E3C', fontStyle: 'italic' }}>
                  &ldquo;{companion.bio}&rdquo;
                </p>
              )}
              {companion.interets && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                  {companion.interets.split(',').map(i => i.trim()).filter(Boolean).map(interet => (
                    <span key={interet} style={{
                      padding: '2px 8px', background: '#F2EAD9',
                      color: '#8B5E3C', fontSize: '11px', borderRadius: '20px',
                      border: '1px solid #D4BFA0',
                    }}>{interet}</span>
                  ))}
                </div>
              )}
              <p style={{ margin: 0, fontSize: '12px', color: '#7A6A55', lineHeight: 1.5 }}>
                Vous rencontrerez{' '}
                <strong style={{ color: '#1C1009' }}>{companion.prenom}</strong>{' '}
                le {fmtDate(creneau)} à {fmtHeure(creneau)} chez{' '}
                <strong style={{ color: '#1C1009' }}>{restaurantNom}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CompanionCard({ hasCompanion, companion, creneau, restaurantNom }: Props) {
  if (!hasCompanion) {
    return (
      <p style={{ fontSize: '12px', color: '#B0A090', marginTop: '8px', fontStyle: 'italic' }}>
        En attente d&apos;un convive…
      </p>
    )
  }

  // Companion existe mais profil incomplet (ne devrait pas arriver)
  if (!companion) {
    return (
      <div style={{
        marginTop: '12px', background: '#F2EAD9', border: '1px solid #D4BFA0',
        borderRadius: '12px', padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span>✨</span>
        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#8B5E3C' }}>
          Votre table est complète !
        </p>
      </div>
    )
  }

  return (
    <MatchAnimation
      companion={companion}
      creneau={creneau}
      restaurantNom={restaurantNom}
    />
  )
}
