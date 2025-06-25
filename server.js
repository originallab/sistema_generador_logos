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

// Función auxiliar para subir imagen a AWS S3
async function uploadImageToS3(imageUrl, filename) {
  try {
    // Descargar la imagen desde DALL-E
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();

    // Subir al S3 usando tu API Gateway
    const s3UploadUrl = `https://kneib5mp53.execute-api.us-west-2.amazonaws.com/dev/folder/bucket-logolab/${filename}`;
    
    const uploadResponse = await fetch(s3UploadUrl, {
      method: 'PUT',
      body: imageBuffer,
      headers: {
        'Content-Type': 'image/png'
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error al subir a S3: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    // Retornar la URL del archivo subido
    return s3UploadUrl;
  } catch (error) {
    console.error('Error subiendo imagen a S3:', error);
    throw error;
  }
}


// Endpoint para generar logos
app.post('/api/generate', async (req, res) => {
  // Obtener TODOS los datos del formulario
  const { 
    brand,
    industry,
    visualElement,
    logoType,
    typography,
    logoStyle,
    colorPalette,
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
    Diseña un logo para una empresa llamada "${brand}", dedicada a la industria de "${industry}".

    Especificaciones:
    - Un simbolo visual plano que represente: ${visualElement}
    - Composición: ${logoType}
    - Tipografía: ${typography}
    - Estilo de diseño: ${logoStyle || "moderno, elegante, limpio"}
    - Paleta de colores: ${colorPalette}
    ${vision ? `- Visión de la empresa: ${vision}` : ''}
    ${mission ? `- Misión de la empresa: ${mission}` : ''}

    Por favor, crea un prompt detallado para DALL·E que describa exactamente cómo debería ser este logo, incluyendo todos los elementos, colores, disposición y estilo.

    ⚠️ Importante:
    - El logo debe ser plano, con líneas limpias y sin degradados, sombras ni texturas.
    - Genera el simbolo y el nombre o dependiendo de la descripción del "${logoType}" 
    - Evita incluir muchos detalles, decoraciones, degradados en entre los colores del logo, sombras ni texturas innecesarias.
    - Evita agregar palabras que no sean el nombre exacto de la empresa: "${brand}".
    - Verifica que el texto esté correctamente escrito, sin errores ortográficos o palabras alteradas.
    - Evita mostrar texto adicional, palabras irrelevantes o errores ortográficos.
    - Evita incluir marcos, bordes, ni elementos decorativos alrededor del logo.
    - El logo debe ser plano (flat design), con estilo limpio y profesional.
    - Fondo blanco o transparente únicamente.
    - No incluir estilos vintage, grabados, relieves ni ilustraciones realistas.
    - Usa colores planos definidos por la paleta: ${colorPalette}.
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
        size:  "1024x1024",
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




// Ruta en el backend para descargar la imagen
app.get('/api/download', async (req, res) => {
  const { imageUrl, filename } = req.query;

  try {
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error en descarga backend:', error);
    res.status(500).send('Error al descargar imagen');
  }
});


// Nuevo endpoint para subir imágenes manualmente a S3
app.post('/api/upload-to-s3', async (req, res) => {
  const { imageUrl, filename } = req.body;

  if (!imageUrl || !filename) {
    return res.status(400).json({ error: 'Se requieren imageUrl y filename' });
  }

  try {
    const s3Url = await uploadImageToS3(imageUrl, filename);
    res.json({ 
      success: true, 
      s3Url: s3Url,
      message: 'Imagen subida exitosamente a S3'
    });
  } catch (error) {
    console.error('Error subiendo a S3:', error);
    res.status(500).json({ 
      error: 'Error subiendo imagen a S3: ' + error.message 
    });
  }
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});