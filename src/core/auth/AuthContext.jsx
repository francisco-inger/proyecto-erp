import { createContext, useContext, useState, useCallback } from 'react'
import { login as loginService, register as registerService, logout as logoutService, getStoredUser } from './auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())

  const login = useCallback(async (credentials) => {
    const loggedUser = await loginService(credentials)
    setUser(loggedUser)
    return loggedUser
  }, [])

  const register = useCallback(async (data) => {
    const newUser = await registerService(data)
    setUser(newUser)
    return newUser
  }, [])

  const logout = useCallback(() => {
    logoutService()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
