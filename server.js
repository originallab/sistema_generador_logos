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
  // Obtener TODOS los datos del formulario
  const { 
    brand,
    industry,
    visualElement,
    textPosition,
    logoType,
    typography,
    logoStyle,
    colorPalette,
    imageSize,
    vision,
    mission 
  } = req.body;

  // Crear una descripción detallada para la generación del logo
  const systemPrompt = `
  Eres un diseñador gráfico profesional con amplia experiencia en branding visual. 
  Tu tarea es tomar los datos del cliente para crear una pormpt adecuado para DALL-E 3, 
  que permita crear un logo profesional, original, limpio, sin detalles adicionales. 

  Debes traducir las especificaciones del cliente en una descripción rica en detalles visuales, 
  incluyendo estilo gráfico, composición, colores, forma, tipografía y elementos simbólicos. 
  Tu prioridad es que el resultado refleje la identidad y visión de la empresa, y cumpla con principios de diseño como simplicidad, legibilidad y escalabilidad.
  `;


  const userPrompt = `
    Necesito un logo para una empresa llamada "${brand}" en la industria "${industry}".

    Especificaciones:
    - Elemento visual principal: ${visualElement}
    - Posición del texto en el logo: ${textPosition}
    - Tipo de logo: ${logoType}
    - Tipografía: ${typography}
    - Estilo de diseño: ${logoStyle || "No especificado"}
    - Paleta de colores: ${colorPalette}
    - Tamaño de imagen: ${imageSize}
    ${vision ? `- Visión de la empresa: ${vision}` : ''}
    ${mission ? `- Misión de la empresa: ${mission}` : ''}

    Por favor, crea un prompt detallado para DALL·E que describa exactamente cómo debería ser este logo, incluyendo todos los elementos, colores, disposición y estilo.

    ⚠️ Importante: 
    - Evita incluir mucho detalle, puntos, líneas decorativas, degradados, sombras ni texturas innecesarias.
    - Evita agregar palabras que no sean el nombre exacto de la empresa: "${brand}".
    - Evita mostrar texto adicional, palabras irrelevantes o errores ortográficos.
    - Evita incluir marcos, bordes, ni elementos decorativos alrededor del logo.
    - El logo debe ser plano (flat design), con estilo limpio y profesional.
    - Fondo blanco o transparente únicamente.
    `;



  try {
    // 1. Prompt con ChatGPT para generar descripción para DALL-E
    const chatResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY_2}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800
      })
    });

    const chatData = await chatResp.json();
    
    if (!chatData.choices || !chatData.choices[0]) {
      throw new Error("Error en la respuesta de OpenAI: " + JSON.stringify(chatData));
    }
    
    const dallePrompt = chatData.choices[0].message.content;

    // 2. Generar una explicación detallada del logo
    const explanationResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY_2}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Eres un experto en diseño y branding. Explica en detalle el significado y los elementos de este logo." },
          { role: "user", content: `Basado en este prompt de DALL-E: "${dallePrompt}", explica detalladamente:
            1. Qué elementos componen el logo y cómo se relacionan
            2. Por qué estos elementos son adecuados para la marca "${brand}" en la industria "${industry}"
            3. Cómo se integraron los requisitos del cliente (elemento visual: ${visualElement}, estilo: ${logoStyle}, tipo: ${logoType})
            4. Qué transmite este logo a nivel emocional y de branding
            ${vision ? `5. Cómo refleja la visión de la empresa: "${vision}"` : ''}
            ${mission ? `6. Cómo apoya la misión de la empresa: "${mission}"` : ''}
            
            Escribe un párrafo de 6-8 oraciones, no uses formato de lista numerada.` 
          }
        ],
        max_tokens: 500
      })
    });

    const explanationData = await explanationResp.json();
    const logoExplanation = explanationData.choices[0].message.content;

    // 3. Imagen con DALL·E
    const imageResp = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: dallePrompt,
        size: imageSize || "1024x1024",
        n: 1
      })
    });

    const imageData = await imageResp.json();
    
    if (!imageData.data || !imageData.data[0] || !imageData.data[0].url) {
      throw new Error("Error en la generación de imagen: " + JSON.stringify(imageData));
    }
    
    const imageUrl = imageData.data[0].url;

    // Devolver todos los datos al cliente
    res.json({ 
      imageUrl, 
      prompt: dallePrompt, 
      explanation: logoExplanation,
      originalRequest: req.body  // Opcional: para depuración
    });

  } catch (err) {
    console.error("Error detallado:", err);
    res.status(500).json({ error: "Error generando el logo: " + err.message });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});