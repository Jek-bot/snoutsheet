const HEIC_RE = /\.(heic|heif)$/i

/** True for HEIC/HEIF files — detected by MIME type or, on browsers that
 *  report an empty type for these, by file extension. */
export function isHeic(file) {
  return /image\/hei[cf]/i.test(file.type) || HEIC_RE.test(file.name)
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = src
  })
}

/**
 * Normalize any user-supplied image into a downscaled JPEG blob suitable for
 * upload. HEIC/HEIF (the iPhone default) is converted to JPEG first, since it
 * isn't accepted by storage and doesn't render in most browsers. Everything is
 * then re-encoded to a bounded-size JPEG via canvas.
 */
export async function prepareImageForUpload(file, { maxDim = 1200, quality = 0.85 } = {}) {
  let blob = file

  if (isHeic(file)) {
    const heic2any = (await import('heic2any')).default
    blob = await heic2any({ blob: file, toType: 'image/jpeg', quality })
    if (Array.isArray(blob)) blob = blob[0]
  }

  const url = URL.createObjectURL(blob)
  try {
    const img = await loadImage(url)
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)

    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('Image encoding failed'))),
        'image/jpeg',
        quality
      )
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}
