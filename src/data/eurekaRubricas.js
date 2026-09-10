/* ═══════════════════════════════════════════════════════════════
   EUREKA 2026 — RÚBRICAS OFICIALES E11 a E18
   Transcripción literal de los Anexos E11 a E18 de las Bases Específicas
   MINEDU 2026 — Anexo E — Feria Escolar Nacional de Ciencia y Tecnología.

   REGLA DE ORO: ningún descriptor de esta tabla debe parafrasearse. Un descriptor
   alterado invalida legalmente la ficha suscrita por el jurado calificador.

   Dos motores de rúbrica:
     tipoEscala 'simple'    → E11, E12, E13, E14. Suma directa del nivel elegido. Máx. 20.
     tipoEscala 'ponderada' → E15, E16, E17, E18. calificación (1..4) x ponderación. Máx. 100.

   TRAMPA CRÍTICA: el Anexo E12 usa la escala [5, 4, 3, 1]. El nivel 2 NO EXISTE en el
   documento oficial. La escala se declara como arreglo explícito por rúbrica y jamás se
   deduce de un rango.
   ═══════════════════════════════════════════════════════════════ */

import { LEYENDA_CALIFICACION_PONDERADA } from './eurekaCatalogos';

export const RUBRICAS_EUREKA = {

  /* ═══════════════ PARTE I — PRIMARIA (Categorías A, B y C) ═══════════════ */

  E11: {
    id: 'E11',
    titulo: 'Formulario de evaluación de la categoría A, B y C – informe del proyecto de indagación científica',
    categorias: ['A', 'B', 'C'],
    areaId: 'ind_ciencia_tecnologia',
    lineaId: 'indagacion_cientifica',
    competencia: 'Indaga mediante métodos científicos para construir sus conocimientos',
    tipoEscala: 'simple',
    escala: [4, 3, 2, 1],
    puntajeMaximo: 20,
    notaMetodologica: 'Los estudiantes evidencian sus desempeños de manera oral, gráfica y/o escrita.',
    gate: {
      requerido: true,
      pregunta: 'Presenta la evidencia de planificación curricular en el que se aborda el proyecto de indagación científica',
      textoPositivo: 'Si la respuesta es "SÍ" prosigue con la evaluación.',
      textoNegativo: 'Si es "NO", concluye su participación.'
    },
    cierreOficial: 'Para la rúbrica, en la categoría "A, B y C" en el área de indagación, el puntaje máximo que se obtendría es de 20 puntos, en relación a los puntajes que se indica para cada criterio.',
    criterios: [
      {
        id: 'e11_c1',
        nombre: 'Problematiza situaciones para hacer indagación',
        nota: 'Una pregunta investigable es aquella que permite establecer la relación entre diferentes factores o fenómenos y que permite diseñar una metodología de obtención de datos y que puede ser respondida mediante pruebas experimentales.',
        descriptores: {
          4: 'La indagación parte de una pregunta investigable y las hipótesis planteadas describen la relación entre las variables de estudio.',
          3: 'La indagación parte de una pregunta investigable y plantean una hipótesis en la que describen un hecho o fenómeno.',
          2: 'La indagación parte de una pregunta y plantea posibles respuestas que expresan un punto de vista sobre el hecho o fenómeno estudiado.',
          1: 'La indagación parte de una pregunta que no guarda relación con la posible respuesta planteada.'
        }
      },
      {
        id: 'e11_c2',
        nombre: 'Diseña estrategias para hacer indagación',
        descriptores: {
          4: 'Describe las acciones y los procedimientos en orden lógico que utilizó para recoger información relacionada con las variables de estudio. Explica cómo usó los materiales, instrumentos y fuentes de información científica que le permiten comprobar sus hipótesis.',
          3: 'Describe las acciones y procedimientos que realizó para recoger información, pero tiene dificultades para ordenarlas en una secuencia lógica. Menciona los materiales e instrumentos que usó en su indagación y las fuentes de información científica que empleó.',
          2: 'Menciona las acciones que realizó, pero no están organizadas en una secuencia lógica. Menciona los materiales e instrumentos que usó en su indagación.',
          1: 'Menciona las acciones que realizó sin un orden lógico. Menciona solo algunos materiales e instrumentos que usó en su indagación.'
        }
      },
      {
        id: 'e11_c3',
        nombre: 'Genera y registra datos e información',
        descriptores: {
          4: 'Presenta datos cuantitativos/cualitativos como resultado de las acciones y procedimientos aplicados para responder la pregunta investigable en relación con las variables. Usa unidades de medida convencionales y no convencionales, registra los datos y los representa en organizadores según su naturaleza.',
          3: 'Presenta datos cualitativos/cuantitativos como resultado de las acciones y procedimientos aplicados para dar respuesta a la pregunta investigable. Usa unidades de medida convencionales y no convencionales, registra los datos sólo en tablas.',
          2: 'Presenta algunos datos cualitativos o cuantitativos relacionados que guardan una escasa relación con las acciones que realizó para responder a la pregunta. Evidencia una escasa comprensión de las unidades de medida convencionales y no convencionales que empleó. Registra los datos en tablas.',
          1: 'Presenta datos cualitativos o cuantitativos que no le permiten dar una respuesta a la pregunta planteada. Tiene dificultades al emplear las unidades de medida convencional/no convencional. Los datos se registran sin un orden definido.'
        }
      },
      {
        id: 'e11_c4',
        nombre: 'Analiza datos e información',
        descriptores: {
          4: 'Utiliza los organizadores de datos para explicar la relación de los datos recogidos en función de las variables para responder a la pregunta investigable. Explica el significado de los datos obtenidos en relación con la hipótesis, empleando los conocimientos científicos. Elabora sus conclusiones en relación a la pregunta con base en los datos e información científica.',
          3: 'Utiliza los organizadores de datos para justificar la hipótesis que propuso, empleando la información científica que posee. Elabora sus conclusiones con relación a la pregunta con base en los datos obtenidos.',
          2: 'Utiliza los datos obtenidos para justificar la posible respuesta que propuso, refiriendo solo alguna información científica. Elabora sus conclusiones con relación a la pregunta con base en algunos datos obtenidos.',
          1: 'Tiene dificultades para utilizar los datos que presenta y justificar la posible respuesta planteada. Elabora algunas conclusiones con relación a la pregunta, pero no usa los datos obtenidos.'
        }
      },
      {
        id: 'e11_c5',
        nombre: 'Evalúa y comunica el proceso y resultados de su indagación',
        descriptores: {
          4: 'Comunica los resultados de su indagación y lo que aprendió usando conocimientos científicos, describiendo las acciones y procedimientos seguidos. Describen los logros y dificultades que tuvo en el proceso de indagación y sugieren acciones adecuadas para superarlas y/o mejorar indagaciones futuras.',
          3: 'Comunica las conclusiones de su indagación y lo que aprendió usando datos obtenidos y algunos conocimientos científicos. Describe los logros y dificultades que tuvo en el proceso de indagación.',
          2: 'Comunica conclusiones de su indagación y lo que aprendió usando datos obtenidos y algunos conocimientos científicos.',
          1: 'Comunica conclusiones de su indagación y lo que aprendió usando conocimientos de sentido común.'
        }
      }
    ]
  },

  E12: {
    id: 'E12',
    titulo: 'Formulario de evaluación de la categoría A, B y C – informe del proyecto de Alternativa de Solución Tecnológica',
    categorias: ['A', 'B', 'C'],
    areaId: 'ind_ciencia_tecnologia',
    lineaId: 'solucion_tecnologica',
    competencia: 'Diseña y construye soluciones tecnológicas para resolver problemas de su entorno',
    tipoEscala: 'simple',
    // ADVERTENCIA: escala oficial 5-4-3-1. El nivel 2 no existe. 4 criterios x 5 = 20.
    escala: [5, 4, 3, 1],
    puntajeMaximo: 20,
    notaMetodologica: 'Los estudiantes evidencian sus desempeños de manera oral, gráfica y/o escrita.',
    gate: {
      requerido: true,
      pregunta: 'Presenta la evidencia de planificación curricular en el que se aborda el proyecto de diseño de solución tecnológica',
      textoPositivo: 'Si la respuesta es "SÍ" prosigue con la evaluación.',
      textoNegativo: 'Si es "NO", concluye su participación.'
    },
    cierreOficial: 'Para la rúbrica, en la categoría "A, B y C" en el área de tecnología, el puntaje máximo que se obtendría es de 20 puntos, en relación a los puntajes que se indica para cada criterio.',
    criterios: [
      {
        id: 'e12_c1',
        nombre: 'Determina una alternativa de solución tecnológica',
        descriptores: {
          5: 'Describe las causas de la necesidad o define el problema que quiere resolver. Presenta antecedentes relacionados con el problema o necesidad. Establece quienes se beneficiarán con la solución tecnológica. Selecciona una solución tecnológica.',
          4: 'Describe las causas de la necesidad o define el problema que quiere resolver. Presenta antecedentes relacionados con el problema o necesidad. Selecciona una solución tecnológica.',
          3: 'Presenta el problema que quiere resolver. Presenta antecedentes relacionados con el problema o necesidad. Selecciona una solución tecnológica.',
          1: 'Presenta el problema que quiere resolver. Selecciona una solución tecnológica.'
        }
      },
      {
        id: 'e12_c2',
        nombre: 'Diseña la alternativa de solución tecnológica',
        // Ambigüedad detectada en el PDF fuente: tras el descriptor del nivel 1 aparece una
        // línea suelta adicional cuya asignación de columna no es determinable desde el texto
        // extraído. Se implementa la tabla tal como figura en el anexo y queda pendiente de
        // confirmación con el PDF original a la vista.
        observacionFuente: 'Nivel 1: el documento fuente presenta una línea adicional suelta cuya columna no es determinable desde el texto extraído. Confirmar con el PDF oficial antes de cerrar la Fase 1.',
        descriptores: {
          5: 'Establece especificaciones que deberá cumplir la solución tecnológica. Selecciona los recursos y materiales que utiliza. Crea un plano de cada parte o etapa de la solución tecnológica. Explica los fundamentos científicos o conocimientos locales de la solución tecnológica. Presenta un presupuesto para costear la solución tecnológica. Presenta un plan y temporaliza las actividades que realizará.',
          4: 'Establece especificaciones que deberá cumplir la solución tecnológica. Selecciona los recursos y materiales a utilizar. Crea un boceto de cada parte o etapa de la solución tecnológica. Presenta un plan y temporaliza las actividades que realizará.',
          3: 'Presenta un boceto de cada parte o etapa de la solución tecnológica. Explica los fundamentos científicos o conocimientos de la solución tecnológica. Presenta un plan y temporaliza las actividades que realizará.',
          1: 'Presenta un boceto de cada parte o etapa de la solución tecnológica. Presenta un plan y temporaliza las actividades que realizará.'
        }
      },
      {
        id: 'e12_c3',
        nombre: 'Implementa y valida la alternativa de solución tecnológica',
        descriptores: {
          5: 'Construye la solución tecnológica siguiendo su plano. Pone a prueba la solución tecnológica con base en las especificaciones. Muestra los ajustes realizados (en el diseño, tiempo necesario y presupuesto).',
          4: 'Construye la solución tecnológica siguiendo su boceto. Pone a prueba la solución tecnológica con base en las especificaciones. Muestra los ajustes realizados (en el diseño, tiempo necesario y presupuesto).',
          3: 'Construye la solución tecnológica. Pone a prueba la solución tecnológica con bases en las especificaciones.',
          1: 'Construye la solución tecnológica.'
        }
      },
      {
        id: 'e12_c4',
        nombre: 'Evalúa y comunica el funcionamiento y los impactos de su alternativa de solución tecnológica',
        descriptores: {
          5: 'Comunica los pasos que siguieron para que la solución tecnológica funcione. Explica cuál es la característica más importante de su solución tecnológica. Presenta las mejoras que podrían hacer a la solución tecnológica. Explica y fundamenta en principios, leyes y teorías el funcionamiento de su solución tecnológica. Presenta la versión final de la solución tecnológica.',
          4: 'Comunica los pasos que siguieron para que la solución tecnológica funcione. Explica cuál es la característica más importante de su solución tecnológica. Explica y fundamenta en principios, leyes y teorías el funcionamiento de su solución tecnológica. Presenta la versión final de la solución tecnológica.',
          3: 'Comunica los pasos que siguieron para que la solución tecnológica funcione. Explica y fundamenta en principios, leyes y teorías, el funcionamiento de su solución tecnológica. Presenta la versión final de la solución tecnológica.',
          1: 'Comunica los pasos que siguieron para que la solución tecnológica funcione. Presenta la versión final de la solución tecnológica.'
        }
      }
    ]
  },

  E13: {
    id: 'E13',
    titulo: 'Formulario de evaluación de la categoría A, B y C – indagación basada en una pregunta relacionada a la historia',
    categorias: ['A', 'B', 'C'],
    areaId: 'indagacion_social',
    lineaId: 'historia',
    competencia: 'Construye interpretaciones históricas',
    tipoEscala: 'simple',
    escala: [4, 3, 2, 1],
    puntajeMaximo: 20,
    notaMetodologica: 'Los estudiantes evidencian sus desempeños de manera oral, gráfica y/o escrita.',
    gate: {
      requerido: true,
      pregunta: 'Presenta la evidencia de planificación curricular en el que se aborda el proyecto de indagación social',
      textoPositivo: 'Si la respuesta es "SÍ" prosigue con la evaluación.',
      textoNegativo: 'Si es "NO", concluye su participación.'
    },
    cierreOficial: 'El puntaje máximo que se obtendría es de 20 puntos, en relación a los puntajes que se indica para cada criterio.',
    criterios: [
      {
        id: 'e13_c1',
        nombre: 'Problematización de hechos o situaciones relevantes de la vida cotidiana relacionada a la historia',
        descriptores: {
          4: 'Describe la situación problemática de la vida cotidiana que genera la indagación. Plantea una pregunta que promueve la indagación sobre un hecho del pasado o proceso histórico, a partir de un hecho o situación problemática de la vida cotidiana. Explica la respuesta preliminar a la pregunta.',
          3: 'Plantea una pregunta que promueve la indagación sobre un hecho del pasado o proceso histórico, a partir de un hecho o situación problemática de la vida cotidiana. Explica la respuesta preliminar a la pregunta.',
          2: 'Plantea una pregunta sobre un hecho del pasado o proceso histórico. Explica la respuesta preliminar a la pregunta.',
          1: 'Plantea una pregunta sobre un hecho del pasado o proceso histórico, pero no guarda relación con la respuesta preliminar.'
        }
      },
      {
        id: 'e13_c2',
        nombre: 'Interpretación de fuentes',
        descriptores: {
          4: 'Elabora organizadores utilizando fuentes diversas para responder la pregunta. Menciona algunas coincidencias y diferencias entre las versiones de los autores de las fuentes sobre el hecho o proceso histórico abordado. Explica por qué las fuentes consultadas son útiles para responder a la pregunta.',
          3: 'Elabora organizadores para responder a la pregunta. Menciona algunas diferencias entre las versiones de los autores de las fuentes sobre el hecho o proceso histórico abordado. Explica por qué es importante el uso de fuentes en la indagación.',
          2: 'Elabora organizadores que guardan escasa relación con la pregunta. Menciona las fuentes que utilizó.',
          1: 'Elabora organizadores que no guardan relación con la pregunta. Señala las fuentes que utilizó.'
        }
      },
      {
        id: 'e13_c3',
        nombre: 'Comprensión del tiempo histórico',
        nota: 'Convenciones: calendarios, décadas, ciclos, milenios, entre otros. Categorías temporales: simultaneidad, cambios, permanencias, entre otros.',
        descriptores: {
          4: 'Ordena cronológicamente hechos o procesos históricos utilizando convenciones y categorías temporales. Describe algunos cambios, permanencias y simultaneidades producidos en el hecho o proceso histórico abordado, que le permiten responder la pregunta.',
          3: 'Ordena cronológicamente hechos o procesos históricos, utilizando convenciones y categorías temporales. Describe algunos cambios y permanencias producidos en el hecho o procesos histórico abordado, que le permiten responder a la pregunta.',
          2: 'Ordena cronológicamente hechos o procesos históricos. Describe algunos cambios y permanencias producidas en el hecho o procesos histórico abordado, que le permiten responder a la pregunta.',
          1: 'Presenta hechos o procesos históricos que no le permiten responder la pregunta.'
        }
      },
      {
        id: 'e13_c4',
        nombre: 'Explicaciones sobre hechos y/o procesos históricos',
        descriptores: {
          4: 'Explica la respuesta a la pregunta, describiendo las causas y consecuencias, los cambios, permanencias y/o simultaneidades; con base en la información analizada. Describe la relación entre el hecho o proceso histórico del pasado y el hecho o situación problemática de la vida cotidiana, con base en la información analizada.',
          3: 'Explica la respuesta a la pregunta, describiendo las causas y consecuencias, con base en la información analizada. Describe la relación entre el hecho o proceso histórico del pasado y el hecho o situación problemática de la vida cotidiana, con base en la información analizada.',
          2: 'Explica la respuesta a la pregunta, sin considerar la información analizada. Señala la relación entre el hecho o proceso histórico del pasado y el hecho o situación problemática de la vida cotidiana, sin considerar la información analizada.',
          1: 'Explica una respuesta que no guarda relación con la pregunta.'
        }
      },
      {
        id: 'e13_c5',
        nombre: 'Presentación de conclusiones',
        descriptores: {
          4: 'Comunica los resultados de su indagación y lo que aprendió usando los nuevos conocimientos. Explica cómo incorporó lo aprendido en su vida cotidiana. Describe las acciones realizadas, logros y dificultades en el proceso de indagación y sugiere acciones de mejora para indagaciones futuras.',
          3: 'Comunica los resultados de su indagación y lo que aprendió usando los nuevos conocimientos. Describe las acciones realizadas, logros y dificultades en el proceso de indagación y sugiere acciones de mejora para indagaciones futuras.',
          2: 'Comunica los resultados de su indagación y lo que aprendió usando los nuevos conocimientos.',
          1: 'Comunica la respuesta a la pregunta.'
        }
      }
    ]
  },

  E14: {
    id: 'E14',
    titulo: 'Formulario de evaluación de la categoría A, B y C – indagación basada en un problema ambiental o territorial',
    categorias: ['A', 'B', 'C'],
    areaId: 'indagacion_social',
    lineaId: 'ambiental_territorial',
    competencia: 'Gestiona responsablemente el espacio y el ambiente',
    tipoEscala: 'simple',
    escala: [4, 3, 2, 1],
    puntajeMaximo: 20,
    notaMetodologica: 'Los estudiantes evidencian sus desempeños de manera oral, gráfica y/o escrita.',
    gate: {
      requerido: true,
      pregunta: 'Presenta la evidencia de planificación curricular en el que se aborda el proyecto de indagación social',
      textoPositivo: 'Si la respuesta es "SÍ" prosigue con la evaluación.',
      textoNegativo: 'Si es "NO", concluye su participación.'
    },
    cierreOficial: 'El puntaje máximo que se obtendría es de 20 puntos, en relación a los puntajes que se indica para cada criterio.',
    criterios: [
      {
        id: 'e14_c1',
        nombre: 'Planteamiento del problema ambiental o territorial',
        nota: 'Ejemplos de problemas ambientales: la deforestación, la contaminación del mar, la contaminación del aire, suelo y agua, la desertificación y la pérdida de suelo, el calentamiento global, los desastres causados por fenómenos naturales, el cambio climático, etc. Ejemplos de problemas territoriales: el caos en el transporte a nivel local, la expansión urbana versus la reducción de tierras de cultivo a nivel local, regional o nacional, etc.',
        descriptores: {
          4: 'Describe la situación problemática de la vida cotidiana que genera la indagación. Plantea una pregunta que promueve la indagación sobre un problema ambiental o territorial. Explica la respuesta preliminar a la pregunta.',
          3: 'Plantea una pregunta que promueve la indagación sobre un problema ambiental o territorial. Explica la respuesta preliminar a la pregunta.',
          2: 'Plantea una pregunta sobre un problema ambiental o territorial. Propone una respuesta preliminar a la pregunta.',
          1: 'Plantea una pregunta, pero no guarda relación con la respuesta preliminar.'
        }
      },
      {
        id: 'e14_c2',
        nombre: 'Manejo de fuentes de información para comprender el espacio geográfico y el ambiente',
        nota: 'Fuentes: entrevistas, encuestas, cuadros y gráficos estadísticos, fichas de observación, fotografías, imágenes, videos, libros, páginas web y revistas académicas, dibujos, croquis, planos, mapas, maquetas, entre otras.',
        descriptores: {
          4: 'Describe en orden lógico, las acciones que realizó para recoger información relacionada con las variables. Explica cómo usó las fuentes de información que le permiten verificar la respuesta preliminar. Elabora organizadores utilizando fuentes diversas para responder la pregunta.',
          3: 'Describe las acciones que realizó para recoger información, pero tiene dificultades para ordenarlas en una secuencia lógica. Menciona las fuentes de información que empleó. Elabora organizadores para responder la pregunta.',
          2: 'Menciona las acciones que realizó, pero no las puede ordenar en una secuencia lógica. Menciona las fuentes de información que empleó. Elabora organizadores que guardan una escasa relación con la pregunta.',
          1: 'Menciona las acciones que realizó sin un orden lógico. Elabora organizadores que no guardan relación con la pregunta.'
        }
      },
      {
        id: 'e14_c3',
        nombre: 'Comprensión de las relaciones entre los elementos naturales y sociales',
        descriptores: {
          4: 'Explica la respuesta a la pregunta, describiendo la relación entre las variables, con base en la información analizada.',
          3: 'Explica la respuesta a la pregunta, mencionando las causas y consecuencias del hecho o fenómeno, con base en la información analizada.',
          2: 'Explica la respuesta a la pregunta, sin considerar la información analizada.',
          1: 'Explica una respuesta que no guarda relación con la pregunta.'
        }
      },
      {
        id: 'e14_c4',
        nombre: 'Generación de acciones para conservar el ambiente local y global',
        nota: 'Ejemplos de acciones para conservar el espacio y el ambiente: planificar y participar en simulacros, señalizar la I. E., acciones concretas para la conservación del ambiente en la escuela y en la localidad relacionadas al manejo y uso del agua, la energía, 3R (reducir, reusar y reciclar) y residuos sólidos, conservación de los ecosistemas terrestres y marinos, transporte, entre otros, teniendo en cuenta el desarrollo sostenible.',
        descriptores: {
          4: 'Propone acciones concretas y realizables, orientadas a contribuir a la solución del problema ambiental o territorial abordado. Realiza todas las acciones propuestas y presenta fotografías como evidencias.',
          3: 'Propone acciones sencillas, orientadas a contribuir a la solución del problema ambiental o territorial abordado. Realiza algunas acciones propuestas y presenta fotografías como evidencias.',
          2: 'Propone acciones sencillas, orientadas a contribuir a la solución del problema ambiental o territorial abordado.',
          1: 'Propone acciones sencillas, pero no están orientadas a contribuir a la solución del problema ambiental o territorial abordado.'
        }
      },
      {
        id: 'e14_c5',
        nombre: 'Evaluación y comunicación',
        descriptores: {
          4: 'Comunica los resultados de su indagación y lo que aprendió usando los nuevos conocimientos. Describe las acciones realizadas, logros y dificultades en el proceso de indagación y sugiere acciones de mejora para indagaciones futuras.',
          3: 'Comunica los resultados de su indagación y lo que aprendió usando los algunos conocimientos nuevos. Describe las acciones realizadas, logros y dificultades en el proceso de indagación.',
          2: 'Comunica los resultados de su indagación y lo que aprendió usando los algunos conocimientos nuevos.',
          1: 'Comunica la respuesta a la pregunta.'
        }
      }
    ]
  },

  /* ═══════════════ PARTE II — SECUNDARIA (Categorías D y E) ═══════════════ */

  E15: {
    id: 'E15',
    titulo: 'Formulario de evaluación de la categoría D y E – informe del proyecto de indagación científica',
    categorias: ['D', 'E'],
    areaId: 'indagacion_cientifica',
    tipoEscala: 'ponderada',
    escala: [4, 3, 2, 1],
    puntajeMaximo: 100,
    sumaPonderaciones: 25,
    tieneVariantes: true,
    variantes: { A: 'Indagación científica experimental', B: 'Indagación científica descriptiva' },
    gate: { requerido: false },
    leyendaCalificacion: LEYENDA_CALIFICACION_PONDERADA,
    aspectos: [
      {
        id: 'e15_introduccion',
        nombre: 'Introducción',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Presenta la importancia del proyecto de indagación en concordancia con las prioridades y planes locales, regionales y nacionales.',
          'Presenta un resumen de los conocimientos científicos utilizados en el proyecto de indagación relacionados con la competencia "Explica el mundo físico basado en conocimientos sobre los seres vivos, materia y energía, biodiversidad, Tierra y universo".',
          'Menciona estudios antecedentes relacionados con la pregunta de indagación.'
        ]
      },
      {
        id: 'e15_problematizacion',
        nombre: 'Problematización',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcionPorVariante: {
          A: [
            'Plantea la pregunta de indagación e hipótesis y que contienen las variables en relación con el hecho o fenómeno seleccionado.',
            'Plantea el objetivo(s) de la indagación. (Categoría E)'
          ],
          B: [
            'Plantea la pregunta de indagación sobre el hecho o fenómeno observado.',
            'Plantea el objetivo(s) de la indagación. (Categoría E)'
          ]
        }
      },
      {
        id: 'e15_diseno',
        nombre: 'Diseño',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcionPorVariante: {
          A: [
            'Presenta los materiales, herramientas, instrumentos en relación con la medida de seguridad.',
            'Menciona la tabla y gráficas previstas para el registro de datos.',
            'Menciona el tiempo previsto para la indagación.',
            'Cita algunos conocimientos científicos en los que se basó su diseño (procedimientos, materiales, instrumentos, entre otros).'
          ],
          B: [
            'Presenta el plan de observaciones para la obtención de hechos o fenómeno observado.',
            'Presenta los materiales, herramientas, instrumentos considerando la medida de seguridad.',
            'Menciona el tiempo previsto para la indagación.',
            'Menciona el margen de error del instrumento de medición (Categoría E).',
            'Cita algunos conocimientos científicos en los que se basó su diseño (procedimientos, materiales, instrumentos, entre otros).'
          ]
        }
      },
      {
        id: 'e15_registro_datos',
        nombre: 'Registro de datos e información obtenida',
        ponderacion: 4,
        puntosMaximos: 16,
        descripcionPorVariante: {
          A: [
            'Presenta los datos cualitativos y cuantitativos organizados en tablas; los cálculos de datos realizados y ajustes realizados si los hubiera.',
            'Presenta la tabla y las gráficas con su respectivo título, denominación de los ejes (X e Y), series de datos, leyenda, etiquetas de datos u otros.'
          ],
          B: [
            'Presenta los datos cualitativos y cuantitativos obtenidos a partir de la observación y están organizados en tablas u otros.',
            'Presenta la tabla y la gráfica con su respectivo título, denominación de los ejes (X e Y), series de datos, leyenda, etiquetas de datos u otros.'
          ]
        }
      },
      {
        id: 'e15_analisis',
        nombre: 'Análisis de datos e información',
        ponderacion: 4,
        puntosMaximos: 16,
        descripcionPorVariante: {
          A: [
            'Presenta una explicación de los resultados de la comparación de los datos obtenidos entre sí, contrastados con la hipótesis e información científica.',
            'Menciona si la hipótesis resultó validada o refutada.',
            'Presenta la(s) conclusión(es) y están basadas en los resultados de la indagación.'
          ],
          B: [
            'Presenta una explicación de los resultados de la comparación de los datos obtenidos entre sí y contrastados con la información científica.',
            'Presenta la(s) conclusión(es) y están en relación con la pregunta de la indagación.'
          ]
        }
      },
      {
        id: 'e15_evaluacion',
        nombre: 'Evaluación',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcionPorVariante: {
          A: [
            'Sustenta sobre la base de conocimientos científicos, las conclusiones, procedimientos, mediciones y disminución del error, cálculo, control de variables intervinientes, ajustes realizados.',
            'Menciona si se logra el/los objetivo(s) de la indagación (Categoría E).'
          ],
          B: [
            'Sustenta sobre la base de conocimientos científicos, las conclusiones, procedimientos, ajustes realizados a plan de observaciones.',
            'Menciona si se logra el/los objetivo(s) de la indagación (Categoría E).'
          ]
        }
      },
      {
        id: 'e15_referencias',
        nombre: 'Referencias bibliográficas',
        ponderacion: 1,
        puntosMaximos: 4,
        descripcion: [
          'Presenta una relación y en orden alfabético de todas las referencias (libros, revistas físicas o de páginas de internet) utilizadas en el proyecto de indagación.',
          'Están citadas en formato APA.'
        ]
      },
      {
        id: 'e15_presentacion',
        nombre: 'Presentación y comunicación científica',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'El panel o póster (formato presencial) o PPT (formato virtual) presentado se relaciona con el proyecto de indagación.',
          'Comunica los resultados del proyecto de indagación.',
          'Muestran creatividad y síntesis.'
        ]
      },
      {
        id: 'e15_documentacion',
        nombre: 'Documentación Virtual (informe virtual y cuaderno de experiencia o de campo)',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'Presentación del informe del proyecto y cuaderno de experiencia o de campo según las bases de Eureka.'
        ]
      }
    ]
  },

  E16: {
    id: 'E16',
    titulo: 'Formulario de evaluación de la categoría D y E – informe del proyecto de Soluciones tecnológicas',
    categorias: ['D', 'E'],
    areaId: 'soluciones_tecnologicas',
    lineaId: 'solucion_tecnologica',
    tipoEscala: 'ponderada',
    escala: [4, 3, 2, 1],
    puntajeMaximo: 100,
    sumaPonderaciones: 25,
    tieneVariantes: false,
    gate: { requerido: false },
    leyendaCalificacion: LEYENDA_CALIFICACION_PONDERADA,
    aspectos: [
      {
        id: 'e16_introduccion',
        nombre: 'Introducción',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Presenta la importancia del proyecto de solución tecnológica en concordancia con prioridades locales, regionales y nacionales.',
          'Presenta un resumen de los conocimientos científicos y tecnológicos o prácticas locales (conocimientos empíricos) en que se basa o hace uso la solución tecnológica, relacionados con la competencia "Explica el mundo físico basado en conocimientos sobre seres vivos, materia y energía, biodiversidad, Tierra y universo".',
          'Menciona estudios antecedentes relacionados con el problema identificado del contexto que requieren una solución tecnológica.'
        ]
      },
      {
        id: 'e16_determinacion',
        nombre: 'Determinación de la alternativa de solución tecnológica',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Presenta una breve descripción del problema tecnológico y sus causas de origen tecnológico.',
          'Propone la alternativa de solución tecnológica viable y pertinente al contexto.',
          'Menciona los beneficios de la alternativa de solución tecnológica.',
          'Presenta los requerimientos de la alternativa de solución tecnológica.'
        ]
      },
      {
        id: 'e16_diseno',
        nombre: 'Diseño de la solución tecnológica construida',
        ponderacion: 4,
        puntosMaximos: 16,
        descripcion: [
          'Presenta una representación integral y de las partes de la solución tecnológica y su función en forma gráfica (Categoría D).',
          'Presenta una representación integral y de las partes de la solución tecnológica y su función en escala con vista y perspectivas o esquemática (Categoría E).',
          'Menciona medidas de seguridad en relación a los procedimientos o uso de herramientas, materiales o instrumentos.',
          'Menciona los materiales, herramientas a ser utilizados según su impacto ambiental.',
          'Menciona los instrumentos de medición previstos.',
          'Menciona los instrumentos de medición previstos según su margen de error (Categoría E).',
          'Presenta los costos estimados.',
          'Menciona el tiempo que prevé para diseñar y construir la solución tecnológica.',
          'Menciona las maneras de probar el funcionamiento de la solución tecnológica (Categoría E).'
        ]
      },
      {
        id: 'e16_implementada',
        nombre: 'Solución tecnológica implementada',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Presenta mediante fotos u otros la solución tecnológica construida o implementada según los requerimientos y el diseño previsto.',
          'Presenta fotos de cómo utilizó los materiales, herramientas e instrumentos.',
          'Menciona cómo verificó el funcionamiento de cada parte o etapa de la solución tecnológica.',
          'Menciona brevemente los errores detectados y ajustes realizados si los hubiera, según los requerimientos.'
        ]
      },
      {
        id: 'e16_validacion',
        nombre: 'Validación',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Describe cómo se comprobó el funcionamiento de la solución tecnológica durante su implementación y qué mejoras realizó, si es que lo hubo, y propone mejoras (Categoría D).',
          'Describe cómo realizaron las pruebas repetitivas del funcionamiento de la solución tecnológica durante su implementación y fundamenta su propuesta de mejora (Categoría E).'
        ]
      },
      {
        id: 'e16_evaluacion',
        nombre: 'Evaluación',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Menciona si la solución tecnológica implementada resolvió el problema identificado.',
          'Menciona los ajustes o cambios realizados si los hubo sobre la base de conocimientos científicos o prácticas locales.',
          'Explica el impacto en el ambiente de su solución tecnológica durante su implementación y uso.'
        ]
      },
      {
        id: 'e16_referencias',
        nombre: 'Referencias bibliográficas',
        ponderacion: 1,
        puntosMaximos: 4,
        descripcion: [
          'Presenta una relación en orden alfabético de todas las referencias utilizadas en el proyecto.',
          'Están citadas en formato APA 7.'
        ]
      },
      {
        id: 'e16_presentacion',
        nombre: 'Presentación y comunicación de la alternativa de solución tecnológica',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'El panel o póster (formato presencial) o PPT (formato virtual) presentado se relaciona con el proyecto de solución tecnológica.',
          'Comunica los posibles efectos del uso de la solución tecnológica en la sociedad o ambiental.',
          'Muestran creatividad y síntesis en el montaje.'
        ]
      },
      {
        id: 'e16_documentacion',
        nombre: 'Documentación Virtual (informe virtual y cuaderno de experiencia o de campo)',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Presentación del informe del proyecto y cuaderno de experiencia o de campo según las bases de Eureka.'
        ]
      }
    ]
  },

  E17: {
    id: 'E17',
    titulo: 'Formulario de evaluación de la categoría D – informe de indagación en el área de Ciencias Sociales basado en un problema histórico, en un problema ambiental o territorial o un problema o desafío económico',
    categorias: ['D'],
    areaId: 'ciencias_sociales',
    tipoEscala: 'ponderada',
    escala: [4, 3, 2, 1],
    puntajeMaximo: 100,
    sumaPonderaciones: 25,
    tieneVariantes: false,
    gate: { requerido: false },
    leyendaCalificacion: LEYENDA_CALIFICACION_PONDERADA,
    aspectos: [
      {
        id: 'e17_introduccion',
        nombre: 'Introducción',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'Presenta el contexto, problema de indagación, justificación, objetivo u objetivos, menciona por lo menos dos fuentes utilizadas para abordar el problema de indagación.'
        ]
      },
      {
        id: 'e17_tema_problema',
        nombre: 'Tema y problema de indagación',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'El problema se formula a través de una pregunta. Debe ser preciso, claro y viable para ser tratado de manera eficaz.',
          'La pregunta debe plantear un problema histórico, o un problema ambiental/territorial o un problema económico, de acuerdo con el CNEB.'
        ]
      },
      {
        id: 'e17_metodologia',
        nombre: 'Metodología',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Explicación de los pasos seguidos para abordar un problema histórico, problema ambiental/territorial o problema o desafío económico, tipo de fuentes de información consultadas o utilizadas, explicar al menos un criterio que se tomó para elegir las fuentes (al menos para dos fuentes). Por ejemplo, pertinencia de la fuente con relación al problema de indagación.'
        ]
      },
      {
        id: 'e17_analisis',
        nombre: 'Análisis e interpretación de la información',
        ponderacion: 8,
        puntosMaximos: 32,
        descripcion: [
          'Para la indagación sobre un problema histórico: Integra la información de las fuentes históricas consultadas para responder al problema y el objetivo u objetivos propuestos.',
          'Para la indagación sobre un problema histórico: Incluye sus ideas a partir del análisis de distintas fuentes, asimismo usa convenciones temporales (hace referencia a años, siglos, periodos, entre otros) para explicar los hechos o procesos históricos que plantea el problema.',
          'Para la indagación sobre un problema ambiental/territorial o económico: Presenta información de diversas fuentes consultadas o construidas (por ejemplo, a partir de encuestas a la población afectada con el problema, entrevista a alguno de los actores sociales, entre otros) para responder al problema y sustentar su propuesta para alcanzar el objetivo u objetivos.',
          'Para la indagación sobre un problema ambiental/territorial o económico: Analiza las causas y consecuencias del problema de indagación y los actores sociales involucrados utilizando las fuentes de información consultadas o construidas.',
          'Para la indagación sobre un problema ambiental/territorial o económico: Explica su propuesta de acciones utilizando las fuentes de información consultadas o construidas.'
        ]
      },
      {
        id: 'e17_conclusiones',
        nombre: 'Conclusiones',
        ponderacion: 2,
        puntosMaximos: 8,
        preambulo: 'Esta es la sección de cierre, en la cual se presenta una respuesta a la pregunta de indagación.',
        descripcion: [
          'En el caso de una indagación basada en un problema histórico finaliza al formular las conclusiones que responden a la pregunta histórica, incorpora su reflexión sobre el problema.',
          'En el caso de las indagaciones basadas en un problema ambiental/territorial o un problema o desafío económico las conclusiones presentan de manera resumida las acciones y los desafíos que la propuesta implica para al menos dos actores involucrados, incluyéndose.'
        ]
      },
      {
        id: 'e17_anexos',
        nombre: 'Anexos',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'Incluye al menos dos imágenes que dan cuenta del proceso de indagación. Podrían ser mapas, gráficos, tablas, diagramas, caricaturas, objetos de arte o artesanía, fotografías, alguna transcripción de una entrevista, entre otros.',
          'También puede incluir la lista de bibliotecas, archivos y/o instituciones visitadas durante el proceso de indagación, o de las personas que han brindado información valiosa para el análisis (especialistas entrevistados, testigos, entre otros).',
          'Cada imagen debe contar con un título.'
        ]
      },
      {
        id: 'e17_formales',
        nombre: 'Aspectos formales del informe virtual',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'El informe cuenta con todas las partes, y estas cumplen con las exigencias planteadas en las bases. Las fuentes de información proveniente de otros autores deben estar citadas.',
          'Elabora una lista clara, ordenada y completa de las fuentes consultadas y las referencias están hechas de acuerdo con el formato APA y son pertinentes a la indagación.'
        ]
      },
      {
        id: 'e17_presentacion',
        nombre: 'Presentación y comunicación de la indagación (exposición virtual sincrónica)',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'La exposición es fluida, considera los objetivos, metodología utilizada, algunos hallazgos de la indagación y las conclusiones.',
          'Demuestra manejo y comprensión de las fuentes sobre el tema elegido, al presentar la información para dar respuesta al problema planteado.',
          'Evidencian conocimiento de investigaciones o publicaciones sobre el tema.',
          'Muestran capacidad de integrar información y la expone, apoyándose en las fuentes consultadas.'
        ]
      }
    ]
  },

  E18: {
    id: 'E18',
    titulo: 'Formulario de evaluación de la categoría E – informe de indagación en el área de Ciencias Sociales basado en un problema histórico, en un problema ambiental o territorial o un problema o desafío económico',
    categorias: ['E'],
    areaId: 'ciencias_sociales',
    tipoEscala: 'ponderada',
    escala: [4, 3, 2, 1],
    puntajeMaximo: 100,
    sumaPonderaciones: 25,
    tieneVariantes: false,
    gate: { requerido: false },
    leyendaCalificacion: LEYENDA_CALIFICACION_PONDERADA,
    aspectos: [
      {
        id: 'e18_introduccion',
        nombre: 'Introducción',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'Presenta el contexto, problema de indagación, justificación, objetivo u objetivos, menciona por lo menos tres (3) fuentes utilizadas para abordar el problema de indagación, explicando su pertinencia y confiabilidad para abordar el problema.'
        ]
      },
      {
        id: 'e18_tema_problema',
        nombre: 'Tema y problema de indagación',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'El problema se formula a través de una pregunta. Debe ser preciso, claro y viable para ser tratado de manera eficaz.',
          'La pregunta debe plantear un problema histórico, o un problema ambiental/territorial o un problema o desafío económico, de acuerdo con el CNEB.'
        ]
      },
      {
        id: 'e18_metodologia',
        nombre: 'Metodología',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'Explicación de los procesos seguidos para abordar un problema histórico, problema ambiental/territorial o problema o desafío económico, tipo de fuentes de información consultadas o utilizadas, y explicar como mínimo tres criterios que se utilizó para elegir las fuentes (al menos dos fuentes), por ejemplo: ¿qué tan confiable es el autor en relación al problema de indagación?, ¿por qué son pertinentes para dar respuesta al problema histórico?'
        ]
      },
      {
        id: 'e18_analisis',
        nombre: 'Análisis e interpretación de la información',
        ponderacion: 8,
        puntosMaximos: 32,
        descripcion: [
          'Para la indagación sobre un problema histórico: Presenta sus argumentos basados en diversas fuentes de información para responder el problema y los objetivos planteados.',
          'Para la indagación sobre un problema histórico: Incluye un análisis donde compara y contrasta las diversas perspectivas de las fuentes para fundamentar sus argumentos y su postura. Se utilizan citas textuales y parafraseo de los autores consultados.',
          'Para la indagación sobre un problema ambiental/territorial o económico: Presenta información de diversas fuentes consultadas o construidas (por ejemplo, a partir de encuestas a la población afectada con el problema, entrevista a alguno de los actores sociales, entre otros) para los objetivos planteados.',
          'Para la indagación sobre un problema ambiental/territorial o económico: Interpreta la información de las fuentes, considerando las causas y consecuencias del problema de indagación y los actores sociales involucrados y las distintas propuestas vinculadas al problema.',
          'Para la indagación sobre un problema ambiental/territorial o económico: Explica su propuesta de acciones utilizando las fuentes de información consultadas o construidas.'
        ]
      },
      {
        id: 'e18_conclusiones',
        nombre: 'Conclusiones',
        ponderacion: 2,
        puntosMaximos: 8,
        preambulo: 'Esta es la sección de cierre, en la cual se presenta una respuesta a la pregunta de indagación.',
        descripcion: [
          'En caso de una indagación basada en un problema histórico finaliza al formular conclusiones que responden a la pregunta histórica, y la reflexión sobre el problema indagado.',
          'En caso de las indagaciones basadas en un problema ambiental/territorial o un problema o desafío económico las conclusiones presentan de manera resumida los principales hallazgos y desafíos que la propuesta implica para los actores involucrados, incluyéndose.'
        ]
      },
      {
        id: 'e18_anexos',
        nombre: 'Anexos',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'Incluye más de dos (2) imágenes que dan cuenta del proceso de indagación. Podrían ser mapas, gráficos, tablas, diagramas, caricaturas, objetos de arte o artesanía, fotografías, alguna transcripción de una entrevista, entre otros.',
          'También puede incluir la lista de bibliotecas, archivos y/o instituciones visitadas durante el proceso de indagación, o de las personas que han brindado información valiosa para el análisis (especialistas entrevistados, testigos, entre otros).',
          'Cada imagen debe contar con un título.'
        ]
      },
      {
        id: 'e18_formales',
        nombre: 'Aspectos formales del informe virtual',
        ponderacion: 2,
        puntosMaximos: 8,
        descripcion: [
          'El informe cuenta con todas las partes, y estas cumplen con las exigencias planteadas en las bases.',
          'Las fuentes de información proveniente de otros autores deben estar debidamente citadas según formato APA última versión.',
          'Elabora una lista clara, ordenada y completa de las fuentes consultadas y las referencias están hechas de acuerdo con el formato APA y son pertinentes a la indagación.'
        ]
      },
      {
        id: 'e18_presentacion',
        nombre: 'Presentación y comunicación de la indagación (exposición)',
        ponderacion: 3,
        puntosMaximos: 12,
        descripcion: [
          'La exposición es fluida, considera los objetivos, metodología utilizada, algunos hallazgos de la indagación y las conclusiones.',
          'Demuestra manejo y comprensión de diversas fuentes sobre el tema elegido, al construir sus argumentos para dar respuesta al problema planteado.',
          'Investigaciones y publicaciones sobre el tema.',
          'Muestran capacidad de síntesis y expone sus argumentos sustentados en las fuentes consultadas.'
        ]
      }
    ]
  }
};

/** Pie de firma oficial, idéntico en los anexos E15 a E18. */
export const PIE_FIRMA_ANEXO = [
  'Nombres y apellidos del jurado:',
  'Institución:',
  'DNI:',
  'Fecha:'
];

/* ───── Helpers de acceso ───── */

export function getRubricaEureka(anexoId) {
  return RUBRICAS_EUREKA[anexoId] || null;
}

export const LISTA_RUBRICAS = Object.values(RUBRICAS_EUREKA);

/** Ítems calificables de una rúbrica, unificados para ambos motores. */
export function getItemsRubrica(rubrica, variante = 'A') {
  if (!rubrica) return [];
  if (rubrica.tipoEscala === 'simple') {
    return (rubrica.criterios || []).map(c => ({
      id: c.id,
      nombre: c.nombre,
      tipo: 'criterio',
      nota: c.nota || null,
      descriptores: c.descriptores
    }));
  }
  return (rubrica.aspectos || []).map(a => ({
    id: a.id,
    nombre: a.nombre,
    tipo: 'aspecto',
    ponderacion: a.ponderacion,
    puntosMaximos: a.puntosMaximos,
    preambulo: a.preambulo || null,
    descripcion: a.descripcionPorVariante
      ? (a.descripcionPorVariante[variante] || a.descripcionPorVariante.A || [])
      : (a.descripcion || [])
  }));
}

/**
 * Aserciones de integridad de las 8 rúbricas.
 * Debe ejecutarse al montar el módulo. Si una aserción falla, el módulo muestra un error
 * visible: una rúbrica desbalanceada produce actas oficiales incorrectas.
 */
export function assertRubricasIntegras() {
  const errores = [];

  const esperadoSimple = {
    E11: { criterios: 5, escala: [4, 3, 2, 1], max: 20 },
    E12: { criterios: 4, escala: [5, 4, 3, 1], max: 20 },
    E13: { criterios: 5, escala: [4, 3, 2, 1], max: 20 },
    E14: { criterios: 5, escala: [4, 3, 2, 1], max: 20 }
  };

  Object.entries(esperadoSimple).forEach(([id, esp]) => {
    const r = RUBRICAS_EUREKA[id];
    if (!r) { errores.push(`${id}: rúbrica ausente.`); return; }
    if (r.tipoEscala !== 'simple') errores.push(`${id}: tipoEscala debe ser 'simple'.`);
    const nCrit = (r.criterios || []).length;
    if (nCrit !== esp.criterios) errores.push(`${id}: se esperaban ${esp.criterios} criterios y hay ${nCrit}.`);
    if (JSON.stringify(r.escala) !== JSON.stringify(esp.escala)) {
      errores.push(`${id}: la escala debe ser [${esp.escala.join(', ')}] y es [${(r.escala || []).join(', ')}].`);
    }
    const maxCalculado = nCrit * Math.max(...(r.escala || [0]));
    if (maxCalculado !== esp.max) errores.push(`${id}: el puntaje máximo calculado es ${maxCalculado} y debe ser ${esp.max}.`);
    if (r.puntajeMaximo !== esp.max) errores.push(`${id}: puntajeMaximo declarado ${r.puntajeMaximo}, esperado ${esp.max}.`);
    (r.criterios || []).forEach(c => {
      esp.escala.forEach(nivel => {
        const d = c.descriptores ? c.descriptores[nivel] : null;
        if (!d || String(d).trim() === '') {
          errores.push(`${id}/${c.id}: falta el descriptor del nivel ${nivel}.`);
        }
      });
    });
  });

  const esperadoPonderado = {
    E15: { aspectos: 9 },
    E16: { aspectos: 9 },
    E17: { aspectos: 8 },
    E18: { aspectos: 8 }
  };

  Object.entries(esperadoPonderado).forEach(([id, esp]) => {
    const r = RUBRICAS_EUREKA[id];
    if (!r) { errores.push(`${id}: rúbrica ausente.`); return; }
    if (r.tipoEscala !== 'ponderada') errores.push(`${id}: tipoEscala debe ser 'ponderada'.`);
    const aspectos = r.aspectos || [];
    if (aspectos.length !== esp.aspectos) {
      errores.push(`${id}: se esperaban ${esp.aspectos} aspectos y hay ${aspectos.length}.`);
    }
    const sumaPond = aspectos.reduce((s, a) => s + (a.ponderacion || 0), 0);
    if (sumaPond !== 25) errores.push(`${id}: la suma de ponderaciones es ${sumaPond} y debe ser 25.`);
    const sumaPuntos = aspectos.reduce((s, a) => s + (a.puntosMaximos || 0), 0);
    if (sumaPuntos !== 100) errores.push(`${id}: la suma de puntos máximos es ${sumaPuntos} y debe ser 100.`);
    aspectos.forEach(a => {
      if (a.ponderacion * 4 !== a.puntosMaximos) {
        errores.push(`${id}/${a.id}: puntosMaximos (${a.puntosMaximos}) no equivale a ponderación x 4 (${a.ponderacion * 4}).`);
      }
    });
  });

  const e15 = RUBRICAS_EUREKA.E15;
  if (e15 && !e15.tieneVariantes) errores.push('E15: debe declarar variantes A y B.');
  if (e15) {
    const conVariante = (e15.aspectos || []).filter(a => a.descripcionPorVariante).length;
    if (conVariante !== 5) errores.push(`E15: se esperaban 5 aspectos con variante A/B y hay ${conVariante}.`);
  }

  return { ok: errores.length === 0, errores };
}
