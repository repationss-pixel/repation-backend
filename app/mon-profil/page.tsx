'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const INTERETS_OPTIONS = [
  'Cuisine', 'Sport', 'Voyage', 'Musique', 'Cinéma',
  'Lecture', 'Nature', 'Art', 'Tech', 'Gastronomie',
]

interface ProfilData {
  id: string
  prenom: string
  email: string
  photoUrl: string | null
  age: number | null
  profession: string | null
  bio: string | null
  interets: string | null
}

export default function MonProfilPage() {
  const [profil, setProfil] = useState<ProfilData | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [age, setAge] = useState('')
  const [profession, setProfession] = useState('')
  const [bio, setBio] = useState('')
  const [selectedInterets, setSelectedInterets] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/profil')
      .then(r => {
        if (r.status === 401) { window.location.href = '/connexion'; return null }
        return r.json()
      })
      .then((data: ProfilData | null) => {
        if (!data) return
        setProfil(data)
        setPhotoUrl(data.photoUrl)
        setAge(data.age ? String(data.age) : '')
        setProfession(data.profession ?? '')
        setBio(data.bio ?? '')
        setSelectedInterets(data.interets ? data.interets.split(',').map(s => s.trim()).filter(Boolean) : [])
      })
      .catch(() => setError('Impossible de charger votre profil.'))
  }, [])

  function toggleInteret(interet: string) {
    setSelectedInterets(prev =>
      prev.includes(interet) ? prev.filter(i => i !== interet) : [...prev, interet]
    )
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/profil-photo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erreur d'upload."); return }
      setPhotoUrl(data.url)
    } catch {
      setError("Erreur lors de l'upload.")
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl,
          age: age ? parseInt(age) : null,
          profession: profession || null,
          bio: bio || null,
          interets: selectedInterets.length > 0 ? selectedInterets.join(',') : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur lors de la sauvegarde.'); return }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (!profil) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src="/logo-repation.png" alt="Repation" style={{ height: '32px', width: 'auto' }} />
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-700">Mon profil</span>
          </div>
          <Link href="/mon-compte" className="text-sm text-[#1D9E75] hover:underline font-medium">
            ← Mon compte
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-6">

        {/* Photo de profil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Photo de profil</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-[#1D9E75]/10 flex items-center justify-center cursor-pointer border-2 border-dashed border-[#1D9E75]/30 hover:border-[#1D9E75] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {photoUrl ? (
                <img src={photoUrl} alt="Photo profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#1D9E75]">
                  {profil.prenom[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-sm font-medium text-[#1D9E75] hover:underline disabled:opacity-50"
              >
                {uploading ? 'Upload en cours…' : photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG ou WebP — max 5 Mo</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Infos personnelles */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Informations</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Âge</label>
            <input
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={e => setAge(e.target.value)}
              placeholder="Ex : 32"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Profession</label>
            <input
              type="text"
              value={profession}
              onChange={e => setProfession(e.target.value)}
              placeholder="Ex : Designer, Ingénieur, Enseignant…"
              maxLength={60}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">Bio</label>
              <span className={`text-xs ${bio.length > 130 ? 'text-orange-500' : 'text-gray-400'}`}>
                {bio.length}/150
              </span>
            </div>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 150))}
              rows={3}
              placeholder="Quelques mots sur vous…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75] resize-none"
            />
          </div>
        </div>

        {/* Centres d'intérêt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-3">Centres d&apos;intérêt</h2>
          <div className="flex flex-wrap gap-2">
            {INTERETS_OPTIONS.map(interet => {
              const active = selectedInterets.includes(interet)
              return (
                <button
                  key={interet}
                  type="button"
                  onClick={() => toggleInteret(interet)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? 'bg-[#1D9E75] text-white border-[#1D9E75]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75] hover:text-[#1D9E75]'
                  }`}
                >
                  {interet}
                </button>
              )
            })}
          </div>
        </div>

        {/* Erreur / Succès */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-[#1D9E75] font-medium">
            ✓ Profil enregistré avec succès !
          </div>
        )}

        {/* Bouton sauvegarde */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow-sm"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
        </button>

      </main>
    </div>
  )
}
