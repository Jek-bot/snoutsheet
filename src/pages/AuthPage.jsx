import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  async function handleForgotPassword() {
    if (!email) { setError('Enter your email address above first.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setForgotSent(true)
  }

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
      if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return }
      setLoading(true)
      const { error } = await signUp(email, password)
      setLoading(false)
      if (error) { setError(error.message) }
      else { setSuccess('Account created! Check your email to confirm, then sign in.'); switchMode('signin') }
      return
    }

    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ───────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 bg-navy flex-col justify-between p-16">

        {/* Logo */}
        <div>
          <img src="/logo.png" alt="Snoutsheet" className="h-56 w-auto mix-blend-screen" />
        </div>

        {/* Headline */}
        <div className="space-y-6">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight mb-4">
              Your pet sitting<br />business,<br />organized.
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-sm">
              Track clients, pets, bookings, vaccines, and your schedule — all in one warm, professional workspace built for independent pet sitters.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-10 pt-2">
            {[
              { value: '∞', label: 'Clients' },
              { value: '∞', label: 'Pets' },
              { value: '∞', label: 'Bookings' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-teal text-4xl font-bold">{value}</p>
                <p className="text-white/50 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/30 text-sm">www.snoutsheet.com</p>
      </div>

      {/* ── Right panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-10">
            <img src="/logo.png" alt="Snoutsheet" className="h-32 w-auto" />
          </div>

          {/* Card */}
          <div className="card p-10">

            {/* Tabs */}
            <div className="flex rounded-xl bg-surface border border-surface-border p-1 mb-8">
              {['signin', 'signup'].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={cn(
                    'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                    mode === m ? 'bg-white text-navy shadow-card' : 'text-navy-300 hover:text-navy'
                  )}
                >
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <h2 className="text-2xl font-bold text-navy mb-1">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-base text-navy-300 mb-8">
              {mode === 'signin' ? 'Sign in to your account' : 'Set up your pet sitting workspace'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className="input py-3 text-base"
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
                    className="input py-3 text-base pr-12"
                    placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="label" htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type={showPw ? 'text' : 'password'}
                    className="input py-3 text-base"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              )}

              {mode === 'signin' && (
                <div className="flex justify-end -mt-2">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-navy-300 hover:text-teal transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {forgotSent && (
                <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">
                  Check your email — we sent a password reset link.
                </p>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}
              {success && (
                <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">{success}</p>
              )}

              <button
                type="submit"
                className={cn('btn-primary w-full py-3.5 text-base mt-2', loading && 'opacity-70 pointer-events-none')}
              >
                {loading
                  ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                  : (mode === 'signup' ? 'Create Account' : 'Sign In')}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-navy-300 mt-5">
            Each account has its own private client and booking data.
          </p>
          <p className="text-center text-sm text-navy-300 mt-3">
            <Link to="/privacy" className="hover:text-teal transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
