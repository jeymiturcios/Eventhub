require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend EventHub funcionando correctamente",
  });
});

app.post("/api/generar-evento-ia", async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion) {
      return res.status(400).json({
        error: "Debes escribir una descripción",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
Genera un evento para Honduras en formato JSON.
Usa precios en lempiras HNL.
No escribas explicaciones, solo JSON.

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
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const limpio = text.replace(/```json|```/g, "").trim();
    const evento = JSON.parse(limpio);

    res.json({
      mensaje: "Evento generado con IA correctamente",
      evento,
    });

  } catch (error) {
    res.status(500).json({
      error: "Error al generar el evento",
      detalle: error.message,
    });
  }
});

app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});