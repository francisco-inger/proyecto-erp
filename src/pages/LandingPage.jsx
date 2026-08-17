import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePWA } from '../core/hooks/usePWA'
import { PWAInstallBanner } from '../core/components/PWAInstallBanner'
import './LandingPage.css'

export function LandingPage() {
  const { isInstallable, isInstalled, promptInstall } = usePWA()
  const [showPWAModal, setShowPWAModal] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState('monthly') // 'monthly' | 'annual'
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const faqs = [
    {
      q: '¿Mis datos están seguros y separados de otras clínicas?',
      a: 'Sí, absolutamente. Nuestra plataforma utiliza una arquitectura Multi-Tenant con aislamiento estricto de bases de datos. La información de tus pacientes, doctores y facturas solo es accesible por los usuarios a quienes tú les otorgues credenciales explícitas.'
    },
    {
      q: '¿Cómo se configuran los NCF de mi país en el módulo de facturación?',
      a: 'El sistema incluye un panel de configuración fiscal donde ingresas el rango inicial, rango final y fecha de vigencia autorizada por la DGII (para B01, B02, etc.). A partir de ahí, el software asigna la secuencia exacta de forma automática en cada cobro y te avisa cuando te queden menos de 50 comprobantes disponibles.'
    },
    {
      q: '¿Puedo limitar lo que ven mis recepcionistas o enfermeras?',
      a: 'Sí. El módulo de control de accesos (RBAC) te permite definir con un solo clic qué puede ver cada perfil: por ejemplo, una recepcionista solo podrá gestionar citas y admisiones sin ver los diagnósticos clínicos ni los ingresos financieros generales.'
    },
    {
      q: '¿Tiene algún costo el soporte o la capacitación del personal?',
      a: 'No tiene costo adicional. Todos nuestros planes incluyen sesiones de capacitación guiada para tu equipo de recepción, médicos y administradores, además de soporte técnico continuo vía WhatsApp y tickets de respuesta rápida.'
    }
  ]

  return (
    <div className="landing-wrapper">
      {/* ── HEADER / NAVBAR ── */}
      <header className="landing-navbar">
        <div className="landing-nav-container">
          <Link to="/" className="landing-brand">
            <img src="/branding/logo_appex.jpg" alt="APPEX Logo" className="landing-logo-img" />
            <div className="landing-brand-text">
              APPEX<span>.ERP</span>
            </div>
          </Link>

          <nav className="landing-nav-links">
            <a href="#modulos">Módulos ERP</a>
            <a href="#precios">Planes & Precios</a>
            <a href="#seguridad">Seguridad Multi-Tenant</a>
            <a href="#faq">Preguntas Frecuentes</a>
          </nav>

          <div className="landing-nav-actions">
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) promptInstall()
                  else setShowPWAModal(true)
                }}
                className="landing-btn-login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderColor: '#93C5FD', color: '#1D4ED8' }}
              >
                <span>📲</span> Instalar App
              </button>
            )}
            <Link to="/login" className="landing-btn-login" style={{ fontWeight: 700 }}>
              🔑 Ingresar al Sistema
            </Link>
            <Link to="/register" className="landing-btn-cta">
              🚀 Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. HERO SECTION ── */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          <div className="landing-hero-badge">
            <span>✦</span> SUITE EMPRESARIAL ERP MULTI-MODULAR PARA EMPRESAS Y NEGOCIOS
          </div>

          <h1 className="landing-hero-title">
            Control total de tu negocio: Ventas, Facturación Fiscal DGII, Compras, Inventario y Finanzas en Tiempo Real.
          </h1>

          <p className="landing-hero-subtitle">
            Centraliza en una sola plataforma en la nube la gestión comercial, control multialmacén, comprobantes fiscales automatizados y tesorería con arquitectura segura multi-tenant.
          </p>

          <div className="landing-hero-ctas">
            <Link to="/register" className="landing-btn-primary-lg">
              🚀 Iniciar Prueba Gratuita de 14 Días
            </Link>
            <Link to="/login" className="landing-btn-outline-lg">
              📅 Iniciar Sesión / Demo
            </Link>
            {!isInstalled && (
              <button
                onClick={() => {
                  if (isInstallable) promptInstall()
                  else setShowPWAModal(true)
                }}
                className="landing-btn-outline-lg"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <span>📲</span> Descargar App (PWA)
              </button>
            )}
          </div>

          <div className="landing-trust-pills">
            <span>🛡️ Sin tarjeta de crédito requerida</span>
            <span>⚡ Instalación y uso en 5 minutos</span>
            <span>🔒 Cumplimiento estricto de salud y privacidad</span>
            <span>⭐️⭐️⭐️⭐️⭐️ 4.9/5 por más de 120 clínicas</span>
          </div>

          {/* Mockup Interactivo de la Agenda / Sistema */}
          <div className="landing-hero-mockup">
            <div className="landing-mockup-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 10 }}>appex.med / agenda-multi-consultorio</span>
            </div>

            <div className="landing-mockup-inner">
              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <strong style={{ fontSize: 14, color: '#0F172A' }}>📅 Agenda Médica Multi-Especialidad</strong>
                  <span style={{ fontSize: 11, background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    ● 14 Pacientes Hoy
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ padding: '8px 12px', background: '#EFF6FF', borderRadius: '8px', borderLeft: '4px solid #2563EB', fontSize: 12 }}>
                    <strong>09:00 AM · Dr. Castillo (Cardiología)</strong> — Paciente: Juan Valdez <span style={{ color: '#2563EB', fontWeight: 700 }}>(En Consulta)</span>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#FEF3C7', borderRadius: '8px', borderLeft: '4px solid #D97706', fontSize: 12 }}>
                    <strong>09:30 AM · Dra. Méndez (Pediatría)</strong> — Paciente: Sofía Gómez <span style={{ color: '#D97706', fontWeight: 700 }}>(En Sala de Espera)</span>
                  </div>
                  <div style={{ padding: '8px 12px', background: '#F1F5F9', borderRadius: '8px', borderLeft: '4px solid #64748B', fontSize: 12 }}>
                    <strong>10:00 AM · Dr. Ramírez (Traumatología)</strong> — Paciente: Carlos Peña <span style={{ color: '#64748B' }}>(Confirmado WhatsApp)</span>
                  </div>
                </div>
              </div>

              <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>🧾 Facturación & NCF en Vivo</strong>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#2563EB' }}>RD$ 48,500.00</div>
                <small style={{ color: '#64748B', fontSize: 11 }}>Comprobantes emitidos hoy:</small>
                <div style={{ fontSize: 11, color: '#059669', background: '#F0FDF4', padding: '6px', borderRadius: '6px', fontWeight: 600 }}>
                  ✓ B01 Crédito Fiscal: 8 facturas<br />
                  ✓ B02 Consumo Final: 15 facturas
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SECCIÓN DE DOLOR Y EMPATÍA ── */}
      <section className="landing-pain-section">
        <div className="landing-section-header">
          <span className="landing-section-tag">EL COSTO DEL DESORDEN ADMINISTRATIVO</span>
          <h2 className="landing-section-title">
            ¿Tu centro médico está perdiendo dinero y pacientes por culpa de herramientas obsoletas?
          </h2>
          <p className="landing-section-subtitle">
            El 73% de las clínicas pierden hasta 4 horas al día coordinando citas en papel, mensajes de WhatsApp dispersos y facturación manual desfasada.
          </p>
        </div>

        <div className="landing-pain-grid">
          <div className="landing-pain-card">
            <div className="landing-pain-icon">🚨</div>
            <h3 className="landing-pain-title">Cancelaciones y Ausentismo</h3>
            <p className="landing-pain-desc">
              Citas cruzadas y falta de recordatorios generan huecos improductivos en los horarios de tus médicos especialistas y quejas por largas esperas.
            </p>
          </div>

          <div className="landing-pain-card">
            <div className="landing-pain-icon">📁</div>
            <h3 className="landing-pain-title">Expedientes Físicos Extraviados</h3>
            <p className="landing-pain-desc">
              Buscar historiales de papel consume tiempo valioso, aumenta el riesgo de extravío de estudios clínicos y expone tu clínica a sanciones de privacidad.
            </p>
          </div>

          <div className="landing-pain-card">
            <div className="landing-pain-icon">🏢</div>
            <h3 className="landing-pain-title">Choque de Consultorios</h3>
            <p className="landing-pain-desc">
              Asignar el mismo consultorio a dos médicos o descoordinar turnos de triaje y enfermería causa fricciones internas y proyecta mala imagen.
            </p>
          </div>

          <div className="landing-pain-card">
            <div className="landing-pain-icon">⚖️</div>
            <h3 className="landing-pain-title">Multas por NCF Mal Emitidos</h3>
            <p className="landing-pain-desc">
              Manejar talonarios manuales sin control estricto de secuencias de comprobantes DGII provoca descuadres de caja y contingencias tributarias.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. SECCIÓN DE MÓDULOS DEL SISTEMA ── */}
      <section id="modulos" className="landing-modules-section">
        <div className="landing-section-header">
          <span className="landing-section-tag blue">ECOSISTEMA INTEGRAL EN LA NUBE</span>
          <h2 className="landing-section-title">
            Todo lo que tu equipo necesita para operar con precisión quirúrgica.
          </h2>
          <p className="landing-section-subtitle">
            Módulos especializados interconectados en tiempo real para optimizar cada proceso médico y financiero.
          </p>
        </div>

        <div className="landing-modules-grid">
          {/* Módulo 1 */}
          <div className="landing-module-card">
            <div className="landing-module-header">
              <div className="landing-module-icon">📅</div>
              <h3 className="landing-module-name">Agenda Inteligente & Multi-Consultorio</h3>
            </div>
            <p className="landing-module-desc">
              Gestión centralizada de citas por médico y especialidad con vistas diaria, semanal y mensual, evitando cruces de horarios.
            </p>
            <ul className="landing-module-features">
              <li><span>✓</span> Estados en vivo: En Espera, En Triaje, En Consulta y Completado.</li>
              <li><span>✓</span> Bloqueos automáticos de pausas de almuerzo, vacaciones y procedimientos.</li>
              <li><span>✓</span> Asignación inteligente de consultorios físicos disponibles.</li>
            </ul>
          </div>

          {/* Módulo 2 */}
          <div className="landing-module-card">
            <div className="landing-module-header">
              <div className="landing-module-icon">📋</div>
              <h3 className="landing-module-name">Expediente Clínico Digital Centralizado</h3>
            </div>
            <p className="landing-module-desc">
              Historial médico confidencial del paciente accesible en segundos desde cualquier dispositivo seguro.
            </p>
            <ul className="landing-module-features">
              <li><span>✓</span> Ficha clínica con antecedentes, alergias, signos vitales y evolución.</li>
              <li><span>✓</span> Carga instantánea de fotos de perfil, estudios de laboratorio y radiografías.</li>
              <li><span>✓</span> Emisión e impresión de recetas médicas institucionales con firma digital.</li>
            </ul>
          </div>

          {/* Módulo 3 */}
          <div className="landing-module-card">
            <div className="landing-module-header">
              <div className="landing-module-icon">🧾</div>
              <h3 className="landing-module-name">Facturación Avanzada & Control Fiscal (NCF)</h3>
            </div>
            <p className="landing-module-desc">
              Cobros rápidos, control estricto de cajas por turno y asignación precisa de comprobantes fiscales autorizados.
            </p>
            <ul className="landing-module-features">
              <li><span>✓</span> Emisión automática de NCF: B01 Crédito Fiscal, B02 Consumo y e-CF.</li>
              <li><span>✓</span> Pagos combinados: Efectivo, Tarjetas, Transferencias y Seguros Médicos.</li>
              <li><span>✓</span> Arqueo ciego de caja por turno y reporte de cuadre diario.</li>
            </ul>
          </div>

          {/* Módulo 4 */}
          <div className="landing-module-card">
            <div className="landing-module-header">
              <div className="landing-module-icon">🔐</div>
              <h3 className="landing-module-name">Gestión de Usuarios & Permisos Multi-Rol</h3>
            </div>
            <p className="landing-module-desc">
              Seguridad basada en roles (RBAC) para que cada colaborador visualice únicamente lo que le compete.
            </p>
            <ul className="landing-module-features">
              <li><span>✓</span> Perfiles para Administradores, Médicos Especialistas y Triaje.</li>
              <li><span>✓</span> Recepción y Facturación blindada sin acceso a diagnósticos confidenciales.</li>
              <li><span>✓</span> Registro y auditoría de accesos con trazabilidad completa.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 4. TABLA DE PRECIOS Y PLANES ── */}
      <section id="precios" className="landing-pricing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag green">PLANES TRANSPARENTES Y ESCALABLES</span>
          <h2 className="landing-section-title">
            Invierte en el crecimiento ordenado de tu centro de salud.
          </h2>
          <p className="landing-section-subtitle">
            Elige el plan ideal según el tamaño de tu equipo. Sin contratos forzosos ni costos ocultos.
          </p>

          <div className="landing-billing-toggle" style={{ marginTop: 24 }}>
            <button
              className={`landing-toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Facturación Mensual
            </button>
            <button
              className={`landing-toggle-btn ${billingPeriod === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('annual')}
            >
              Facturación Anual <span className="landing-save-pill">15% OFF</span>
            </button>
          </div>
        </div>

        <div className="landing-pricing-grid">
          {/* Plan 1 */}
          <div className="landing-price-card">
            <div>
              <h3 className="landing-plan-name">Plan Emprendedor</h3>
              <p className="landing-plan-target">Para médicos independientes o consultorios privados individuales.</p>
              <div className="landing-plan-price">
                ${billingPeriod === 'annual' ? '39' : '49'} <span>USD / mes</span>
              </div>
              <div className="landing-plan-subtext">
                {billingPeriod === 'annual' ? 'Facturado anualmente ($468/año)' : 'Facturación mensual flexible'}
              </div>
              <ul className="landing-plan-features">
                <li><span>✓</span> Hasta 2 Médicos Especialistas</li>
                <li><span>✓</span> 1 Consultorio Físico</li>
                <li><span>✓</span> Hasta 1,500 Pacientes</li>
                <li><span>✓</span> Agenda Médica Digital</li>
                <li><span>✓</span> Facturación básica y NCF</li>
                <li><span>✓</span> Soporte estándar por Email</li>
              </ul>
            </div>
            <Link to="/register" className="landing-plan-btn outline">
              Elegir Plan Emprendedor
            </Link>
          </div>

          {/* Plan 2: Destacado */}
          <div className="landing-price-card popular">
            <div className="landing-popular-badge">MÁS POPULAR</div>
            <div>
              <h3 className="landing-plan-name">Plan Clínica</h3>
              <p className="landing-plan-target">Para policlínicas y centros médicos medianos con múltiples consultorios.</p>
              <div className="landing-plan-price">
                ${billingPeriod === 'annual' ? '99' : '129'} <span>USD / mes</span>
              </div>
              <div className="landing-plan-subtext">
                {billingPeriod === 'annual' ? 'Facturado anualmente ($1,188/año)' : 'Facturación mensual flexible'}
              </div>
              <ul className="landing-plan-features">
                <li><span>✓</span> Hasta 10 Médicos Especialistas</li>
                <li><span>✓</span> Hasta 5 Consultorios Físicos</li>
                <li><span>✓</span> Expedientes de Pacientes Ilimitados</li>
                <li><span>✓</span> Agenda Multi-Consultorio con Estados</li>
                <li><span>✓</span> NCF Completo + Control de Cajas</li>
                <li><span>✓</span> Todos los Roles (Médico, Triaje, Caja)</li>
                <li><span>✓</span> Soporte Prioritario WhatsApp</li>
              </ul>
            </div>
            <Link to="/register" className="landing-plan-btn primary">
              Comenzar Prueba Gratis
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="landing-price-card">
            <div>
              <h3 className="landing-plan-name">Plan Enterprise Suite</h3>
              <p className="landing-plan-target">Para redes hospitalarias, franquicias o centros de alta complejidad.</p>
              <div className="landing-plan-price">
                ${billingPeriod === 'annual' ? '249' : '299'} <span>USD / mes</span>
              </div>
              <div className="landing-plan-subtext">
                {billingPeriod === 'annual' ? 'Facturado anualmente ($2,988/año)' : 'Facturación mensual flexible'}
              </div>
              <ul className="landing-plan-features">
                <li><span>✓</span> Médicos y Especialistas Ilimitados</li>
                <li><span>✓</span> Sucursales y Consultorios Ilimitados</li>
                <li><span>✓</span> Almacenamiento Clínico Ilimitado</li>
                <li><span>✓</span> Multi-Empresa + Multi-Caja simultánea</li>
                <li><span>✓</span> Roles personalizados y Auditoría forense</li>
                <li><span>✓</span> Account Manager dedicado 24/7 + SLA 99.9%</li>
              </ul>
            </div>
            <Link to="/register" className="landing-plan-btn outline">
              Contactar Ventas Enterprise
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. SECCIÓN DE SEGURIDAD Y CONFIANZA SAAS ── */}
      <section id="seguridad" className="landing-security-section">
        <div className="landing-section-header">
          <span className="landing-section-tag green">PRIVACIDAD DE GRADO BANCARIO</span>
          <h2 className="landing-section-title">
            La información de tu clínica y tus pacientes está blindada bajo llave.
          </h2>
          <p className="landing-section-subtitle">
            Arquitectura Multi-Tenant de última generación diseñada para cumplir con las normativas sanitarias más exigentes.
          </p>
        </div>

        <div className="landing-security-grid">
          <div className="landing-security-card">
            <div className="landing-security-icon">🏢</div>
            <h3 className="landing-security-title">Aislamiento Total Multi-Tenant</h3>
            <p className="landing-security-desc">
              Cada clínica opera en un entorno lógico independiente y cifrado. Ningún otro centro médico ni usuario ajeno puede visualizar jamás tu base de datos de pacientes, tarifas ni balances.
            </p>
          </div>

          <div className="landing-security-card">
            <div className="landing-security-icon">☁️</div>
            <h3 className="landing-security-title">Copias de Seguridad Automáticas</h3>
            <p className="landing-security-desc">
              Tus datos se respaldan de forma continua cada hora en la nube con redundancia geográfica. Si tu equipo falla, tu clínica sigue operativa desde cualquier tablet o celular.
            </p>
          </div>

          <div className="landing-security-card">
            <div className="landing-security-icon">🛡️</div>
            <h3 className="landing-security-title">Cifrado de Extremo a Extremo</h3>
            <p className="landing-security-desc">
              Toda la transmisión de expedientes y comprobantes viaja encriptada bajo estándares AES-256 y certificados SSL/TLS, garantizando confidencialidad médica absoluta.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. SECCIÓN DE PREGUNTAS FRECUENTES (FAQ) ── */}
      <section id="faq" className="landing-faq-section">
        <div className="landing-section-header">
          <span className="landing-section-tag blue">RESOLVEMOS TUS DUDAS</span>
          <h2 className="landing-section-title">Preguntas Frecuentes</h2>
          <p className="landing-section-subtitle">
            Todo lo que necesitas saber antes de modernizar la gestión de tu centro médico.
          </p>
        </div>

        <div className="landing-faq-container">
          {faqs.map((f, idx) => (
            <div key={idx} className={`landing-faq-item ${openFaq === idx ? 'open' : ''}`}>
              <button className="landing-faq-question" onClick={() => toggleFaq(idx)}>
                <span>{f.q}</span>
                <span className="landing-faq-icon">▾</span>
              </button>
              {openFaq === idx && (
                <div className="landing-faq-answer">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. BANNER FINAL DE CONVERSIÓN ── */}
      <section className="landing-cta-banner">
        <div className="landing-cta-container">
          <h2 className="landing-cta-title">Transforma la administración de tu centro médico a partir de hoy.</h2>
          <p className="landing-cta-sub">
            Únete a los especialistas que ya ahorran más de 15 horas semanales y operan sin fricciones.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register" className="landing-btn-primary-lg">
              🚀 Probar Gratis por 14 Días Sin Compromiso
            </Link>
            <Link to="/login" className="landing-btn-outline-lg">
              🔒 Iniciar Sesión con mi Cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div style={{ marginBottom: 8, fontWeight: 700, color: '#94A3B8' }}>
          APPEX.MED Suite ERP · Sistema Médico Multi-Clínica
        </div>
        <div>
          © 2026 APPEX Technologies SRL. Todos los derechos reservados. Cumplimiento de Privacidad y Normativa Fiscal DGII.
        </div>
      </footer>

      {showPWAModal && (
        <PWAInstallBanner showModalOverride={true} onCloseModalOverride={() => setShowPWAModal(false)} />
      )}
    </div>
  )
}
