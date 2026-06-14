-- =====================================================
-- Elmer Izaguirre
-- T4 - ÍNDICES Y TRANSACCIONES
-- Prueba: Verificación de índices creados
-- Objetivo: Comprobar que los índices idx_% existen
-- =====================================================

SELECT indexname, tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename;

-- =====================================================
-- T4 - ÍNDICES Y TRANSACCIONES
-- Prueba: Detalle completo de índices
-- Objetivo: Ver la definición SQL de cada índice creado
-- =====================================================

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%';

-- =====================================================
-- T4 - ÍNDICES Y TRANSACCIONES
-- Prueba: Verificar evento generado por IA
-- Objetivo: Confirmar que la transacción insertó el evento
-- =====================================================

SELECT
    evento_id,
    titulo,
    creado_con_asistente_ia,
    fecha_creacion
FROM eventos
ORDER BY evento_id DESC
LIMIT 5;

-- =====================================================
-- T4 - ÍNDICES Y TRANSACCIONES
-- Prueba: Verificar tipos de entrada
-- Objetivo: Confirmar que se insertaron General y VIP
-- =====================================================

SELECT
    tipo_entrada_id,
    evento_id,
    nombre,
    precio,
    cupo_total,
    cupo_disponible
FROM tipos_entrada
ORDER BY tipo_entrada_id DESC;

-- =====================================================
-- T4 - ÍNDICES Y TRANSACCIONES
-- Prueba: Ver evento con sus tipos de entrada
-- Objetivo: Demostrar la relación entre eventos y tipos_entrada
-- =====================================================

SELECT
    e.evento_id,
    e.titulo,
    e.creado_con_asistente_ia,
    t.nombre AS tipo_entrada,
    t.precio,
    t.cupo_total
FROM eventos e
INNER JOIN tipos_entrada t
    ON e.evento_id = t.evento_id
ORDER BY e.evento_id DESC;

-- =====================================================
-- T4 - ÍNDICES Y TRANSACCIONES
-- Prueba: Verificación de ROLLBACK
-- Objetivo: Confirmar que el evento de prueba NO fue guardado
-- Resultado esperado: 0 filas
-- =====================================================

SELECT *
FROM eventos
WHERE titulo = 'Evento de Prueba con Error';

-- =====================================================
-- T4 - ÍNDICES Y TRANSACCIONES
-- Prueba final
-- Objetivo: Mostrar eventos generados con IA y sus entradas
-- =====================================================

SELECT
    e.evento_id,
    e.titulo,
    e.creado_con_asistente_ia,
    t.nombre AS tipo_entrada,
    t.precio
FROM eventos e
INNER JOIN tipos_entrada t
    ON e.evento_id = t.evento_id
WHERE e.creado_con_asistente_ia = TRUE
ORDER BY e.evento_id DESC;