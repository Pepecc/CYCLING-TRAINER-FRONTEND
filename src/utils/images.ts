import type { OutgoingImage } from '../types'

// The backend stores each image in a Firestore document (max 900 KB): shrink before sending.
export const MAX_IMAGES = 4
const MAX_BYTES = 900 * 1024
const MAX_SIDE = 2048            // enough to read a training table
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`No se puede leer la imagen ${file.name}`)) }
    img.src = url
  })
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se puede leer la imagen'))
    reader.readAsDataURL(blob)
  })
}

const base64Bytes = (b64: string) => Math.floor((b64.length * 3) / 4)

// Small images go as they are; the rest are re-encoded as JPEG, shrinking until they fit
export async function prepareImage(file: File): Promise<OutgoingImage> {
  if (!ACCEPTED.includes(file.type)) throw new Error(`${file.name}: formato no admitido (JPEG, PNG, WebP o GIF)`)

  if (file.size <= MAX_BYTES) {
    const img = await loadImage(file)
    if (Math.max(img.width, img.height) <= MAX_SIDE) {
      const dataUrl = await readAsDataUrl(file)
      return { mediaType: file.type, data: dataUrl.split(',')[1], name: file.name, previewUrl: dataUrl }
    }
  }

  const img = await loadImage(file)
  let side = Math.min(MAX_SIDE, Math.max(img.width, img.height))
  let quality = 0.85
  for (let attempt = 0; attempt < 8; attempt++) {
    const scale = side / Math.max(img.width, img.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'    // transparent PNG → white background in JPEG
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', quality)
    const data = dataUrl.split(',')[1]
    if (base64Bytes(data) <= MAX_BYTES) {
      return { mediaType: 'image/jpeg', data, name: file.name.replace(/\.\w+$/, '') + '.jpg', previewUrl: dataUrl }
    }
    if (quality > 0.6) quality -= 0.1
    else side = Math.round(side * 0.8)
  }
  throw new Error(`${file.name}: no se ha podido reducir lo suficiente`)
}
