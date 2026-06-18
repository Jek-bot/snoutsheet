import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import AuthPage from '@/pages/AuthPage'
import Dashboard from '@/pages/Dashboard'
import Clients from '@/pages/Clients'
import Pets from '@/pages/Pets'
import Bookings from '@/pages/Bookings'
import Schedule from '@/pages/Schedule'
import Vaccines from '@/pages/Vaccines'
import Settings from '@/pages/Settings'
import GoogleCallback from '@/pages/GoogleCallback'
import ClientPortal from '@/pages/ClientPortal'
import Admin from '@/pages/Admin'

function PendingScreen() {
  const { signOut, user } = useAuth()
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-6">
      <div className="max-w-sm w-full card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <h2 className="text-lg font-bold text-navy mb-2">Account Pending Approval</h2>
        <p className="text-sm text-navy-300 mb-1">
          Your account (<span className="font-medium text-navy">{user?.email}</span>) has been created but is waiting for admin approval.
        </p>
        <p className="text-sm text-navy-300 mb-6">
          You'll be able to sign in once an admin approves your account.
        </p>
        <button onClick={signOut} className="btn-outline w-full">Sign Out</button>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading, isApproved } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (!isApproved) return <PendingScreen />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        <p className="text-sm text-navy-400 font-medium">Loading Snoutsheet…</p>
      </div>
    </div>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <AuthPage />}
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="pets" element={<Pets />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="vaccines" element={<Vaccines />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="/auth/google/callback" element={<GoogleCallback />} />
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
