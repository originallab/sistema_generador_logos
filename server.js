import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Configuración de entorno
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Endpoint para generar logos
app.post('/api/generate', async (req, res) => {
  const { brand, style, colors } = req.body;

  const userInput = `Quiero un logo para una marca llamada "${brand}", estilo: ${style}, colores: ${colors}`;

  try {
    // 1. Prompt con ChatGPT
    const chatResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY_2}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Eres un experto en diseño de logos." },
          { role: "user", content: userInput }
        ],
        max_tokens: 100
      })
    });

    const chatData = await chatResp.json();
    const dallePrompt = chatData.choices[0].message.content;

    // 2. Imagen con DALL·E
    const imageResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: dallePrompt,
        size: "1024x1024",
        n: 1
      })
    });

    const imageData = await imageResp.json();
    const imageUrl = imageData.data[0].url;

    res.json({ imageUrl, prompt: dallePrompt });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generando el logo" });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});