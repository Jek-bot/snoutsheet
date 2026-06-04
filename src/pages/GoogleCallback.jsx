import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PawPrint } from 'lucide-react'

export default function GoogleCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Connecting to Google Calendar…')

  useEffect(() => {
    const error = searchParams.get('gcal_error')
    const success = searchParams.get('gcal_success')

    if (error) {
      setStatus('Connection failed. Redirecting…')
      setTimeout(() => navigate('/settings?gcal_error=' + error), 1500)
    } else if (success) {
      setStatus('Connected! Redirecting…')
      setTimeout(() => navigate('/settings?gcal_success=1'), 1000)
    } else {
      // Should not happen — redirect anyway
      setTimeout(() => navigate('/settings'), 1500)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        <p className="text-sm text-navy-400 font-medium">{status}</p>
      </div>
    </div>
  )
}
