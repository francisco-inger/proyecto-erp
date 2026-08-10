/*
  CORE · auth.service
  Capa de autenticación. Hoy usa un mock en localStorage para poder
  navegar la app sin backend; cuando el backend (Eliannys/Diego) exponga
  POST /api/auth/login y /api/auth/register, solo se reemplaza el cuerpo
  de estas dos funciones — el resto de la app no debe cambiar.
*/
import { apiClient } from '../api/apiClient'

const USE_MOCK = true // cambiar a false cuando el backend esté disponible

export async function login({ email, password }) {
  if (USE_MOCK) {
    if (!email || !password) throw new Error('Email y contraseña son requeridos')
    const user = { id: 'u_1', name: email.split('@')[0], email, role: 'admin' }
    localStorage.setItem('erp_token', 'mock-token')
    localStorage.setItem('erp_user', JSON.stringify(user))
    return user
  }
  const { user, token } = await apiClient.post('/auth/login', { email, password })
  localStorage.setItem('erp_token', token)
  localStorage.setItem('erp_user', JSON.stringify(user))
  return user
}

export async function register({ name, email, password, company }) {
  if (USE_MOCK) {
    if (!name || !email || !password) throw new Error('Completa todos los campos')
    const user = { id: 'u_new', name, email, role: 'admin', company }
    localStorage.setItem('erp_token', 'mock-token')
    localStorage.setItem('erp_user', JSON.stringify(user))
    return user
  }
  const { user, token } = await apiClient.post('/auth/register', { name, email, password, company })
  localStorage.setItem('erp_token', token)
  localStorage.setItem('erp_user', JSON.stringify(user))
  return user
}

export function logout() {
  localStorage.removeItem('erp_token')
  localStorage.removeItem('erp_user')
}

export function getStoredUser() {
  const raw = localStorage.getItem('erp_user')
  return raw ? JSON.parse(raw) : null
}
