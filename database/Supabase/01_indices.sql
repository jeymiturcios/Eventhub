CREATE INDEX IF NOT EXISTS idx_eventos_fecha_inicio
ON eventos(fecha_inicio);

CREATE INDEX IF NOT EXISTS idx_eventos_categoria_id
ON eventos(categoria_id);

CREATE INDEX IF NOT EXISTS idx_compras_usuario_id
ON compras(usuario_id);