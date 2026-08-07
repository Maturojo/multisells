import { getDb } from '../lib/mongodb.js'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo no permitido' })

  try {
    const { credential } = req.body || {}
    if (!credential) return res.status(400).json({ error: 'Falta la credencial de Google.' })

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID no configurado.' })

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`)
    const profile = await googleRes.json()

    if (!googleRes.ok) return res.status(401).json({ error: 'No se pudo validar la cuenta de Google.' })
    if (profile.aud !== clientId) return res.status(401).json({ error: 'Client ID de Google invalido.' })
    if (profile.email_verified !== 'true' && profile.email_verified !== true) {
      return res.status(401).json({ error: 'El email de Google no esta verificado.' })
    }

    const db = await getDb()
    const col = db.collection('users')
    const now = new Date().toISOString()
    const existing = await col.findOne({ email: profile.email })

    if (existing) {
      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            nombre: existing.nombre || profile.name || profile.email,
            googleId: profile.sub,
            avatar: profile.picture || existing.avatar || '',
            provider: existing.provider || 'google',
            updatedAt: now,
          },
        }
      )
      const updated = await col.findOne({ _id: existing._id })
      const { password: _, _id, ...safeUser } = updated
      return res.status(200).json({ ok: true, user: { ...safeUser, id: _id.toString() } })
    }

    const newUser = {
      nombre: profile.name || profile.email,
      email: profile.email,
      password: '',
      googleId: profile.sub,
      avatar: profile.picture || '',
      provider: 'google',
      createdAt: now,
      updatedAt: now,
    }
    const result = await col.insertOne(newUser)
    const { password: _, ...safeUser } = newUser
    return res.status(201).json({ ok: true, user: { ...safeUser, id: result.insertedId.toString() } })
  } catch (err) {
    console.error('[auth-google]', err)
    return res.status(500).json({ error: err.message })
  }
}
