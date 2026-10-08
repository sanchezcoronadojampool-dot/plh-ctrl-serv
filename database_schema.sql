-- =============================================================================
-- DATABASE SCHEMA: SISTEMA DE CONTROL DE SERVICIOS (CONDOMINIO)
-- Version: 1.0.0
-- Description: Esquema profesional para control de luz y agua con trazabilidad total.
-- =============================================================================

-- 1. GESTIÓN DE PERSONAS Y CLIENTES
CREATE TABLE personas (
    id_persona UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    documento_identidad VARCHAR(50) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    correo_electronico VARCHAR(255) UNIQUE,
    telefono_principal VARCHAR(20) NOT NULL,
    telefono_secundario VARCHAR(20),
    direccion_fiscal TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    estatus_cuenta VARCHAR(20) DEFAULT 'activo' 
);

CREATE TABLE roles_propiedad (
    id_rol UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descripcion VARCHAR(50) NOT NULL 
);

-- 2. INFRAESTRUCTURA Y SERVICIOS
CREATE TABLE propiedades (
    id_propiedad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    numero_casa VARCHAR(20) NOT NULL,
    manzana VARCHAR(20),
    sector VARCHAR(50),
    area_m2 DECIMAL(10,2),
    coordenadas_gps POINT, 
    estatus_ocupacion VARCHAR(20) DEFAULT 'ocupada',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE propiedad_personas (
    id_propiedad UUID REFERENCES propiedades(id_propiedad) ON DELETE CASCADE,
    id_persona UUID REFERENCES personas(id_persona) ON DELETE CASCADE,
    id_rol UUID REFERENCES roles_propiedad(id_rol),
    fecha_vinculo DATE DEFAULT CURRENT_DATE,
    es_responsable_pago BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_propiedad, id_persona)
);

CREATE TABLE tarifas (
    id_tarifa UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_servicio VARCHAR(20) NOT NULL,
    precio_unidad DECIMAL(12,4) NOT NULL,
    cargo_fijo DECIMAL(12,2) DEFAULT 0.00,
    vigencia_desde DATE NOT NULL,
    vigencia_hasta DATE,
    descripcion TEXT
);

CREATE TABLE medidores (
    id_medidor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_propiedad UUID REFERENCES propiedades(id_propiedad) ON DELETE CASCADE,
    id_tarifa UUID REFERENCES tarifas(id_tarifa),
    tipo_servicio VARCHAR(20) NOT NULL,
    numero_serie VARCHAR(100) UNIQUE NOT NULL,
    marca_modelo VARCHAR(100),
    lectura_inicial DECIMAL(15,2) DEFAULT 0,
    fecha_instalacion DATE DEFAULT CURRENT_DATE,
    ultima_mantenimiento DATE
);

-- 3. OPERACIONES Y FINANZAS
-- Las cuentas nuevas se crean desde la aplicación; password_hash contiene BCrypt.
CREATE TABLE staff (
    id_staff UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_persona UUID REFERENCES personas(id_persona),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol_sistema VARCHAR(20) DEFAULT 'operador',
    nombre VARCHAR(200),
    activo BOOLEAN DEFAULT TRUE,
    password_version INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE staff ADD COLUMN IF NOT EXISTS nombre VARCHAR(200);

CREATE TABLE lecturas (
    id_lectura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_medidor UUID REFERENCES medidores(id_medidor) NOT NULL,
    id_staff UUID REFERENCES staff(id_staff) NOT NULL,
    valor_lectura DECIMAL(15,2) NOT NULL,
    fecha_lectura TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    foto_evidencia_url TEXT,
    coordenadas_captura VARCHAR(100),
    observaciones TEXT,
    CONSTRAINT check_lectura_positiva CHECK (valor_lectura >= 0)
);

CREATE TABLE facturas (
    id_factura UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_lectura UUID REFERENCES lecturas(id_lectura) UNIQUE,
    id_propiedad UUID REFERENCES propiedades(id_propiedad),
    id_persona_cobro UUID REFERENCES personas(id_persona),
    consumo_periodo DECIMAL(15,2) NOT NULL,
    monto_subtotal DECIMAL(12,2) NOT NULL,
    monto_cargo_fijo DECIMAL(12,2) DEFAULT 0,
    monto_total DECIMAL(12,2) NOT NULL,
    fecha_emision TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento DATE NOT NULL,
    estatus_pago VARCHAR(20) DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    fecha_pago TIMESTAMP WITHOUT TIME ZONE
);

-- Índices para optimización
CREATE INDEX idx_propiedad_codigo ON propiedades(codigo_interno);
CREATE INDEX idx_lectura_fecha ON lecturas(fecha_lectura);
CREATE INDEX idx_factura_estatus ON facturas(estatus_pago);

-- New installations should use Flyway migrations in backend/src/main/resources/db/migration.
-- These tables are included here for convenience when this legacy bootstrap script is run.
CREATE TABLE IF NOT EXISTS owner_registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    documento_identidad VARCHAR(50) NOT NULL UNIQUE,
    telefono VARCHAR(20) NOT NULL,
    correo_electronico VARCHAR(255),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    inmueble VARCHAR(50) NOT NULL,
    fecha_solicitud TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(40) NOT NULL,
    title VARCHAR(120) NOT NULL,
    message VARCHAR(500) NOT NULL,
    target_path VARCHAR(200) NOT NULL,
    recipient_staff_id UUID REFERENCES staff(id_staff) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id_staff) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    used_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_staff_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_staff ON password_reset_tokens(staff_id);
