'use client'

import { useRef, useState } from 'react'

const INTERETS_OPTIONS = ['Cuisine', 'Sport', 'Voyage', 'Musique', 'Cinéma', 'Lecture', 'Nature', 'Art', 'Tech', 'Gastronomie']

interface Props {
  user: {
    prenom: string
    email: string
    phone: string | null
    photoUrl: string | null
    age: number | null
    profession: string | null
    bio: string | null
    interets: string | null
  }
}

export default function ProfilSection({ user }: Props) {
  const [open, setOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl)
  const [age, setAge] = useState(user.age ? String(user.age) : '')
  const [profession, setProfession] = useState(user.profession ?? '')
  const [bio, setBio] = useState(user.bio ?? '')
  const [selectedInterets, setSelectedInterets] = useState<string[]>(
    user.interets ? user.interets.split(',').map(s => s.trim()).filter(Boolean) : []
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function toggleInteret(i: string) {
    setSelectedInterets(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await fetch('/api/upload/profil-photo', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Erreur upload."); return }
      setPhotoUrl(data.url)
    } catch { setError("Erreur upload.") }
    finally { setUploading(false) }
  }

  async function handleSave() {
    setSaving(true); setError(''); setSuccess(false)
    try {
      const res = await fetch('/api/user/profil', {
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
      if (!res.ok) { setError(data.error ?? 'Erreur.'); return }
      setSuccess(true)
      setOpen(false)
      setTimeout(() => setSuccess(false), 3000)
    } catch { setError('Erreur réseau.') }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* En-tête profil */}
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full overflow-hidden bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] font-bold text-xl cursor-pointer shrink-0"
            onClick={() => open && fileRef.current?.click()}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={user.prenom} className="w-full h-full object-cover" />
            ) : (
              user.prenom[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900">{user.prenom}</h1>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
          </div>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="shrink-0 text-sm font-medium text-[#1D9E75] border border-[#1D9E75]/30 px-4 py-2 rounded-xl hover:bg-[#1D9E75]/5 transition-colors"
          >
            {open ? 'Fermer' : '✏️ Modifier mon profil'}
          </button>
        </div>

        {/* Tags profil existants (affichage) */}
        {!open && (user.profession || user.age || user.interets) && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            {user.age && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{user.age} ans</span>}
            {user.profession && <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{user.profession}</span>}
            {user.interets && user.interets.split(',').slice(0, 4).map(i => (
              <span key={i} className="text-xs bg-[#1D9E75]/10 text-[#1D9E75] px-2.5 py-1 rounded-full">{i.trim()}</span>
            ))}
          </div>
        )}
        {!open && user.bio && (
          <p className="mt-2 text-sm text-gray-500 italic">&ldquo;{user.bio}&rdquo;</p>
        )}

        {success && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-sm text-[#1D9E75] font-medium">
            ✓ Profil enregistré !
          </div>
        )}
      </div>

      {/* Formulaire dépliant */}
      {open && (
        <div className="border-t border-gray-100 p-6 space-y-5">
          {/* Photo */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Photo de profil</p>
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full overflow-hidden bg-[#1D9E75]/10 flex items-center justify-center cursor-pointer border-2 border-dashed border-[#1D9E75]/30 hover:border-[#1D9E75] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {photoUrl
                  ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="text-xl font-bold text-[#1D9E75]">{user.prenom[0].toUpperCase()}</span>
                }
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="text-sm text-[#1D9E75] hover:underline disabled:opacity-50">
                {uploading ? 'Upload…' : photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
            </div>
          </div>

          {/* Âge + Profession */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Âge</label>
              <input type="number" min={18} max={99} value={age} onChange={e => setAge(e.target.value)}
                placeholder="Ex : 32"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Profession</label>
              <input type="text" value={profession} onChange={e => setProfession(e.target.value)} maxLength={60}
                placeholder="Ex : Designer…"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75]" />
            </div>
          </div>

          {/* Bio */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">Bio</label>
              <span className={`text-xs ${bio.length > 130 ? 'text-orange-500' : 'text-gray-400'}`}>{bio.length}/150</span>
            </div>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, 150))} rows={2}
              placeholder="Quelques mots sur vous…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 focus:border-[#1D9E75]" />
          </div>

          {/* Centres d'intérêt */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Centres d&apos;intérêt</p>
            <div className="flex flex-wrap gap-2">
              {INTERETS_OPTIONS.map(i => {
                const active = selectedInterets.includes(i)
                return (
                  <button key={i} type="button" onClick={() => toggleInteret(i)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${active ? 'bg-[#1D9E75] text-white border-[#1D9E75]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1D9E75]'}`}>
                    {i}
                  </button>
                )
              })}
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button type="button" onClick={handleSave} disabled={saving || uploading}
            className="w-full bg-[#1D9E75] hover:bg-[#178560] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
            {saving ? 'Enregistrement…' : 'Enregistrer mon profil'}
          </button>
        </div>
      )}
    </div>
  )
}
