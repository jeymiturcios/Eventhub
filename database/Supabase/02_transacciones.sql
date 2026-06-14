BEGIN;

SAVEPOINT crear_evento_ia;

WITH evento_insertado AS (
  INSERT INTO eventos (
    titulo,
    descripcion,
    fecha_inicio,
    fecha_fin,
    organizador_id,
    categoria_id,
    lugar_id,
    creado_con_asistente_ia
  )
  VALUES (
    'Evento de prueba IA',
    'Evento generado por IA para prueba de transacción',
    '2026-07-01 18:00:00',
    '2026-07-01 23:00:00',
    1,
    1,
    1,
    TRUE
  )
  RETURNING evento_id
)

INSERT INTO tipos_entrada (
  evento_id,
  nombre,
  precio,
  cupo_total,
  cupo_disponible,
  descripcion
)
SELECT
  evento_id,
  'General',
  250,
  100,
  100,
  'Entrada general en HNL'
FROM evento_insertado

UNION ALL

SELECT
  evento_id,
  'VIP',
  600,
  30,
  30,
  'Entrada VIP en HNL'
FROM evento_insertado;

COMMIT;