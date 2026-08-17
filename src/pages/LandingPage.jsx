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
  
  // Estado para el formulario de contacto interactivo
  const [contactForm, setContactForm] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    mensaje: '',
    servicioInteres: 'ERP Completo Suite',
  })
  const [contactSent, setContactSent] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx)
  }

  const handleContactSubmit = (e) => {
    e.preventDefault()
    if (!contactForm.nombre || !contactForm.email) return
    setContactLoading(true)
    setTimeout(() => {
      setContactLoading(false)
      setContactSent(true)
      setContactForm({
        nombre: '',
        empresa: '',
        email: '',
        telefono: '',
        mensaje: '',
        servicioInteres: 'ERP Completo Suite',
      })
    }, 900)
  }

  const faqs = [
    {
      q: '¿Qué es APPEX Enterprise ERP y a qué sectores está dirigido?',
      a: 'APPEX ERP es una suite de gestión integral en la nube diseñada para empresas comerciales, farmacéuticas, manufactureras, empresas de servicios y tecnología. Centraliza ventas, compras, inventario multialmacén, facturación fiscal DGII y tesorería en tiempo real.'
    },
    {
      q: '¿Mis datos empresariales están aislados y seguros frente a terceros?',
      a: 'Sí, absolutamente. Nuestra plataforma opera bajo una arquitectura Multi-Tenant estricta con bases de datos segregadas y cifrado AES-256. Ninguna otra empresa u organización puede acceder a tus registros contables o comerciales.'
    },
    {
      q: '¿El sistema está adaptado a las normativas de comprobantes fiscales DGII (e-CF)?',
      a: 'Sí. El módulo de facturación gestiona automáticamente secuencias autorizadas de comprobantes B01 (Crédito Fiscal), B02 (Consumo Final), B14, B15 y factura electrónica (e-CF), con control de secuencias y alertas de disponibilidad.'
    },
    {
      q: '¿Puedo sincronizar las ventas con el inventario y las cuentas contables de inmediato?',
      a: 'Totalmente. Cada venta o compra emitida actualiza en milisegundos las existencias en almacén (Kardex), el libro contable de ingresos/egresos y los gráficos del dashboard ejecutivo de manera 100% reactiva.'
    },
    {
      q: '¿Qué incluye la implementación y el soporte técnico?',
      a: 'Todos los planes cuentan con acompañamiento de migración de datos, configuración de catálogos y capacitación continua para tu equipo, además de soporte prioritario vía WhatsApp Business y asistencia técnica 24/7.'
    }
  ]

  const services = [
    {
      id: 'ventas',
      title: 'Ventas & Facturación Fiscal (DGII)',
      tag: 'Comercial',
      img: '/branding/banner_sales_panoramic.jpg',
      desc: 'Emisión ágil de cotizaciones, pedidos y facturas con comprobantes fiscales B01, B02 y e-CF. Cobros multi-moneda y comisiones por vendedor.',
      bullets: ['Comprobantes Fiscales autorizados DGII', 'Descuento automático de existencias', 'Control de cuentas por cobrar y crédito'],
    },
    {
      id: 'inventario',
      title: 'Inventario Multialmacén & Kardex',
      tag: 'Logística',
      img: '/branding/banner_inventario_panoramic.jpg',
      desc: 'Control estricto de existencias, valoraciones FIFO/Promedio Ponderado, transferencias entre sucursales y alertas de punto de reorden.',
      bullets: ['Trazabilidad total por SKU y lotes', 'Auditoría y conteos cíclicos de stock', 'Valoración contable de activos en tiempo real'],
    },
    {
      id: 'finanzas',
      title: 'Finanzas, Tesorería & Bancos',
      tag: 'Contabilidad',
      img: '/branding/banner_finanzas_panoramic.jpg',
      desc: 'Flujo de caja proyectado, conciliación bancaria inteligente, libro mayor, centros de costo y estados financieros ejecutivos.',
      bullets: ['Conciliaciones bancarias automatizadas', 'Presupuestos por departamento', 'Reportes de balance y margen neto'],
    },
    {
      id: 'compras',
      title: 'Compras & Gestión de Proveedores',
      tag: 'Abastecimiento',
      img: '/branding/banner_compras_panoramic.jpg',
      desc: 'Órdenes de compra sistematizadas, control de recepción de mercancías en almacén y registro automático de cuentas por pagar.',
      bullets: ['Evaluación de proveedores y condiciones de pago', 'Recepción cotejada contra órdenes de compra', 'Flujo de aprobación multi-nivel'],
    },
    {
      id: 'crm',
      title: 'CRM Comercial & Oportunidades',
      tag: 'Crecimiento',
      img: '/branding/banner_crm_panoramic.jpg',
      desc: 'Pipeline comercial dinámico, seguimiento de leads, historial de interacciones y proyección de cierre de negocios.',
      bullets: ['Pipeline visual de oportunidades', 'Historial 360° del cliente', 'Recordatorios y tareas automáticas'],
    },
    {
      id: 'rrhh',
      title: 'Recursos Humanos & Nómina',
      tag: 'Talento',
      img: '/branding/banner_rrhh_panoramic.jpg',
      desc: 'Gestión de expedientes de colaboradores, cálculo de nómina, control de asistencia, solicitud de vacaciones y evaluaciones de desempeño.',
      bullets: ['Cálculo de deducciones y bonificaciones', 'Registro de asistencia y permisos', 'Expediente digital del empleado'],
    },
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
            <a href="#quienes-somos">Quiénes Somos</a>
            <a href="#servicios">Servicios</a>
            <a href="#modulos">Módulos ERP</a>
            <a href="#precios">Planes & Precios</a>
            <a href="#contacto">Contacto</a>
            <a href="#faq">Preguntas</a>
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
            <Link to="/login" className="landing-btn-login" style={{ fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8' }}>
              🔑 Ingresar al Sistema
            </Link>
            <Link to="/register" className="landing-btn-cta">
              🚀 Probar Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* ── 1. HERO SECTION DINÁMICO & MODERNO ── */}
      <section className="landing-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="landing-hero-container">
          <div className="landing-hero-badge">
            <span>✦</span> SUITE EMPRESARIAL ERP MULTI-MODULAR PARA EMPRESAS Y NEGOCIOS
          </div>

          <h1 className="landing-hero-title">
            Control total de tu empresa: Ventas, Facturación DGII, Compras, Inventario y Finanzas en Tiempo Real.
          </h1>

          <p className="landing-hero-subtitle">
            Centraliza en una sola plataforma segura en la nube la gestión comercial, control multialmacén, comprobantes fiscales automatizados y tesorería con arquitectura reactiva de última generación.
          </p>

          <div className="landing-hero-ctas">
            <Link to="/register" className="landing-btn-primary-lg">
              🚀 Iniciar Prueba Gratuita de 14 Días
            </Link>
            <Link to="/login" className="landing-btn-outline-lg">
              🔑 Ingresar al Sistema / Demo
            </Link>
            <a href="#contacto" className="landing-btn-outline-lg" style={{ background: 'rgba(255,255,255,0.08)' }}>
              💬 Contactar a un Asesor
            </a>
          </div>

          <div className="landing-trust-pills">
            <span>🛡️ Sin tarjeta de crédito para iniciar</span>
            <span>⚡ Configuración e implementación ágil</span>
            <span>🔒 Cumplimiento fiscal DGII y cifrado bancario</span>
            <span>⭐️⭐️⭐️⭐️⭐️ 4.9/5 por líderes empresariales</span>
          </div>

          {/* Mockup Interactivo del Dashboard en Vivo */}
          <div className="landing-hero-mockup">
            <div className="landing-mockup-bar">
              <span className="mockup-dot red" />
              <span className="mockup-dot yellow" />
              <span className="mockup-dot green" />
              <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 10, fontFamily: 'monospace' }}>https://appex-erp.cloud / executive-dashboard</span>
            </div>

            <div className="landing-mockup-inner" style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', padding: '20px', borderRadius: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{ background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <strong style={{ fontSize: 15, color: '#FFFFFF' }}>📈 Facturación & Comprobantes DGII</strong>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>Conciliación automática en tiempo real</div>
                  </div>
                  <span style={{ fontSize: 11, background: 'rgba(16, 185, 129, 0.2)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                    ● En Vivo
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ padding: '12px 14px', background: 'rgba(37, 99, 235, 0.15)', borderRadius: '8px', borderLeft: '4px solid #3B82F6', fontSize: 13, color: '#E2E8F0' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#60A5FA', marginBottom: 2 }}>RD$ 1,428,500.00</div>
                    <span>Ingresos del mes (+22.8% vs período anterior)</span>
                  </div>
                  <div style={{ padding: '10px 14px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', borderLeft: '4px solid #10B981', fontSize: 12, color: '#A7F3D0' }}>
                    ✓ <strong>B01 Crédito Fiscal:</strong> 142 emitidos | <strong>B02 Consumo:</strong> 894 emitidos
                  </div>
                </div>
              </div>

              <div style={{ background: 'linear-gradient(145deg, #1E293B 0%, #0F172A 100%)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong style={{ fontSize: 14, color: '#FFFFFF' }}>📦 Inventario & Multialmacén</strong>
                    <span style={{ fontSize: 11, background: 'rgba(59, 130, 246, 0.2)', color: '#93C5FD', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>3 Sucursales</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#38BDF8', marginBottom: 6 }}>12,840 Unidades</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 12 }}>Valoración Kardex: <strong style={{ color: '#E2E8F0' }}>RD$ 8,950,200.00</strong></div>
                </div>
                <div style={{ fontSize: 12, color: '#E2E8F0', background: 'rgba(255,255,255,0.05)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  ⚡ <strong>Alertas:</strong> 0 quiebres de stock · 4 órdenes de compra en tránsito
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. SECCIÓN QUIÉNES SOMOS, MISIÓN, VISIÓN Y VALORES ── */}
      <section id="quienes-somos" style={{ padding: '80px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag blue">NUESTRA IDENTIDAD CORPORATIVA</span>
            <h2 className="landing-section-title">Quiénes Somos</h2>
            <p className="landing-section-subtitle">
              Somos una empresa tecnológica líder especializada en el desarrollo de soluciones empresariales avanzadas. Diseñamos plataformas que transforman la complejidad operativa en simplicidad, rentabilidad y crecimiento estratégico.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 40 }}>
            {/* Misión */}
            <div style={{ background: 'linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 100%)', padding: '32px 28px', borderRadius: 16, border: '1px solid #DBEAFE', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.05)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#2563EB', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                🎯
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Nuestra Misión</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                Empoderar a empresas de todos los sectores con herramientas tecnológicas de clase mundial que automaticen sus procesos administrativos, fiscales y financieros, permitiéndoles tomar decisiones inteligentes basadas en datos reales.
              </p>
            </div>

            {/* Visión */}
            <div style={{ background: 'linear-gradient(145deg, #F8FAFC 0%, #F0FDF4 100%)', padding: '32px 28px', borderRadius: 16, border: '1px solid #DCFCE7', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#059669', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                🔭
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Nuestra Visión</h3>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                Consolidarnos como el referente definitivo de software ERP empresarial y multi-inquilino en la región, reconocidos por nuestra innovación continua, máxima seguridad y un servicio al cliente excepcional.
              </p>
            </div>

            {/* Valores */}
            <div style={{ background: 'linear-gradient(145deg, #F8FAFC 0%, #FAF5FF 100%)', padding: '32px 28px', borderRadius: 16, border: '1px solid #F3E8FF', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.05)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: '#7C3AED', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                💎
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Nuestros Valores</h3>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 14, color: '#475569', lineHeight: 1.8 }}>
                <li><strong>Innovación Continua:</strong> Tecnología vanguardista y reactiva.</li>
                <li><strong>Transparencia e Integridad:</strong> Datos veraces y blindados.</li>
                <li><strong>Compromiso con el Cliente:</strong> Soporte cercano y resolutivo.</li>
                <li><strong>Excelencia Operativa:</strong> Eficiencia sin margen de error.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SECCIÓN DE SERVICIOS DESTACADOS CON IMÁGENES ── */}
      <section id="servicios" style={{ padding: '80px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag green">CAPACIDADES EMPRESARIALES 360°</span>
            <h2 className="landing-section-title">Servicios y Soluciones Integrales</h2>
            <p className="landing-section-subtitle">
              Diseñados para elevar la productividad y controlar cada área crítica de tu negocio.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 28, marginTop: 40 }}>
            {services.map((srv) => (
              <div key={srv.id} style={{ background: '#FFFFFF', borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 180, backgroundImage: `url(${srv.img})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(15, 23, 42, 0.8)', color: '#FFFFFF', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                    {srv.tag}
                  </span>
                </div>
                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>{srv.title}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>{srv.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {srv.bullets.map((b, i) => (
                      <li key={i} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#10B981', fontWeight: 800 }}>✓</span> {b}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" style={{ textAlign: 'center', padding: '10px 16px', background: '#F1F5F9', color: '#1E293B', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', transition: 'all 150ms ease' }}>
                    Explorar Módulo en Demo →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. SECCIÓN DE PLANES Y PRECIOS ── */}
      <section id="precios" className="landing-pricing-section">
        <div className="landing-section-header">
          <span className="landing-section-tag green">PLANES TRANSPARENTES Y ESCALABLES</span>
          <h2 className="landing-section-title">
            Invierte en el crecimiento ordenado y rentable de tu empresa.
          </h2>
          <p className="landing-section-subtitle">
            Elige el plan adecuado según la magnitud de tus operaciones. Sin contratos forzosos ni costos ocultos.
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
              <h3 className="landing-plan-name">Plan Profesional</h3>
              <p className="landing-plan-target">Para pequeñas empresas y comercios en fase de aceleración.</p>
              <div className="landing-plan-price">
                ${billingPeriod === 'annual' ? '39' : '49'} <span>USD / mes</span>
              </div>
              <div className="landing-plan-subtext">
                {billingPeriod === 'annual' ? 'Facturado anualmente ($468/año)' : 'Facturación mensual flexible'}
              </div>
              <ul className="landing-plan-features">
                <li><span>✓</span> Hasta 5 Usuarios del Sistema</li>
                <li><span>✓</span> Facturación DGII & NCF ilimitados</li>
                <li><span>✓</span> 1 Almacén de Inventario Central</li>
                <li><span>✓</span> Ventas, CRM y Cotizaciones</li>
                <li><span>✓</span> Soporte estándar por Email</li>
              </ul>
            </div>
            <Link to="/register" className="landing-plan-btn outline">
              Elegir Plan Profesional
            </Link>
          </div>

          {/* Plan 2: Destacado */}
          <div className="landing-price-card popular">
            <div className="landing-popular-badge">MÁS POPULAR</div>
            <div>
              <h3 className="landing-plan-name">Plan Empresarial</h3>
              <p className="landing-plan-target">Para empresas consolidadas con múltiples almacenes y personal.</p>
              <div className="landing-plan-price">
                ${billingPeriod === 'annual' ? '99' : '129'} <span>USD / mes</span>
              </div>
              <div className="landing-plan-subtext">
                {billingPeriod === 'annual' ? 'Facturado anualmente ($1,188/año)' : 'Facturación mensual flexible'}
              </div>
              <ul className="landing-plan-features">
                <li><span>✓</span> Hasta 20 Usuarios con Roles (RBAC)</li>
                <li><span>✓</span> Multi-Almacén & Kardex Automático</li>
                <li><span>✓</span> Finanzas, Tesorería & Conciliaciones</li>
                <li><span>✓</span> Compras & Gestión de Proveedores</li>
                <li><span>✓</span> Nómina RRHH & Vacaciones</li>
                <li><span>✓</span> Soporte Prioritario WhatsApp 24/7</li>
              </ul>
            </div>
            <Link to="/register" className="landing-plan-btn primary">
              Comenzar Prueba Gratis
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="landing-price-card">
            <div>
              <h3 className="landing-plan-name">Plan Corporativo Suite</h3>
              <p className="landing-plan-target">Para corporaciones, distribuidoras y redes multi-empresa.</p>
              <div className="landing-plan-price">
                ${billingPeriod === 'annual' ? '249' : '299'} <span>USD / mes</span>
              </div>
              <div className="landing-plan-subtext">
                {billingPeriod === 'annual' ? 'Facturado anualmente ($2,988/año)' : 'Facturación mensual flexible'}
              </div>
              <ul className="landing-plan-features">
                <li><span>✓</span> Usuarios & Almacenes Ilimitados</li>
                <li><span>✓</span> Multi-Empresa & Multi-Moneda</li>
                <li><span>✓</span> Asistente IA Integrado + API REST</li>
                <li><span>✓</span> Auditoría Forense y Logs de Seguridad</li>
                <li><span>✓</span> Gerente de Cuenta Dedicado + SLA 99.9%</li>
              </ul>
            </div>
            <a href="#contacto" className="landing-plan-btn outline">
              Contactar Ventas Corporativas
            </a>
          </div>
        </div>
      </section>

      {/* ── 5. FORMULARIO DE CONTACTO FUNCIONAL & UBICACIÓN ── */}
      <section id="contacto" style={{ padding: '80px 24px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-section-header">
            <span className="landing-section-tag blue">ESTAMOS PARA SERVIRTE</span>
            <h2 className="landing-section-title">Contáctanos</h2>
            <p className="landing-section-subtitle">
              ¿Tienes dudas o necesitas una demostración personalizada para tu empresa? Nuestro equipo de consultores te responderá en breve.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36, marginTop: 40 }}>
            {/* Información de Contacto Directo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>🏢 Oficinas Principales</h3>
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>
                  <strong>APPEX Technologies SRL</strong><br />
                  Torre Empresarial Blue Mall, Piso 14, Av. Winston Churchill, Piantini.<br />
                  Santo Domingo, Distrito Nacional, República Dominicana.
                </p>
              </div>

              <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#334155' }}>
                  <span style={{ fontSize: 18 }}>📞</span> <strong>Teléfono:</strong> (809) 555-0100
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#334155' }}>
                  <span style={{ fontSize: 18 }}>💬</span> <strong>WhatsApp Ventas:</strong> +1 (809) 555-0199
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#334155' }}>
                  <span style={{ fontSize: 18 }}>✉️</span> <strong>Email:</strong> contacto@appes.com
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#334155' }}>
                  <span style={{ fontSize: 18 }}>⏰</span> <strong>Horario:</strong> Lunes a Viernes 8:00 AM - 6:00 PM
                </div>
              </div>
            </div>

            {/* Formulario Interactivo */}
            <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: 18, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              {contactSent ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>¡Mensaje Enviado con Éxito!</h3>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                    Gracias por ponerte en contacto. Uno de nuestros ejecutivos comerciales se comunicará contigo a la brevedad posible.
                  </p>
                  <button
                    onClick={() => setContactSent(false)}
                    style={{ marginTop: 20, padding: '10px 20px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Escríbenos un Mensaje</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={contactForm.nombre}
                        onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Empresa</label>
                      <input
                        type="text"
                        placeholder="Ej. Distribuidora del Caribe"
                        value={contactForm.empresa}
                        onChange={(e) => setContactForm({ ...contactForm, empresa: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        placeholder="correo@tuempresa.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        placeholder="(809) 555-0100"
                        value={contactForm.telefono}
                        onChange={(e) => setContactForm({ ...contactForm, telefono: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Módulo o Servicio de Interés</label>
                    <select
                      value={contactForm.servicioInteres}
                      onChange={(e) => setContactForm({ ...contactForm, servicioInteres: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', background: '#FFFFFF' }}
                    >
                      <option value="ERP Completo Suite">Suite Completa ERP (Todos los módulos)</option>
                      <option value="Ventas & Facturacion DGII">Ventas & Facturación Fiscal (DGII)</option>
                      <option value="Inventario & Almacenes">Inventario Multialmacén & Kardex</option>
                      <option value="Finanzas & Bancos">Finanzas, Tesorería & Bancos</option>
                      <option value="Compras & Proveedores">Compras & Proveedores</option>
                      <option value="Recursos Humanos">Recursos Humanos & Nómina</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Mensaje o Consulta</label>
                    <textarea
                      rows={3}
                      placeholder="Cuéntanos brevemente las necesidades de tu empresa..."
                      value={contactForm.mensaje}
                      onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    style={{ padding: '12px', background: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background 150ms ease' }}
                  >
                    {contactLoading ? 'Enviando...' : '🚀 Enviar Mensaje de Contacto'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. SECCIÓN DE PREGUNTAS FRECUENTES (FAQ) ── */}
      <section id="faq" className="landing-faq-section">
        <div className="landing-section-header">
          <span className="landing-section-tag blue">RESOLVEMOS TUS DUDAS</span>
          <h2 className="landing-section-title">Preguntas Frecuentes</h2>
          <p className="landing-section-subtitle">
            Todo lo que necesitas saber antes de implementar APPEX Enterprise ERP en tu empresa.
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
          <h2 className="landing-cta-title">Transforma la gestión de tu empresa a partir de hoy.</h2>
          <p className="landing-cta-sub">
            Únete a las empresas que ya optimizan sus operaciones, ahorran tiempo valioso y crecen con control total.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link to="/register" className="landing-btn-primary-lg">
              🚀 Probar Gratis por 14 Días
            </Link>
            <Link to="/login" className="landing-btn-outline-lg">
              🔑 Iniciar Sesión con mi Cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div style={{ marginBottom: 8, fontWeight: 700, color: '#94A3B8' }}>
          APPEX.ERP Suite · Software Empresarial en la Nube
        </div>
        <div>
          © 2026 APPEX Technologies SRL. Todos los derechos reservados. Cumplimiento con Normativas Fiscales DGII y Cifrado de Datos.
        </div>
      </footer>

      {showPWAModal && (
        <PWAInstallBanner showModalOverride={true} onCloseModalOverride={() => setShowPWAModal(false)} />
      )}
    </div>
  )
}

