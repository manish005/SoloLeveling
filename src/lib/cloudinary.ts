const CLOUD_NAME = 'dsxfqjw1s'
const API_KEY = '427986956158514'
const API_SECRET = 'jHC8IJrJn9T_tLIOvFGbduXDUyA'

export interface CloudinaryResult {
  url: string
  secure_url: string
  public_id: string
}

const generateSignature = (publicId: string, timestamp: number): Promise<string> => {
  const str = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`
  return crypto.subtle.digest('SHA-1', new TextEncoder().encode(str))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
}

export const uploadToCloudinary = async (file: File): Promise<CloudinaryResult> => {
  const timestamp = Math.round(Date.now() / 1000)
  const publicId = `sl_${timestamp}_${Math.random().toString(36).slice(2, 8)}`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('public_id', publicId)
  formData.append('api_key', API_KEY)
  formData.append('timestamp', String(timestamp))

  const signature = await generateSignature(publicId, timestamp)
  formData.append('signature', signature)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.error?.message ?? 'Cloudinary upload failed')
  }

  return res.json()
}
