BEGIN;

SAVEPOINT sp_prueba_error;

INSERT INTO eventos (
    titulo,
    descripcion,
    fecha_inicio,
    fecha_fin,
    estado,
    organizador_id,
    categoria_id,
    lugar_id,
    creado_con_asistente_ia
)
VALUES (
    'Evento de Prueba con Error',
    'Este evento no debe guardarse porque se hará rollback.',
    '2026-08-01 18:00:00',
    '2026-08-01 22:00:00',
    'publicado',
    1,
    1,
    1,
    TRUE
);

ROLLBACK TO SAVEPOINT sp_prueba_error;

COMMIT;