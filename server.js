import express from 'express'
import cors from 'cors'
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 5039

app.use(cors())
app.use(express.json())

// Inicializar base de datos relacional SQL local persistente
const dbPath = path.join(__dirname, 'erp_database.sqlite')
const db = new Database(dbPath)

// Crear tablas y sembrar datos si la DB está vacía
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      codigo TEXT NOT NULL UNIQUE,
      descripcion TEXT
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      rol TEXT NOT NULL,
      departamento_id INTEGER,
      estado TEXT DEFAULT 'Activo',
      dos_factores INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rnc_cedula TEXT UNIQUE,
      nombre_empresa TEXT NOT NULL,
      contacto_principal TEXT,
      email TEXT,
      telefono TEXT,
      direccion TEXT,
      sector TEXT,
      limite_credito REAL DEFAULT 0,
      estado TEXT DEFAULT 'Activo'
    );

    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rnc TEXT UNIQUE NOT NULL,
      razon_social TEXT NOT NULL,
      contacto TEXT,
      email TEXT,
      telefono TEXT,
      direccion TEXT,
      categoria TEXT,
      condiciones_pago TEXT,
      estado TEXT DEFAULT 'Activo'
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      categoria TEXT,
      unidad_medida TEXT DEFAULT 'Unidad',
      precio_compra REAL NOT NULL DEFAULT 0,
      precio_venta REAL NOT NULL DEFAULT 0,
      stock_actual INTEGER NOT NULL DEFAULT 0,
      stock_minimo INTEGER NOT NULL DEFAULT 5,
      ubicacion_almacen TEXT,
      estado TEXT DEFAULT 'Disponible'
    );

    CREATE TABLE IF NOT EXISTS ordenes_venta (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT UNIQUE NOT NULL,
      cliente TEXT NOT NULL,
      fecha TEXT NOT NULL,
      total REAL NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Pendiente',
      observaciones TEXT
    );

    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cedula TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      telefono TEXT,
      departamento TEXT NOT NULL,
      cargo TEXT NOT NULL,
      salario_mensual REAL NOT NULL,
      fecha_ingreso TEXT NOT NULL,
      estado TEXT DEFAULT 'Activo'
    );

    CREATE TABLE IF NOT EXISTS cuentas_contables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      tipo TEXT NOT NULL,
      saldo_actual REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS logs_auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT,
      modulo TEXT NOT NULL,
      accion TEXT NOT NULL,
      ip TEXT,
      estado TEXT NOT NULL,
      fecha TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const userCount = db.prepare('SELECT count(*) as count FROM usuarios').get().count
  if (userCount === 0) {
    console.log('Sembrando base de datos con datos reales...')

    const insertUser = db.prepare(`INSERT INTO usuarios (id, nombre, email, password_hash, rol, departamento_id, estado, dos_factores) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    insertUser.run('usr-1', 'Admin General', 'admin@appes.com', 'Admin2024!', 'ADMIN', 2, 'Activo', 1)
    insertUser.run('usr-2', 'Francisco Inger', 'francisco@appes.com', 'Francisco123!', 'ADMIN', 1, 'Activo', 1)
    insertUser.run('usr-3', 'Ana Martínez', 'ana.martinez@appes.com', 'Ana2024!', 'VENTAS', 3, 'Activo', 0)
    insertUser.run('usr-4', 'Carlos Hernández', 'carlos.h@appes.com', 'Carlos2024!', 'ADMIN', 5, 'Activo', 1)
    insertUser.run('usr-5', 'María Rodríguez', 'maria.r@appes.com', 'Maria2024!', 'SOPORTE', 4, 'Activo', 0)
    insertUser.run('usr-6', 'Laura Jiménez', 'laura.j@appes.com', 'Laura2024!', 'RRHH', 6, 'Activo', 1)
    insertUser.run('usr-7', 'Ediana Tejada', 'ediana.t@appes.com', 'Ediana2024!', 'CRM', 3, 'Activo', 0)

    const insertClient = db.prepare(`INSERT INTO clientes (rnc_cedula, nombre_empresa, contacto_principal, email, telefono, direccion, sector, limite_credito, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    insertClient.run('1-30-49281-5', 'Tech Solutions Dominicana SRL', 'Ing. Juan Pérez', 'contacto@techsolutions.do', '(809) 555-0192', 'Av. Winston Churchill #1099, Piantini, Santo Domingo', 'Tecnología', 1500000.0, 'Activo')
    insertClient.run('1-01-83921-2', 'Distribuidora Farmacéutica del Caribe SAS', 'Lic. María Rodríguez', 'compras@distcaribe.com.do', '(809) 555-0144', 'Av. Luperón Km 6.5, Herrera, Santo Domingo Oeste', 'Farmacéutica', 2500000.0, 'Activo')
    insertClient.run('1-31-09483-9', 'Comercial ABC Retail SRL', 'Lic. Carlos Gómez', 'cgomez@comercialabc.com', '(809) 555-0188', 'Av. 27 de Febrero #240, La Esperilla, Santo Domingo', 'Retail', 900000.0, 'Activo')
    insertClient.run('1-02-58193-4', 'Servicios Médicos Integrales Abreu', 'Dra. Ana López', 'alopez@clinicaabreu.com.do', '(829) 555-0123', 'Calle Beller #42, Gazcue, Santo Domingo', 'Salud', 1800000.0, 'Activo')
    insertClient.run('1-20-49102-8', 'Industrias Químicas Nacionales', 'Ing. Pedro Martínez', 'pmartinez@indquimicas.do', '(809) 555-0199', 'Zona Industrial Haina, San Cristóbal', 'Manufactura', 3000000.0, 'Activo')

    const insertProd = db.prepare(`INSERT INTO productos (sku, nombre, categoria, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, ubicacion_almacen, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    insertProd.run('SRV-DL-R750', 'Servidor Rack Dell PowerEdge R750 Xeon 32GB', 'Tecnología', 'Unidad', 185000.0, 245000.0, 8, 2, 'Pasillo A-Rack 01', 'Disponible')
    insertProd.run('LPT-THINK-X1', 'Laptop Lenovo ThinkPad X1 Carbon Gen 11 16GB SSD', 'Tecnología', 'Unidad', 82000.0, 115000.0, 15, 3, 'Pasillo A-Estante 03', 'Disponible')
    insertProd.run('INS-GLUCO-KIT', 'Kit Reactivo de Glucosa en Sangre (Caja 100)', 'Salud', 'Caja', 1850.0, 2900.0, 120, 25, 'Almacén Frío B-02', 'Disponible')
    insertProd.run('INS-MASC-N95', 'Mascarillas de Protección Respiratoria N95 (Caja 50)', 'Salud', 'Caja', 650.0, 1200.0, 250, 40, 'Pasillo B-Estante 01', 'Disponible')
    insertProd.run('OFI-PAP-BOND', 'Caja de Papel Bond 8.5x11 20lb (5000 hojas)', 'Oficina', 'Caja', 1950.0, 2800.0, 85, 15, 'Pasillo C-Tarima 04', 'Disponible')
    insertProd.run('LIC-ERP-ENT', 'Licencia Anual ERP Enterprise Edition por Inquilino', 'Software', 'Licencia', 120000.0, 195000.0, 50, 5, 'Bóveda Digital Cloud', 'Disponible')

    const insertOrder = db.prepare(`INSERT INTO ordenes_venta (numero, cliente, fecha, total, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?)`)
    insertOrder.run('PED-1001', 'Distribuidora Farmacéutica del Caribe SAS', '2025-05-20', 125000.0, 'Confirmado', 'Entrega prioritaria en almacén central')
    insertOrder.run('PED-1002', 'Servicios Médicos Integrales Abreu', '2025-05-19', 98000.0, 'Enviado', 'Factura formal con comprobante fiscal gubernamental (B15)')
    insertOrder.run('PED-1003', 'Tech Solutions Dominicana SRL', '2025-05-18', 75000.0, 'Entregado', 'Pago verificado vía transferencia bancaria')
    insertOrder.run('PED-1004', 'Comercial ABC Retail SRL', '2025-05-17', 62000.0, 'Pendiente', 'Pendiente de aprobación por comité de crédito')
    insertOrder.run('PED-1005', 'Distribuidora Farmacéutica del Caribe SAS', '2025-05-16', 58000.0, 'Confirmado', 'Despacho conjunto con pedido PED-1001')

    const insertEmp = db.prepare(`INSERT INTO empleados (cedula, nombre, apellido, email, telefono, departamento, cargo, salario_mensual, fecha_ingreso, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    insertEmp.run('001-1829384-1', 'Francisco', 'Inger', 'francisco@appes.com', '(809) 555-0101', 'Dirección General', 'Director de Operaciones & Tecnología', 175000.0, '2023-01-15', 'Activo')
    insertEmp.run('001-0948271-3', 'Ana', 'Martínez', 'ana.martinez@appes.com', '(809) 555-0102', 'Ventas', 'Gerente de Cuentas y Ventas Corporativas', 95000.0, '2023-03-01', 'Activo')
    insertEmp.run('001-1209384-5', 'Carlos', 'Hernández', 'carlos.h@appes.com', '(809) 555-0103', 'Finanzas', 'Contador General & Auditor', 110000.0, '2023-02-10', 'Activo')
    insertEmp.run('001-1748291-7', 'Laura', 'Jiménez', 'laura.j@appes.com', '(809) 555-0104', 'Recursos Humanos', 'Especialista en Gestión de Talento', 80000.0, '2023-04-15', 'Activo')
    insertEmp.run('001-1492049-2', 'Ediana', 'Tejada', 'ediana.t@appes.com', '(809) 555-0105', 'CRM Comercial', 'Ejecutiva Senior de CRM y Fidelización', 85000.0, '2023-05-02', 'Activo')

    const insertCuenta = db.prepare(`INSERT INTO cuentas_contables (codigo, nombre, tipo, saldo_actual) VALUES (?, ?, ?, ?)`)
    insertCuenta.run('1101-01', 'Banco Popular Dominicano - Cuenta Corriente DOP', 'Activo', 4850000.0)
    insertCuenta.run('1101-02', 'Banco BHD León - Cuenta Nómina DOP', 'Activo', 1250000.0)
    insertCuenta.run('1105-01', 'Cuentas por Cobrar Comerciales', 'Activo', 2150000.0)
    insertCuenta.run('1108-01', 'Inventario de Mercancías en Existencia', 'Activo', 3820000.0)
    insertCuenta.run('2101-01', 'Cuentas por Pagar Proveedores Locales', 'Pasivo', 1640000.0)
    insertCuenta.run('4101-01', 'Ingresos por Ventas de Bienes y Licencias', 'Ingreso', 8950000.0)
    insertCuenta.run('5101-01', 'Costo de Ventas y Mercancías', 'Costo', 4920000.0)
    insertCuenta.run('6101-01', 'Gastos Operativos y Sueldos del Personal', 'Gasto', 2450000.0)
  }
}

initDatabase()

// --- Endpoints de API Conectados a la Base de Datos Relacional ---

// KPI Dashboard
app.get('/api/dashboard/kpis', (req, res) => {
  const ventasTotales = db.prepare(`SELECT SUM(total) as total FROM ordenes_venta WHERE estado != 'Cancelado'`).get().total || 0
  const pedidosCount = db.prepare(`SELECT COUNT(*) as count FROM ordenes_venta`).get().count
  const clientesCount = db.prepare(`SELECT COUNT(*) as count FROM clientes`).get().count
  const inventarioValor = db.prepare(`SELECT SUM(precio_compra * stock_actual) as total FROM productos`).get().total || 0

  res.json({
    kpis: {
      ventasMes: ventasTotales,
      pedidos: pedidosCount,
      clientes: clientesCount,
      inventarioTotal: inventarioValor,
    }
  })
})

app.get('/api/dashboard/actividades', (req, res) => {
  const logs = db.prepare(`SELECT * FROM logs_auditoria ORDER BY id DESC LIMIT 10`).all()
  res.json(logs)
})

// Ventas
app.get('/api/sales/orders', (req, res) => {
  const orders = db.prepare('SELECT * FROM ordenes_venta ORDER BY id DESC').all()
  res.json(orders)
})

app.post('/api/sales/orders', (req, res) => {
  const { cliente, total, estado, observaciones, fecha } = req.body
  const num = `PED-${Math.floor(1000 + Math.random() * 9000)}`
  const fechaVal = fecha || new Date().toISOString().slice(0, 10)
  const stmt = db.prepare('INSERT INTO ordenes_venta (numero, cliente, fecha, total, estado, observaciones) VALUES (?, ?, ?, ?, ?, ?)')
  const info = stmt.run(num, cliente, fechaVal, total || 0, estado || 'Pendiente', observaciones || '')
  
  const created = db.prepare('SELECT * FROM ordenes_venta WHERE id = ?').get(info.lastInsertRowid)
  res.json(created)
})

app.patch('/api/sales/orders/:id/status', (req, res) => {
  const { id } = req.params
  const { estado } = req.body
  db.prepare('UPDATE ordenes_venta SET estado = ? WHERE id = ?').run(estado, id)
  const updated = db.prepare('SELECT * FROM ordenes_venta WHERE id = ?').get(id)
  res.json(updated)
})

// Productos / Inventario
app.get('/api/products', (req, res) => {
  const prods = db.prepare('SELECT * FROM productos ORDER BY id ASC').all()
  res.json(prods)
})

app.get('/api/products/:id', (req, res) => {
  const prod = db.prepare('SELECT * FROM productos WHERE id = ?').get(req.params.id)
  if (!prod) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json(prod)
})

// Clientes CRM
app.get('/api/crm/clients', (req, res) => {
  const clients = db.prepare('SELECT * FROM clientes ORDER BY id ASC').all()
  res.json(clients)
})

// Empleados RRHH
app.get('/api/rrhh/employees', (req, res) => {
  const employees = db.prepare('SELECT * FROM empleados ORDER BY id ASC').all()
  res.json(employees)
})

// Seguridad & Usuarios
app.get('/api/seguridad/usuarios', (req, res) => {
  const users = db.prepare('SELECT id, nombre, email, rol, estado, dos_factores FROM usuarios').all()
  res.json(users)
})

app.get('/api/seguridad/logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM logs_auditoria ORDER BY id DESC LIMIT 50').all()
  res.json(logs)
})

// Finanzas
app.get('/api/finanzas/cuentas', (req, res) => {
  const cuentas = db.prepare('SELECT * FROM cuentas_contables ORDER BY codigo ASC').all()
  res.json(cuentas)
})

// Health check & DB Summary
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'SQL Relacional SQLite / Postgres-compatible',
    tables: ['departamentos', 'usuarios', 'clientes', 'proveedores', 'productos', 'ordenes_venta', 'empleados', 'cuentas_contables', 'logs_auditoria']
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor API Backend & Base de Datos Relacional escuchando en http://localhost:${PORT}`)
})
