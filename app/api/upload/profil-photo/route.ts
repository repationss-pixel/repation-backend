import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'profil-photos'
const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'Aucun fichier fourni.' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté (JPEG, PNG ou WebP).' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo).' }, { status: 400 })
    }

    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false })

    if (error) {
      console.error('[upload/profil-photo]', error)
      return NextResponse.json({ error: "Erreur lors de l'upload." }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[upload/profil-photo]', err)
    return NextResponse.json({ error: 'Erreur inattendue.' }, { status: 500 })
  }
}
