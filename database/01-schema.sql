-- Esquema del IT Incident Hub
-- Se ejecuta solo la primera vez que arranca el contenedor de Postgres,
-- porque docker-compose monta esta carpeta en /docker-entrypoint-initdb.d

-- Tipos -----------------------------------------------------------------

CREATE TYPE estado_incidente AS ENUM (
    'NUEVO', 'ASIGNADO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'
);

CREATE TYPE prioridad_incidente AS ENUM (
    'BAJA', 'MEDIA', 'ALTA', 'CRITICA'
);

CREATE TYPE categoria_incidente AS ENUM (
    'HARDWARE', 'SOFTWARE', 'RED', 'ACCESOS', 'OTRO'
);

-- Tablas ----------------------------------------------------------------

-- Quien reporta el incidente. No hay login, asi que el usuario se
-- selecciona al crear el incidente.
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Quien atiende el incidente.
CREATE TABLE technicians (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    especialidad  VARCHAR(80),
    activo        BOOLEAN      NOT NULL DEFAULT true,
    creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE incidents (
    id            SERIAL PRIMARY KEY,
    titulo        VARCHAR(150)        NOT NULL,
    descripcion   TEXT                NOT NULL,
    categoria     categoria_incidente NOT NULL,
    prioridad     prioridad_incidente NOT NULL DEFAULT 'MEDIA',
    estado        estado_incidente    NOT NULL DEFAULT 'NUEVO',
    usuario_id    INTEGER             NOT NULL REFERENCES users(id),
    tecnico_id    INTEGER             REFERENCES technicians(id),
    creado_en     TIMESTAMPTZ         NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ        NOT NULL DEFAULT now(),
    resuelto_en   TIMESTAMPTZ,
    cerrado_en    TIMESTAMPTZ,

    -- Un incidente sin tecnico no puede estar mas alla de NUEVO.
    CONSTRAINT asignado_requiere_tecnico CHECK (
        estado = 'NUEVO' OR tecnico_id IS NOT NULL
    )
);

-- Bitacora. Va en tabla aparte para que sea un historial y no un campo
-- de texto que se sobrescribe.
CREATE TABLE comments (
    id           SERIAL PRIMARY KEY,
    incidente_id INTEGER      NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    autor        VARCHAR(120) NOT NULL,
    cuerpo       TEXT         NOT NULL,
    creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indices ---------------------------------------------------------------
-- Los cuatro primeros son los filtros que pide el proyecto. El de
-- creado_en es para ordenar el listado, que siempre sale por fecha.

CREATE INDEX idx_incidents_estado     ON incidents (estado);
CREATE INDEX idx_incidents_prioridad  ON incidents (prioridad);
CREATE INDEX idx_incidents_categoria  ON incidents (categoria);
CREATE INDEX idx_incidents_tecnico    ON incidents (tecnico_id);
CREATE INDEX idx_incidents_creado_en  ON incidents (creado_en DESC);
CREATE INDEX idx_comments_incidente   ON comments (incidente_id, creado_en);

-- actualizado_en se mantiene solo ------------------------------------------

CREATE OR REPLACE FUNCTION set_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_incidents_actualizado_en
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION set_actualizado_en();
