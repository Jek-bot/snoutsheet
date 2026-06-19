import { useRef, useState } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { isHeic, prepareImageForUpload } from '@/lib/image'
import { reportError } from '@/lib/sentry'

export default function PetPhotoUpload({ petId, currentUrl, onUploaded }) {
  const { user } = useAuth()
  const fileRef = useRef()
  const cameraRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl ?? null)
  const [error, setError] = useState('')

  async function handleFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/') && !isHeic(file)) {
      setError('Please select an image file.')
      return
    }
    // Generous original-size cap; the image is downscaled before upload.
    if (file.size > 25 * 1024 * 1024) {
      setError('Image must be under 25MB.')
      return
    }

    setError('')
    setUploading(true)

    // Convert HEIC and downscale/re-encode to a bounded JPEG before upload.
    let jpeg
    try {
      jpeg = await prepareImageForUpload(file)
    } catch (err) {
      reportError(err, { label: 'Image processing failed', fileName: file.name, fileType: file.type })
      setError('Could not process this image. Please try a different photo.')
      setUploading(false)
      return
    }

    // Show local preview from the processed image
    const localUrl = URL.createObjectURL(jpeg)
    setPreview(localUrl)

    const path = `${user.id}/${petId ?? 'new'}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('pet-photos')
      .upload(path, jpeg, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) {
      reportError(uploadError, { label: 'Pet photo upload failed', path })
      setError('Upload failed. Please try again.')
      setPreview(currentUrl ?? null)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('pet-photos').getPublicUrl(path)
    setUploading(false)
    onUploaded(data.publicUrl)
  }

  function removePhoto() {
    setPreview(null)
    onUploaded(null)
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative w-24 h-24">
          <img
            src={preview}
            alt="Pet"
            className="w-24 h-24 rounded-2xl object-cover border border-surface-border"
          />
          {uploading && (
            <div className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-teal animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
              aria-label="Remove photo"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Upload from library */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-surface-border bg-surface text-sm text-navy-400 hover:border-teal-300 hover:text-navy transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>

          {/* Take photo (mobile) */}
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-surface-border bg-surface text-sm text-navy-400 hover:border-teal-300 hover:text-navy transition-colors"
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
