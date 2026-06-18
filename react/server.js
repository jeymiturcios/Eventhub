
require("dotenv").config({ path: "./react/.env" });
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const { GoogleGenerativeAI } = require("@google/generative-ai");

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

app.post("/api/generar-evento-ia", async (req, res) => {
  const client = await pool.connect();

  try {
    const { descripcion, organizador_id, categoria_id, lugar_id } = req.body;

    if (!descripcion) {
      return res.status(400).json({ error: "La descripción es obligatoria" });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
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

app.post('/api/moderar-resena', async (req, res) => {
  const {comentario} = req.body;

  const palabrasProhibidas = ['malo', 'horrible', 'terrible', 'pésimo', 'asqueroso']
  const ofensivo = palabrasProhibidas.some(palabra => comentario && comentario.toLowerCase().includes(palabra));

  if (ofensivo) {
    return res.json({
      aprobado: false,
      sentimiento: 'negativo',
      mensaje: 'Comentario rechazado por contener lenguaje ofensivo.',
      score: 0,
      fuente: 'fallback'
    });
  }

  res.json({
    aprobado: true,
    sentimiento: 'positivo',
    mensaje: 'Comentario aprobado.',
    score: 0.9,
    fuente: 'filtro simple'
  });
});

app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});