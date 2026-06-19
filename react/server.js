
/* global process */
import dotenv from "dotenv";
dotenv.config();
console.log("DATABASE_URL:");
console.log(process.env.DATABASE_URL);
console.log("GEMINI_API_KEY:");
console.log(process.env.GEMINI_API_KEY);

import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/", (req, res) => {
  res.json({ mensaje: "Backend EventHub funcionando" });
});
/*ENDPOINT DE COMPRA DE TRANSACCIONES UTILIZANDO UPDATE */
app.post("/api/comprar-entrada", async (req, res) => {
 const client = await pool.connect();

 try {
  const {
    usuario_id,
    tipo_entrada_id,
    cantidad,
  } = req.body;

  if (!usuario_id || !tipo_entrada_id || !cantidad) {
    return res.status(400).json({ error: "Faltan datos para realizar la compra" });
  }

  await client.query("BEGIN");

  const entradaResult = await client.query(
    `
    SELECT *
    FROM tipos_entrada
    WHERE tipo_entrada_id = $1
    FOR UPDATE
    `,
    [tipo_entrada_id]
  );

  if (entradaResult.rows.length === 0) {
    await client.query("ROLLBACK");
    return res.status(404).json({ error: "Tipo de entrada no encontrado" });
  }

  const entrada = entradaResult.rows[0];

  if (entrada.cupo_disponible < cantidad) {
    await client.query("ROLLBACK");
    return res.status(400).json({ error: "No hay suficientes entradas disponibles" });
  }

  const codigoQr = `EVH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const compraResult = await client.query(
    `
    INSERT INTO compras(
      usuario_id,
      tipo_entrada_id,
      cantidad,
      precio_total,
      estado_pago,
      codigo_qr
    )
    VALUES($1,$2,$3,$4,'pendiente',$5)
    RETURNING *`,
    [
      usuario_id,
      tipo_entrada_id,
      cantidad,
      entrada.precio * cantidad,
      codigoQr,
    ]
  );

  await client.query(
    `
    UPDATE tipos_entrada
    SET cupo_disponible = cupo_disponible - $1
    WHERE tipo_entrada_id = $2
    `,
    [cantidad, tipo_entrada_id]
  );

  await client.query("COMMIT");

  res.json({
    success: true,
    mensaje: "Compra realizada exitosamente",
    compra: compraResult.rows[0],
  });
 } catch (error) {
  await client.query("ROLLBACK");
  console.error(error);

  res.status(500).json({
    success: false,
    error: error.message,
  });
 } finally {
  client.release();
 }
});

app.post("/api/generar-evento-ia", async (req, res) => {
  const client = await pool.connect();

  try {
    const { descripcion, organizador_id, categoria_id, lugar_id } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
Genera un evento para Honduras en JSON.
Usa precios en HNL.
Devuelve solo JSON, sin explicación.


Descripción del usuario: ${descripcion}


Formato:
{
  "titulo": "",
  "descripcion": "",
  "fecha_inicio": "2026-07-01 18:00:00",
  "fecha_fin": "2026-07-01 23:00:00",
  "tipos_entrada": [
    {
      "nombre": "General",
      "precio": 250,
      "cupo_total": 100,
      "cupo_disponible": 100,
      "descripcion": "Entrada general"
    },
    {
      "nombre": "VIP",
      "precio": 600,
      "cupo_total": 30,
      "cupo_disponible": 30,
      "descripcion": "Entrada VIP"
    }
  ]
}

`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const limpio = text.replace(/```json|```/g, "").trim();
    const eventoIA = JSON.parse(limpio);

    await client.query("BEGIN");
    await client.query("SAVEPOINT evento_ia");

    const eventoInsertado = await client.query(
      `
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
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      RETURNING evento_id, titulo, descripcion, fecha_inicio, fecha_fin
      `,
      [
        eventoIA.titulo,
        eventoIA.descripcion,
        eventoIA.fecha_inicio,
        eventoIA.fecha_fin,
        organizador_id || 1,
        categoria_id || 1,
        lugar_id || 1,
      ]
    );

    const eventoId = eventoInsertado.rows[0].evento_id;

    await client.query("SAVEPOINT entradas_ia");

    for (const entrada of eventoIA.tipos_entrada) {
      await client.query(
        `
        INSERT INTO tipos_entrada (
          evento_id,
          nombre,
          precio,
          cupo_total,
          cupo_disponible,
          descripcion
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          eventoId,
          entrada.nombre,
          entrada.precio,
          entrada.cupo_total,
          entrada.cupo_disponible,
          entrada.descripcion,
        ]
      );
    }

    await client.query("COMMIT");

    res.json({
      mensaje: "Evento generado con IA e insertado correctamente",
      evento: eventoInsertado.rows[0],
      tipos_entrada: eventoIA.tipos_entrada,
    });
  } catch (error) {

    console.error(error);

    await client.query("ROLLBACK");


    res.status(500).json({
      error: "Error al generar o insertar el evento",
      detalle: error.message,
    });
  } finally {
    client.release();
  }
});
/* IA #1 MODERACION DE RESEÑAS REAL*/
app.post('/api/moderar-resena', async (req, res)=>{
  try{
    const{comentario} = req.body;
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt=`
    Analiza esta reseña.
    
    devuelve SOLO JSON{
    "APROBADO": true,
    "sentimiento": "positivo";
    "score": 0.95
    }
    Comentario:
"${comentario}"
`;

    const result = await model.generateContent(prompt);

    const respuesta = result.response.text();

    const limpio = respuesta
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const analisis = JSON.parse(limpio);

    res.json({
      ...analisis,
      fuente: "gemini"
    });

  } catch (error) {

    console.error(error);

    res.json({
      aprobado: true,
      sentimiento: 'neutral',
      score: 0.5,
      fuente: 'fallback'
    });
  }
});

/*IA #3 FEED PERSONALIZADO REAL
 Devuelve un feed de eventos personalizados para el usuario, basado en sus intereses y comportamiento pasado. Utiliza IA para analizar los datos del usuario y generar recomendaciones relevantes. */
app.get('/api/feed-personalizado/:usuarioId', async (req, res) => {
  const cliente = await pool.connect();

  try {
    const { usuarioId } = req.params;

    const compras = await cliente.query(
      `
      SELECT
        e.titulo,
        c.nombre AS categoria
      FROM compras co
      INNER JOIN tipos_entrada te
        ON co.tipo_entrada_id = te.tipo_entrada_id
      INNER JOIN eventos e
        ON te.evento_id = e.evento_id
      INNER JOIN categorias c
        ON e.categoria_id = c.categoria_id
      WHERE co.usuario_id = $1
      `,
      [usuarioId]
    );

    if (compras.rows.length === 0) {
      const eventos = await cliente.query(`
        SELECT evento_id,titulo,descripcion
        FROM eventos
        WHERE estado='publicado'
        LIMIT 5
      `);

      return res.json({
        fuente: "fallback",
        recomendaciones: eventos.rows
      });
    }

    const historial = compras.rows
      .map(c => `${c.titulo} - ${c.categoria}`)
      .join("\n");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Analiza los gustos del usuario.

Historial:

${historial}

Devuelve únicamente JSON.

{
  "categorias_recomendadas":[]
}
`;

    const result = await model.generateContent(prompt);

    const texto = result.response
      .text()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const respuestaIA = JSON.parse(texto);

    const categorias =
      respuestaIA.categorias_recomendadas || [];

    const eventos = await cliente.query(
      `
      SELECT
        e.evento_id,
        e.titulo,
        e.descripcion,
        c.nombre AS categoria
      FROM eventos e
      INNER JOIN categorias c
        ON e.categoria_id = c.categoria_id
      WHERE c.nombre = ANY($1)
      AND e.estado = 'publicado'
      LIMIT 10
      `,
      [categorias]
    );

    res.json({
      fuente: "gemini",
      categoriasDetectadas: categorias,
      recomendaciones: eventos.rows
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  } finally {
    cliente.release();
  }
});
pool.connect()
  .then(() => {
   
});
app.get("/rutas", (req, res) => {
  res.json({
    ok: true,
    rutas: [
      "/api/comprar-entrada",
      "/api/generar-evento-ia",
      "/api/moderar-resena",
      "/api/feed-personalizado/:usuarioId"
    ]
  });
});
app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});