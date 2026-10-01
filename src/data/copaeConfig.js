/* ═══════════════════════════════════════════════════════════════
   PRECONGRESO DE COPAE – UGEL 03 «Mi voz, mi propuesta»
   Configuración Oficial, Criterios de Evaluación y Padrón de CEBAs
   ═══════════════════════════════════════════════════════════════ */

export const COPAE_CONFIG = {
  eventoId: 'copae-2026',
  titulo: 'INSTRUMENTO DE EVALUACIÓN',
  subtitulo: 'PRECONGRESO DE COPAE – UGEL 03',
  lema: '«Mi voz, mi propuesta»',
  denominacion: 'Consejo de Participación Escolar — EBA',
  etapa: 'UGEL 03',
  dre: 'DRELM',
  ugel: 'UGEL 03',
  fechaPorDefecto: '30 - 09 - 2026',
  fechaIso: '2026-09-30',
  numeroJuradosPorFicha: 2,
  slotsJurado: [1, 2],
  puntajeMaximoPorJurado: 20,
  puntajeMaximoTotal: 40,
  cuposSiguienteRonda: 7, // Pasan a la siguiente ronda 7 CEBAs
  puestosGanador: 1       // Solamente gana el primer puesto
};

export const SLOTS_JURADO_COPAE = [1, 2];

export const NIVELES_VALORACION_COPAE = [
  { valor: 4, etiqueta: '4 – Destacado', corto: 'Destacado', color: '#15803D', bg: '#DCFCE7' },
  { valor: 3, etiqueta: '3 – Logrado', corto: 'Logrado', color: '#1D4ED8', bg: '#DBEAFE' },
  { valor: 2, etiqueta: '2 – En proceso', corto: 'En proceso', color: '#B45309', bg: '#FEF3C7' },
  { valor: 1, etiqueta: '1 – Inicio', corto: 'Inicio', color: '#B91C1C', bg: '#FEE2E2' }
];

export const CRITERIOS_EVALUACION_COPAE = [
  {
    id: 'criterio_1',
    numero: 1,
    nombre: 'Comprensión del problema',
    descriptores: {
      4: 'Identifica con precisión el problema, sus causas y efectos.',
      3: 'Identifica claramente el problema y sus principales efectos.',
      2: 'Reconoce el problema, pero con explicación parcial.',
      1: 'Presenta una comprensión limitada o confusa.'
    }
  },
  {
    id: 'criterio_2',
    numero: 2,
    nombre: 'Pertinencia y viabilidad de la propuesta',
    descriptores: {
      4: 'Propone una solución pertinente, innovadora y viable, con acciones concretas.',
      3: 'La propuesta es pertinente y aplicable, con acciones claras.',
      2: 'La propuesta es pertinente, pero requiere mayor concreción.',
      1: 'La propuesta es poco pertinente o difícil de aplicar.'
    }
  },
  {
    id: 'criterio_3',
    numero: 3,
    nombre: 'Argumentación y análisis',
    descriptores: {
      4: 'Sustenta sus ideas con argumentos sólidos, ejemplos y análisis crítico.',
      3: 'Explica y sustenta sus ideas con argumentos adecuados.',
      2: 'Presenta argumentos básicos con escaso sustento.',
      1: 'Expresa opiniones sin suficiente argumentación.'
    }
  },
  {
    id: 'criterio_4',
    numero: 4,
    nombre: 'Comunicación oral y claridad',
    descriptores: {
      4: 'Comunica con claridad, seguridad, orden y adecuado manejo del tiempo.',
      3: 'Se comunica claramente y mantiene una estructura adecuada.',
      2: 'Comunica sus ideas con algunas dificultades de claridad u organización.',
      1: 'Presenta dificultades importantes para comunicar sus ideas.'
    }
  },
  {
    id: 'criterio_5',
    numero: 5,
    nombre: 'Liderazgo, iniciativa y compromiso',
    descriptores: {
      4: 'Demuestra iniciativa, capacidad de representación y compromiso concreto con la EBA.',
      3: 'Demuestra iniciativa y compromiso con su comunidad educativa.',
      2: 'Evidencia disposición, aunque su compromiso aún es general.',
      1: 'Muestra poca iniciativa o no concreta un compromiso.'
    }
  }
];

/**
 * Padrón inicial oficial de los 19 CEBAs participantes en el Precongreso COPAE UGEL 03
 */
export const CEBAS_PARTICIPANTES_COPAE = [
  { id: 'copae-ceba-01', orden: 1, nombre: '1049 JUANA ALARCO DE DAMMERT', codigoModular: '555649' },
  { id: 'copae-ceba-02', orden: 2, nombre: '1150 ABRAHAM ZEA CARREON', codigoModular: '605576' },
  { id: 'copae-ceba-03', orden: 3, nombre: '0040 HIPOLITO UNANUE', codigoModular: '337345' },
  { id: 'copae-ceba-04', orden: 4, nombre: '0005 ROSA DE SANTA MARIA', codigoModular: '337451' },
  { id: 'copae-ceba-05', orden: 5, nombre: '1110 REPUBLICA DE PANAMA', codigoModular: '501072' },
  { id: 'copae-ceba-06', orden: 6, nombre: 'PRONOEPSA', codigoModular: '1199595' },
  { id: 'copae-ceba-07', orden: 7, nombre: '1120 PEDRO ADOLFO LABARTHE EFFIO', codigoModular: '449637' },
  { id: 'copae-ceba-08', orden: 8, nombre: '1112 VICTOR ANDRES BELAUNDE', codigoModular: '1226380' },
  { id: 'copae-ceba-09', orden: 9, nombre: 'TUPAC AMARU', codigoModular: '603795' },
  { id: 'copae-ceba-10', orden: 10, nombre: 'ISABEL LA CATOLICA', codigoModular: '449652' },
  { id: 'copae-ceba-11', orden: 11, nombre: '1070 MELITON CARVAJAL', codigoModular: '449645' },
  { id: 'copae-ceba-12', orden: 12, nombre: '1071 ALFONSO UGARTE', codigoModular: '449611' },
  { id: 'copae-ceba-13', orden: 13, nombre: 'TERESA GONZALES DE FANNING', codigoModular: '450015' },
  { id: 'copae-ceba-14', orden: 14, nombre: '1103 ELVIRA GARCIA Y GARCIA', codigoModular: '334698' },
  { id: 'copae-ceba-15', orden: 15, nombre: 'MIGUEL GRAU', codigoModular: '827493' },
  { id: 'copae-ceba-16', orden: 16, nombre: 'BARTOLOME HERRERA', codigoModular: '337337' },
  { id: 'copae-ceba-17', orden: 17, nombre: 'CRISTO JOVEN', codigoModular: '1491349' },
  { id: 'copae-ceba-18', orden: 18, nombre: 'NUESTRA SEÑORA DE MONSERRAT', codigoModular: '' },
  { id: 'copae-ceba-19', orden: 19, nombre: 'SAN FRANCISCO DE SALES', codigoModular: '' }
];
