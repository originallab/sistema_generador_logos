// Elementos DOM
const logoForm = document.getElementById('logo-form');
const generateBtn = document.getElementById('generate-btn');
const resultContainer = document.getElementById('result-container');
const spinner = document.getElementById('spinner');
const resultContent = document.getElementById('result-content');
const logoImage = document.getElementById('logo-image');
const promptText = document.getElementById('prompt-text');
const explanationText = document.getElementById('explanation-text');
const downloadBtn = document.getElementById('download-btn');
const regenerateBtn = document.getElementById('regenerate-btn');
const colorPalette = document.getElementById('colorPalette');
const colorPreview = document.getElementById('color-preview');

// Variables globales
let currentFormData = null;

// Event Listeners
logoForm.addEventListener('submit', handleFormSubmit);
downloadBtn.addEventListener('click', handleDownload);
regenerateBtn.addEventListener('click', handleRegenerate);
colorPalette.addEventListener('change', updateColorPreview);

// Inicializar la previsualización de colores
updateColorPreview();

// Paletas de colores predefinidas
const colorPalettes = {
  'Rojos': ['#FF0000', '#FF5757'],
  'Azules': ['#0000FF', '#5757FF'],
  'Verdes': ['#00FF00', '#57FF57'],
  'Amarillos': ['#FFFF00', '#FFFF57'],
  'Morados': ['#800080', '#B300B3'],
  'Naranjas': ['#FFA500', '#FFB857'],
  'Blanco y Negro': ['#000000', '#FFFFFF'],
  'Pasteles': ['#FFB6C1', '#ADD8E6']
};

/**
 * Actualiza la previsualización de colores según la paleta seleccionada
 */
function updateColorPreview() {
  const selectedPalette = colorPalette.value;
  const colors = colorPalettes[selectedPalette] || ['#FF0000', '#FF5757'];

  // Limpiar previsualización actual
  colorPreview.innerHTML = '';

  // Crear nuevos elementos de color
  colors.forEach(color => {
    const colorBox = document.createElement('div');
    colorBox.className = 'color-box';
    colorBox.style.backgroundColor = color;
    colorPreview.appendChild(colorBox);
  });
}

/**
 * Maneja el envío del formulario
 * @param {Event} e - Evento de submit
 */
async function handleFormSubmit(e) {
  e.preventDefault();

  // Obtener los datos del formulario
  const formData = new FormData(logoForm);
  const data = {};
  
  // Convertir FormData a objeto y guardar todos los campos
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  // Guardar los datos para posible regeneración
  currentFormData = data;

  // Mostrar spinner
  resultContainer.classList.add('active');
  spinner.classList.add('active');
  resultContent.classList.remove('active');

  try {
    await generateLogo(currentFormData);
  } catch (error) {
    showError('Ha ocurrido un error al generar el logo. Por favor, intenta de nuevo.');
    console.error('Error:', error);
  }
}

/**
 * Genera un logo utilizando la API
 * @param {Object} data - Datos para generar el logo
 */
async function generateLogo(data) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en la generación del logo');
  }

  const result = await response.json();

  // Mostrar el resultado
  logoImage.src = result.imageUrl;
  promptText.textContent = result.prompt;
  
  // Mostrar la explicación del logo si está disponible
  if (result.explanation) {
    explanationText.textContent = result.explanation;
    document.getElementById('explanation-container').classList.add('active');
  }

  // Ocultar spinner y mostrar contenido
  spinner.classList.remove('active');
  resultContent.classList.add('active');

  // Scroll al resultado
  resultContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Maneja la descarga del logo generado
 */
async function handleDownload() {
  if (!logoImage.src) return;

  const filename = `logo-${currentFormData.brand.replace(/\s+/g, '-')}.png`;

  const downloadUrl = `/api/download?imageUrl=${encodeURIComponent(logoImage.src)}&filename=${filename}`;

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
/**
 * Maneja la regeneración del logo
 */
async function handleRegenerate() {
  if (!currentFormData) return;

  spinner.classList.add('active');
  resultContent.classList.remove('active');

  try {
    await generateLogo(currentFormData);
  } catch (error) {
    showError('Ha ocurrido un error al regenerar el logo');
    console.error('Error:', error);
  }
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 */
function showError(message) {
  spinner.classList.remove('active');

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = '#ef4444';
  errorDiv.style.padding = '1rem';
  errorDiv.style.marginTop = '1rem';
  errorDiv.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
  errorDiv.style.borderRadius = 'var(--border-radius)';
  errorDiv.style.textAlign = 'center';

  resultContainer.appendChild(errorDiv);

  setTimeout(() => {
    if (resultContainer.contains(errorDiv)) {
      resultContainer.removeChild(errorDiv);
    }
  }, 5000);
}