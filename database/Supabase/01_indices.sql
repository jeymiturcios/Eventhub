-- =====================================================
-- Elmer Izaguirre
-- T4 - ÍNDICES Y TRANSACCIONES
-- Archivo: 01_indices_elmer.sql
-- Objetivo: Optimizar consultas frecuentes en EventHub
-- =====================================================

-- Índice para buscar eventos por categoría
CREATE INDEX IF NOT EXISTS idx_eventos_categoria
ON eventos(categoria_id);

-- Índice para buscar eventos por organizador
CREATE INDEX IF NOT EXISTS idx_eventos_organizador
ON eventos(organizador_id);

-- Índice para buscar eventos por lugar
CREATE INDEX IF NOT EXISTS idx_eventos_lugar
ON eventos(lugar_id);

-- Índice para consultar tipos de entrada por evento
CREATE INDEX IF NOT EXISTS idx_tipos_entrada_evento
ON tipos_entrada(evento_id);

-- Índice para consultar compras por usuario
CREATE INDEX IF NOT EXISTS idx_compras_usuario
ON compras(usuario_id);

-- Índice para consultar compras por tipo de entrada
CREATE INDEX IF NOT EXISTS idx_compras_tipo_entrada
ON compras(tipo_entrada_id);

-- Índice para consultar reseñas por evento
CREATE INDEX IF NOT EXISTS idx_resenas_evento
ON resenas(evento_id);

-- Índice para consultar reseñas por usuario
CREATE INDEX IF NOT EXISTS idx_resenas_usuario
ON resenas(usuario_id);