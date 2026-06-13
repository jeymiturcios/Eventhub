-- =====================================================
-- Elmer Izaguirre
-- T4 - ÍNDICES Y TRANSACCIONES
-- Archivo: 02_transacciones_elmer.sql
-- Objetivo: Insertar un evento generado por IA de forma segura
-- =====================================================

BEGIN;

SAVEPOINT sp_evento_ia;

-- 1. Insertar evento generado por IA
INSERT INTO eventos (
    titulo,
    descripcion,
    fecha_inicio,
    fecha_fin,
    imagen_banner,
    estado,
    organizador_id,
    categoria_id,
    lugar_id,
    creado_con_asistente_ia,
    fecha_creacion
)
VALUES (
    'Concierto de Salsa en Tegucigalpa',
    'Evento generado automáticamente por IA para demostrar transacciones en EventHub.',
    '2026-07-20 19:00:00',
    '2026-07-20 23:00:00',
    'https://example.com/banner-salsa.jpg',
    'publicado',
    1,
    1,
    1,
    TRUE,
    NOW()
);

-- 2. Insertar tipos de entrada relacionados al evento
-- IMPORTANTE: usa el último evento creado con currval()
INSERT INTO tipos_entrada (
    evento_id,
    nombre,
    precio,
    cupo_total,
    cupo_disponible,
    descripcion
)
VALUES
(
    currval('eventos_evento_id_seq'),
    'VIP',
    1200.00,
    100,
    100,
    'Entrada VIP con acceso preferencial'
),
(
    currval('eventos_evento_id_seq'),
    'General',
    600.00,
    300,
    300,
    'Entrada general al evento'
),
(
    currval('eventos_evento_id_seq'),
    'Estudiante',
    350.00,
    150,
    150,
    'Entrada con descuento para estudiantes'
);

COMMIT;