// Elementos DOM
const logoForm = document.getElementById('logo-form');
const generateBtn = document.getElementById('generate-btn');
const resultContainer = document.getElementById('result-container');
const spinner = document.getElementById('spinner');
const resultContent = document.getElementById('result-content');
const logoImage = document.getElementById('logo-image');
const promptText = document.getElementById('prompt-text');
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
  const brand = formData.get('brand');
  const industry = formData.get('industry');
  const visualElement = formData.get('visualElement');
  const textPosition = formData.get('textPosition');
  const logoType = formData.get('logoType');
  const typography = formData.get('typography');
  const logoStyle = formData.get('logoStyle');
  const colorPalette = formData.get('colorPalette');
  const imageSize = formData.get('imageSize');

  // Guardar los datos para posible regeneración
  currentFormData = {
    brand,
    industry,
    visualElement,
    textPosition,
    logoType,
    typography,
    logoStyle,
    colorPalette,
    imageSize
  };

  // Mostrar spinner
  resultContainer.style.display = 'block';
  spinner.style.display = 'block';
  resultContent.style.display = 'none';

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

  // Ocultar spinner y mostrar contenido
  spinner.style.display = 'none';
  resultContent.style.display = 'block';

  // Scroll al resultado
  resultContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Maneja la descarga del logo generado
 */
async function handleDownload() {
  if (!logoImage.src) return;

  try {
    const a = document.createElement('a');
    a.href = logoImage.src;
    a.download = `logo-${currentFormData.brand}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    showError('Error al descargar el logo');
    console.error('Error de descarga:', error);
  }
}

/**
 * Maneja la regeneración del logo
 */
async function handleRegenerate() {
  if (!currentFormData) return;

  spinner.style.display = 'block';
  resultContent.style.display = 'none';

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
  spinner.style.display = 'none';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  errorDiv.style.color = '#ef4444';
  errorDiv.style.padding = '1rem';

  resultContainer.appendChild(errorDiv);

  setTimeout(() => {
    resultContainer.removeChild(errorDiv);
  }, 5000);
}
