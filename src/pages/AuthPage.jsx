import { useState } from 'react'
import { PawPrint, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m) {
    setMode(m)
    setError('')
    setSuccess('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      setLoading(true)
      const { error } = await signUp(email, password)
      setLoading(false)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Account created! Check your email to confirm your address, then sign in.')
        switchMode('signin')
      }
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-navy flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-navy" strokeWidth={2.5} />
          </div>
          <span className="text-white font-bold text-xl">Snoutsheet</span>
        </div>

        <div>
          <p className="text-3xl font-bold text-white leading-snug mb-4">
            Your pet sitting<br />business, organized.
          </p>
          <p className="text-white/60 text-sm leading-relaxed max-w-sm">
            Track clients, pets, bookings, vaccines, and your schedule — all in one warm, professional workspace built just for independent pet sitters.
          </p>
        </div>

        <div className="flex gap-6">
          {[
            { value: '∞', label: 'Clients' },
            { value: '∞', label: 'Pets' },
            { value: '∞', label: 'Bookings' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-teal text-2xl font-bold">{value}</p>
              <p className="text-white/50 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center">
              <PawPrint className="w-4 h-4 text-teal" strokeWidth={2.5} />
            </div>
            <span className="text-navy font-bold text-xl">Snoutsheet</span>
          </div>

          <div className="card p-8">
            {/* Mode tabs */}
            <div className="flex rounded-xl bg-surface border border-surface-border p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={cn(
                  'flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all',
                  mode === 'signin'
                    ? 'bg-white text-navy shadow-card'
                    : 'text-navy-300 hover:text-navy'
                )}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={cn(
                  'flex-1 py-1.5 text-sm font-semibold rounded-lg transition-all',
                  mode === 'signup'
                    ? 'bg-white text-navy shadow-card'
                    : 'text-navy-300 hover:text-navy'
                )}
              >
                Sign Up
              </button>
            </div>

            <h2 className="text-xl font-bold text-navy mb-1">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-navy-300 mb-6">
              {mode === 'signin'
                ? 'Sign in to your account'
                : 'Set up your pet sitting workspace'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="label" htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{success}</p>
              )}

              <button
                type="submit"
                className={cn('btn-primary w-full py-2.5', loading && 'opacity-70 pointer-events-none')}
              >
                {loading
                  ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                  : (mode === 'signup' ? 'Create Account' : 'Sign In')}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-navy-300 mt-4">
            Each account has its own private client and booking data.
          </p>
        </div>
      </div>
    </div>
  )
}
