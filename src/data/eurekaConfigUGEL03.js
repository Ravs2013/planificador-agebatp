/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — CONFIGURACIÓN DE DOMINIO — ETAPA UGEL 03
   XXXVI Feria Escolar Nacional de Ciencia y Tecnología Eureka
   Fuente: Bases Específicas 2026 — Anexo E — MINEDU
   ═══════════════════════════════════════════════════════════════ */

/**
 * CATEGORÍAS.
 * `finalizaEnUGEL` es una regla legal, no cosmética: para A, B y C la etapa UGEL es la
 * final y se reconoce a los tres primeros puestos. Para D y E el 1.° puesto clasifica a
 * la etapa DRE. Esto cambia el párrafo condicional del Acta E20.
 */
export const CATEGORIAS = [
  {
    id: 'A', nombre: 'Categoría A', grados: 'Primer y segundo grado de Educación Primaria',
    nivel: 'Primaria', gradosNum: [1, 2], finalizaEnUGEL: true
  },
  {
    id: 'B', nombre: 'Categoría B', grados: 'Tercer y cuarto grado de Educación Primaria',
    nivel: 'Primaria', gradosNum: [3, 4], finalizaEnUGEL: true
  },
  {
    id: 'C', nombre: 'Categoría C', grados: 'Quinto y sexto grado de Educación Primaria',
    nivel: 'Primaria', gradosNum: [5, 6], finalizaEnUGEL: true
  },
  {
    id: 'D', nombre: 'Categoría D', grados: 'Primer y segundo grado de Educación Secundaria',
    nivel: 'Secundaria', gradosNum: [1, 2], finalizaEnUGEL: false
  },
  {
    id: 'E', nombre: 'Categoría E', grados: 'Tercer, cuarto y quinto grado de Educación Secundaria',
    nivel: 'Secundaria', gradosNum: [3, 4, 5], finalizaEnUGEL: false
  }
];

/** ÁREAS DE PARTICIPACIÓN. Dos en primaria, tres en secundaria. */
export const AREAS_PARTICIPACION = [
  /* ── Primaria (A, B, C) ── */
  {
    id: 'ind_ciencia_tecnologia',
    nombre: 'Indagación en Ciencia y Tecnología',
    areaCurricular: 'Ciencia y Tecnología',
    categorias: ['A', 'B', 'C'],
    numEstudiantes: 2,
    lineas: [
      { id: 'indagacion_cientifica', nombre: 'Indaga mediante métodos científicos para construir conocimientos', anexo: 'E11' },
      { id: 'solucion_tecnologica', nombre: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno', anexo: 'E12' }
    ]
  },
  {
    id: 'indagacion_social',
    nombre: 'Indagación social',
    areaCurricular: 'Personal Social',
    categorias: ['A', 'B', 'C'],
    numEstudiantes: 2,
    lineas: [
      { id: 'historia', nombre: 'Construye interpretaciones históricas', anexo: 'E13' },
      { id: 'ambiental_territorial', nombre: 'Gestiona responsablemente el espacio y el ambiente', anexo: 'E14' }
    ]
  },
  /* ── Secundaria (D, E) ── */
  {
    id: 'indagacion_cientifica',
    nombre: 'Indagación científica',
    areaCurricular: 'Ciencia y Tecnología',
    categorias: ['D', 'E'],
    numEstudiantes: [1, 2],
    lineas: [
      { id: 'experimental', nombre: 'Indagación científica experimental', anexo: 'E15', variante: 'A' },
      { id: 'descriptiva', nombre: 'Indagación científica descriptiva', anexo: 'E15', variante: 'B' }
    ]
  },
  {
    id: 'soluciones_tecnologicas',
    nombre: 'Soluciones tecnológicas',
    areaCurricular: 'Ciencia y Tecnología',
    categorias: ['D', 'E'],
    numEstudiantes: [1, 2],
    lineas: [
      { id: 'solucion_tecnologica', nombre: 'Soluciones tecnológicas', anexo: 'E16' }
    ]
  },
  {
    id: 'ciencias_sociales',
    nombre: 'Ciencias Sociales',
    areaCurricular: 'Ciencias Sociales',
    categorias: ['D', 'E'],
    numEstudiantes: [1, 2],
    lineas: [
      { id: 'historico', nombre: 'Problema histórico', anexoPorCategoria: { D: 'E17', E: 'E18' } },
      { id: 'ambiental_territorial', nombre: 'Problema ambiental o territorial', anexoPorCategoria: { D: 'E17', E: 'E18' } },
      { id: 'economico', nombre: 'Problema o desafío económico', anexoPorCategoria: { D: 'E17', E: 'E18' } }
    ]
  }
];

/** Constantes de configuración del evento. */
export const EUREKA_CONFIG = {
  eventoId: 'EUREKA-2026',
  edicion: 'XXXVI Feria Escolar Nacional de Ciencia y Tecnología Eureka',
  anio: 2026,
  etapa: 'UGEL',
  dre: 'DRE LIMA METROPOLITANA',
  ugel: 'UGEL 03',
  region: 'Lima',
  provincia: 'Lima',
  // PENDIENTE DE CONFIRMACIÓN POR LA COMISIÓN ORGANIZADORA (sección 20.2 del prompt maestro).
  distrito: 'Breña',
  sede: '',
  fechaEvaluacion: '2026-09-11',
  horaActa: '17:00',

  // Los formatos oficiales E19 y E20 tienen exactamente tres casilleros de firma.
  // Toda tabla de UI y de PDF debe generar sus columnas iterando sobre esta constante.
  numeroJuradosPorFicha: 3,
  tiempoExposicionMin: 8,
  // Las bases no establecen descuento por exceso de tiempo. No se penaliza de forma automática.
  penalizacionAutomatica: false,
  criterioOrdenMerito: 'promedio', // 'promedio' | 'suma'
  decimalesPromedio: 2,
  alcanceFirmaPorDefecto: 'GLOBAL',
  imprimirEvaluadorOperativo: false
};

/** Casilleros de jurado habilitados, derivados de numeroJuradosPorFicha. */
export const SLOTS_JURADO = Array.from(
  { length: EUREKA_CONFIG.numeroJuradosPorFicha },
  (_, i) => i + 1
);

/** Sedes de la etapa UGEL 03. Confirmar con la comisión organizadora antes del acta. */
export const SEDES_EUREKA = {
  ugel03: { id: 'ugel03', nombre: 'UGEL 03', tipo: 'presencial', distrito: 'Breña' }
};

/* ───── Helpers de dominio ───── */

export function getCategoria(id) {
  return CATEGORIAS.find(c => c.id === id) || null;
}

export function getArea(areaId) {
  return AREAS_PARTICIPACION.find(a => a.id === areaId) || null;
}

/** Áreas habilitadas para una categoría. */
export function getAreasDeCategoria(categoria) {
  return AREAS_PARTICIPACION.filter(a => a.categorias.includes(categoria));
}

/** Líneas de participación de un área. */
export function getLineasDeArea(areaId) {
  const area = getArea(areaId);
  return area ? area.lineas : [];
}

export function getLinea(areaId, lineaId) {
  return getLineasDeArea(areaId).find(l => l.id === lineaId) || null;
}

export function esCombinacionValida(categoria, areaId) {
  const area = getArea(areaId);
  return Boolean(area && area.categorias.includes(categoria));
}

/** Todas las combinaciones categoría + área de la etapa UGEL 03. */
export function getCombinacionesEureka() {
  const out = [];
  CATEGORIAS.forEach(cat => {
    getAreasDeCategoria(cat.id).forEach(area => {
      out.push({
        categoria: cat.id,
        categoriaNombre: cat.nombre,
        nivel: cat.nivel,
        areaId: area.id,
        areaNombre: area.nombre,
        finalizaEnUGEL: cat.finalizaEnUGEL
      });
    });
  });
  return out;
}

/** Identificador determinista del consolidado y del acta. */
export function consolidadoId(categoria, areaId) {
  return `${EUREKA_CONFIG.eventoId}__${EUREKA_CONFIG.etapa}__${categoria}__${areaId}`;
}

/** Contexto institucional precargado para fichas, E19 y E20. */
export function getContextoEvaluacion(categoria, areaId) {
  const cat = getCategoria(categoria);
  const area = getArea(areaId);
  return {
    eventoId: EUREKA_CONFIG.eventoId,
    etapa: EUREKA_CONFIG.etapa,
    dre: EUREKA_CONFIG.dre,
    ugel: EUREKA_CONFIG.ugel,
    region: EUREKA_CONFIG.region,
    provincia: EUREKA_CONFIG.provincia,
    distrito: EUREKA_CONFIG.distrito,
    sede: EUREKA_CONFIG.sede,
    fecha: EUREKA_CONFIG.fechaEvaluacion,
    hora: EUREKA_CONFIG.horaActa,
    categoria,
    categoriaNombre: cat ? cat.nombre : '',
    categoriaGrados: cat ? cat.grados : '',
    nivel: cat ? cat.nivel : '',
    finalizaEnUGEL: cat ? cat.finalizaEnUGEL : true,
    areaId,
    areaNombre: area ? area.nombre : '',
    areaCurricular: area ? area.areaCurricular : ''
  };
}
