/* ════════════════════════════════════════════════════════════════
   API Client — Monitoreo IA Endpoints (Backend E-SINAD)
   AGEBATP — UGEL 03
   
   Todos los endpoints nuevos están en el backend (Easy Panel).
   El frontend se autentica con X-Evidencia-Token.
   NUNCA se envían secretos de OpenAI/Google desde aquí.
   ════════════════════════════════════════════════════════════════ */

const getBase = () => (import.meta.env.VITE_ESINAD_API || '').replace(/\/+$/, '');
const getToken = () => import.meta.env.VITE_EVIDENCIA_TOKEN || '';

async function monitoreoRequest(endpoint, body, timeoutMs = 120000) {
  const base = getBase();
  if (!base) {
    return { ok: false, error: 'VITE_ESINAD_API no configurado. Configure la URL del backend E-SINAD.' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Evidencia-Token': getToken(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, error: `Respuesta no JSON del servidor: ${text.substring(0, 200)}` };
    }

    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}`, status: res.status };
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { ok: false, error: 'Tiempo de espera agotado. El procesamiento puede tardar para archivos grandes.' };
    }
    return { ok: false, error: err.message };
  }
}

/**
 * POST /api/ocr-ficha — Extrae datos JSON de una ficha escaneada usando IA (visión)
 * @param {{ tipoFicha: 'docente'|'director', programa: 'EBA'|'ETP', archivo: { name, mimeType, base64 } }} params
 * @returns {Promise<{ ok, data?, advertencias? }>}
 */
export function ocrFicha({ tipoFicha, programa, archivo }) {
  return monitoreoRequest('/api/ocr-ficha', { tipoFicha, programa, archivo }, 180000);
}

/**
 * POST /api/generar-informe — Genera el cuerpo del informe por IA
 * @param {object} payload — Ver sección 5.3 del mega-prompt
 * @returns {Promise<{ ok, informe? }>}
 */
export function generarInforme(payload) {
  return monitoreoRequest('/api/generar-informe', payload, 120000);
}

/**
 * POST /api/generar-oficio — Genera oficio de felicitación o recomendación por IA
 * @param {object} payload — Ver sección 5.4 del mega-prompt
 * @returns {Promise<{ ok, oficio? }>}
 */
export function generarOficio(payload) {
  return monitoreoRequest('/api/generar-oficio', payload, 90000);
}

/**
 * POST /api/subir-documento — Sube un PDF generado a OneDrive/GDrive y devuelve link
 * @param {object} payload — Ver sección 5.5 del mega-prompt
 * @returns {Promise<{ ok, linkOnedrive?, linkDrive?, carpeta? }>}
 */
export function subirDocumento(payload) {
  return monitoreoRequest('/api/subir-documento', payload, 60000);
}

/**
 * Convierte un File a base64
 * @param {File} file 
 * @returns {Promise<{ name, mimeType, base64 }>}
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ name: file.name, mimeType: file.type, base64 });
    };
    reader.onerror = reject;
  });
}
