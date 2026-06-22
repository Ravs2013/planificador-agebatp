# Backend Endpoints — Módulo de Monitoreo con IA

> **Destino**: Herramienta E-SINAD (`https://governia-esinad.xv74e4.easypanel.host`)
> **Autenticación**: Todos los endpoints validan `X-Evidencia-Token` en el header.

## Variables de entorno requeridas en el backend

```env
OPENAI_API_KEY=sk-...             # Para generación de informes/oficios/OCR
EVIDENCIA_TOKEN=<shared-token>    # Token compartido con el frontend
STORAGE_PROVIDERS=onedrive        # Opcional: habilita subida a OneDrive
ONEDRIVE_CLIENT_ID=...            # Si se usa OneDrive
ONEDRIVE_CLIENT_SECRET=...
ONEDRIVE_REFRESH_TOKEN=...
ONEDRIVE_FOLDER_ID=...
```

---

## 1. `POST /api/ocr-ficha`

Extrae datos JSON de una ficha escaneada usando visión por IA (GPT-4o).

### Request
```json
{
  "tipoFicha": "docente",       // "docente" | "director"
  "programa": "EBA",            // "EBA" | "ETP"
  "archivo": {
    "name": "ficha_001.pdf",
    "mimeType": "application/pdf",
    "base64": "<base64>"
  }
}
```

### Response (200 OK)
```json
{
  "ok": true,
  "data": {
    "docenteNombre": "PÉREZ GARCÍA, MARÍA ELENA",
    "docenteDni": "12345678",
    "institucionCodigo": "0123456",
    "institucionNombre": "CEBA REPÚBLICA DE PANAMÁ",
    "monitorNombre": "NÉLIDA ALBINO IGREDA",
    "fechaEjecucion": "15/06/2026",
    "fechaEjecucionISO": "2026-06-15",
    "grado": "3ro Avanzado",
    "areaCurricular": "Comunicación",
    "desempeno": {
      "involucraEstudiantes": { "raw": "III", "nivel": 3 },
      "promueveRazonamiento": { "raw": "II", "nivel": 2 },
      "evaluaProgreso": { "raw": "III", "nivel": 3 },
      "ambienteRespeto": { "raw": "IV", "nivel": 4 },
      "regulaComportamiento": { "raw": "III", "nivel": 3 }
    },
    "planificacion": {
      "planificacionAnual": { "raw": "III", "nivel": 3 },
      "situacionSignificativa": { "raw": "II", "nivel": 2 },
      "secuenciaMetodologica": { "raw": "III", "nivel": 3 },
      "metodologiaActiva": { "raw": "III", "nivel": 3 },
      "usoPedagogicoRecursos": { "raw": "II", "nivel": 2 }
    },
    "compromisos": "Implementar estrategias de razonamiento en próximas sesiones.",
    "observaciones": null,
    "promedioDesempeno": 3.0,
    "promedioPlanificacion": 2.6,
    "promedioGeneral": 2.8,
    "nivelGeneralLabel": "Nivel III",
    "advertencias": ["El campo 'grado' fue inferido del contexto."]
  }
}
```

### Prompt de IA (referencia)
```
Eres un asistente que extrae datos de fichas de monitoreo pedagógico escaneadas.
Analiza la imagen y extrae TODOS los campos del modelo JSON adjunto.
Si un campo no es legible, devuelve null y añade una advertencia.
Los niveles van de I a IV (1 a 4). Respeta exactamente las claves del JSON.
```

---

## 2. `POST /api/generar-informe`

Genera el cuerpo de un informe de monitoreo usando IA.

### Request
```json
{
  "tipo": "individual",           // "individual" | "consolidado"
  "tipoMonitoreo": "docente",     // "docente" | "director"
  "programa": "EBA",
  "especialista": {
    "nombre": "Nélida Albino Igreda",
    "cargo": "Especialista de Educación Básica Alternativa"
  },
  "jefatura": {
    "nombre": "Rosa Isabel Ninamango Baldeon",
    "cargo": "Jefa del Área AGEBATP"
  },
  "periodo": { "mes": "junio", "anio": 2026 },
  "acta": { "...datos del acta..." },
  "fichas": [ "...array de fichas con desempeño..." ],
  "linkEvidenciasOnedrive": "https://...",
  "kpis": { "...solo para consolidados..." }
}
```

### Response (200 OK)
```json
{
  "ok": true,
  "informe": {
    "asunto": "Informe de monitoreo y acompañamiento pedagógico al CEBA...",
    "referencia": "Plan de Trabajo AGEBATP 2026",
    "antecedentes": ["Párrafo 1...", "Párrafo 2..."],
    "analisis": ["Párrafo de análisis..."],
    "resultados": ["Resultado 1...", "Resultado 2..."],
    "conclusionesTabla": [
      { "nudoCritico": "Bajo nivel en razonamiento", "alternativa": "Capacitación en estrategias didácticas" }
    ],
    "recomendaciones": ["Recomendación 1...", "Recomendación 2..."]
  }
}
```

---

## 3. `POST /api/generar-oficio`

Genera un oficio de felicitación o recomendación.

### Request
```json
{
  "programa": "EBA",
  "destinatario": {
    "nombre": "JUAN PÉREZ",
    "cargo": "Director(a)",
    "institucion": "CEBA República de Panamá"
  },
  "remitente": {
    "nombre": "Nélida Albino Igreda",
    "cargo": "Especialista de EBA"
  },
  "tono": "felicitacion",         // "felicitacion" | "recomendacion"
  "conclusiones": [...],
  "recomendaciones": [...],
  "linkEvidenciasOnedrive": "https://..."
}
```

### Response (200 OK)
```json
{
  "ok": true,
  "oficio": {
    "asunto": "Felicitación por resultados destacados...",
    "cuerpo": ["Párrafo 1...", "Párrafo 2..."],
    "despedida": "Hago propicia la ocasión..."
  }
}
```

---

## 4. `POST /api/subir-documento`

Sube un documento PDF generado a OneDrive (o almacenamiento configurado).

### Request
```json
{
  "categoria": "informe",         // "informe" | "oficio" | "acta" | "ficha"
  "tipoMonitoreo": "docente",
  "programa": "EBA",
  "institucionNombre": "CEBA República de Panamá",
  "fecha": "2026-06-15",
  "archivo": {
    "name": "Informe_docente_2026-06-15.pdf",
    "mimeType": "application/pdf",
    "base64": "<base64>"
  }
}
```

### Response (200 OK)
```json
{
  "ok": true,
  "linkOnedrive": "https://onedrive.live.com/...",
  "carpeta": "AGEBATP/Monitoreo/2026/Junio/EBA/CEBA República de Panamá"
}
```

> **Nota**: Si `STORAGE_PROVIDERS` no incluye `"onedrive"`, el campo `linkOnedrive` será `null`.

---

## Implementación sugerida (Node.js/Express)

```js
// routes/monitoreo.js
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function authMiddleware(req, res, next) {
  const token = req.headers['x-evidencia-token'];
  if (token !== process.env.EVIDENCIA_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
  next();
}

router.post('/api/ocr-ficha', authMiddleware, async (req, res) => {
  // TODO: Implementar con GPT-4o vision
  // 1. Convertir base64 a buffer
  // 2. Enviar a OpenAI con el prompt de extracción
  // 3. Parsear la respuesta JSON
  // 4. Validar y devolver
});

router.post('/api/generar-informe', authMiddleware, async (req, res) => {
  // TODO: Implementar con GPT-4o text
  // 1. Construir prompt con los datos del payload
  // 2. Solicitar generación del informe
  // 3. Devolver estructura JSON
});

router.post('/api/generar-oficio', authMiddleware, async (req, res) => {
  // TODO: Implementar con GPT-4o text
});

router.post('/api/subir-documento', authMiddleware, async (req, res) => {
  // TODO: Implementar con Microsoft Graph API
  // Si STORAGE_PROVIDERS no incluye 'onedrive':
  // return res.json({ ok: true, linkOnedrive: null });
});

module.exports = router;
```
