/*
  App.jsx — COMPOSITION ROOT

  Este es el ÚNICO archivo del proyecto que tiene permiso para importar
  módulos directamente. Lo hace solo para forzar su auto-registro
  (cada import de "modules/x" ejecuta registerModule() dentro de su
  propio index.jsx). El core NUNCA importa esto; los módulos NUNCA se
  importan entre sí.

  Para instalar un módulo nuevo: agrega una línea de import aquí.
  Para desinstalarlo del build: quítala. Eso es todo lo que hay que
  tocar en este archivo — el resto de la navegación se arma solo
  a partir de core/moduleRegistry.js.
*/
import 'modules/ventas'
import 'modules/crm'
import 'modules/rrhh-inventario'
import 'modules/rrhh-inventario/rrhh.index'
import 'modules/chatbot'
import 'modules/plugin-manager'
import 'modules/compras'
import 'modules/finanzas'
// import 'modules/proyectos'  // Módulo desactivado
import 'modules/reportes'
import 'modules/integraciones'
import 'modules/ajustes'

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './core/auth/AuthContext'
import { ProtectedRoute } from './core/auth/ProtectedRoute'
import { Login } from './core/auth/pages/Login'
import { Register } from './core/auth/pages/Register'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPlan } from './pages/OnboardingPlan'
import { OnboardingEmpresa } from './pages/OnboardingEmpresa'
import { AppShell } from './core/layout/AppShell'
import { Dashboard } from './pages/Dashboard'
import { NotFound } from './pages/NotFound'
import { getEnabledModules } from './core/moduleRegistry'
import { PWAInstallBanner } from './core/components/PWAInstallBanner'

function RootNavigator() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

export default function App() {
  const modules = getEnabledModules()

  return (
    <AuthProvider>
      {/* Componente Global PWA (Píldora flotante, estado offline y modal de instalación) */}
      <PWAInstallBanner />

      <Routes>
        {/* Landing Page Pública de Captación y Conversión */}
        <Route path="/" element={<RootNavigator />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Flujo Obligatorio Post-Registro: Selección de Plan, Pago con Tarjeta y Configuración Inicial */}
        <Route path="/onboarding-plan" element={<OnboardingPlan />} />
        <Route path="/onboarding-empresa" element={<OnboardingEmpresa />} />

        {/* Panel ERP Administrativo Protegido */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/panel" element={<Dashboard />} />
          {modules.map((m) => (
            <Route key={m.id} path={m.path.replace('/', '')} element={m.element} />
          ))}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}
