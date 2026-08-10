/*
  CORE · apiClient
  Punto único de salida hacia el backend (API Gateway del ERP Core).
  Ningún módulo debe usar fetch()/axios directamente: todos pasan por aquí,
  para que el Tech Lead pueda centralizar auth headers, rate limiting del
  lado cliente, manejo de errores y logging.
*/

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

function getToken() {
  return localStorage.getItem('erp_token')
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken()

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.message || `Error ${res.status} en ${path}`)
  }

  return res.json().catch(() => null)
}

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
