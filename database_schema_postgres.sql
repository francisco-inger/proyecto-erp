-- ==========================================================
-- SISTEMA ERP EMPRESARIAL INTEGRAL - ESQUEMA Y DATOS REALES
-- Compatible con PostgreSQL y motor relacional SQL
-- ==========================================================

-- 1. Tabla de Departamentos
CREATE TABLE IF NOT EXISTS departamentos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 2. Tabla de Usuarios y Seguridad
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    departamento_id INT REFERENCES departamentos(id),
    estado VARCHAR(50) DEFAULT 'Activo',
    dos_factores BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clientes y CRM
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    rnc_cedula VARCHAR(30) UNIQUE,
    nombre_empresa VARCHAR(200) NOT NULL,
    contacto_principal VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(50),
    direccion TEXT,
    sector VARCHAR(100),
    limite_credito DECIMAL(14,2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Oportunidades de Negocio CRM
CREATE TABLE IF NOT EXISTS oportunidades_crm (
    id SERIAL PRIMARY KEY,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    valor_estimado DECIMAL(14,2) NOT NULL,
    etapa VARCHAR(50) NOT NULL,
    probabilidad INT DEFAULT 50,
    fecha_cierre_estimada DATE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    rnc VARCHAR(30) UNIQUE NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    contacto VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(50),
    direccion TEXT,
    categoria VARCHAR(100),
    condiciones_pago VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Categorías y Productos de Inventario
CREATE TABLE IF NOT EXISTS categorias_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    codigo VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    categoria_id INT REFERENCES categorias_producto(id),
    unidad_medida VARCHAR(30) DEFAULT 'Unidad',
    precio_compra DECIMAL(14,2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(14,2) NOT NULL DEFAULT 0,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    ubicacion_almacen VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'Disponible',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Órdenes de Venta
CREATE TABLE IF NOT EXISTS ordenes_venta (
    id SERIAL PRIMARY KEY,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    cliente_id INT REFERENCES clientes(id),
    fecha DATE NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    itbis_impuesto DECIMAL(14,2) NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    terminos_pago VARCHAR(100),
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Órdenes de Compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id SERIAL PRIMARY KEY,
    numero_orden VARCHAR(50) UNIQUE NOT NULL,
    proveedor_id INT REFERENCES proveedores(id),
    fecha DATE NOT NULL,
    total DECIMAL(14,2) NOT NULL,
    estado VARCHAR(50) NOT NULL DEFAULT 'Borrador',
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Empleados y Nómina (RRHH)
CREATE TABLE IF NOT EXISTS empleados (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(30) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefono VARCHAR(50),
    departamento_id INT REFERENCES departamentos(id),
    cargo VARCHAR(100) NOT NULL,
    salario_mensual DECIMAL(14,2) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    estado VARCHAR(50) DEFAULT 'Activo'
);

-- 10. Finanzas: Plan Contable
CREATE TABLE IF NOT EXISTS cuentas_contables (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    saldo_actual DECIMAL(14,2) DEFAULT 0
);

-- 11. Auditoría
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_email VARCHAR(150),
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(255) NOT NULL,
    ip_origen VARCHAR(50),
    estado VARCHAR(50) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INSERCIÓN DE DATOS REALES
INSERT INTO departamentos (id, nombre, codigo, descripcion) VALUES
(1, 'Dirección General & Administración', 'DIR', 'Gerencia estratégica y gobernanza corporativa'),
(2, 'Tecnología de la Información', 'TIC', 'Infraestructura, desarrollo y seguridad de sistemas'),
(3, 'Comercial y Ventas', 'VTA', 'Gestión de canales de distribución y cartera de clientes'),
(4, 'Compras y Cadena de Suministro', 'COM', 'Adquisiciones, proveedores y logística de insumos'),
(5, 'Finanzas y Contabilidad', 'FIN', 'Tesorería, presupuestos, tributación y reportes contables'),
(6, 'Recursos Humanos y Talento', 'RRHH', 'Gestión de nómina, capacitación y clima laboral'),
(7, 'Operaciones y Almacén', 'ALM', 'Gestión de inventarios y despacho de mercancías');

INSERT INTO usuarios (id, nombre, email, password_hash, rol, departamento_id, estado, dos_factores) VALUES
('usr-1', 'Admin General', 'admin@appes.com', 'Admin2024!', 'ADMIN', 2, 'Activo', TRUE),
('usr-2', 'Francisco Inger', 'francisco@appes.com', 'Francisco123!', 'ADMIN', 1, 'Activo', TRUE),
('usr-3', 'Ana Martínez', 'ana.martinez@appes.com', 'Ana2024!', 'VENTAS', 3, 'Activo', FALSE),
('usr-4', 'Carlos Hernández', 'carlos.h@appes.com', 'Carlos2024!', 'ADMIN', 5, 'Activo', TRUE),
('usr-5', 'María Rodríguez', 'maria.r@appes.com', 'Maria2024!', 'SOPORTE', 4, 'Activo', FALSE),
('usr-6', 'Laura Jiménez', 'laura.j@appes.com', 'Laura2024!', 'RRHH', 6, 'Activo', TRUE),
('usr-7', 'Ediana Tejada', 'ediana.t@appes.com', 'Ediana2024!', 'CRM', 3, 'Activo', FALSE);

INSERT INTO clientes (id, rnc_cedula, nombre_empresa, contacto_principal, email, telefono, direccion, sector, limite_credito, estado) VALUES
(1, '1-30-49281-5', 'Tech Solutions Dominicana SRL', 'Ing. Juan Pérez', 'contacto@techsolutions.do', '(809) 555-0192', 'Av. Winston Churchill #1099, Piantini, Santo Domingo', 'Tecnología', 1500000.00, 'Activo'),
(2, '1-01-83921-2', 'Distribuidora Farmacéutica del Caribe SAS', 'Lic. María Rodríguez', 'compras@distcaribe.com.do', '(809) 555-0144', 'Av. Luperón Km 6.5, Herrera, Santo Domingo Oeste', 'Farmacéutica', 2500000.00, 'Activo'),
(3, '1-31-09483-9', 'Comercial ABC Retail SRL', 'Lic. Carlos Gómez', 'cgomez@comercialabc.com', '(809) 555-0188', 'Av. 27 de Febrero #240, La Esperilla, Santo Domingo', 'Retail', 900000.00, 'Activo'),
(4, '1-02-58193-4', 'Servicios Médicos Integrales Abreu', 'Dra. Ana López', 'alopez@clinicaabreu.com.do', '(829) 555-0123', 'Calle Beller #42, Gazcue, Santo Domingo', 'Salud', 1800000.00, 'Activo'),
(5, '1-20-49102-8', 'Industrias Químicas Nacionales', 'Ing. Pedro Martínez', 'pmartinez@indquimicas.do', '(809) 555-0199', 'Zona Industrial Haina, San Cristóbal', 'Manufactura', 3000000.00, 'Activo');

INSERT INTO proveedores (id, rnc, razon_social, contacto, email, telefono, direccion, categoria, condiciones_pago, estado) VALUES
(1, '1-01-00234-1', 'Dell Dominicana Technologies SRL', 'Roberto Castillo', 'ventas@dell.com.do', '(809) 227-8000', 'Av. John F. Kennedy #12, Santo Domingo', 'Equipos de Cómputo', 'Crédito 30 días', 'Activo'),
(2, '1-30-88123-9', 'Laboratorios Químicos del Caribe SRL', 'Elena Vargas', 'contacto@labquimicos.do', '(809) 560-4411', 'Autopista Duarte Km 14, Los Alcarrizos', 'Materia Prima e Insumos', 'Crédito 45 días', 'Activo'),
(3, '1-02-39481-6', 'Distribuidora Papelera Nacional SA', 'Marcos Santana', 'pedidos@papeleranacional.com.do', '(809) 682-1100', 'Av. San Martín #88, Miraflores, Santo Domingo', 'Material Gastable', 'Contado / 15 días', 'Activo'),
(4, '1-22-90184-3', 'Telecomunicaciones & Redes Globales SRL', 'Karla Mendoza', 'kmendoza@redesglobales.do', '(809) 334-9900', 'Av. Núñez de Cáceres #303, Santo Domingo', 'Servicios Cloud y Telecom', 'Crédito 30 días', 'Activo');

INSERT INTO categorias_producto (id, nombre, codigo) VALUES
(1, 'Servidores y Equipamiento IT', 'CAT-IT'),
(2, 'Insumos Médicos y Laboratorio', 'CAT-MED'),
(3, 'Suministros de Oficina y Papelería', 'CAT-OFI'),
(4, 'Licencias de Software y Soporte', 'CAT-LIC');

INSERT INTO productos (id, sku, nombre, categoria_id, unidad_medida, precio_compra, precio_venta, stock_actual, stock_minimo, ubicacion_almacen, estado) VALUES
(1, 'SRV-DL-R750', 'Servidor Rack Dell PowerEdge R750 Xeon 32GB', 1, 'Unidad', 185000.00, 245000.00, 8, 2, 'Pasillo A-Rack 01', 'Disponible'),
(2, 'LPT-THINK-X1', 'Laptop Lenovo ThinkPad X1 Carbon Gen 11 16GB SSD', 1, 'Unidad', 82000.00, 115000.00, 15, 3, 'Pasillo A-Estante 03', 'Disponible'),
(3, 'INS-GLUCO-KIT', 'Kit Reactivo de Glucosa en Sangre (Caja 100 pruebas)', 2, 'Caja', 1850.00, 2900.00, 120, 25, 'Almacén Frío B-02', 'Disponible'),
(4, 'INS-MASC-N95', 'Mascarillas de Protección Respiratoria N95 (Caja 50)', 2, 'Caja', 650.00, 1200.00, 250, 40, 'Pasillo B-Estante 01', 'Disponible'),
(5, 'OFI-PAP-BOND', 'Caja de Papel Bond 8.5x11 20lb (5000 hojas)', 3, 'Caja', 1950.00, 2800.00, 85, 15, 'Pasillo C-Tarima 04', 'Disponible'),
(6, 'LIC-ERP-ENT', 'Licencia Anual ERP Enterprise Edition por Inquilino', 4, 'Licencia', 120000.00, 195000.00, 50, 5, 'Bóveda Digital Cloud', 'Disponible');

INSERT INTO ordenes_venta (id, numero_pedido, cliente_id, fecha, subtotal, itbis_impuesto, total, estado, terminos_pago, observaciones) VALUES
(1, 'PED-1001', 2, '2025-05-20', 105932.20, 19067.80, 125000.00, 'Confirmado', 'Crédito 30 días', 'Entrega prioritaria en almacén central de insumos médicos'),
(2, 'PED-1002', 4, '2025-05-19', 83050.85, 14949.15, 98000.00, 'Enviado', 'Crédito 15 días', 'Factura formal con comprobante fiscal gubernamental (B15)'),
(3, 'PED-1003', 1, '2025-05-18', 63559.32, 11440.68, 75000.00, 'Entregado', 'Contado', 'Pago verificado vía transferencia bancaria'),
(4, 'PED-1004', 3, '2025-05-17', 52542.37, 9457.63, 62000.00, 'Pendiente', 'Crédito 30 días', 'Pendiente de aprobación por comité de crédito'),
(5, 'PED-1005', 2, '2025-05-16', 49152.54, 8847.46, 58000.00, 'Confirmado', 'Crédito 30 días', 'Despacho conjunto con pedido PED-1001');

INSERT INTO empleados (id, cedula, nombre, apellido, email, telefono, departamento_id, cargo, salario_mensual, fecha_ingreso, estado) VALUES
(1, '001-1829384-1', 'Francisco', 'Inger', 'francisco@appes.com', '(809) 555-0101', 1, 'Director de Operaciones & Tecnología', 175000.00, '2023-01-15', 'Activo'),
(2, '001-0948271-3', 'Ana', 'Martínez', 'ana.martinez@appes.com', '(809) 555-0102', 3, 'Gerente de Cuentas y Ventas Corporativas', 95000.00, '2023-03-01', 'Activo'),
(3, '001-1209384-5', 'Carlos', 'Hernández', 'carlos.h@appes.com', '(809) 555-0103', 5, 'Contador General & Auditor', 110000.00, '2023-02-10', 'Activo'),
(4, '001-1748291-7', 'Laura', 'Jiménez', 'laura.j@appes.com', '(809) 555-0104', 6, 'Especialista en Gestión de Talento', 80000.00, '2023-04-15', 'Activo'),
(5, '001-1492049-2', 'Ediana', 'Tejada', 'ediana.t@appes.com', '(809) 555-0105', 3, 'Ejecutiva Senior de CRM y Fidelización', 85000.00, '2023-05-02', 'Activo');

INSERT INTO cuentas_contables (id, codigo, nombre, tipo, saldo_actual) VALUES
(1, '1101-01', 'Banco Popular Dominicano - Cuenta Corriente DOP', 'Activo', 4850000.00),
(2, '1101-02', 'Banco BHD León - Cuenta Nómina DOP', 'Activo', 1250000.00),
(3, '1105-01', 'Cuentas por Cobrar Comerciales', 'Activo', 2150000.00),
(4, '1108-01', 'Inventario de Mercancías en Existencia', 'Activo', 3820000.00),
(5, '2101-01', 'Cuentas por Pagar Proveedores Locales', 'Pasivo', 1640000.00),
(6, '4101-01', 'Ingresos por Ventas de Bienes y Licencias', 'Ingreso', 8950000.00),
(7, '5101-01', 'Costo de Ventas y Mercancías', 'Costo', 4920000.00),
(8, '6101-01', 'Gastos Operativos y Sueldos del Personal', 'Gasto', 2450000.00);

INSERT INTO logs_auditoria (usuario_email, modulo, accion, ip_origen, estado) VALUES
('francisco@appes.com', 'Sistema', 'Inicio de base de datos relacional y servidor backend', '127.0.0.1', 'Exitoso'),
('admin@appes.com', 'Seguridad', 'Verificación de políticas de integridad de datos', '192.168.100.41', 'Exitoso'),
('ana.martinez@appes.com', 'Ventas', 'Consulta de cartera de pedidos activos', '192.168.100.15', 'Exitoso');
