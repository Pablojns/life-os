/**
 * Rotas públicas (login/register) e protegidas (dashboard/settings).
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import { WorldProvider } from './context/WorldContext'
import { NotificationProvider } from './hooks/useNotifications.jsx'
import { AppShell } from './components/UI'
import Notifications from './components/Notifications'
import ProtectedRoute, { AuthSpinner } from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Plans from './pages/Plans'
import Landing from './pages/Landing'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <AuthSpinner />
  if (user) return <Navigate to="/dashboard" replace />
  return <Landing />
}

function PublicOrApp({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthSpinner />
  if (user) return <AppShell>{children}</AppShell>
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <ThemeProvider>
          <WorldProvider>
          <NotificationProvider>
            <BrowserRouter
              basename={
                import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')
              }
            >
              <Notifications />
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AppShell>
                        <Settings />
                      </AppShell>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/plans"
                  element={
                    <PublicOrApp>
                      <Plans />
                    </PublicOrApp>
                  }
                />
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
          </WorldProvider>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  )
}
