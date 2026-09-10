/* ═══════════════════════════════════════════════════════════════
   CONCURSO NACIONAL CREA Y EMPRENDE 2026 — INSTRUMENTOS DE EVALUACIÓN
   Transcripción literal de las Bases Específicas 2026 (Anexo D):
     D10  Rúbrica de evaluación del proyecto de emprendimiento (A, B y C)
     D11  Rúbrica de evaluación del portafolio del proyecto de emprendimiento (A, B y C)
     D12  Escala de valoración de la presentación en la Expoferia (común)

   Única corrección aplicada: la errata ortográfica "Design Thinkign" del D11 de la
   categoría B se escribe "Design Thinking". Ningún descriptor cambia de sentido.

   El jurado NUNCA elige el instrumento: lo determina la categoría del proyecto.
   ═══════════════════════════════════════════════════════════════ */

/** Niveles de D10 y D11 (encabezado literal de ambas rúbricas). */
export const NIVELES_RUBRICA_CYE = [
  { valor: 1, nombre: 'Básico', encabezado: 'Nivel 1: Básico (1 punto)' },
  { valor: 2, nombre: 'En proceso', encabezado: 'Nivel 2: En proceso (2 puntos)' },
  { valor: 3, nombre: 'Destacado', encabezado: 'Nivel 3: Destacado (3 puntos)' },
  { valor: 4, nombre: 'Sobresaliente', encabezado: 'Nivel 4: Sobresaliente (4 puntos)' }
];

/** Escala del D12. El formato oficial ordena las columnas de valoración 4, 3, 2, 1. */
export const ESCALA_D12 = [
  { valor: 4, descripcion: 'Evidencia un nivel superior a lo esperado respecto a los criterios de evaluación.' },
  { valor: 3, descripcion: 'Evidencia el nivel esperado es decir cumple de manera satisfactoria con todo lo establecido en los criterios de evaluación.' },
  { valor: 2, descripcion: 'Está próximo o cerca de cumplir lo establecido en los criterios de evaluación.' },
  { valor: 1, descripcion: 'Muestra un nivel mínimo respecto de lo establecido en los criterios de evaluación.' }
];

/* ───── Criterios compartidos por el D10 de las categorías A y C ───── */

const D10_BASE_A_C = [
  {
    nombre: 'Originalidad y Creatividad',
    pregunta: '¿Qué tan diferente o novedoso es el proyecto?',
    niveles: {
      1: 'El proyecto repite soluciones comunes sin aportar algo nuevo.',
      2: 'Tiene algunas ideas nuevas, pero se basa en soluciones ya existentes.',
      3: 'La propuesta es creativa y combina ideas de forma original.',
      4: 'La solución es altamente innovadora y sorprendente para su contexto.'
    }
  },
  {
    nombre: 'Relación con el problema familiar o barrial',
    pregunta: '¿Qué tan bien responde a un problema real de su entorno?',
    niveles: {
      1: 'No está claro qué problema resuelve o si es realmente necesario.',
      2: 'Identifica un problema real, pero la solución aún no está bien desarrollada.',
      3: 'Atiende un problema importante en su familia o barrio con una solución bien pensada.',
      4: 'Resuelve un problema relevante con un impacto positivo y evidente para su comunidad.'
    }
  },
  {
    nombre: 'Sostenibilidad y uso eficiente de recursos',
    pregunta: '¿El proyecto usa materiales de reúso o reciclados para cuidar el ambiente?',
    niveles: {
      1: 'No considera el impacto ambiental ni el uso responsable de recursos.',
      2: 'Usa algunos materiales de reúso o reciclados, pero sin un enfoque claro en sostenibilidad.',
      3: 'Demuestra interés en el cuidado del ambiente y reutiliza o recicla materiales de forma efectiva.',
      4: 'Es un proyecto sostenible que optimiza recursos y minimiza residuos.'
    }
  },
  {
    nombre: 'Uso de tecnología o herramientas simples',
    pregunta: '¿El proyecto integra tecnología o recursos digitales?',
    niveles: {
      1: 'No usa herramientas tecnológicas ni recursos digitales.',
      2: 'Usa algunas herramientas simples, pero sin un propósito claro.',
      3: 'Integra tecnología o recursos digitales para mejorar la propuesta.',
      4: 'Hace un uso creativo y significativo de herramientas digitales o tecnológicas.'
    }
  },
  {
    nombre: 'Aplicación y mejora del proyecto',
    pregunta: '¿Han probado su idea y la han mejorado?',
    niveles: {
      1: 'No han realizado pruebas ni ajustes en su propuesta.',
      2: 'Han hecho pruebas mínimas, pero sin mejorar la solución.',
      3: 'Han validado su idea con algunas personas y han realizado mejoras.',
      4: 'Han probado la idea con varios usuarios y han hecho mejoras significativas.'
    }
  }
];

const D10_B = [
  {
    nombre: 'Originalidad y Creatividad',
    pregunta: '¿Qué tan novedoso es el proyecto?',
    niveles: {
      1: 'El proyecto repite soluciones comunes sin aportar algo nuevo.',
      2: 'Tiene algunas ideas innovadoras, pero aún se parece a soluciones existentes.',
      3: 'Presenta una propuesta creativa con un enfoque único.',
      4: 'Es altamente innovador, disruptivo y sorprendente para su contexto.'
    }
  },
  {
    nombre: 'Impacto en la calidad de vida',
    pregunta: '¿El proyecto mejora la vida de las personas en su comunidad o más allá?',
    niveles: {
      1: 'No está claro cómo beneficia a las personas.',
      2: 'Tiene un impacto positivo, pero aún es limitado en alcance.',
      3: 'Genera mejoras significativas para un grupo de personas en la comunidad.',
      4: 'Su impacto es claro, medible y beneficia a muchas personas en su comunidad o más allá.'
    }
  },
  {
    nombre: 'Contribución a la economía local',
    pregunta: '¿Cómo mejora las oportunidades económicas de las personas?',
    niveles: {
      1: 'No tiene un modelo económico claro ni genera oportunidades.',
      2: 'Presenta una forma básica de generar ingresos o empleos.',
      3: 'Contribuye al crecimiento económico de un sector de la comunidad.',
      4: 'Tiene un alto potencial de escalabilidad y puede fortalecer la economía local o regional.'
    }
  },
  {
    nombre: 'Sostenibilidad y uso eficiente de recursos',
    pregunta: '¿Cómo cuida el ambiente y optimiza los recursos?',
    niveles: {
      1: 'No considera la sostenibilidad ni el impacto ambiental.',
      2: 'Usa algunos materiales de reúso o reciclados o estrategias ecológicas, pero sin un enfoque claro.',
      3: 'Integra prácticas sostenibles y minimiza residuos de manera efectiva.',
      4: 'Es un proyecto ecológico innovador que optimiza el uso de recursos con impacto positivo.'
    }
  },
  {
    nombre: 'Uso de IA generativa para publicidad digital',
    pregunta: '¿Cómo aprovecha la IA para la promoción del proyecto?',
    niveles: {
      1: 'No emplea IA ni herramientas digitales en su publicidad.',
      2: 'Usa IA generativa, pero de manera básica y sin estrategia clara.',
      3: 'Aplica IA en su publicidad de forma efectiva y atractiva.',
      4: 'Utiliza IA de manera innovadora para optimizar campañas y llegar a su público objetivo.'
    }
  },
  {
    nombre: 'Aplicación del ciclo de vida del cliente',
    pregunta: '¿Cómo gestiona la relación con sus clientes o beneficiarios?',
    niveles: {
      1: 'No considera la relación con clientes ni su fidelización.',
      2: 'Tiene una estrategia inicial, pero no es consistente.',
      3: 'Aplica estrategias para atraer, retener y fidelizar clientes.',
      4: 'Integra estrategias avanzadas para mejorar la experiencia y la lealtad del cliente o beneficiario.'
    }
  },
  {
    nombre: 'Validación y mejora del proyecto',
    pregunta: '¿Han probado su idea y la han ajustado según el feedback?',
    niveles: {
      1: 'No han realizado pruebas ni ajustes.',
      2: 'Han hecho pruebas básicas, pero sin cambios significativos.',
      3: 'Han validado su idea con usuarios y mejorado su propuesta.',
      4: 'Han probado con varios usuarios, hecho ajustes importantes y optimizado su proyecto.'
    }
  }
];

const D10_C_EXTRA = {
  nombre: 'Presentación y explicación del proyecto',
  pregunta: '¿Cómo comunican su idea?',
  niveles: {
    1: 'Explican la idea con dificultad y sin claridad.',
    2: 'Explican el proyecto, pero con algunas dificultades para comunicarlo bien.',
    3: 'Explican con claridad y entusiasmo, logrando que se entienda su propuesta.',
    4: 'Presentan el proyecto con seguridad, claridad y convenciendo a los demás de su importancia.'
  }
};

/* ───── D11: portafolio. A y C comparten texto literal ───── */

const D11_A_C = [
  {
    nombre: 'Presentación y estructura del portafolio',
    alcance: 'Carátula, índice, organización y claridad del documento.',
    niveles: {
      1: 'Incompleto o desordenado y la estructura del portafolio dificulta un seguimiento.',
      2: 'Presenta la mayoría de los elementos, pero con fallas en la organización.',
      3: 'Bien estructurado y claro, con buena organización visual.',
      4: 'Presenta cada uno de los elementos solicitados y la estructura del portafolio es fácil de seguir.'
    }
  },
  {
    nombre: 'Introducción del proyecto',
    alcance: 'Resumen, problema, solución, modelo de ventas, innovación, análisis de competencia y necesidades.',
    niveles: {
      1: 'Falta información clave o es poco clara.',
      2: 'Presenta información general, pero con poca profundidad.',
      3: 'Explica claramente los elementos clave del emprendimiento.',
      4: 'Explica con profundidad, coherencia cada aspecto.'
    }
  },
  {
    nombre: 'Análisis técnico del producto o servicio',
    alcance: 'Análisis funcional, usabilidad, morfológico, estructural, tecnológico y comparativo.',
    niveles: {
      1: 'No presenta análisis o es muy superficial.',
      2: 'Presenta algunos análisis, pero sin suficiente detalle.',
      3: 'Incluye análisis detallados.',
      4: 'Presenta todos los análisis con profundidad y en forma detallada.'
    }
  },
  {
    nombre: 'Evidencia de aplicación del Design Thinking en la Creación del Proyecto',
    alcance: 'Empatizar, Definir, Idear, Prototipar y Evaluar con usuarios.',
    niveles: {
      1: 'No hay evidencia clara de aplicación.',
      2: 'Se presentan evidencias mínimas, pero sin mostrar evolución.',
      3: 'Se documenta cada fase con fotos fechadas y resultados.',
      4: 'Se muestra un proceso iterativo, con fotos fechadas y resultados de cada fase.'
    }
  },
  {
    nombre: 'Validación del PMV con Lean Canvas',
    alcance: 'Formulación de hipótesis falsables, validación con usuarios y experimentos.',
    niveles: {
      1: 'No presenta hipótesis ni validación.',
      2: 'Presenta hipótesis, pero sin validación clara.',
      3: 'Documenta validaciones con usuarios y resultados.',
      4: 'Evidencia un proceso sólido con ajustes iterativos y documentación visual.'
    }
  },
  {
    nombre: 'Planificación y gestión del proceso',
    alcance: 'Uso de Diagrama Gantt y organización estratégica de validaciones.',
    niveles: {
      1: 'No presenta planificación.',
      2: 'Muestra una planificación básica, pero sin seguimiento.',
      3: 'Tiene un plan estructurado con hitos claros.',
      4: 'Plan detallado con fechas, responsables y evidencia de ejecución.'
    }
  },
  {
    nombre: 'Validación con clientes (captación, retención y ampliación de ingresos)',
    alcance: 'Estrategias de mercado con evidencia visual y registros de clientes.',
    niveles: {
      1: 'No presenta estrategias ni evidencias.',
      2: 'Muestra estrategias, pero con poca evidencia.',
      3: 'Presenta estrategias con evidencia visual y datos.',
      4: 'Documenta estrategias efectivas con métricas, videos y testimonio de clientes.'
    }
  },
  {
    nombre: 'Reflexión y aprendizajes del equipo',
    alcance: 'Listado de desafíos, soluciones aplicadas y mejoras futuras.',
    niveles: {
      1: 'No hay reflexión sobre el proceso.',
      2: 'Presenta reflexiones generales sin profundidad.',
      3: 'Documenta aprendizajes y mejoras implementadas.',
      4: 'Reflexión detallada con aprendizajes, fotos fechadas y mejoras estratégicas.'
    }
  },
  {
    nombre: 'Evidencia visual y autenticidad del proyecto',
    alcance: 'Fotografías fechadas, videos y documentos verificables.',
    niveles: {
      1: 'No hay evidencia o es insuficiente.',
      2: 'Se incluyen algunas evidencias, pero faltan en fases clave.',
      3: 'Se documenta con fotos fechadas en la mayoría de las fases.',
      4: 'Completo registro visual con fotos, videos y documentación real del proceso.'
    }
  },
  {
    nombre: 'Documentación adicional y respaldo del proyecto',
    alcance: 'Facturas, registros de ventas, constancias de ferias, concursos, etc.',
    niveles: {
      1: 'No presenta documentación de respaldo.',
      2: 'Incluye algunas evidencias, pero no de manera completa.',
      3: 'Presenta registros de ventas, constancias y evidencias adicionales.',
      4: 'Portafolio sólido con documentación de respaldo bien organizada.'
    }
  }
];

const D11_B = [
  {
    nombre: 'Presentación y estructura del portafolio',
    alcance: 'Carátula, índice y organización del documento.',
    niveles: {
      1: 'Incompleto o desordenado, difícil de seguir.',
      2: 'Presenta los elementos básicos, pero con fallas en organización.',
      3: 'Bien estructurado y claro, con buena organización visual.',
      4: 'Excelente presentación, con una estructura fluida y ordenada.'
    }
  },
  {
    nombre: 'Introducción del proyecto',
    alcance: 'Resumen, problema, solución, modelo de ventas, innovación, análisis de competencia y necesidades.',
    niveles: {
      1: 'Falta información clave o está mal desarrollada.',
      2: 'Presenta información general, pero con poca profundidad.',
      3: 'Explica claramente los elementos clave del emprendimiento.',
      4: 'Explica con profundidad, coherencia y evidencia cada aspecto.'
    }
  },
  {
    nombre: 'Análisis técnico del producto o servicio',
    alcance: 'Funcionalidad, accesibilidad, usabilidad, morfológico, estructural, tecnológico, comparativo, impacto ambiental, estético y económico.',
    niveles: {
      1: 'No presenta análisis o es muy superficial.',
      2: 'Presenta algunos análisis, pero sin suficiente detalle.',
      3: 'Incluye análisis detallados con evidencia de soporte.',
      4: 'Presenta todos los análisis con profundidad y documentación visual.'
    }
  },
  {
    nombre: 'Evidencia de aplicación del Design Thinking en la Creación del Proyecto',
    alcance: 'Empatizar, Definir, Idear, Prototipar y Evaluar con usuarios.',
    niveles: {
      1: 'No hay evidencia clara de aplicación del Design Thinking ni evidencias fotográficas fechadas.',
      2: 'Se presentan evidencias mínimas de aplicación del Design Thinking, presenta solo algunas fotografías fechadas.',
      3: 'Se documenta cada fase con fotos fechadas y resultados.',
      4: 'Se muestra un proceso fluido, con fotos fechadas y resultados en cada fase del Design Thinking.'
    }
  },
  {
    nombre: 'Validación del PMV con Lean Canvas',
    alcance: 'Formulación de hipótesis falsables, validación con usuarios y experimentos.',
    niveles: {
      1: 'No presenta hipótesis falsables, ni validación.',
      2: 'Presenta hipótesis falsables, pero sin validación clara.',
      3: 'Presenta hipótesis falsables y documenta validaciones con usuarios y resultados.',
      4: 'Presenta hipótesis falsables, evidencia un proceso sólido de validación con ajustes iterativos y documentación visual.'
    }
  },
  {
    nombre: 'Planificación y gestión del proceso',
    alcance: 'Uso de Diagrama Gantt y organización estratégica de validaciones.',
    niveles: {
      1: 'No presenta planificación.',
      2: 'Muestra una planificación básica, incompleta.',
      3: 'Tiene un plan estructurado con hitos claros, empleando el Diagrama Gantt.',
      4: 'Plan detallado con fechas, responsables y evidencia de ejecución, empleando del Diagrama de Gantt.'
    }
  },
  {
    nombre: 'Validación con clientes (captación, retención y ampliación de ingresos)',
    alcance: 'Estrategias de mercado con evidencia visual y registros de clientes.',
    niveles: {
      1: 'No presenta estrategias ni evidencias fotográficas fechadas.',
      2: 'Muestra estrategias, pero con poca evidencia fotográficas fechadas.',
      3: 'Presenta estrategias con evidencia visual, fotografías fechadas, videos y datos.',
      4: 'Documenta estrategias efectivas con métricas, fotografías fechadas, videos y testimonio de clientes.'
    }
  },
  {
    nombre: 'Uso de IA generativa en publicidad digital',
    alcance: 'Evidencia de uso en videos, imágenes o textos promocionales.',
    niveles: {
      1: 'No se evidencia el uso de IA generativa.',
      2: 'Se evidencia el uso de la IA generativa, en texto e imágenes.',
      3: 'Presenta evidencia del uso de IA en publicidades digitales.',
      4: 'Presenta evidencias del uso de la IA generativa en texto, imágenes, música y videos publicitarios en las redes.'
    }
  },
  {
    nombre: 'Impacto social, económico y ambiental del proyecto',
    alcance: 'Evidencia de mejoras en la calidad de vida y la sostenibilidad.',
    niveles: {
      1: 'No hay evidencia de impacto.',
      2: 'Se menciona impacto, pero sin pruebas concretas.',
      3: 'Documenta impacto positivo con fotos y videos.',
      4: 'Demuestra impacto en la comunidad, con fotos, videos, y testimonios.'
    }
  },
  {
    nombre: 'Reflexión y aprendizajes del equipo',
    alcance: 'Listado de desafíos, soluciones aplicadas y mejoras futuras.',
    niveles: {
      1: 'No hay reflexión sobre el proceso.',
      2: 'Presenta reflexiones generales sin profundidad.',
      3: 'Presenta reflexiones profundas sobre los aprendizajes.',
      4: 'Reflexión detallada con aprendizajes, aplicando alguna técnica de rutina de pensamiento.'
    }
  },
  {
    nombre: 'Evidencia visual y autenticidad del proyecto',
    alcance: 'Fotografías fechadas, videos y documentos verificables.',
    niveles: {
      1: 'No hay evidencia o es insuficiente.',
      2: 'Se incluyen algunas evidencias, pero faltan en fases clave.',
      3: 'Se documenta con fotos fechadas en la mayoría de las fases.',
      4: 'Completo registro visual con fotos, videos y documentación real del proceso.'
    }
  },
  {
    nombre: 'Documentación adicional y respaldo del proyecto',
    alcance: 'Facturas, registros de ventas, constancias de ferias, concursos, etc.',
    niveles: {
      1: 'No presenta documentación de respaldo.',
      2: 'Incluye algunas evidencias, pero no de manera completa.',
      3: 'Presenta registros de ventas, constancias y evidencias adicionales.',
      4: 'Portafolio sólido con documentación de respaldo bien organizada.'
    }
  }
];

/* ───── D12: escala de la Expoferia (común a las tres categorías) ───── */

const D12_CRITERIOS = [
  {
    nombre: 'Organización del equipo Emprendedor',
    pregunta: '¿Quiénes somos?',
    evidencia: 'Presenta el nombre del equipo emprendedor, a los integrantes y el rol de cada uno de los miembros y precisa que producto o servicio oferta.',
    tiempo: '20 segundos'
  },
  {
    nombre: 'Identificación del Problema',
    pregunta: '¿Qué problema soluciona a sus clientes?',
    evidencia: 'Describe el problema que resuelve a sus clientes.',
    tiempo: '25 segundos'
  },
  {
    nombre: 'Propuesta de solución al problema',
    pregunta: '¿Cómo solucionan el problema a sus clientes?',
    evidencia: 'Describe la solución al problema identificado.',
    tiempo: '25 segundos'
  },
  {
    nombre: 'Perfil del Cliente',
    pregunta: '¿Quienes compran el producto o servicio?',
    evidencia: 'Describe quienes compran o comprarían el producto o servicio y señala el precio de venta.',
    tiempo: '20 segundos'
  },
  {
    nombre: 'La innovación del producto o servicio',
    pregunta: '¿Cuál es la innovación, lo que lo hace diferente del resto al producto o servicio?',
    evidencia: 'Describe cuál es la innovación del producto o servicio y que lo distingue de los que ya existen en el mercado.',
    tiempo: '30 segundos'
  }
];

/* ───── Construcción de las rúbricas con identificadores estables ───── */

function conIds(prefijo, criterios) {
  return criterios.map((c, i) => ({ ...c, id: `${prefijo}_${i + 1}`, numero: i + 1 }));
}

function rubrica({ anexo, categoria, titulo, tipo, criterios }) {
  return {
    id: anexo,
    anexo,
    categoria,
    titulo,
    tipo,
    criterios,
    maximo: criterios.length * 4
  };
}

export const RUBRICAS_CYE = {
  D10: {
    A: rubrica({ anexo: 'D10', categoria: 'A', tipo: 'rubrica', titulo: 'Rúbrica de Evaluación del Proyecto de emprendimiento — Categoría A', criterios: conIds('d10A', D10_BASE_A_C) }),
    B: rubrica({ anexo: 'D10', categoria: 'B', tipo: 'rubrica', titulo: 'Rúbrica de Evaluación del Proyecto de emprendimiento — Categoría B', criterios: conIds('d10B', D10_B) }),
    C: rubrica({ anexo: 'D10', categoria: 'C', tipo: 'rubrica', titulo: 'Rúbrica de Evaluación del Proyecto de emprendimiento — Categoría C', criterios: conIds('d10C', [...D10_BASE_A_C, D10_C_EXTRA]) })
  },
  D11: {
    A: rubrica({ anexo: 'D11', categoria: 'A', tipo: 'rubrica', titulo: 'Rúbrica de evaluación del portafolio del proyecto de emprendimiento: categoría A – ciclo VI', criterios: conIds('d11A', D11_A_C) }),
    B: rubrica({ anexo: 'D11', categoria: 'B', tipo: 'rubrica', titulo: 'Rúbrica de evaluación del portafolio del proyecto de emprendimiento: categoría B – ciclo VII', criterios: conIds('d11B', D11_B) }),
    C: rubrica({ anexo: 'D11', categoria: 'C', tipo: 'rubrica', titulo: 'Rúbrica de evaluación del portafolio del proyecto emprendimiento: categoría C – ciclo avanzado', criterios: conIds('d11C', D11_A_C) })
  },
  D12: rubrica({ anexo: 'D12', categoria: null, tipo: 'escala', titulo: 'Escala de valoración de la presentación del Proyecto de emprendimiento en la Expoferia', criterios: conIds('d12', D12_CRITERIOS) })
};

/** Rúbrica aplicable a un anexo y una categoría. */
export function getRubricaCYE(anexo, categoria) {
  if (anexo === 'D12') return RUBRICAS_CYE.D12;
  return RUBRICAS_CYE[anexo]?.[categoria] || null;
}

/** Los tres instrumentos de la etapa UGEL, en el orden oficial, para una categoría. */
export function getInstrumentosCategoria(categoria) {
  return ['D10', 'D11', 'D12'].map(anexo => getRubricaCYE(anexo, categoria)).filter(Boolean);
}

/** Puntaje máximo alcanzable por categoría (sumatoria real de los tres instrumentos). */
export function maximoCategoria(categoria) {
  return getInstrumentosCategoria(categoria).reduce((s, r) => s + r.maximo, 0);
}

/**
 * Verificación de integridad contra las bases. Si falla, el módulo lo muestra y bloquea
 * la emisión de documentos: un criterio perdido altera la sumatoria de todos los equipos.
 */
export function assertRubricasIntegrasCYE() {
  const esperado = {
    D10: { A: 5, B: 7, C: 6 },
    D11: { A: 10, B: 12, C: 10 }
  };
  const errores = [];

  Object.entries(esperado).forEach(([anexo, porCat]) => {
    Object.entries(porCat).forEach(([cat, n]) => {
      const r = getRubricaCYE(anexo, cat);
      if (!r) { errores.push(`Falta la rúbrica ${anexo} de la categoría ${cat}.`); return; }
      if (r.criterios.length !== n) errores.push(`${anexo} categoría ${cat}: ${r.criterios.length} criterios, las bases establecen ${n}.`);
      r.criterios.forEach(c => {
        [1, 2, 3, 4].forEach(v => {
          if (!String(c.niveles?.[v] || '').trim()) errores.push(`${anexo} ${cat}, criterio ${c.numero}: falta el descriptor del nivel ${v}.`);
        });
      });
    });
  });

  if (RUBRICAS_CYE.D12.criterios.length !== 5) errores.push('D12: la escala de la Expoferia debe tener 5 criterios.');
  if (RUBRICAS_CYE.D11.A.maximo !== 40 || RUBRICAS_CYE.D11.B.maximo !== 48 || RUBRICAS_CYE.D11.C.maximo !== 40) {
    errores.push('D11: los totales deben ser 40 (A), 48 (B) y 40 (C).');
  }

  const ids = new Set();
  [RUBRICAS_CYE.D10.A, RUBRICAS_CYE.D10.B, RUBRICAS_CYE.D10.C, RUBRICAS_CYE.D11.A, RUBRICAS_CYE.D11.B, RUBRICAS_CYE.D11.C, RUBRICAS_CYE.D12]
    .forEach(r => r.criterios.forEach(c => {
      if (ids.has(c.id)) errores.push(`Identificador de criterio duplicado: ${c.id}.`);
      ids.add(c.id);
    }));

  return { ok: errores.length === 0, errores };
}
