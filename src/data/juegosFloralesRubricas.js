/* ═══════════════════════════════════════════════════════════════
   JUEGOS FLORALES ESCOLARES NACIONALES 2026
   Rúbricas oficiales por disciplina — Bases Específicas, Anexo A
   Fuente: RVM que aprueba las bases de los Concursos Educativos 2026
   Eje temático 2026: "Sentir, pensar y crear para convivir"
   ═══════════════════════════════════════════════════════════════ */

/** Escala de calificación única para todos los indicadores (numeral 8 de las bases) */
export const ESCALA_CALIFICACION = [
  {
    puntaje: 4,
    nivel: "Logro destacado",
    descripcion: "Evidencia un nivel superior a lo esperado respecto del criterio de evaluación. Esto quiere decir que demuestra un desempeño que va más allá de lo esperado."
  },
  {
    puntaje: 3,
    nivel: "Logro esperado",
    descripcion: "Evidencia el nivel esperado respecto del criterio de evaluación, cumpliendo de manera satisfactoria con todos los aspectos descritos en los indicadores."
  },
  {
    puntaje: 2,
    nivel: "En proceso",
    descripcion: "Está próximo o cerca al nivel esperado respecto del criterio de evaluación, pero no cumple con todos los aspectos descritos en los indicadores."
  },
  {
    puntaje: 1,
    nivel: "En inicio",
    descripcion: "Muestra un nivel mínimo respecto del criterio de evaluación. Evidencia dificultades para cumplir con los aspectos descritos en los indicadores o logra cumplir con muy pocos aspectos."
  }
];

/**
 * RUBRICAS
 * Cada entrada:
 *   id, numeral, arte, disciplina, definicion, modalidad, maxParticipantes,
 *   categorias: { CAT: "ETAPA_MAXIMA" }, tiempoMaximo, penalizacionTiempo,
 *   presencial (bool), puntajeMaximo, criterios[{ criterio, indicadores[{ id, texto, max }] }],
 *   reglas[] (viñetas normativas mostradas al jurado)
 */
export const RUBRICAS_JF = {

  /* ───────────── 9.1 ARTES ESCÉNICAS ───────────── */

  teatro: {
    id: "teatro",
    numeral: "9.1.1",
    arte: "Artes escénicas",
    arteId: "artes_escenicas",
    disciplina: "Teatro",
    definicion: "El teatro es un lenguaje artístico que se caracteriza por la representación de una historia a través de la actuación. Para su desarrollo, combina diversos elementos, como la gestualidad, el discurso, la música, los sonidos y la escenografía. Es el resultado de una creación literaria y una puesta en escena.",
    modalidad: "grupal",
    maxParticipantes: 8,
    categorias: { D: "UGEL", E: "DRE", F: "NACIONAL" },
    presencial: true,
    tiempoMaximo: "15:00",
    penalizacionTiempo: 5,
    puntajeMaximo: 40,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "tea1", texto: "La obra comunica ideas y sentimientos con claridad.", max: 4 },
          { id: "tea2", texto: "Las ideas son originales y ponen en evidencia análisis y reflexión.", max: 4 }
        ]
      },
      {
        criterio: "Representación teatral",
        indicadores: [
          { id: "tea3", texto: "Capacidad interpretativa de los actores.", max: 4 },
          { id: "tea4", texto: "Expresión corporal: postura, gesto y movimiento.", max: 4 },
          { id: "tea5", texto: "Expresión oral: vocalización, pronunciación y dicción.", max: 4 }
        ]
      },
      {
        criterio: "Dominio del espacio",
        indicadores: [
          { id: "tea6", texto: "Manejo adecuado del espacio y de la creación del ambiente.", max: 4 }
        ]
      },
      {
        criterio: "Vestuario y escenografía",
        indicadores: [
          { id: "tea7", texto: "Creatividad en el uso del vestuario y de acuerdo con el sentido de la obra.", max: 4 },
          { id: "tea8", texto: "Escenografía creativa, original, de bajo costo (materiales de reúso o reciclados) y fácil de trasladar y desmontar.", max: 4 }
        ]
      },
      {
        criterio: "Ritmo y creatividad",
        indicadores: [
          { id: "tea9", texto: "Orden y compás en la secuencia de los hechos, las acciones, el sonido y la música (en el caso de que la obra cuente con música).", max: 4 },
          { id: "tea10", texto: "Puesta en escena innovadora.", max: 4 }
        ]
      }
    ],
    reglas: [
      "La obra teatral no deberá exceder los quince (15) minutos. Este tiempo incluye la presentación del grupo y la reseña de la obra. Exceder el tiempo establecido restará al elenco cinco (5) puntos del total obtenido.",
      "Se permite el uso de recursos como muñecos, sin embargo, la obra debe ser representada por actores, no por títeres ni marionetas.",
      "El docente asesor no puede participar como personaje, intervenir en el trabajo o aparecer por ningún motivo en la obra teatral dentro del escenario."
    ]
  },

  baile_urbano: {
    id: "baile_urbano",
    numeral: "9.1.2",
    arte: "Artes escénicas",
    arteId: "artes_escenicas",
    disciplina: "Baile urbano",
    definicion: "Se considera baile urbano a los diferentes estilos de baile que contengan dentro de su coreografía la representación de una región, una ciudad o algún pueblo del país (baile peruano urbano). La música debe tener la melodía fusionada con estilos urbanos modernos que pueden ser bailables, como hip hop, house, dancehall, street jazz y breakdance, y que demuestren la versatilidad de su presentación.",
    modalidad: "grupal",
    maxParticipantes: 6,
    categorias: { E: "DRE", F: "NACIONAL" },
    presencial: true,
    tiempoMaximo: "04:00",
    penalizacionTiempo: 5,
    puntajeMaximo: 40,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "bur1", texto: "El baile comunica ideas y sentimientos.", max: 4 },
          { id: "bur2", texto: "Las ideas son originales y ponen en evidencia análisis y reflexión.", max: 4 }
        ]
      },
      {
        criterio: "Armonía rítmico-corporal",
        indicadores: [
          { id: "bur3", texto: "Expresión facial y corporal.", max: 4 },
          { id: "bur4", texto: "Coordinación rítmica individual.", max: 4 },
          { id: "bur5", texto: "Coordinación en los desplazamientos.", max: 4 },
          { id: "bur6", texto: "Armonía corporal y natural en los movimientos.", max: 4 }
        ]
      },
      {
        criterio: "Posicionamiento escénico",
        indicadores: [
          { id: "bur7", texto: "La coreografía presenta movimientos creativos; está compuesta por estilos, técnicas y movimientos característicos del baile urbano.", max: 4 },
          { id: "bur8", texto: "Las transiciones son creativas e inesperadas.", max: 4 },
          { id: "bur9", texto: "Movimientos dinámicos en las rutinas, ejecuciones, durante las coreografías individuales.", max: 4 }
        ]
      },
      {
        criterio: "Vestimenta",
        indicadores: [
          { id: "bur10", texto: "Originalidad de la vestimenta y accesorios que representan la esencia y el espíritu del entorno urbano.", max: 4 }
        ]
      }
    ],
    reglas: [
      "La presentación no deberá exceder los cuatro (4) minutos. Este tiempo incluye la presentación del grupo y la reseña de la obra. Exceder el tiempo establecido restará al elenco cinco (5) puntos del total obtenido.",
      "La vestimenta utilizada debe ser adecuada y coherente con el contexto del baile que se presenta."
    ]
  },

  danza_tradicional: {
    id: "danza_tradicional",
    numeral: "9.1.3",
    arte: "Artes escénicas",
    arteId: "artes_escenicas",
    disciplina: "Danza tradicional",
    definicion: "La danza se considera un lenguaje artístico y una manifestación cultural que, a través de sus pasos, coreografía, vestuario y música, expresa prácticas y saberes transmitidos de generación en generación, manteniéndose vigentes en su interpretación.",
    modalidad: "grupal",
    maxParticipantes: 16,
    categorias: { A: "IE", B: "IE", C: "IE", D: "DRE", E: "DRE", F: "NACIONAL", H: "DRE" },
    categoriasNoCompetitivas: ["A", "B", "C"],
    presencial: true,
    tiempoMaximo: "07:00",
    penalizacionTiempo: 5,
    puntajeMaximo: 48,
    criterios: [
      {
        criterio: "Presentación",
        indicadores: [
          { id: "dan1", texto: "Presentan una vestimenta tradicional apropiada.", max: 4 },
          { id: "dan2", texto: "Uso adecuado de prendas, herramientas y accesorios.", max: 4 }
        ]
      },
      {
        criterio: "Armonía rítmica corporal",
        indicadores: [
          { id: "dan3", texto: "Demuestran una coordinación rítmica corporal y visomotora.", max: 4 },
          { id: "dan4", texto: "Coordinación en los desplazamientos.", max: 4 },
          { id: "dan5", texto: "Realizan desplazamientos o mudanzas coreográficas en función del mensaje de la danza.", max: 4 }
        ]
      },
      {
        criterio: "Interpretación artística",
        indicadores: [
          { id: "dan6", texto: "Utilizan lenguaje corporal, gestual y oral acorde con las características y el mensaje presente en la danza.", max: 4 },
          { id: "dan7", texto: "Interpretan con naturalidad los movimientos de la danza.", max: 4 }
        ]
      },
      {
        criterio: "Dominio escénico",
        indicadores: [
          { id: "dan8", texto: "Aplican criterios de simetría y asimetría coreográfica.", max: 4 },
          { id: "dan9", texto: "Realizan figuras y mudanzas respetando las características del espacio utilizado como escenario.", max: 4 },
          { id: "dan10", texto: "El ingreso y la salida del escenario se realizan adecuadamente respetando el uso del espacio en el tiempo de duración establecido en las bases.", max: 4 }
        ]
      },
      {
        criterio: "Mensaje",
        indicadores: [
          { id: "dan11", texto: "Evidencian comprensión del significado cultural de la danza (contexto, intención u origen).", max: 4 },
          { id: "dan12", texto: "La interpretación transmite el sentido y propósito de la danza de manera coherente.", max: 4 }
        ]
      }
    ],
    reglas: [
      "La presentación no deberá exceder los siete (7) minutos de duración. Exceder el tiempo establecido restará al elenco cinco (5) puntos del total obtenido.",
      "No se permitirá, bajo ningún motivo, el uso de escenografía.",
      "Se debe presentar una danza tradicional de la región a la que pertenece la I. E.",
      "Medidas del escenario: 16 m x 10 m (largo por ancho).",
      "El docente asesor deberá completar de manera obligatoria la reseña histórica de la danza (Anexo A9)."
    ]
  },

  /* ───────────── 9.2 ARTES MUSICALES ───────────── */

  canto_solista: {
    id: "canto_solista",
    numeral: "9.2.1",
    arte: "Artes musicales",
    arteId: "artes_musicales",
    disciplina: "Canto solista",
    definicion: "Se considera canto solista a la interpretación individual de la música a través de la voz, con un canto de su región, en castellano o en la lengua originaria del participante. No cumplir con este punto implica descalificación.",
    modalidad: "individual",
    maxParticipantes: 1,
    categorias: { D: "DRE", E: "DRE", F: "NACIONAL", G: "UGEL" },
    presencial: true,
    tiempoMaximo: "04:00",
    penalizacionTiempo: 5,
    puntajeMaximo: 36,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "csol1", texto: "La interpretación de la canción comunica ideas y sentimientos.", max: 4 },
          { id: "csol2", texto: "La ejecución del canto pone en evidencia el análisis y la reflexión sobre el mensaje de la canción.", max: 4 }
        ]
      },
      {
        criterio: "Ritmo",
        indicadores: [
          { id: "csol3", texto: "Pulso correcto y constante de la canción a interpretar.", max: 4 }
        ]
      },
      {
        criterio: "Afinación y expresión",
        indicadores: [
          { id: "csol4", texto: "Correcta afinación de las melodías a ejecutar vocalmente.", max: 4 },
          { id: "csol5", texto: "Ejecución vocal estable, constante y clara.", max: 4 }
        ]
      },
      {
        criterio: "Técnica vocal",
        indicadores: [
          { id: "csol6", texto: "Emplea una técnica vocal adecuada, respiración, resonancia y vocalización.", max: 4 }
        ]
      },
      {
        criterio: "Musicalidad",
        indicadores: [
          { id: "csol7", texto: "Expresa y comunica el carácter de la canción a través de la interpretación, el manejo de matices o dinámicas.", max: 4 }
        ]
      },
      {
        criterio: "Presentación",
        indicadores: [
          { id: "csol8", texto: "Demuestra dominio escénico en la ejecución de su presentación.", max: 4 },
          { id: "csol9", texto: "Correcta presentación personal acorde al género musical.", max: 4 }
        ]
      }
    ],
    reglas: [
      "La duración de la pieza debe ser de cuatro (4) minutos como máximo. Exceder el tiempo establecido restará al participante cinco (5) puntos del total obtenido.",
      "El estudiante debe ejecutar una canción de su región de cualquier género musical o creación propia. No cumplir con este punto implica su descalificación.",
      "No se aceptan fondos musicales con voces grabadas o el uso de canciones originales (voz y música) como pista musical."
    ]
  },

  ensamble_instrumental: {
    id: "ensamble_instrumental",
    numeral: "9.2.3",
    arte: "Artes musicales",
    arteId: "artes_musicales",
    disciplina: "Ensamble instrumental",
    definicion: "Se considera ensamble instrumental al arte de ejecutar una pieza musical con un conjunto de instrumentos musicales.",
    modalidad: "grupal",
    maxParticipantes: 5,
    categorias: { D: "UGEL", E: "DRE", F: "NACIONAL" },
    presencial: true,
    tiempoMaximo: "04:00",
    penalizacionTiempo: 5,
    puntajeMaximo: 32,
    criterios: [
      {
        criterio: "Ritmo",
        indicadores: [
          { id: "ens1", texto: "Pulso correcto y constante de la pieza u obra a interpretar.", max: 4 },
          { id: "ens2", texto: "Tiempo y métrica correctos de la obra a interpretar según el género.", max: 4 }
        ]
      },
      {
        criterio: "Afinación y sonido",
        indicadores: [
          { id: "ens3", texto: "Correcta afinación de las melodías o armonías a ejecutar.", max: 4 },
          { id: "ens4", texto: "Ejecuta un sonido estable, constante y claro.", max: 4 }
        ]
      },
      {
        criterio: "Técnicas instrumentales",
        indicadores: [
          { id: "ens5", texto: "Emplea una técnica adecuada según el instrumento a ejecutar.", max: 4 }
        ]
      },
      {
        criterio: "Musicalidad",
        indicadores: [
          { id: "ens6", texto: "Expresa y comunica el carácter de la pieza a través de la interpretación, con recursos técnicos, manejo de matices o dinámicas y destreza instrumental.", max: 4 }
        ]
      },
      {
        criterio: "Presentación",
        indicadores: [
          { id: "ens7", texto: "Demuestra dominio escénico en la ejecución de su presentación.", max: 4 },
          { id: "ens8", texto: "Correcta presentación personal acorde al género musical.", max: 4 }
        ]
      }
    ],
    reglas: [
      "La duración de la pieza será de cuatro (4) minutos como máximo. Exceder el tiempo establecido restará al elenco cinco (5) puntos del total obtenido.",
      "Los estudiantes deben ejecutar una o más canciones de cualquier género musical de su región. No cumplir con este punto implica la descalificación del elenco."
    ]
  },

  banda_escolar: {
    id: "banda_escolar",
    numeral: "9.2.4",
    arte: "Artes musicales",
    arteId: "artes_musicales",
    disciplina: "Banda escolar de música",
    definicion: "Se considera banda escolar de música a una agrupación de estudiantes conformada por instrumentos de viento y percusión.",
    modalidad: "grupal",
    maxParticipantes: 25,
    categorias: { E: "NACIONAL", F: "NACIONAL" },
    categoriasEnConjunto: true,
    presencial: true,
    tiempoMaximo: "15:00",
    penalizacionTiempo: 0,
    puntajeMaximo: 32,
    criterios: [
      {
        criterio: "Puntualidad",
        indicadores: [
          { id: "ban1", texto: "Los participantes del elenco se encuentran listos y ordenados para su presentación.", max: 4 }
        ]
      },
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "ban2", texto: "La participación incluye como mínimo una pieza musical de su región.", max: 4 },
          { id: "ban3", texto: "La propuesta es original y transmite el mensaje de la pieza musical.", max: 4 }
        ]
      },
      {
        criterio: "Uso de elementos y recursos musicales (ejecución musical)",
        indicadores: [
          { id: "ban4", texto: "Coordinación y precisión rítmica acordes al género musical.", max: 4 },
          { id: "ban5", texto: "Calidad sonora: afinación, articulación y balance instrumental.", max: 4 },
          { id: "ban6", texto: "Dominio técnico y seguridad en la ejecución.", max: 4 }
        ]
      },
      {
        criterio: "Presentación global",
        indicadores: [
          { id: "ban7", texto: "Interpretación con expresividad y dominio escénico.", max: 4 },
          { id: "ban8", texto: "El ingreso y la salida del escenario son adecuados; evidencia orden y presencia escénica.", max: 4 }
        ]
      }
    ],
    reglas: [
      "La presentación será de quince (15) minutos como máximo y se contará a partir del primer sonido musical realizado por cualquier integrante de la banda.",
      "Se puede emplear coreografías, sin embargo, la evaluación solo tomará en cuenta la propuesta musical interpretativa.",
      "Se calificará solo la interpretación de los estudiantes. No se calificará bajo ningún punto la participación del docente asesor.",
      "A la etapa Nacional clasifican las seis (6) bandas con los puntajes más altos de la calificación preselectiva."
    ]
  },

  /* ───────────── 9.3 ARTES VISUALES ───────────── */

  pintura: {
    id: "pintura",
    numeral: "9.3.2",
    arte: "Artes visuales",
    arteId: "artes_visuales",
    disciplina: "Pintura",
    definicion: "La pintura es un lenguaje artístico que utiliza un conjunto de técnicas y materiales para plasmar su representación gráfica sobre una superficie determinada.",
    modalidad: "individual",
    maxParticipantes: 1,
    categorias: { D: "UGEL", E: "DRE", F: "NACIONAL", G: "DRE", H: "NACIONAL" },
    presencial: false,
    tiempoMaximo: null,
    penalizacionTiempo: 0,
    puntajeMaximo: 32,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "pin1", texto: "Comunica ideas y sentimientos.", max: 4 },
          { id: "pin2", texto: "Su trabajo y texto demuestran originalidad y evidencian análisis y reflexión.", max: 4 }
        ]
      },
      {
        criterio: "Creatividad",
        indicadores: [
          { id: "pin3", texto: "Usa técnicas, elementos de composición y una propuesta innovadora.", max: 4 },
          { id: "pin4", texto: "Demuestra imaginación e ideas independientes e innovadoras en su pintura.", max: 4 }
        ]
      },
      {
        criterio: "Composición",
        indicadores: [
          { id: "pin5", texto: "Utiliza elementos como el espacio, la forma, el manejo del color, el movimiento y el equilibrio que sustentan el contenido de la obra.", max: 4 },
          { id: "pin6", texto: "Combina los elementos visuales (línea, color, textura, forma, figura y valor) para transmitir sus ideas y sentimientos.", max: 4 }
        ]
      },
      {
        criterio: "Técnica",
        indicadores: [
          { id: "pin7", texto: "Aplica la técnica de acuerdo con el mensaje y el contenido propuesto.", max: 4 },
          { id: "pin8", texto: "Presenta limpieza y acabado.", max: 4 }
        ]
      }
    ],
    reglas: [
      "El participante debe realizar su trabajo en una cartulina de 40 cm x 50 cm. No se califican las obras presentadas en otras medidas a las establecidas.",
      "La cartulina debe estar pegada a un soporte sin marco.",
      "Se presenta una sola obra por participante: esta debe ser inédita y no debe haber sido premiada en ningún otro concurso.",
      "De no enviar a tiempo los trabajos ganadores, no serán exhibidos ni calificados."
    ]
  },

  arte_tradicional: {
    id: "arte_tradicional",
    numeral: "9.3.3",
    arte: "Artes visuales",
    arteId: "artes_visuales",
    disciplina: "Arte tradicional",
    definicion: "Se considera arte tradicional a aquellas obras cuyos procedimientos de elaboración tienen sus raíces en las tradiciones, las costumbres y los conocimientos de los pueblos, las comunidades o la región y cuya propuesta, original e innovadora, se basa en temas actuales o tradicionales.",
    modalidad: "individual",
    maxParticipantes: 1,
    categorias: { E: "DRE", F: "NACIONAL", H: "NACIONAL" },
    presencial: false,
    tiempoMaximo: null,
    penalizacionTiempo: 0,
    puntajeMaximo: 32,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "art1", texto: "Comunica ideas y sentimientos en relación con el tema de su obra.", max: 4 },
          { id: "art2", texto: "Su trabajo y su texto reflejan la historia, la tradición o la cosmovisión de su lugar de procedencia.", max: 4 }
        ]
      },
      {
        criterio: "Creatividad",
        indicadores: [
          { id: "art3", texto: "Emplea técnicas propias de su región, trabajando de manera innovadora.", max: 4 },
          { id: "art4", texto: "Demuestra imaginación, al igual que ideas independientes e innovadoras en su propuesta.", max: 4 }
        ]
      },
      {
        criterio: "Composición",
        indicadores: [
          { id: "art5", texto: "Utiliza elementos, como el espacio, la forma, el manejo del color, el movimiento y el equilibrio, que sustentan el contenido de la obra según su tradición.", max: 4 },
          { id: "art6", texto: "Combina elementos visuales (línea, color, textura, forma y espacio) para transmitir sus ideas y sentimientos.", max: 4 }
        ]
      },
      {
        criterio: "Materiales",
        indicadores: [
          { id: "art7", texto: "Utiliza materiales que lo identifican con su entorno natural, sin recurrir a la depredación de la flora, la fauna u otros.", max: 4 }
        ]
      },
      {
        criterio: "Técnica",
        indicadores: [
          { id: "art8", texto: "Emplea una técnica tradicional de su localidad. Demuestra conocimiento y sentido simbólico de su práctica.", max: 4 }
        ]
      }
    ],
    reglas: [
      "La obra debe tener un máximo de 65 cm en su dimensión mayor.",
      "Se presenta una sola obra por participante: debe ser inédita y no debe haber sido premiada en ningún otro concurso.",
      "Se debe indicar la disposición de la obra (cómo debe presentarse, horizontal o verticalmente, entre otros detalles)."
    ]
  },

  escultura: {
    id: "escultura",
    numeral: "9.3.4",
    arte: "Artes visuales",
    arteId: "artes_visuales",
    disciplina: "Escultura",
    definicion: "La escultura es una disciplina artística que consiste en esculpir o tallar distintos materiales para crear una forma con volumen.",
    modalidad: "individual",
    maxParticipantes: 1,
    categorias: { E: "DRE", F: "NACIONAL", H: "NACIONAL" },
    presencial: false,
    tiempoMaximo: null,
    penalizacionTiempo: 0,
    puntajeMaximo: 32,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "esc1", texto: "Comunica ideas y sentimientos con claridad.", max: 4 },
          { id: "esc2", texto: "Su trabajo y su texto reflejan la historia, la tradición o la cosmovisión de su lugar de procedencia.", max: 4 }
        ]
      },
      {
        criterio: "Creatividad",
        indicadores: [
          { id: "esc3", texto: "Emplea técnicas propias de su región, trabajando de manera innovadora.", max: 4 },
          { id: "esc4", texto: "Demuestra imaginación e ideas independientes e innovadoras en su propuesta.", max: 4 }
        ]
      },
      {
        criterio: "Composición",
        indicadores: [
          { id: "esc5", texto: "Utiliza elementos como el espacio, la forma, el manejo del color, el movimiento y el equilibrio que sustentan el contenido de la obra.", max: 4 },
          { id: "esc6", texto: "Combina elementos visuales (línea, color, textura, forma y espacio) para transmitir sus ideas y sentimientos.", max: 4 }
        ]
      },
      {
        criterio: "Materiales",
        indicadores: [
          { id: "esc7", texto: "Utiliza materiales que lo identifican con su entorno natural, sin recurrir a la depredación de la flora, la fauna u otros.", max: 4 }
        ]
      },
      {
        criterio: "Técnica",
        indicadores: [
          { id: "esc8", texto: "Emplea dominio de la técnica de su localidad. Demuestra conocimiento y sentido simbólico de su práctica.", max: 4 }
        ]
      }
    ],
    reglas: [
      "Las obras deben tener un mínimo de 25 cm y un máximo de 60 cm en su dimensión mayor.",
      "La técnica es libre y se puede utilizar cualquier material, con excepción del material orgánico perecedero.",
      "Al realizarlas, debe considerarse que puedan observarse por todos sus lados."
    ]
  },

  fotografia: {
    id: "fotografia",
    numeral: "9.3.5",
    arte: "Artes visuales",
    arteId: "artes_visuales",
    disciplina: "Fotografía",
    definicion: "La fotografía es el arte y la técnica de capturar imágenes relacionadas con un determinado tema.",
    modalidad: "individual",
    maxParticipantes: 1,
    categorias: { E: "DRE", F: "NACIONAL" },
    presencial: false,
    tiempoMaximo: null,
    penalizacionTiempo: 0,
    puntajeMaximo: 32,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "fot1", texto: "Comunica ideas y sentimientos en relación con el tema de su obra.", max: 4 },
          { id: "fot2", texto: "Aborda el tema resaltando sus elementos y proponiendo nuevas perspectivas sobre ellos.", max: 4 }
        ]
      },
      {
        criterio: "Creatividad",
        indicadores: [
          { id: "fot3", texto: "Emplea técnicas de manera innovadora.", max: 4 },
          { id: "fot4", texto: "Demuestra imaginación e ideas independientes e innovadoras en su propuesta.", max: 4 }
        ]
      },
      {
        criterio: "Composición",
        indicadores: [
          { id: "fot5", texto: "Utiliza los planos fotográficos, el espacio, el ritmo y el color para expresar el mensaje relacionado con alguno de los temas indicados.", max: 4 },
          { id: "fot6", texto: "Utiliza elementos, como la composición, la luz, el volumen, la simetría, la forma y la textura, que sustentan el contenido de la obra.", max: 4 }
        ]
      },
      {
        criterio: "Originalidad e impacto visual",
        indicadores: [
          { id: "fot7", texto: "Demuestra innovación y originalidad a través de la obra.", max: 4 }
        ]
      },
      {
        criterio: "Técnica",
        indicadores: [
          { id: "fot8", texto: "Aplica conceptos como profundidad de campo, iluminación, tiempo de exposición, enfoque, entre otros, de acuerdo con el mensaje que se quiere transmitir.", max: 4 }
        ]
      }
    ],
    reglas: [
      "El participante debe presentar la fotografía con una dimensión de 20 cm x 30 cm.",
      "La fotografía no puede tener datos de fecha u otros que identifiquen al autor.",
      "No se admiten fotomontajes o fotografías retocadas digitalmente con uso de plataformas, aplicaciones o herramientas con IA de mejora de imágenes, cuyo mensaje e imagen original hayan sido modificados."
    ]
  },

  /* ───────────── 9.4 ARTES LITERARIAS ───────────── */

  poesia: {
    id: "poesia",
    numeral: "9.4.1",
    arte: "Artes literarias",
    arteId: "artes_literarias",
    disciplina: "Poesía",
    definicion: "La poesía es una composición literaria que se concibe como expresión artística de la belleza o del sentimiento estético a través de la palabra, en castellano o en su lengua originaria.",
    modalidad: "individual",
    maxParticipantes: 1,
    categorias: { D: "UGEL", E: "DRE", F: "NACIONAL" },
    presencial: false,
    tiempoMaximo: null,
    penalizacionTiempo: 0,
    puntajeMaximo: 32,
    criterios: [
      {
        criterio: "Adecúa el texto a la situación comunicativa.",
        indicadores: [
          { id: "poe1", texto: "Considera el propósito, el destinatario, el tipo de texto, el género literario y el registro al escribir su poema.", max: 4 },
          { id: "poe2", texto: "Expresa su sentir, sus emociones, inquietudes o ideas.", max: 4 },
          { id: "poe3", texto: "La poesía desarrolla ideas sobre el tema de su elección describiéndolo o presentando su opinión.", max: 4 }
        ]
      },
      {
        criterio: "Organiza y desarrolla las ideas de forma coherente y cohesionada.",
        indicadores: [
          { id: "poe4", texto: "Ordena sus ideas en torno a un tema, ampliándose y complementándose, estableciendo relaciones de coherencia y cohesión entre ellas y utilizando un vocabulario variado.", max: 4 },
          { id: "poe5", texto: "Usa con precisión recursos ortográficos y gramaticales para establecer relaciones lógicas entre las ideas.", max: 4 },
          { id: "poe6", texto: "Emplea figuras retóricas con el propósito de elaborar patrones rítmicos demostrando creatividad y originalidad.", max: 4 },
          { id: "poe7", texto: "Utiliza técnicas de composición poética y recursos estilísticos para garantizar la claridad y el uso estético del lenguaje.", max: 4 }
        ]
      },
      {
        criterio: "Reflexiona y evalúa la forma, el contenido y el contexto del texto escrito.",
        indicadores: [
          { id: "poe8", texto: "La poesía se presenta con un lenguaje que refuerza o sugiere sentidos y produce efectos en los lectores.", max: 4 }
        ]
      }
    ],
    reglas: [
      "Su extensión no debe exceder los veinticinco (25) versos o líneas, impreso a una sola cara y como máximo una página.",
      "Los trabajos se presentan en tamaño A4, indicando el nombre del participante, la I. E., la UGEL y la DRE/GRE.",
      "Si la obra se presenta en una lengua originaria, el docente asesor deberá entregar al jurado la versión traducida al castellano."
    ]
  },

  /* ───────────── 9.5 ARTE, DISEÑO Y TECNOLOGÍA ───────────── */

  corto_audiovisual: {
    id: "corto_audiovisual",
    numeral: "9.5.1",
    arte: "Arte, diseño y tecnología",
    arteId: "arte_diseno_tecnologia",
    disciplina: "Corto audiovisual",
    definicion: "El corto audiovisual consiste en la elaboración de un cortometraje de ficción o de un video de género libre (documental, entrevista, videoarte, entre otros), orientado a visibilizar producciones de corta duración en audio y video, así como a fomentar su creación entre los estudiantes.",
    modalidad: "grupal",
    maxParticipantes: 2,
    categorias: { F: "NACIONAL" },
    presencial: false,
    tiempoMaximo: "06:00",
    penalizacionTiempo: 0,
    puntajeMaximo: 32,
    requiereURL: true,
    criterios: [
      {
        criterio: "Comunicación y desarrollo de ideas",
        indicadores: [
          { id: "cor1", texto: "La historia comunica ideas y sentimientos con claridad.", max: 4 },
          { id: "cor2", texto: "Expresa un sentir, una inquietud o una idea.", max: 4 }
        ]
      },
      {
        criterio: "Uso de elementos y recursos audiovisuales",
        indicadores: [
          { id: "cor3", texto: "Los personajes son coherentes con el tema planteado.", max: 4 },
          { id: "cor4", texto: "Las locaciones han sido bien definidas de acuerdo con el contexto.", max: 4 },
          { id: "cor5", texto: "Se hace buen uso de la iluminación, los contraluces y la luz natural o artificial.", max: 4 },
          { id: "cor6", texto: "Se maneja el movimiento de cámara, el audio, el sonido natural o los efectos de sonido de manera adecuada y efectiva.", max: 4 }
        ]
      },
      {
        criterio: "Producto global",
        indicadores: [
          { id: "cor7", texto: "Su producto final demuestra esfuerzo y atención a los detalles. Presenta un trabajo bien acabado.", max: 4 },
          { id: "cor8", texto: "Demuestra imaginación, ideas independientes e innovadoras en su cortometraje.", max: 4 }
        ]
      }
    ],
    reglas: [
      "Duración máxima de seis (6) minutos, incluyendo un (1) minuto de presentación de los participantes y la reseña de la obra.",
      "Al inicio del video se debe mencionar como mínimo el nombre de la I. E., el título del cortometraje o videoclip y la región o provincia de procedencia (créditos).",
      "Si se realiza en lengua originaria, el cortometraje debe contar con subtítulos en español.",
      "El enlace del video debe estar registrado en el SICE."
    ]
  },

  historietas_interactivas: {
    id: "historietas_interactivas",
    numeral: "9.5.2",
    arte: "Arte, diseño y tecnología",
    arteId: "arte_diseno_tecnologia",
    disciplina: "Historietas interactivas",
    definicion: "Consiste en elaborar una historieta a través de un lenguaje de programación, con una secuencia de viñetas o representaciones gráficas que narra una historia mediante imágenes y textos que aparecen encerrados en globos. El participante deberá desarrollar la historieta empleando escenarios, personajes y acciones animadas.",
    modalidad: "individual",
    maxParticipantes: 1,
    categorias: { D: "UGEL", E: "DRE", F: "NACIONAL" },
    presencial: false,
    tiempoMaximo: null,
    penalizacionTiempo: 0,
    puntajeMaximo: 40,
    requiereURL: true,
    criterios: [
      {
        criterio: "Adecúa el texto a la situación comunicativa.",
        indicadores: [
          { id: "his1", texto: "La temática y los personajes describen un suceso o relatan una historia relacionada al eje temático.", max: 4 },
          { id: "his2", texto: "Manejo adecuado de la redacción y la ortografía.", max: 4 },
          { id: "his3", texto: "Considera el propósito, el destinatario, el tipo de texto, el género discursivo y el registro que utilizará al escribir los textos, así como los contextos socioculturales que enmarcan la comunicación escrita.", max: 4 }
        ]
      },
      {
        criterio: "Organiza y desarrolla las ideas de forma coherente y cohesionada.",
        indicadores: [
          { id: "his4", texto: "Presenta secuencia correcta, funcionalidad y pertinencia.", max: 4 },
          { id: "his5", texto: "El estilo gráfico (colores, imágenes, tipografía, entre otros) presenta armonía y contribuye a la comprensión de la narración elaborada.", max: 4 },
          { id: "his6", texto: "Ordena lógicamente las ideas en torno a un tema, ampliándose y complementándose, estableciendo relaciones de cohesión entre ellas y utilizando un vocabulario pertinente.", max: 4 }
        ]
      },
      {
        criterio: "Utiliza convenciones del lenguaje escrito de forma pertinente.",
        indicadores: [
          { id: "his7", texto: "Utiliza los elementos necesarios (escenarios, personajes, acciones, sonidos, movimientos, parlamentos, imágenes, entre otros) para expresar el mensaje.", max: 4 },
          { id: "his8", texto: "Usa de forma apropiada recursos textuales para garantizar la claridad, el uso estético del lenguaje y el sentido del texto escrito.", max: 4 }
        ]
      },
      {
        criterio: "Reflexiona y evalúa la forma, el contenido y el contexto del texto escrito.",
        indicadores: [
          { id: "his9", texto: "El contenido presenta coherencia y cohesión adecuadas a la situación comunicativa, con atención al detalle para su mejora.", max: 4 },
          { id: "his10", texto: "El estudiante explica el relato realizado y fundamenta la relación con el tema sorteado.", max: 4 }
        ]
      }
    ],
    reglas: [
      "Categoría D: la historieta debe ser animada. Categorías E y F: la historieta debe ser interactiva.",
      "Los participantes deben usar las plataformas online de programación Scratch (https://scratch.mit.edu) o mblock (https://mblock.cc).",
      "El docente asesor deberá registrar en el SICE el enlace del proyecto."
    ]
  }
};

/* ───── Disciplinas NO competitivas: no llevan ficha de calificación ───── */
export const DISCIPLINAS_NO_COMPETITIVAS = {
  canto_grupal: {
    id: "canto_grupal",
    numeral: "9.2.2",
    arte: "Artes musicales",
    disciplina: "Canto grupal",
    categorias: { C: "IE" },
    motivo: "La participación es no competitiva, por lo que esta disciplina no tiene cuadro de calificación."
  },
  creacion_colectiva: {
    id: "creacion_colectiva",
    numeral: "9.3.1",
    arte: "Artes visuales",
    disciplina: "Creación colectiva",
    categorias: { A: "IE", B: "IE", C: "IE" },
    motivo: "La participación es no competitiva, por lo que esta disciplina no tiene cuadro de calificación."
  }
};

/* ───── Helpers de acceso ───── */
export const LISTA_DISCIPLINAS = Object.values(RUBRICAS_JF);

export function getRubrica(disciplinaId) {
  return RUBRICAS_JF[disciplinaId] || null;
}

export function getIndicadores(disciplinaId) {
  const r = getRubrica(disciplinaId);
  if (!r) return [];
  return r.criterios.flatMap(c => c.indicadores.map(i => ({ ...i, criterio: c.criterio })));
}

export function getDisciplinasPorArte() {
  return LISTA_DISCIPLINAS.reduce((acc, d) => {
    (acc[d.arte] = acc[d.arte] || []).push(d);
    return acc;
  }, {});
}
