import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { canAccess } from '../rbac/permissions'

export function ProtectedRoute({ children, requiredRole = null }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !canAccess(user?.role, requiredRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
