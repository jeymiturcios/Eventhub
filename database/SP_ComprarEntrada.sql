-- STORED PROCEDURE: comprar_entrada
-- Descripción: Procesa la compra de entradas y actualiza cupo

CREATE OR REPLACE FUNCTION comprar_entrada(
  p_usuario_id INTEGER,
  p_tipo_entrada_id INTEGER,
  p_cantidad INTEGER,
  p_codigo_qr VARCHAR(255)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_precio DECIMAL(10,2);
  v_precio_total DECIMAL(10,2);
  v_cupo_disponible INTEGER;
  v_nuevo_cupo INTEGER;
  v_compra_id INTEGER;
  v_evento_id INTEGER;
  v_titulo_evento VARCHAR(200);
BEGIN
  -- Obtener precio y cupo
  SELECT precio, cupo_disponible, evento_id 
  INTO v_precio, v_cupo_disponible, v_evento_id
  FROM tipos_entrada
  WHERE tipo_entrada_id = p_tipo_entrada_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Tipo de entrada no existe');
  END IF;
  
  IF v_cupo_disponible < p_cantidad THEN
    RETURN json_build_object('success', false, 'message', 'No hay cupo suficiente');
  END IF;
  
  v_precio_total := v_precio * p_cantidad;
  v_nuevo_cupo := v_cupo_disponible - p_cantidad;
  
  -- Insertar compra
  INSERT INTO compras (
    usuario_id, tipo_entrada_id, cantidad, precio_total, estado_pago, codigo_qr, fecha_compra
  ) VALUES (
    p_usuario_id, p_tipo_entrada_id, p_cantidad, v_precio_total, 'completado', p_codigo_qr, NOW()
  )
  RETURNING compra_id INTO v_compra_id;
  
  -- Actualizar cupo
  UPDATE tipos_entrada
  SET cupo_disponible = v_nuevo_cupo
  WHERE tipo_entrada_id = p_tipo_entrada_id;
  
  SELECT titulo INTO v_titulo_evento FROM eventos WHERE evento_id = v_evento_id;
  
  RETURN json_build_object(
    'success', true,
    'compra_id', v_compra_id,
    'evento', v_titulo_evento,
    'cantidad', p_cantidad,
    'precio_total', v_precio_total,
    'cupo_restante', v_nuevo_cupo
  );
END;
$$;