# Notas de Migración — Módulo Directorio v2 (CEBA y CETPRO)
## Sistema de Planificación en Tiempo Real AGEBATP 2026 — UGEL 03

---

### 1. Resumen Ejecutivo
Se implementó con éxito la modernización integral del **Módulo Directorio (CEBA y CETPRO)** según la especificación del Mega Plan de Implementación v2.
El sistema procesa y renderiza las plantillas oficiales consolidadas **F-07-v2** (Directorio CEBA) y **F-08-v2** (Directorio CETPRO), integrando las colecciones hijas embebidas (Áreas, Sedes, Personal Nominal, Atención a Distancia, Programas de Estudio, Formación Continua y Talleres) con persistencia segura en Cloud Firestore y visualización en tiempo real.

---

### 2. Archivos Creados y Modificados

#### A. Nuevas Utilidades y Componentes
- `frontend/src/utils/directorioFormato.js`: Módulo unificado de helpers de presencia de datos (`hayDato`, `metricaVisible`, `fmt`, `numeroFormulario`), badges de gestión (`gestionMeta`), nombres de directores, badges de situación de personal y coberturas.
- `frontend/src/utils/directorioExcel.js`: Parsers multi-hoja de alta fidelidad (`parseDirectorioCebaV2`, `parseDirectorioCetproV2`), detección de formatos (`detectarFormato`, `FORMATOS`), sanitización de artefactos y compatibilidad con versiones legacy.
- `frontend/src/components/directorio/TablaDirectorio.jsx`: Tabla reutilizable estilizada con scroll horizontal, fuentes tipográficas gubernamentales (`DM Sans`, `JetBrains Mono`) y fila de totales condicional.
- `frontend/src/components/directorio/PestanasDetalle.jsx`: Barra de pestañas fijas para modales de detalle con ocultamiento automático de pestañas sin contenido (Regla R-3e).

#### B. Componentes y Servicios Actualizados
- `frontend/src/firebase/db.js`:
  - Estrategia de ID documentales preservada con fallback `local-${codigoLocal}`.
  - Soporte para eliminación limpia de 32 campos legacy de CEBA (`limpiarLegacy: true` con `deleteField()`).
  - Límite de seguridad contra desbordamiento de payload en Firestore (< 900 KB).
- `frontend/src/components/DirectorioCEBA.jsx`:
  - Normalización en suscripción Firestore (`normalizarCeba`).
  - KPIs ordenados con regla R-3f (solo valores > 0, métricas de aulas omitidas).
  - Tarjetas con 3 estados de gestión (`ESTATAL`, `PARROQUIAL`, `CONVENIO`), badge de `FICHA PENDIENTE`, baldosas estadísticas filtradas (R-3c) y regla de borde (R-3h/R-3j).
  - Modal de detalle con navegación por pestañas (`Resumen`, `Sedes`, `Áreas`, `Personal`, `A distancia`).
  - Modal de carga en 4 bloques con detección de formato e incidencias.
  - Formulario de edición manual sin coerción arbitraria a cero (`numeroFormulario`).
  - Exportación PDF limpia sin emojis ni datos nulos.
- `frontend/src/components/DirectorioCETPRO.jsx`:
  - Normalización en suscripción Firestore (`normalizarCetpro`).
  - KPIs con métricas R-3f (`Total CETPRO`, `Estudiantes`, `Docentes`, `Talleres`, `Programas`, `Personal Admin`, `Distritos`).
  - Modal de detalle con pestañas (`Resumen`, `Programas`, `Formación continua`, `Talleres y sedes`, `Personal`).
  - Descarte automático de filas de artefacto en Formación Continua (Regla D1).
  - Modal de carga en 4 bloques con validación cruzada entre CEBA y CETPRO.
  - Exportación PDF optimizada.

---

### 3. Reglas Críticas Implementadas

| Regla | Descripción | Estado |
| :--- | :--- | :--- |
| **R1: Cero Emojis** | Uso exclusivo de iconos SVG inline (`Icons` / `SvgIcon`). Ningún emoji en código, UI ni documentos. | Verificado (0 emojis en todo el módulo). |
| **R2: Sin dependencias nuevas** | Implementación pura con React 18, xlsx 0.18.5, recharts, jsPDF y Firebase SDK. | Cumplido. |
| **R3: Tokens de diseño** | Tipografías `DM Serif Display`, `DM Sans`, `JetBrains Mono` y paleta `C`. | Cumplido. |
| **R4: Alcance acotado** | Solo se intervino el módulo de Directorio sin afectar otros módulos del sistema. | Cumplido. |
| **R5: Jerarquía de IDs** | Precedencia de identificador Firestore respetada estrictamente. | Cumplido. |
| **R6: Celdas vacías son null** | Prohibido el uso de `\|\| 0` en inputs de Excel. Celdas vacías no renderizan valores ficticios. | Cumplido (`numeroFormulario`, `hayDato`). |
| **D1: Artefactos CETPRO** | Descarte de las 4 filas de cabecera duplicada en Formación Continua (28 módulos útiles). | Cumplido. |
| **D2: Fichas Pendientes** | Identificación de `NUESTRA SEÑORA DE MONTSERRAT` y `SAN FRANCISCO DE SALES`. | Cumplido (`fichaPendiente: true`). |
| **D3: Sentinela Distrito** | `Por confirmar` excluido del conteo de distritos y mostrado en gris (`C.g300`). | Cumplido. |
| **D5: Badges de Gestión** | Normalización a `ESTATAL`, `PARROQUIAL` y `CONVENIO`. | Cumplido. |

---

### 4. Resultados de la Validación Numérica Automatizada

Pruebas ejecutadas con los archivos Excel oficiales de la UGEL 03:

#### Directorio CEBA (`DIRECTORIO_CEBA_UGEL03.xlsx`)
- **A1. Instituciones:** 19 (100% match)
- **A2. Total Estudiantes:** 5,147 (100% match)
- **A3. Cobertura Matrícula:** 17 de 19 instituciones (100% match)
- **A4. Total Docentes:** 323 (100% match)
- **A5. Desglose Docente:** 204 Nombrados / 102 Contratados / 17 Directivos (100% match)
- **A6. Periféricos:** 48 (100% match)
- **A7. Áreas Curriculares:** 76 (100% match)
- **A8. Sedes y Locales:** 76 (100% match)
- **A9. Personal Docente Nominal:** 328 (100% match)
- **A10. Fichas de Atención a Distancia:** 16 instituciones (100% match)
- **A11. Estudiantes a Distancia:** 1,543 (100% match)
- **A12. Distritos Atendidos:** 9 distritos (excluyendo "Por confirmar") (100% match)
- **A13. Fichas Pendientes:** 2 (`NUESTRA SEÑORA DE MONTSERRAT`, `SAN FRANCISCO DE SALES`)
- **A14. Gestión:** 16 Estatal, 2 Parroquial, 1 Convenio (100% match)
- **A15. Situación Nominal:** 201 Nombrados, 100 Contratados, 11 Designados, 6 Encargados, 3 Vacantes, 1 Destacado (100% match)

#### Directorio CETPRO (`DIRECTORIO_CETPRO_UGEL03.xlsx`)
- **B1. Instituciones:** 21 (100% match)
- **B2. Total Estudiantes:** 10,880 (100% match)
- **B3. Total Docentes:** 515 (100% match)
- **B4. Desglose Docente:** 286 Nombrados / 187 Contratados / 42 Directivos (100% match)
- **B5. Total Talleres:** 543 (100% match)
- **B6. Total Programas de Estudio:** 271 (100% match)
- **B7. Personal Administrativo:** 48 (29 Nombrados + 19 Contratados) (100% match)
- **B8. Distritos Atendidos:** 7 distritos (100% match)
- **B9. Formación Continua Útil:** 28 módulos (100% match, 4 artefactos purgados)
- **B10. Personal Docente Nominal:** 459 (100% match)
- **B11. Talleres y Sedes:** 21 (100% match)
- **B12. Gestión:** 15 Estatal, 5 Parroquial, 1 Convenio (100% match)
- **B13. Situación Nominal:** 250 Nombrados, 165 Contratados, 28 Encargados, 13 Designados, 2 Vacantes, 1 Destacado (100% match)
