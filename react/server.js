import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

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
    console.error(error);

    res.status(500).json({
      error: "Error al generar el evento",
      detalle: error.message,
    });
  }
});

app.listen(3001, () => {
  console.log("Servidor corriendo en http://localhost:3001");
});