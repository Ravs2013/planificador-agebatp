# Bitácora de Migración — Planificador AGEBATP (Firebase + PWA + Chatbot IA)

Este documento detalla los cambios realizados en el sistema **"Planificador AGEBATP"** durante la migración de la arquitectura basada en `localStorage` y webhooks n8n (para lectura de datos) hacia **Firebase (Auth, Firestore y Storage)**, integrando soporte PWA completo y un Chatbot inteligente en español.

---

## 1. Stack Tecnológico y Configuración

- **Autenticación**: Firebase Auth para el inicio de sesión y registro de usuarios.
- **Base de Datos**: Cloud Firestore en tiempo real con persistencia multi-pestaña offline habilitada en [config.js](file:///c:/Users/perum/Desktop/PLANIFICADOR-MENSUAL-AGEBATP/frontend/src/firebase/config.js).
- **Almacenamiento**: Firebase Storage para la carga de evidencias de actividades (con fallback automático a n8n en caso de que `VITE_USE_FIREBASE_STORAGE` sea falso).
- **IA**: Vertex AI en Firebase (`gemini-2.5-flash`) mediante cargas lazy para el Chatbot.
- **PWA**: PWA offline vía `@vite-pwa/plugin` registrado en [vite.config.js](file:///c:/Users/perum/Desktop/PLANIFICADOR-MENSUAL-AGEBATP/frontend/vite.config.js).

---

## 2. Roles y Permisos de Usuarios

La aplicación cuenta con un control de accesos basado en roles definidos en la base de datos Firestore bajo la colección `/usuarios/{uid}`:

| Rol | Permisos | Acceso de Lectura | Acceso de Escritura |
| :--- | :--- | :--- | :--- |
| **admin** | `admin`, `write_directories`, `write_activities`, `write_monitoreo` | Completo (todas las colecciones) | Completo (todas las colecciones y configuración) |
| **jefatura** | `write_directories`, `write_activities`, `write_monitoreo` | Completo (todas las colecciones) | Directorios, Actividades, Monitoreo y Config de pestañas |
| **personal** | `write_activities`, `write_monitoreo` | Completo (todas las colecciones) | Actividades, Requerimientos, Monitoreo (sin poder editar pestañas del directorio) |
| **publico** | Ninguno (usuario externo / director) | Solo Lectura de Directorios y Requerimientos | Solo creación/lectura de solicitudes de reunión propias |

---

## 3. Modelo de Datos Firestore (Colecciones)

### `/usuarios/{uid}`
- `nombre` (string)
- `email` (string)
- `rol` (string: admin, jefatura, personal, publico)
- `cargo` (string)
- `institucion` (string)
- `telefono` (string)
- `permisos` (array de strings)

### `/actividades/{actId}`
- `actividad` (string)
- `descripcion` (string)
- `acciones` (number)
- `estado` (string: pendiente, en_proceso, completado)
- `progreso` (number: auto-calculado)
- `evidenciasCount` (number)
- `checklistCount` (number)
- `checklist` (array de items `{ id, texto, completado }`)
- `fechaInicio` / `fechaFin` (timestamp/string)

### `/reuniones/{reunionId}`
- `tipoSolicitud` (string)
- `motivo` (string)
- `fechaReunion` (string)
- `horaReunion` (string)
- `estado` (string: pendiente, aceptada, rechazada)
- `correoSolicitante` (string)

### `/monitoreoSemanal/{id}` & `/monitoreoAcumulado/{id}`
- Datos e importaciones de avance del plan de monitoreo mensual.

### `/esinadSemanas/{id}`
- `semana` (string: ej. "Semana 1")
- `expedientes` (number)
- `completados` (number)
- `pendientes` (number)
- `porcentaje` (number)

### `/directorioCeba/{modularCode}` & `/directorioCetpro/{modularCode}`
- Directorios institucionales de las CEBA y CETPRO con todos sus datos estadísticos, directivos y sedes dinámicas.

### `/config/{id}`
- Configuración global. El documento `/config/directorioTabs` contiene los nombres asignados a los sub-tabs en tiempo real.

---

## 4. Archivos de Reglas de Seguridad

### Firestore: `firestore.rules`
Define restricciones a nivel de servidor:
- `/usuarios`: solo lectura para autenticados, escritura para el rol `admin`.
- `/actividades`: lectura para autenticados, escritura para personal, jefatura o admin.
- `/directorioCeba` y `/directorioCetpro`: lectura para todos los autenticados, escritura restringida a `admin` y `jefatura`.
- `/config`: lectura para todos, escritura restringida a `admin` y `jefatura`.

### Storage: `storage.rules`
- Permite lectura pública (`allow read: if true;`) para visualización de evidencias.
- Permite escritura (`allow write: if request.auth != null;`) a cualquier usuario autenticado de la UGEL.

---

## 5. Instrucciones de Siembra e Inicialización

Para crear los usuarios base del sistema, primero instala `firebase-admin` si no está en la carpeta de scripts, y luego ejecuta el script de siembra.

### 5.1 Requisitos Previos
1. Descarga el archivo de claves de cuenta de servicio en formato JSON desde la consola de Firebase.
2. Nómbralo como `serviceAccountKey.json` y colócalo en la raíz de la carpeta `frontend/`.

### 5.2 Ejecutar Siembra
Desde la terminal en el directorio `frontend/`:
```bash
# Instala firebase-admin en el entorno de desarrollo
npm install -D firebase-admin

# Ejecuta el script de siembra
node scripts/seedUsuarios.js
```

---

## 6. Integración del Chatbot con IA (Gemini 2.5 Flash)

### 6.1 Requisitos de Activación
Para usar el chatbot en producción:
1. Accede a la consola de Firebase del proyecto.
2. Dirígete a la sección **Build > Vertex AI in Firebase** y haz clic en **Comenzar** para habilitar las APIs necesarias en Google Cloud.
3. Asegúrate de tener configurado el plan de pago (Pay-as-you-go / Blaze) de Firebase, requerido para el uso de Vertex AI SDK.

### 6.2 Lógica Contextual
El chatbot (`ChatbotIA.jsx`) inyecta automáticamente en sus instrucciones de sistema un resumen actualizado del estado del planificador:
- Número de actividades pendientes, en proceso y completadas.
- Cantidad de solicitudes de reuniones pendientes.
- Avance total de expedientes E-SINAD.
Esto le permite responder preguntas específicas como *"¿Qué reuniones tenemos pendientes hoy?"* o *"¿Cómo va el progreso de las actividades?"* sin necesidad de buscar manualmente.

---

## 7. Instrucciones para Desarrollo y Producción

### 7.1 Servidor de Desarrollo
```bash
npm run dev
```

### 7.2 Compilar para Producción
```bash
npm run build
```
Esto generará los assets optimizados en la carpeta `dist/` e inicializará el archivo de Service Worker para el soporte PWA offline.
