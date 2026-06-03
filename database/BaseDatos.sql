
-- EventHub — Script DDL para Supabase (PostgreSQL)
-- Administración de Bases de Datos II — CEUTEC

 
-- 1. USUARIOS
CREATE TABLE usuarios (
  usuario_id     SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  rol            VARCHAR(20)  NOT NULL DEFAULT 'asistente'
                 CHECK (rol IN ('asistente', 'organizador', 'admin')),
  avatar_url     VARCHAR(255),
  ciudad         VARCHAR(100),
  fecha_registro TIMESTAMP DEFAULT NOW()
);
 
-- 2. CATEGORIAS
CREATE TABLE categorias (
  categoria_id SERIAL PRIMARY KEY,
  nombre       VARCHAR(80) UNIQUE NOT NULL,
  descripcion  TEXT
);
 
-- 3. LUGARES
CREATE TABLE lugares (
  lugar_id         SERIAL PRIMARY KEY,
  nombre           VARCHAR(150) NOT NULL,
  direccion        VARCHAR(255) NOT NULL,
  ciudad           VARCHAR(100) NOT NULL,
  capacidad_maxima INTEGER      NOT NULL,
  coordenadas      VARCHAR(100),
  imagen_url       VARCHAR(255)
);
 
-- 4. EVENTOS (tabla central ★)
CREATE TABLE eventos (
  evento_id               SERIAL PRIMARY KEY,
  titulo                  VARCHAR(200) NOT NULL,
  descripcion             TEXT         NOT NULL,
  fecha_inicio            TIMESTAMP    NOT NULL,
  fecha_fin               TIMESTAMP    NOT NULL,
  imagen_banner           VARCHAR(255),
  estado                  VARCHAR(20)  DEFAULT 'borrador'
                          CHECK (estado IN ('borrador', 'publicado', 'cancelado', 'finalizado')),
  organizador_id          INTEGER      NOT NULL REFERENCES usuarios(usuario_id),
  categoria_id            INTEGER      NOT NULL REFERENCES categorias(categoria_id),
  lugar_id                INTEGER      NOT NULL REFERENCES lugares(lugar_id),
  creado_con_asistente_ia BOOLEAN      DEFAULT FALSE,
  fecha_creacion          TIMESTAMP    DEFAULT NOW()
);
 
-- 5. TIPOS DE ENTRADA
CREATE TABLE tipos_entrada (
  tipo_entrada_id SERIAL PRIMARY KEY,
  evento_id       INTEGER        NOT NULL REFERENCES eventos(evento_id),
  nombre          VARCHAR(80)    NOT NULL,
  precio          DECIMAL(10, 2) NOT NULL,
  cupo_total      INTEGER        NOT NULL,
  cupo_disponible INTEGER        NOT NULL,
  descripcion     TEXT
);
 
-- 6. COMPRAS (pivot N:M usuarios ↔ tipos_entrada)
CREATE TABLE compras (
  compra_id       SERIAL PRIMARY KEY,
  usuario_id      INTEGER        NOT NULL REFERENCES usuarios(usuario_id),
  tipo_entrada_id INTEGER        NOT NULL REFERENCES tipos_entrada(tipo_entrada_id),
  cantidad        INTEGER        NOT NULL DEFAULT 1,
  precio_total    DECIMAL(10, 2) NOT NULL,
  fecha_compra    TIMESTAMP      DEFAULT NOW(),
  estado_pago     VARCHAR(20)    DEFAULT 'pendiente'
                  CHECK (estado_pago IN ('pendiente', 'completado', 'reembolsado')),
  codigo_qr       VARCHAR(255)   UNIQUE
);
 
-- 7. RESEÑAS (con campos de análisis IA)
CREATE TABLE resenas (
  resena_id                SERIAL PRIMARY KEY,
  usuario_id               INTEGER    NOT NULL REFERENCES usuarios(usuario_id),
  evento_id                INTEGER    NOT NULL REFERENCES eventos(evento_id),
  calificacion             SMALLINT   NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  comentario               TEXT,
  fecha_resena             TIMESTAMP  DEFAULT NOW(),
  ia_sentimiento_resultado VARCHAR(20),   -- 'Positivo' | 'Neutral' | 'Negativo'
  ia_sentimiento_score     NUMERIC(3, 2), -- 0.00 a 1.00
  ia_moderado_bloqueado    BOOLEAN    DEFAULT FALSE,
  UNIQUE (usuario_id, evento_id)
);
 
-- 8. ARTISTAS
CREATE TABLE artistas (
  artista_id       SERIAL PRIMARY KEY,
  nombre_artistico VARCHAR(150) NOT NULL,
  genero_musical   VARCHAR(80),
  bio              TEXT,
  foto_url         VARCHAR(255),
  redes_sociales   JSONB
);
 
-- 9. EVENTO_ARTISTAS (pivot N:M eventos ↔ artistas)
CREATE TABLE evento_artistas (
  evento_id         INTEGER  NOT NULL REFERENCES eventos(evento_id),
  artista_id        INTEGER  NOT NULL REFERENCES artistas(artista_id),
  hora_presentacion TIME,
  orden_escenario   SMALLINT,
  PRIMARY KEY (evento_id, artista_id)
);
 
-- 10. USUARIO_SEGUIMIENTOS (pivot N:M auto-referencial)
CREATE TABLE usuario_seguimientos (
  seguidor_id       INTEGER   NOT NULL REFERENCES usuarios(usuario_id),
  seguido_id        INTEGER   NOT NULL REFERENCES usuarios(usuario_id),
  fecha_seguimiento TIMESTAMP DEFAULT NOW(),
  tipo              VARCHAR(30) NOT NULL,
  PRIMARY KEY (seguidor_id, seguido_id),
  CHECK (seguidor_id <> seguido_id)
);
 
-- 11. NOTIFICACIONES
CREATE TABLE notificaciones (
  notificacion_id SERIAL PRIMARY KEY,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(usuario_id),
  evento_id       INTEGER NOT NULL REFERENCES eventos(evento_id),
  mensaje         TEXT    NOT NULL,
  leida           BOOLEAN   DEFAULT FALSE,
  fecha_creacion  TIMESTAMP DEFAULT NOW()
);
 
-- 12. COMUNIDADES
CREATE TABLE comunidades (
  comunidad_id   SERIAL PRIMARY KEY,
  nombre         VARCHAR(150) NOT NULL,
  descripcion    TEXT,
  categoria_id   INTEGER REFERENCES categorias(categoria_id),
  creada_por     INTEGER REFERENCES usuarios(usuario_id),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);
 
-- 
-- ÍNDICES RECOMENDADOS (para mejorar rendimiento)
-- 
 
-- Búsquedas frecuentes por estado y fecha en eventos
CREATE INDEX idx_eventos_estado       ON eventos(estado);
CREATE INDEX idx_eventos_fecha_inicio ON eventos(fecha_inicio);
CREATE INDEX idx_eventos_organizador  ON eventos(organizador_id);
CREATE INDEX idx_eventos_categoria    ON eventos(categoria_id);
CREATE INDEX idx_eventos_lugar        ON eventos(lugar_id);
 
-- Consultas de compras por usuario
CREATE INDEX idx_compras_usuario      ON compras(usuario_id);
CREATE INDEX idx_compras_estado_pago  ON compras(estado_pago);
 
-- Consultas de tipos de entrada por evento
CREATE INDEX idx_tipos_entrada_evento ON tipos_entrada(evento_id);
 
-- Reseñas por evento
CREATE INDEX idx_resenas_evento       ON resenas(evento_id);
 
-- Notificaciones no leídas por usuario
CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida   ON notificaciones(leida);