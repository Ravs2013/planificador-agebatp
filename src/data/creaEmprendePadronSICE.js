/* ═══════════════════════════════════════════════════════════════
   CONCURSO NACIONAL CREA Y EMPRENDE 2026 — ETAPA UGEL 03
   Padrón mínimo de proyectos inscritos (respaldo precargado)

   Fuente: reportes SICE completos de ganadores de la etapa I. E.
     - ReporteGanadoresCYE_CAT_A_descarga.xlsx  (183 estudiantes, 42 proyectos)
     - ReporteGanadoresCYE_cat_b_descarga.xlsx  (270 estudiantes, 62 proyectos)
     - ReporteGanadoresCYE_CAT_C.xlsx           (11 estudiantes, 5 proyectos)

   PROTECCIÓN DE DATOS (Ley N.° 29733)
   Este archivo viaja dentro del bundle público de la aplicación. Por eso NO contiene
   DNI, códigos de estudiante, fechas de nacimiento, teléfonos, correos, direcciones ni
   nombres de estudiantes o apoderados. Solo guarda lo que la evaluación necesita.
   Los nombres de los integrantes se incorporan importando el reporte SICE desde la
   pestaña "Padrón y admisión"; se guardan en Firestore, protegidos por reglas.

   La aptitud NO se guarda aquí: la calcula evaluarAdmision() en tiempo real contra las
   bases, para que la especialista y el módulo usen exactamente la misma regla.
   ═══════════════════════════════════════════════════════════════ */

export const ORIGEN_PADRON_CYE = {
  "fuente": "SICE — Reporte de ganadores de la etapa I. E.",
  "exportadoEl": "2026-09-10",
  "totalProyectos": 109,
  "totalEstudiantes": 464,
  "proyectosPorCategoria": {
    "A": 42,
    "B": 62,
    "C": 5
  }
};

export const PROYECTOS_SICE_CYE = [
  {
    "id": "CYE26-A-0466383-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "0035 NUESTRA SEÑORA DE LA VISITACION",
      "codigoModular": "0466383",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "AVECHIA",
    "tematica": "INDUSTRIA ALIMENTARIA",
    "enlaceWeb": "https://docs.google.com/document/d/1QKktn3HABdQkL7A-7CnSGhf24jQeeDiF/edit?usp=drive_link&ouid=108641854485076015813&rtpof=true&sd=true",
    "fechaRegistro": "2026-09-09T11:35:15",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO B TT"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "LEON ., ALICIA",
      "especialidad": "INDUSTRIA ALIMENTARIA"
    }
  },
  {
    "id": "CYE26-A-0466383-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "0035 NUESTRA SEÑORA DE LA VISITACION",
      "codigoModular": "0466383",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "SEMAFORO FINANCIERO",
    "tematica": "CONTABILIDAD",
    "enlaceWeb": "https://drive.google.com/drive/folders/1qmxU7EZRuRS16krnkIengpiw1W36Rpx8?usp=drive_link",
    "fechaRegistro": "2026-09-09T13:40:41",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "PRIMERO A TM"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "DIAZ LOPEZ, YENIFFER KATTELIN",
      "especialidad": "CONTABILIDAD"
    }
  },
  {
    "id": "CYE26-A-0334656-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "0040 HIPOLITO UNANUE",
      "codigoModular": "0334656",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Nuggets de Quinua",
    "tematica": "Alimentación nutritiva y rica",
    "enlaceWeb": "https://drive.google.com/drive/folders/1zr6OEaGKKI39uLpqzWxjNfQWYveSPkxN?usp=sharing",
    "fechaRegistro": "2026-09-08T13:48:49",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MORALES AMAYA, ERICA AMALIA",
      "especialidad": "Cocina y Repostería"
    }
  },
  {
    "id": "CYE26-A-0334656-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "0040 HIPOLITO UNANUE",
      "codigoModular": "0334656",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "Exfoliantes Caseros",
    "tematica": "Crema hidratante al instante",
    "enlaceWeb": "https://drive.google.com/drive/folders/1wde6sy6cwy0-csAUWBNRyVe_1b5ODye_?usp=drive_link",
    "fechaRegistro": "2026-09-08T14:07:51",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "GELDRES VERA, BERTHA MILAGROS",
      "especialidad": "Estética personal"
    }
  },
  {
    "id": "CYE26-A-0337741-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "022 REPUBLICA DE GUATEMALA",
      "codigoModular": "0337741",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "SANGRICHOCO",
    "tematica": "Alimentación saludable",
    "enlaceWeb": "https://drive.google.com/drive/u/0/folders/1n5H_xo2mL5h_LYBFtS3t66s2-PtMbHsD",
    "fechaRegistro": "2026-09-09T11:35:40",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TAQUIRE ROSALES, MARIA ALEJANDRA",
      "especialidad": "Industrias alimentarias"
    }
  },
  {
    "id": "CYE26-A-0449827-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "093 MANUELA FELICIA GOMEZ",
      "codigoModular": "0449827",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Trufas contra la anemia",
    "tematica": "Alimentación",
    "enlaceWeb": "https://drive.google.com/drive/folders/1AcC_bVC6CybtGQMRQIJ9xDnX0SHdQ7Pc",
    "fechaRegistro": "2026-09-03T20:24:54",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MALPARTIDA VEGA, ENRIQUE",
      "especialidad": "Industria Alimentaria y Nutrición"
    }
  },
  {
    "id": "CYE26-A-0449827-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "093 MANUELA FELICIA GOMEZ",
      "codigoModular": "0449827",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "Copias e impresiones a color",
    "tematica": "Economica",
    "enlaceWeb": "https://drive.google.com/drive/folders/1zVcC5pKtKtIfjMhnVgseJJzWY57r75jC?usp=drive_link",
    "fechaRegistro": "2026-09-03T19:39:23",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ZEGARRA POLANCO, ROLANDO SIXTO",
      "especialidad": "EDUCACION PARA EL TRABAJO"
    }
  },
  {
    "id": "CYE26-A-0578393-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1021 REPUBLICA FEDERAL DE ALEMANIA",
      "codigoModular": "0578393",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "CACAO Y ALMA",
    "tematica": "TRUFAS DE DÁTILES QUE APORTAN ENERGIAS SALUDABLES",
    "enlaceWeb": "https://drive.google.com/drive/folders/1KYd1ezAHG2KSWkoiInbjy5xqqWKP33n0?usp=drive_link",
    "fechaRegistro": "2026-09-09T16:48:22",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "B"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "B"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "B"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "B"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "VENERO LOZANO, LEYLA MARTHA",
      "especialidad": "CYT"
    }
  },
  {
    "id": "CYE26-A-0556332-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "103 LUIS ARMANDO CABELLO HURTADO",
      "codigoModular": "0556332",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "VERDE LIMPIO PUBLICIDAD QUE CONECTA Y CUIDA EL PLANETA",
    "tematica": "MARKETING DIGITAL SOSTENIBLE Y PUBLICIDAD INTERACTIVA CON IMPACTO AMBIENTAL",
    "enlaceWeb": "https://drive.google.com/drive/folders/1Ge9tBwd9xwuPSVh0ZZA2Xv8742ffL2gK?usp=sharing",
    "fechaRegistro": "2026-09-09T18:11:54",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CALIXTRO SALINAS, DOLORES ROCIO",
      "especialidad": "COMPUTACIÓN E INFORMÁTICA"
    }
  },
  {
    "id": "CYE26-A-0336511-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "105 PEDRO CORONADO ARRASCUE",
      "codigoModular": "0336511",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Remigummies",
    "tematica": "Gomitas de beterraga como alternativa salubable",
    "enlaceWeb": "https://drive.google.com/drive/u/1/folders/1tS8KuvvfD9TLx_C1HLAGTT26HJoVigzM",
    "fechaRegistro": "2026-08-24T21:12:37",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "OSCCO QUIROZ, ROBERTO",
      "especialidad": "Electricidad"
    }
  },
  {
    "id": "CYE26-A-0340281-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1057 JOSE BAQUIJANO Y CARRILLO",
      "codigoModular": "0340281",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "PITUFIEMPANADAS",
    "tematica": "EMPANADAS ARTESANALES",
    "enlaceWeb": "https://drive.google.com/file/d/1zL9SXFU4Fw0fWTVmB7OL3UxQwF_ZBbon/view?usp=sharing",
    "fechaRegistro": "2026-09-09T09:33:15",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "D"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "SILVA VALLE, NARDITA YNES",
      "especialidad": "COMPUTACION E INFORMATICA"
    }
  },
  {
    "id": "CYE26-A-0340281-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "1057 JOSE BAQUIJANO Y CARRILLO",
      "codigoModular": "0340281",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "SWEET YELIS",
    "tematica": "GELATINA ARTESANAL - INDUSTRIAS ALIMENTARIAS",
    "enlaceWeb": "https://drive.google.com/file/d/15uuQQqrA-SMo9BmnyiKdRRb55G4DchyS/view?usp=sharing",
    "fechaRegistro": "2026-09-09T09:00:18",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ZAMORA DIAZ, KELY",
      "especialidad": "COMPUTACION E INFORMATICA"
    }
  },
  {
    "id": "CYE26-A-0245647-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1070 MELITON CARVAJAL",
      "codigoModular": "0245647",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Ecodesk 360 Raíces",
    "tematica": "ESPACIO MULTIFUNCIONAL PARA EL APRENDIZAJE Y LA CONCIENCIA AMBIENTAL",
    "enlaceWeb": "https://drive.google.com/drive/folders/1hcuVkzp1BedQ83yEXImVmTLRBB6soYjr",
    "fechaRegistro": "2026-09-09T13:48:36",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "2 C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2 C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2 C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2 C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2 C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "JIMENEZ HUANCCO, HUGO HERBERT",
      "especialidad": "Ebanisteria"
    }
  },
  {
    "id": "CYE26-A-0245647-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "1070 MELITON CARVAJAL",
      "codigoModular": "0245647",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "Bocado crocante saludable CHOCOCRUNCH",
    "tematica": "INDUSTRIA ALIMENTARIA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1cHcnVkNtUDbErCscDdOwKNRXWUvy2xZV?usp=sharing",
    "fechaRegistro": "2026-09-09T12:04:59",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "1 C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "LLALLICO HUANCAYA, LIZ MIRIAM",
      "especialidad": "INDUSTRIA ALIMENTARIA"
    }
  },
  {
    "id": "CYE26-A-0340224-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1071 ALFONSO UGARTE",
      "codigoModular": "0340224",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Isidro",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Filtro Real",
    "tematica": "Computación e Informática",
    "enlaceWeb": "https://drive.google.com/drive/folders/1DU9QFCuNXlaxWUgcy-XoBmiZRNki0puc?usp=drive_link",
    "fechaRegistro": "2026-09-08T10:22:06",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "G"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "G"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "G"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "G"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "G"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "FRANCISCO PAREDES, MIRIAN PILAR",
      "especialidad": "Computación"
    }
  },
  {
    "id": "CYE26-A-0340224-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "1071 ALFONSO UGARTE",
      "codigoModular": "0340224",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Isidro",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "ROTEX",
    "tematica": "Computación e Informática",
    "enlaceWeb": "https://drive.google.com/drive/folders/1zbCsfuhtZ8geEBzTALW9XthtvtELBVsn?usp=drive_link",
    "fechaRegistro": "2026-09-08T11:20:05",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "GOMEZ RONDON, VERONICA LILIANA",
      "especialidad": "Computación"
    }
  },
  {
    "id": "CYE26-A-0774455-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1086 JESUS REDENTOR",
      "codigoModular": "0774455",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "GEL ANTIANEMICO",
    "tematica": "ALIMENTACION SALUDABLE",
    "enlaceWeb": "https://drive.google.com/drive/folders/1-RWqVqCuR7SsOHWUCn3VvpjhwmXco0GH?usp=drive_link",
    "fechaRegistro": "2026-09-09T03:00:27",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "D"
      },
      {
        "grado": "PRIMERO",
        "seccion": "C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "GUILLEN RIVERA, MARIA LOURDES",
      "especialidad": "COMPUTACION E INFORMATICA"
    }
  },
  {
    "id": "CYE26-A-0336636-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1087 GRAL ROQUE SAENZ PEÑA",
      "codigoModular": "0336636",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "TRUFITAS DE BETERRAGA",
    "tematica": "EMPRENDIMIENTO",
    "enlaceWeb": "https://drive.google.com/drive/folders/18omS1D4ZZZE82dN3mLSdKOOLarlwL0kY?usp=sharing",
    "fechaRegistro": "2026-09-07T10:24:53",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CAJUSOL FARROÑAN, FERNANDO MANUEL",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-A-1007491-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1110 REPUBLICA DE PANAMA",
      "codigoModular": "1007491",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "ALFAJORES A BASE DE HARINA DE PLATANO",
    "tematica": "ALFAJORES DE PLATANO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1Sv6pdCPNW6PJIo_z_Bh5MZ2cs5QtbBa1?usp=sharing",
    "fechaRegistro": "2026-09-09T15:32:25",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "2B"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2B"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2B"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "BABILONIA VARGAS, ROSA",
      "especialidad": "EDUCACIÓN COMERCIAL"
    }
  },
  {
    "id": "CYE26-A-0245654-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1120 PEDRO ADOLFO LABARTHE EFFIO",
      "codigoModular": "0245654",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "SUMAQ HANPARA",
    "tematica": "ECO SOSTENIBLE",
    "enlaceWeb": "https://docs.google.com/document/d/1B4De7PQddSn0hoc-QIExirC-y8TehORi/edit?usp=sharing&ouid=113745120555432271916&rtpof=true&sd=true",
    "fechaRegistro": "2026-09-08T20:21:40",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "POMACARHUA MELO, FANY ZENAYDA",
      "especialidad": "INDUSTRIA DEL VESTIDO"
    }
  },
  {
    "id": "CYE26-A-0245654-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "1120 PEDRO ADOLFO LABARTHE EFFIO",
      "codigoModular": "0245654",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "DEMA",
    "tematica": "Cuidado y estética de manos",
    "enlaceWeb": "https://docs.google.com/document/d/1ywdDOmUmbsj2T8OKPB4-rVrJMYSi3IMv/edit?usp=sharing&ouid=113745120555432271916&rtpof=true&sd=true",
    "fechaRegistro": "2026-09-08T21:27:20",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "F"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "GONZALES CAVERO, LOURDES KARIN",
      "especialidad": "ESTÉTICA PERSONAL"
    }
  },
  {
    "id": "CYE26-A-1008044-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1123 SAGRADO CORAZON DE JESUS",
      "codigoModular": "1008044",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "prendas para mascotas perros",
    "tematica": "diseñar prendas para mascotas con valor agregado",
    "enlaceWeb": "https://drive.google.com/drive/folders/1tRHS9RF6LOHk9_oRb3qtgpSlGuET9slQ?usp=drive_link",
    "fechaRegistro": "2026-09-09T14:19:02",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "GASPAR CHAVEZ, NANCY CLAUDIA",
      "especialidad": "EPT industria del vestido"
    }
  },
  {
    "id": "CYE26-A-0336602-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "1166 LIBERTADOR SIMON BOLIVAR",
      "codigoModular": "0336602",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "FROSTY CUP",
    "tematica": "ALIMENTACION SALUDABLE",
    "enlaceWeb": "https://drive.google.com/file/d/1ty-4fZA8RuLRmZ0snOalwouqFDmMhiR7/view?usp=sharing",
    "fechaRegistro": "2026-09-04T16:18:58",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "DE LA TORRE SOTO, ALDO MARTIN",
      "especialidad": "MATEMATICA E INFORMATICA"
    }
  },
  {
    "id": "CYE26-A-0337568-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "ARGENTINA",
      "codigoModular": "0337568",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "SERVICIO DE ELABORACIÓN DE ENCUESTAS DE SATISFACCIÓN",
    "tematica": "Soluciones a problemas económicos o sociales del contexto de las personas de su barrio",
    "enlaceWeb": "https://drive.google.com/drive/folders/1g4HsZx2LuErE8Frs5TiHhtv_d1apZkoI?usp=sharing",
    "fechaRegistro": "2026-09-03T20:37:39",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "F"
      },
      {
        "grado": "PRIMERO",
        "seccion": "F"
      },
      {
        "grado": "PRIMERO",
        "seccion": "F"
      },
      {
        "grado": "PRIMERO",
        "seccion": "F"
      },
      {
        "grado": "PRIMERO",
        "seccion": "F"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "LEON VERA, CESAR AUGUSTO",
      "especialidad": "ADMINISTRACIÓN"
    }
  },
  {
    "id": "CYE26-A-0337568-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "ARGENTINA",
      "codigoModular": "0337568",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "CONTRA PRO SERVICIO DE GUÍA PARA LLEVAR UN CONTROL DE INGRESOS Y EGRESOS",
    "tematica": "Solución de Problema del contexto de las microempresas de su barrio.",
    "enlaceWeb": "https://drive.google.com/drive/folders/1Asn2jX0PABKGzyuinkBaP2zaqAvR3Xlt",
    "fechaRegistro": "2026-09-06T16:46:15",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "VARGAS CUBAS, FLOR DE MARIA",
      "especialidad": "CONTABILIDAD"
    }
  },
  {
    "id": "CYE26-A-0334649-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "BARTOLOME HERRERA",
      "codigoModular": "0334649",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Nutri Kids Box",
    "tematica": "Alimentación saludable",
    "enlaceWeb": "https://drive.google.com/drive/folders/1wN-7WVC-x-o-jAgM9uYs43cNcidAGah0?usp=sharing",
    "fechaRegistro": "2026-09-09T20:06:28",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "E"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TORIBIO CHOQUETICO, RENE WILLIAM",
      "especialidad": "Informática y computación"
    }
  },
  {
    "id": "CYE26-A-0601492-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "DIEGO FERRE",
      "codigoModular": "0601492",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Jabones Grugly",
    "tematica": "CUIDADO PERSONAL Y COSMÉTICA NATURAL",
    "enlaceWeb": "https://drive.google.com/drive/folders/1cu4RvRXws6_eTVgtatOpBwhnxnCK_eY8?usp=sharing",
    "fechaRegistro": "2026-09-08T18:04:49",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MUÑOZ HUERTA, RUDY DAIVIS",
      "especialidad": "Computación Informática"
    }
  },
  {
    "id": "CYE26-A-0601492-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "DIEGO FERRE",
      "codigoModular": "0601492",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "ECOVOCES",
    "tematica": "FANZINES DIGITALES POR LA PAZ Y EL PLANETA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1FA9beWdJYACo3-wBDbXy2qUjy_UgPHLb?usp=sharing",
    "fechaRegistro": "2026-09-09T12:51:29",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "C"
      },
      {
        "grado": "PRIMERO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "VILLAMARES AJALCRIÑA, RINA JULIA",
      "especialidad": "Computacion e Informatica"
    }
  },
  {
    "id": "CYE26-A-0340356-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "GABRIELA MISTRAL",
      "codigoModular": "0340356",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "GOMICUY",
    "tematica": "Alimentos",
    "enlaceWeb": "https://drive.google.com/drive/folders/1SaUylRCmXipBghmLLEKlVv2EEwkVIjBP?usp=drive_link",
    "fechaRegistro": "2026-09-09T23:01:58",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "PASCUAL BASURTO, ALEJANDRINA CLEMENCIA",
      "especialidad": "Tecnología del vestido"
    }
  },
  {
    "id": "CYE26-A-0245662-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "ISABEL LA CATOLICA",
      "codigoModular": "0245662",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "PATRIOTIC CARTRIDGE POUCHES",
    "tematica": "PRODUCCION",
    "enlaceWeb": "https://drive.google.com/drive/folders/1H3pqza5JHphOdQscSFwIt-Mm1Gsae8T0?usp=drive_link",
    "fechaRegistro": "2026-09-08T15:24:48",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "E"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "E"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "E"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "E"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "E"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "SANDOVAL PEÑA, ANA TERESA",
      "especialidad": "INDUSTRIA DEL VESTIDO"
    }
  },
  {
    "id": "CYE26-A-0334664-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "MARIANO MELGAR",
      "codigoModular": "0334664",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Breña",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "ECO STUDY",
    "tematica": "CUIDADO DEL PLANETA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1jTSbuEPPmQs9z0Rgq4ciY7_OyUw9vwEd?usp=sharing",
    "fechaRegistro": "2026-09-07T15:50:49",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "H"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "YACHEZ GUZMAN, ELEANA AUREA",
      "especialidad": "administración"
    }
  },
  {
    "id": "CYE26-A-0334664-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "MARIANO MELGAR",
      "codigoModular": "0334664",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Breña",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "ECO CHIC",
    "tematica": "MODA SOSTENIBLE",
    "enlaceWeb": "https://drive.google.com/drive/folders/1AwlChjgMDKM1JBPj0PxDUiSqRF43QfIZ?usp=sharing",
    "fechaRegistro": "2026-09-07T15:24:19",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "QUISPE CAÑAPATAÑA DE RODRIGUEZ, NELLY YOLANDA",
      "especialidad": "INDUSTRIA DEL VESTIDO"
    }
  },
  {
    "id": "CYE26-A-0739367-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "NUESTRA SEÑORA DE MONTSERRAT",
      "codigoModular": "0739367",
      "tipoGestion": "Privada",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "RESUENA",
    "tematica": "Juego Interactivo",
    "enlaceWeb": "https://drive.google.com/drive/folders/1j0JfxojBAX9UOsioxYY1cna93a4N4r9Q?usp=sharing",
    "fechaRegistro": "2026-09-09T11:30:11",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "HUAMAN VELIZ, JOSELINE MARILUZ",
      "especialidad": "Telecomunicaciones e Informática"
    }
  },
  {
    "id": "CYE26-A-0334680-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "PEDRO GALVEZ EGUSQUIZA",
      "codigoModular": "0334680",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "EasyClass",
    "tematica": "Aprende con cientos de preguntas inteligentes",
    "enlaceWeb": "https://drive.google.com/drive/folders/165BKb9CRA3VluteNSRHng031CJz9cEBv?usp=drive_link",
    "fechaRegistro": "2026-09-08T16:25:56",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A3"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A3"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A3"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A3"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "SEGUNDO A3"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "JUNCHAYA ARONES, ROSA YSABEL",
      "especialidad": "COMPUTACIÓN E INFORMÁTICA"
    }
  },
  {
    "id": "CYE26-A-0644690-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "REPUBLICA DE CHILE",
      "codigoModular": "0644690",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "MODA QUE UNE",
    "tematica": "MODA Y VÌNCULO AFECTIVO ENTRE MASCOTAS Y DUEÑOS",
    "enlaceWeb": "https://drive.google.com/drive/folders/1vWxw39fBGf3b6V2N44CgCVrIgLAVncLI?usp=sharing",
    "fechaRegistro": "2026-09-08T05:04:28",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "OCHOA VASQUEZ, ENMA CONSUELO",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-A-0340398-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "ROSA DOMINGA PEREZ LIENDO",
      "codigoModular": "0340398",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "CHIAYMANTO",
    "tematica": "PRODUCTO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1U_TnAyF-QXXHMhEndVbRfA1LgXlZxqkz?usp=drive_link",
    "fechaRegistro": "2026-09-09T10:42:58",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "1 A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1 A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CELEDONIO MARADIEGUE, SIMON NICOLAS",
      "especialidad": "INDUSTRIA ALIMENTARIA"
    }
  },
  {
    "id": "CYE26-A-0690214-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "SEÑOR DE LUREN",
      "codigoModular": "0690214",
      "tipoGestion": "Privada",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "ECOCULTIVA",
    "tematica": "Venta del kit básico que promueve el autocultivo y la alimentación saludable en espacios urbanos reducidos.",
    "enlaceWeb": "https://canva.link/76rdbo4t3tcfiwv",
    "fechaRegistro": "2026-09-09T23:56:12",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "QUIÑONES ROJAS, ERIKA URSULA",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-A-0690214-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "SEÑOR DE LUREN",
      "codigoModular": "0690214",
      "tipoGestion": "Privada",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "LUZ DE AROMA",
    "tematica": "Velas aromáticas terapéuticas",
    "enlaceWeb": "https://canva.link/82bhq1rh5rhbllv",
    "fechaRegistro": "2026-09-09T23:50:57",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      },
      {
        "grado": "PRIMERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "QUIÑONES ROJAS, ERIKA URSULA",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-A-0245688-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "TERESA GONZALES DE FANNING",
      "codigoModular": "0245688",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "MINI LUNCH",
    "tematica": "ALIMENTACIÓN NUTRITIVA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1p7eJ2oz4gbyGA8Ztwx61LQoY4cgAgsMb?usp=sharing",
    "fechaRegistro": "2026-09-07T12:32:26",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "8"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "8"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "8"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "8"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "8"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "FLORES CRUZ, MAGALY ESTELA",
      "especialidad": "Industria del Vestido"
    }
  },
  {
    "id": "CYE26-A-0245688-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "TERESA GONZALES DE FANNING",
      "codigoModular": "0245688",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "CATÁLOGO WEB FANNIX",
    "tematica": "TECNOLOGÍA APLICADA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1qGUFEDpdI7dCsrhZGb1AaKjrSExoUH9D?usp=sharing",
    "fechaRegistro": "2026-09-07T12:07:16",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "2"
      },
      {
        "grado": "PRIMERO",
        "seccion": "2"
      },
      {
        "grado": "PRIMERO",
        "seccion": "2"
      },
      {
        "grado": "PRIMERO",
        "seccion": "2"
      },
      {
        "grado": "PRIMERO",
        "seccion": "2"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ALMENARA GALINDO, MARITZA ROSARIO",
      "especialidad": "CONTABILIDAD"
    }
  },
  {
    "id": "CYE26-A-0340364-P1",
    "categoria": "A",
    "institucion": {
      "nombre": "TUPAC AMARU",
      "codigoModular": "0340364",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "BABYFLEX MANTITA 3 EN 1",
    "tematica": "PRENDAS CON RETAZO DE TELA",
    "enlaceWeb": "https://drive.google.com/drive/folders/18E7vNFYYSLo4M6qnYAzd8MrRWU_NPsjE?usp=sharing",
    "fechaRegistro": "2026-09-08T23:54:03",
    "integrantes": [
      {
        "grado": "SEGUNDO",
        "seccion": "2D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2D"
      },
      {
        "grado": "SEGUNDO",
        "seccion": "2D"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ITOKAZU PIZARRO, MARIA LUISA",
      "especialidad": "INDUSTRIA DEL VESTIDO"
    }
  },
  {
    "id": "CYE26-A-0340364-P2",
    "categoria": "A",
    "institucion": {
      "nombre": "TUPAC AMARU",
      "codigoModular": "0340364",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "NOS COMUNICAMOS",
    "tematica": "VIDEOJUEGO EDUCATIVO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1WhWapBvuxVpdYHH5k1sixOYes4eybd8K?usp=sharing",
    "fechaRegistro": "2026-09-09T00:19:37",
    "integrantes": [
      {
        "grado": "PRIMERO",
        "seccion": "1D"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1D"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1D"
      },
      {
        "grado": "PRIMERO",
        "seccion": "1D"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CASTILLO ANTON, ANGELA ANTUANET",
      "especialidad": "INFORMATICA COMPUTO"
    }
  },
  {
    "id": "CYE26-B-0337717-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "0003 NUESTRA SEÑORA DEL CARMEN",
      "codigoModular": "0337717",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "MISKI SUYO",
    "tematica": "Alimentación saludable",
    "enlaceWeb": "https://drive.google.com/drive/folders/1cVcTkyGp9zEYO0Cb-Sym7oYXIM-QzyyI",
    "fechaRegistro": "2026-09-09T16:21:36",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TERRY URBINA, VERONICA ROSARIO",
      "especialidad": "Computación e informática"
    }
  },
  {
    "id": "CYE26-B-0337717-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "0003 NUESTRA SEÑORA DEL CARMEN",
      "codigoModular": "0337717",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "QUMA VITAL",
    "tematica": "INDUSTRIA ALIMENTARIA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1NB4y4Yn-ti000EWwHNeA3kW7iqNu0NVD",
    "fechaRegistro": "2026-09-08T15:26:23",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A SECUNDARIA"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TERRY URBINA, VERONICA ROSARIO",
      "especialidad": "Computación e informática"
    }
  },
  {
    "id": "CYE26-B-0555862-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "0013 BERNARDO O'HIGGINS",
      "codigoModular": "0555862",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Pueblo Libre",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Billeteras ecologicas con cuero de pescado",
    "tematica": "reciclable",
    "enlaceWeb": "https://drive.google.com/drive/u/1/folders/1JTUomQr19-7KB2a6SMQRPcjvg11ZNtaB",
    "fechaRegistro": "2026-09-06T15:43:16",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "4TO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4TO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4TO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4TO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4TO A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "PAJUELO FALCON, ELISABET",
      "especialidad": "artesania y manualidades"
    }
  },
  {
    "id": "CYE26-B-0466383-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "0035 NUESTRA SEÑORA DE LA VISITACION",
      "codigoModular": "0466383",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "ECOPRODUCTOS DE FRUTAS DESHIDRATADAS",
    "tematica": "INDUSTRIA ALIMENTARIA",
    "enlaceWeb": "https://drive.google.com/drive/folders/18fCxFX8OQHG-uB3gVOKZkBt0_vZiilEd?usp=sharing",
    "fechaRegistro": "2026-09-09T12:57:04",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "QUINTO B TM"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ROJAS CALLA, LESLY JANIO",
      "especialidad": "INDUSTRIA ALIMENTARIA"
    }
  },
  {
    "id": "CYE26-B-0466383-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "0035 NUESTRA SEÑORA DE LA VISITACION",
      "codigoModular": "0466383",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "NUTRIEMPANADAS",
    "tematica": "INDUSTRIA ALIMENTARIA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1xA_nJ2jOFD3KPkgs6pCjqgx-S0Z8lmwf?usp=sharing",
    "fechaRegistro": "2026-09-09T12:05:11",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "TERCERO B TT"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CARPIO OBREGON, BRISA ALEXANDRA",
      "especialidad": "INDUSTRIA ALIMENTARIA"
    }
  },
  {
    "id": "CYE26-B-0334656-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "0040 HIPOLITO UNANUE",
      "codigoModular": "0334656",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Ilios AI",
    "tematica": "Creación de Inteligencia Artificial para encontrar su vocación ideal",
    "enlaceWeb": "https://drive.google.com/drive/folders/1mdpW4VT04dOGP8c1BZrB5jHnRg3M2oa1?usp=drive_link",
    "fechaRegistro": "2026-09-08T13:31:10",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "G"
      },
      {
        "grado": "QUINTO",
        "seccion": "G"
      },
      {
        "grado": "QUINTO",
        "seccion": "G"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "GALDOS SANCHEZ, WILLIAM JAIME",
      "especialidad": "Computación e Informática"
    }
  },
  {
    "id": "CYE26-B-0334656-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "0040 HIPOLITO UNANUE",
      "codigoModular": "0334656",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "Transmisión segura",
    "tematica": "Página web",
    "enlaceWeb": "https://drive.google.com/drive/folders/1of79hEZY7dQxJJvFAfMeY8F4LceFWtGZ?usp=drive_link",
    "fechaRegistro": "2026-09-08T12:40:57",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "BRAVO FERNANDEZ, JULIO CESAR",
      "especialidad": "Mecanica"
    }
  },
  {
    "id": "CYE26-B-0337741-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "022 REPUBLICA DE GUATEMALA",
      "codigoModular": "0337741",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Hilos de oportunidades",
    "tematica": "Emprendimiento y empleabilidad",
    "enlaceWeb": "https://drive.google.com/drive/u/0/folders/1n5H_xo2mL5h_LYBFtS3t66s2-PtMbHsD",
    "fechaRegistro": "2026-09-09T11:55:26",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "5 B"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 B"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 B"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 B"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CAPCHA GAMARRA, DIANA DARIA",
      "especialidad": "Industria del vestido"
    }
  },
  {
    "id": "CYE26-B-0449827-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "093 MANUELA FELICIA GOMEZ",
      "codigoModular": "0449827",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Mind Nest",
    "tematica": "Organizador de tareas diarias",
    "enlaceWeb": "https://drive.google.com/drive/folders/1TXi9uK85_KgYRKK8ViAQW4zteaZcsF2C?usp=drive_link",
    "fechaRegistro": "2026-09-09T20:37:57",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "NINAMANCCO CCATAMAYO, CRISOSTOMO",
      "especialidad": "matemática e informática"
    }
  },
  {
    "id": "CYE26-B-0449827-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "093 MANUELA FELICIA GOMEZ",
      "codigoModular": "0449827",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "Perru Sueños",
    "tematica": "Reciclaje",
    "enlaceWeb": "https://drive.google.com/drive/folders/1hg3zt8CRsluZDnrCVAgRzkU92kOkfbbV?usp=sharing",
    "fechaRegistro": "2026-09-03T21:38:53",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ROMAN FELIX, LIDA SIMONA",
      "especialidad": "Industria del Vestido"
    }
  },
  {
    "id": "CYE26-B-0578393-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1021 REPUBLICA FEDERAL DE ALEMANIA",
      "codigoModular": "0578393",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "DOLCE VITA",
    "tematica": "TARTA DE AVENA CON KIWICHA Y CREMA DE MANGO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1_lKZzIwFfs14ateZ20F_yJFp8mEQoJ9L?usp=drive_link",
    "fechaRegistro": "2026-09-09T17:53:16",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "VENERO LOZANO, LEYLA MARTHA",
      "especialidad": "CYT"
    }
  },
  {
    "id": "CYE26-B-0336511-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "105 PEDRO CORONADO ARRASCUE",
      "codigoModular": "0336511",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "SAFEWALK",
    "tematica": "Conecta, alerta y protege a las personas",
    "enlaceWeb": "https://drive.google.com/drive/folders/1lZIUOECNsa1TM2NSItpneKC66eDC7gec",
    "fechaRegistro": "2026-08-22T06:42:18",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CALDERON QUIROZ, WILLIAM ENRIQUE",
      "especialidad": "computacion e informatica"
    }
  },
  {
    "id": "CYE26-B-0340281-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1057 JOSE BAQUIJANO Y CARRILLO",
      "codigoModular": "0340281",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "RAIZ VITAL",
    "tematica": "TACOS DE ZANAHORIA",
    "enlaceWeb": "https://drive.google.com/file/d/1qSQ3M8vdA0S97c_VZ8izt0aGM3fTgRnO/view?usp=sharing",
    "fechaRegistro": "2026-09-09T09:50:52",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ZAMORA DIAZ, KELY",
      "especialidad": "COMPUTACION E INFORMATICA"
    }
  },
  {
    "id": "CYE26-B-0340281-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "1057 JOSE BAQUIJANO Y CARRILLO",
      "codigoModular": "0340281",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "INKAPOPS",
    "tematica": "SNAK DE CHOCLO",
    "enlaceWeb": "https://docs.google.com/document/d/1dzv_EjwkgNKTCyqb76q5EMkBmux0kWBXOFN84rAScLk/edit?usp=sharing",
    "fechaRegistro": "2026-09-09T10:07:45",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ZAMORA DIAZ, KELY",
      "especialidad": "COMPUTACION E INFORMATICA"
    }
  },
  {
    "id": "CYE26-B-0245647-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1070 MELITON CARVAJAL",
      "codigoModular": "0245647",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "TITOBOT",
    "tematica": "Programación Robótica Computación e Informática",
    "enlaceWeb": "https://drive.google.com/drive/folders/1yeoIDDQoKjSwQ6_sotV9y_3ctMIWQOGS",
    "fechaRegistro": "2026-09-08T11:44:04",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "IBAÑEZ ALMONACID, PATRICIA ROXANA",
      "especialidad": "Informática"
    }
  },
  {
    "id": "CYE26-B-0245647-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "1070 MELITON CARVAJAL",
      "codigoModular": "0245647",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "WARMI KILLA",
    "tematica": "INDUSTRIA DEL VESTIDO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1DJ1TtmrMDAGIBVAdiN176EDF6-GNWEGu?usp=sharing",
    "fechaRegistro": "2026-09-08T22:52:43",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "RAFAEL QUISPE, MERCEDES GHYSELA",
      "especialidad": "INDUSTRIA DEL VESTIDO"
    }
  },
  {
    "id": "CYE26-B-0340224-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1071 ALFONSO UGARTE",
      "codigoModular": "0340224",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Isidro",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Desky",
    "tematica": "Electrónica",
    "enlaceWeb": "https://drive.google.com/drive/folders/1K7XOfC0hODlqW-On6gw-ho8S2bngsm5S?usp=drive_link",
    "fechaRegistro": "2026-09-08T11:34:48",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TORRES GARCIA, CARLOS ORLANDO",
      "especialidad": "Electrónica"
    }
  },
  {
    "id": "CYE26-B-0340224-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "1071 ALFONSO UGARTE",
      "codigoModular": "0340224",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Isidro",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "MOOD LIGHT",
    "tematica": "Electrónica",
    "enlaceWeb": "https://drive.google.com/drive/folders/16PTUQxPunEv-KnycUWi75Ivs7h5L7jcZ?usp=drive_link",
    "fechaRegistro": "2026-09-08T11:59:15",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TORRES GARCIA, CARLOS ORLANDO",
      "especialidad": "Electrónica"
    }
  },
  {
    "id": "CYE26-B-0774455-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1086 JESUS REDENTOR",
      "codigoModular": "0774455",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Dulce vida",
    "tematica": "Comida",
    "enlaceWeb": "https://drive.google.com/file/d/16nNfY7KpnpS0d0taxcRdCalWvHEtSOI2/view?usp=drivesdk",
    "fechaRegistro": "2026-09-09T02:23:59",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      },
      {
        "grado": "CUARTO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "QUISPE HILARIO, YANETH",
      "especialidad": "PRODUCCION AGROPECUARIA"
    }
  },
  {
    "id": "CYE26-B-0336636-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1087 GRAL ROQUE SAENZ PEÑA",
      "codigoModular": "0336636",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "ROQUETEJAS",
    "tematica": "EMPRENDIMIENTO ECONÓMICO",
    "enlaceWeb": "https://drive.google.com/drive/folders/12lcqqCWvc1wuEj3ZNiqZOYhkgPZQflfu?usp=sharing",
    "fechaRegistro": "2026-09-07T10:48:47",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5 A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CALDERON RIVERA, SULLY BETTY",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-B-0336636-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "1087 GRAL ROQUE SAENZ PEÑA",
      "codigoModular": "0336636",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "NATURAL FUSSION",
    "tematica": "EMPRENDIMIENTO ECONÓMICO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1uXeOvxrCqhoFy-ll62MCVKZ33QkxpBmU?usp=sharing",
    "fechaRegistro": "2026-09-08T11:16:43",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "3 A"
      },
      {
        "grado": "TERCERO",
        "seccion": "3 A"
      },
      {
        "grado": "TERCERO",
        "seccion": "3 A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CAJUSOL FARROÑAN, FERNANDO MANUEL",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-B-1007491-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1110 REPUBLICA DE PANAMA",
      "codigoModular": "1007491",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "QUINUA FUENTE DE VIDA",
    "tematica": "QUINUA Y FRUTA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1V87Ya6OkmrPxLtGXoFe3QnWoiJd88RMk?usp=sharing",
    "fechaRegistro": "2026-09-09T15:11:23",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "4B"
      },
      {
        "grado": "CUARTO",
        "seccion": "4B"
      },
      {
        "grado": "CUARTO",
        "seccion": "4B"
      },
      {
        "grado": "CUARTO",
        "seccion": "4B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "BABILONIA VARGAS, ROSA",
      "especialidad": "EDUCACIÓN COMERCIAL"
    }
  },
  {
    "id": "CYE26-B-0245654-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1120 PEDRO ADOLFO LABARTHE EFFIO",
      "codigoModular": "0245654",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "BIOFABRICA COSECHA VIVA",
    "tematica": "MEDIO AMBIENTE",
    "enlaceWeb": "https://drive.google.com/drive/folders/1ilv50MM2l75WWOGm2X4vxE_04gYwFyWv?usp=sharing",
    "fechaRegistro": "2026-09-08T17:22:24",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "F"
      },
      {
        "grado": "CUARTO",
        "seccion": "F"
      },
      {
        "grado": "CUARTO",
        "seccion": "F"
      },
      {
        "grado": "CUARTO",
        "seccion": "F"
      },
      {
        "grado": "CUARTO",
        "seccion": "F"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CAYCHO GAGO, ALQUIMIDES FRANKLIN",
      "especialidad": "Agropecuaria"
    }
  },
  {
    "id": "CYE26-B-0245654-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "1120 PEDRO ADOLFO LABARTHE EFFIO",
      "codigoModular": "0245654",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "POLVO FACIAL GREEN BEATY",
    "tematica": "Bio Natural",
    "enlaceWeb": "https://drive.google.com/drive/folders/1-TLogC_gbNXB9xU40cKuN9XufkQUARcD?usp=sharing",
    "fechaRegistro": "2026-09-08T16:07:01",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "YAURI ESPINOZA, MONICA VANESSA",
      "especialidad": "Estetica Personal"
    }
  },
  {
    "id": "CYE26-B-1008044-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1123 SAGRADO CORAZON DE JESUS",
      "codigoModular": "1008044",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Prendas Inclusivas",
    "tematica": "Prendas inclusivas para personas con discapacidad",
    "enlaceWeb": "https://drive.google.com/drive/folders/1fA_9BHrMa5MQZEO3Oxguu6OmGO0G1jru?usp=drive_link",
    "fechaRegistro": "2026-09-09T15:09:41",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "GASPAR CHAVEZ, NANCY CLAUDIA",
      "especialidad": "EPT industria del vestido"
    }
  },
  {
    "id": "CYE26-B-0763771-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1157 JULIO CESAR TELLO ROJAS",
      "codigoModular": "0763771",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "INTIUNO",
    "tematica": "JUEGO DIDÁCTICO DE IDENTIDAD CULTURAL",
    "enlaceWeb": "https://drive.google.com/drive/folders/1veCRTrzzOiPbs7IDpEO0iOxdpuvvFZfn?usp=drive_link",
    "fechaRegistro": "2026-09-02T11:09:08",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "QUINTO B"
      },
      {
        "grado": "QUINTO",
        "seccion": "QUINTO B"
      },
      {
        "grado": "QUINTO",
        "seccion": "QUINTO B"
      },
      {
        "grado": "QUINTO",
        "seccion": "QUINTO B"
      },
      {
        "grado": "QUINTO",
        "seccion": "QUINTO B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ROJAS HIDALGO, JESS",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-B-0336602-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1166 LIBERTADOR SIMON BOLIVAR",
      "codigoModular": "0336602",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "ESTAMPARTE",
    "tematica": "SUBLIMADOS",
    "enlaceWeb": "https://drive.google.com/drive/folders/11wC9Zxm1EEa3CjjI3uVnJWQEKcB3c0lO",
    "fechaRegistro": "2026-09-04T11:19:57",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A"
      },
      {
        "grado": "CUARTO",
        "seccion": "CUARTO A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "QUISPE GALVEZ, LUISA ROSA",
      "especialidad": "COMPUTACION E INFORMATICA"
    }
  },
  {
    "id": "CYE26-B-0336602-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "1166 LIBERTADOR SIMON BOLIVAR",
      "codigoModular": "0336602",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "SAFE SIGN",
    "tematica": "STICKERS",
    "enlaceWeb": "https://drive.google.com/drive/folders/1KD-atypOYIS2xIlfLQKl2VzUkXunWjl7",
    "fechaRegistro": "2026-09-04T14:01:15",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "TERCERO A"
      },
      {
        "grado": "TERCERO",
        "seccion": "TERCERO A"
      },
      {
        "grado": "TERCERO",
        "seccion": "TERCERO A"
      },
      {
        "grado": "TERCERO",
        "seccion": "TERCERO A"
      },
      {
        "grado": "TERCERO",
        "seccion": "TERCERO A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "QUISPE GALVEZ, LUISA ROSA",
      "especialidad": "COMPUTACION E INFORMATICA"
    }
  },
  {
    "id": "CYE26-B-1072727-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "1168 HEROES DEL CENEPA",
      "codigoModular": "1072727",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "POSTRES SALUDABLES A BASE DE CUSHURO",
    "tematica": "AGRO INDUSTRIA Y SOSTENIBILIDAD",
    "enlaceWeb": "https://drive.google.com/drive/folders/1hxPA4U4YyQJxFqIGPXqbdwqwSgTYgUvK?usp=sharing",
    "fechaRegistro": "2026-09-09T18:34:07",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "LLAPAPASCA MOROCHO, YOISY",
      "especialidad": "INFORMATICA"
    }
  },
  {
    "id": "CYE26-B-1072727-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "1168 HEROES DEL CENEPA",
      "codigoModular": "1072727",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "TASKSCHOOL",
    "tematica": "INFORMÁTICA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1mUis_NzI2b939NgFuKeCyphUubXIsaO8?usp=sharing",
    "fechaRegistro": "2026-09-09T19:17:58",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "LLAPAPASCA MOROCHO, YOISY",
      "especialidad": "INFORMATICA"
    }
  },
  {
    "id": "CYE26-B-0337766-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "24 ROSA IRENE INFANTES DE CANALES",
      "codigoModular": "0337766",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "RECET APP",
    "tematica": "Emprendimiento",
    "enlaceWeb": "https://drive.google.com/drive/folders/1NrftiFiS4Q4Axg90aVjo04gjbAjCGA4j?usp=drive_link",
    "fechaRegistro": "2026-08-26T22:21:10",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MEDINA AMANQUI, OLGA MARILYN",
      "especialidad": "COMPUTACION INFORMATICA"
    }
  },
  {
    "id": "CYE26-B-0340331-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "ANGELICA PALMA ROMAN",
      "codigoModular": "0340331",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Canastas Doradas",
    "tematica": "Ambiental",
    "enlaceWeb": "https://drive.google.com/drive/folders/1XcgjXzvIAVnJ62Ygo0eaTMm2WMxdwOG0?usp=sharing",
    "fechaRegistro": "2026-09-09T22:40:42",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MOREYRA DE LA CRUZ, RAFAEL HUBER",
      "especialidad": "Matemática e Informática"
    }
  },
  {
    "id": "CYE26-B-0340331-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "ANGELICA PALMA ROMAN",
      "codigoModular": "0340331",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "Alcancias reciclaves",
    "tematica": "Ambiental",
    "enlaceWeb": "https://drive.google.com/drive/folders/1lPDLHAPVhOX1vOdmXzD6IMkpswTR_88p?usp=sharing",
    "fechaRegistro": "2026-09-09T23:34:05",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MOREYRA DE LA CRUZ, RAFAEL HUBER",
      "especialidad": "Matemática e Informática"
    }
  },
  {
    "id": "CYE26-B-0601856-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "ANGELICA RECHARTE",
      "codigoModular": "0601856",
      "tipoGestion": "Privada",
      "distrito": "Magdalena Del Mar",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Diseño de productos digitales para negocios y emprendimientos de Magdalena del Mar",
    "tematica": "Computación e informática.",
    "enlaceWeb": "https://drive.google.com/drive/folders/1ZhlZbKd0vXq7-Yr0mQ4aBePlO9tVMzdO?usp=drive_link",
    "fechaRegistro": "2026-08-28T10:19:02",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "5A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4B"
      },
      {
        "grado": "CUARTO",
        "seccion": "4A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "FLORES NEYRA, JULIO CESAR",
      "especialidad": "Computación"
    }
  },
  {
    "id": "CYE26-B-0337568-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "ARGENTINA",
      "codigoModular": "0337568",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "SERVICIO DE ACOMPAÑAMIENTO EMPRESARIAL Y CONEXIÓN COMERCIAL PARA MYPES",
    "tematica": "SERVICIO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1Dvvb6JiDNJaxHUOg2mkQbHuamYhv3RVN?usp=sharing",
    "fechaRegistro": "2026-09-06T17:22:05",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "BALLON ROMERO, ROXANA",
      "especialidad": "ADMINISTRACIÓN"
    }
  },
  {
    "id": "CYE26-B-0337568-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "ARGENTINA",
      "codigoModular": "0337568",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "SERVICIO DE ASESORAMIENTO INTEGRAL PARA MICROEMPRESAS INFORMALES",
    "tematica": "SERVICIO ÁREA EDUCACIÓN PARA EL TRABAJO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1s-x16F6AKSlW6-8pvyBwcI3uyhBfKfII?usp=sharing",
    "fechaRegistro": "2026-09-03T21:39:56",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CHAVEZ CERNA, GUSTAVO JESUS",
      "especialidad": "ADMINISTRACIÓN"
    }
  },
  {
    "id": "CYE26-B-0334649-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "BARTOLOME HERRERA",
      "codigoModular": "0334649",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Thermal Care",
    "tematica": "Cuidado personal",
    "enlaceWeb": "https://drive.google.com/file/d/1vN3v16eNDm79bV-tMAx1ycwkzRRoK-SN/view?usp=sharing",
    "fechaRegistro": "2026-09-09T21:01:55",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "SANTA ANA FLORES, ROSALIN NATALI",
      "especialidad": "Confección textil"
    }
  },
  {
    "id": "CYE26-B-0245696-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "CESAR A. VALLEJO",
      "codigoModular": "0245696",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "UMA PAKIY",
    "tematica": "SOLUCIÓN EDUCATIVA DIGITAL A ESTUDIANTES",
    "enlaceWeb": "https://drive.gocom/drive/folders/1543ddNo_tcWQpvlARRNLbF1fEsMAI1gZ",
    "fechaRegistro": "2026-09-09T15:19:09",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ESPINOZA BARRIOS, FREDY LUIS",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-B-0643692-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "DEPORTIVO EXPERIMENTAL JULIA SANCHEZ DEZA",
      "codigoModular": "0643692",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "DecoVerde Macrame Portamaceteros artesanales y ecolgicos",
    "tematica": "Manualidades y artesanias tecnicas- tejido macrame",
    "enlaceWeb": "https://drive.google.com/drive/folders/1_2z5q80Fv1fNABlKtrZqQfbnH1QA7KPx?usp=sharing",
    "fechaRegistro": "2026-09-09T15:30:38",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "A"
      },
      {
        "grado": "TERCERO",
        "seccion": "A"
      },
      {
        "grado": "TERCERO",
        "seccion": "A"
      },
      {
        "grado": "TERCERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "BULLON CANO, ESTHER VALENTINA",
      "especialidad": "EBANISTERIA Y DECORACION"
    }
  },
  {
    "id": "CYE26-B-0601492-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "DIEGO FERRE",
      "codigoModular": "0601492",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "GOMITAS DE CUSHURO",
    "tematica": "ALIMENTACIÓN SALUDABLE Y NUTRICIÓN",
    "enlaceWeb": "https://drive.google.com/drive/folders/1Kj8SfzJy1LaPVDWy_Ywhwi0RJ0RYr1Sq?usp=sharing",
    "fechaRegistro": "2026-09-08T19:47:01",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "A"
      },
      {
        "grado": "TERCERO",
        "seccion": "A"
      },
      {
        "grado": "TERCERO",
        "seccion": "A"
      },
      {
        "grado": "TERCERO",
        "seccion": "A"
      },
      {
        "grado": "TERCERO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MUÑOZ HUERTA, RUDY DAIVIS",
      "especialidad": "Computación Informática"
    }
  },
  {
    "id": "CYE26-B-0601492-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "DIEGO FERRE",
      "codigoModular": "0601492",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "Ecovolt school Mochila",
    "tematica": "Cargador Solar",
    "enlaceWeb": "https://drive.google.com/drive/folders/1Kj8SfzJy1LaPVDWy_Ywhwi0RJ0RYr1Sq?usp=sharing",
    "fechaRegistro": "2026-09-08T22:25:06",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      },
      {
        "grado": "TERCERO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "BARRIAL LORENZO, CARLOS AMERICO",
      "especialidad": "Electrónica"
    }
  },
  {
    "id": "CYE26-B-0340356-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "GABRIELA MISTRAL",
      "codigoModular": "0340356",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "TAPERICRUNCH",
    "tematica": "Alimentos",
    "enlaceWeb": "https://drive.google.com/drive/folders/1Z1PI_Wffyu_OThKIKLLP5kVmKYHSEjQH?usp=sharing",
    "fechaRegistro": "2026-09-09T23:19:01",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "PASCUAL BASURTO, ALEJANDRINA CLEMENCIA",
      "especialidad": "Tecnología del vestido"
    }
  },
  {
    "id": "CYE26-B-0245662-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "ISABEL LA CATOLICA",
      "codigoModular": "0245662",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "THE SILENT BATTLE",
    "tematica": "PRODUCCION",
    "enlaceWeb": "https://drive.google.com/drive/folders/1n6C9vucp6HmIvh1QUIA-Ahsf9SjiuWkS?usp=drive_link",
    "fechaRegistro": "2026-09-08T15:47:47",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "E"
      },
      {
        "grado": "CUARTO",
        "seccion": "E"
      },
      {
        "grado": "CUARTO",
        "seccion": "E"
      },
      {
        "grado": "CUARTO",
        "seccion": "E"
      },
      {
        "grado": "CUARTO",
        "seccion": "E"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "SANDOVAL PEÑA, ANA TERESA",
      "especialidad": "INDUSTRIA DEL VESTIDO"
    }
  },
  {
    "id": "CYE26-B-0245662-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "ISABEL LA CATOLICA",
      "codigoModular": "0245662",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "ORIENTACION FINANCIERA",
    "tematica": "SERVICIOS",
    "enlaceWeb": "https://drive.google.com/drive/folders/1VXgyhLF0AprxzCYQpI1LVnHzzkCML_gs",
    "fechaRegistro": "2026-09-07T11:25:13",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      },
      {
        "grado": "TERCERO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "PURIZAGA ARAPA, EDUARDO MANUEL",
      "especialidad": "CONTABILIDAD"
    }
  },
  {
    "id": "CYE26-B-0334771-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "JOSE SANTOS CHOCANO",
      "codigoModular": "0334771",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Pueblo Libre",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "ABRAZO SONORO",
    "tematica": "Regulación emocional",
    "enlaceWeb": "https://drive.google.com/drive/folders/1bh0hTEO-obFhco7TUNaf8hK0_sOzYKaH?usp=sharing",
    "fechaRegistro": "2026-09-08T15:53:40",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "PADILLA RODRIGUEZ, DIANA RAQUEL",
      "especialidad": "EPT"
    }
  },
  {
    "id": "CYE26-B-0334771-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "JOSE SANTOS CHOCANO",
      "codigoModular": "0334771",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Pueblo Libre",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "CONECTA MAYOR",
    "tematica": "Inclusión digital",
    "enlaceWeb": "https://drive.google.com/drive/folders/1wdKMbSGxuQV4VWcOj1PQoAovdkpyhHJG?usp=sharing",
    "fechaRegistro": "2026-09-08T12:44:02",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "PADILLA RODRIGUEZ, DIANA RAQUEL",
      "especialidad": "EPT"
    }
  },
  {
    "id": "CYE26-B-0334664-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "MARIANO MELGAR",
      "codigoModular": "0334664",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Breña",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "COOKIES BOOM",
    "tematica": "GALLETAS NUTRITIVAS",
    "enlaceWeb": "https://drive.google.com/drive/folders/1CQl0qDsvGQjG6emO321iVrDcqY_CStVO?usp=sharing",
    "fechaRegistro": "2026-09-08T11:42:16",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "H"
      },
      {
        "grado": "QUINTO",
        "seccion": "H"
      },
      {
        "grado": "QUINTO",
        "seccion": "H"
      },
      {
        "grado": "QUINTO",
        "seccion": "H"
      },
      {
        "grado": "QUINTO",
        "seccion": "H"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CUADROS CARRION, JANIO ANTONIO",
      "especialidad": "administración"
    }
  },
  {
    "id": "CYE26-B-0334664-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "MARIANO MELGAR",
      "codigoModular": "0334664",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Breña",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "ECO REPORTA",
    "tematica": "PAGINA WEB PARA REPORTAR INCIDENCIAS",
    "enlaceWeb": "https://drive.google.com/drive/folders/1VMbXEpZzTO3D3M8c3py26aVx32zbggzn?usp=sharing",
    "fechaRegistro": "2026-09-08T12:04:20",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "H"
      },
      {
        "grado": "CUARTO",
        "seccion": "H"
      },
      {
        "grado": "CUARTO",
        "seccion": "H"
      },
      {
        "grado": "CUARTO",
        "seccion": "H"
      },
      {
        "grado": "CUARTO",
        "seccion": "H"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CUADROS CARRION, JANIO ANTONIO",
      "especialidad": "administración"
    }
  },
  {
    "id": "CYE26-B-1489053-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "NUESTRA SEÑORA DE COCHARCAS",
      "codigoModular": "1489053",
      "tipoGestion": "Privada",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "L HUILE RENAISSANTE APP",
    "tematica": "Reducción de la contaminación ambiental",
    "enlaceWeb": "https://drive.google.com/drive/folders/1vPB1UBH6QXUQRfMDhYPhGJgbSCaaDUKb?usp=drive_link",
    "fechaRegistro": "2026-09-09T22:16:38",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CARDENAS ESPINOZA, CESAR ANGELO",
      "especialidad": "Ingeniero de sistemas y cómputo"
    }
  },
  {
    "id": "CYE26-B-1489053-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "NUESTRA SEÑORA DE COCHARCAS",
      "codigoModular": "1489053",
      "tipoGestion": "Privada",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "ECO CHIA APP",
    "tematica": "Alimentación saludable",
    "enlaceWeb": "https://drive.google.com/drive/folders/1d4po-L5gyL3efKt72zxdV3GDxNwp7SC-?usp=sharing",
    "fechaRegistro": "2026-09-09T22:52:59",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      },
      {
        "grado": "QUINTO",
        "seccion": "ÚNICA"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CARDENAS ESPINOZA, CESAR ANGELO",
      "especialidad": "Ingeniero de sistemas y cómputo"
    }
  },
  {
    "id": "CYE26-B-0739367-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "NUESTRA SEÑORA DE MONTSERRAT",
      "codigoModular": "0739367",
      "tipoGestion": "Privada",
      "distrito": "Lima",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "IMPERION ACADEMIA DE EXPORACIÓN Y APRENDIZAJE DIGITAL",
    "tematica": "Innovación Educativa y Aprendizaje Digital",
    "enlaceWeb": "https://imperiongame.blogspot.com",
    "fechaRegistro": "2026-09-09T10:39:09",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ESPEJO CARLOS, WILDER MOISES",
      "especialidad": "Ciencias Sociales"
    }
  },
  {
    "id": "CYE26-B-0314401-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "REINA DE LAS AMERICAS",
      "codigoModular": "0314401",
      "tipoGestion": "Privada",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "HEMSI",
    "tematica": "Producto alimenticio que combata la anemia",
    "enlaceWeb": "https://drive.google.com/drive/folders/1JjPI3ZvD_61SDGo4ZmORlU-JBVrqYjBb",
    "fechaRegistro": "2026-09-01T12:39:50",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      },
      {
        "grado": "QUINTO",
        "seccion": "B"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TORRES AJALLA, MARIA ELENA",
      "especialidad": "Biología Quimica"
    }
  },
  {
    "id": "CYE26-B-0314401-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "REINA DE LAS AMERICAS",
      "codigoModular": "0314401",
      "tipoGestion": "Privada",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "MISKI KALLPA",
    "tematica": "Nutrición",
    "enlaceWeb": "https://drive.google.com/drive/folders/11_Jx2Vdg82N2W79mWKEX1AQG5mZ1Fnxa",
    "fechaRegistro": "2026-09-01T14:42:44",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "C"
      },
      {
        "grado": "QUINTO",
        "seccion": "C"
      },
      {
        "grado": "QUINTO",
        "seccion": "C"
      },
      {
        "grado": "QUINTO",
        "seccion": "C"
      },
      {
        "grado": "QUINTO",
        "seccion": "C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "TORRES AJALLA, MARIA ELENA",
      "especialidad": "Biología Quimica"
    }
  },
  {
    "id": "CYE26-B-0644690-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "REPUBLICA DE CHILE",
      "codigoModular": "0644690",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "GOMIX",
    "tematica": "PROBLEMATICA SOCIAL",
    "enlaceWeb": "https://drive.google.com/drive/folders/1lfzH2NyE7J4z4qI22FZaplVsfQFtTi6T?usp=sharing",
    "fechaRegistro": "2026-09-07T23:52:27",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "MENDOZA CACERES, DILMA EULALIA",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-B-0644690-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "REPUBLICA DE CHILE",
      "codigoModular": "0644690",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "KAWSAY HAIR",
    "tematica": "SHAMPOO EN BARRA ANTICAIDA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1EWRt4XBIqqxTl5eI6T0IThCToyliUfwH?usp=sharing",
    "fechaRegistro": "2026-09-08T14:42:03",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      },
      {
        "grado": "QUINTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "FUENTES RIVERA QUISPE, GYSELA PAULA",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-B-0340398-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "ROSA DOMINGA PEREZ LIENDO",
      "codigoModular": "0340398",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "VIVAMTAJAYA",
    "tematica": "PRODUCTO",
    "enlaceWeb": "https://drive.google.com/drive/folders/1ci1fkvk5pRb1MCq9-fJ21Wyy4MWY8EpO?usp=drive_link",
    "fechaRegistro": "2026-09-09T11:52:32",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      },
      {
        "grado": "CUARTO",
        "seccion": "4 A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CELEDONIO MARADIEGUE, SIMON NICOLAS",
      "especialidad": "INDUSTRIA ALIMENTARIA"
    }
  },
  {
    "id": "CYE26-B-1199009-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "SANTO DOMINGO EL APOSTOL",
      "codigoModular": "1199009",
      "tipoGestion": "Privada",
      "distrito": "San Miguel",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "TARÚ HEALTHY SNACK A BASE DE TARWI",
    "tematica": "ALIMENTACIÓN SALUDABLE E INNOVACIÓN CON PRODUCTOS PERUANOS",
    "enlaceWeb": "https://drive.google.com/drive/folders/1XoZY2W6AUheXn_77O9uAdZuDaRargorG?usp=sharing",
    "fechaRegistro": "2026-09-09T10:55:53",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "PRE3"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "CAPUÑAY TERRONES, JONATHAN ENRIQUE",
      "especialidad": "EPT"
    }
  },
  {
    "id": "CYE26-B-0690214-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "SEÑOR DE LUREN",
      "codigoModular": "0690214",
      "tipoGestion": "Privada",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "FRUTALIA",
    "tematica": "Acuarelas hechas a base de residuos de frutas",
    "enlaceWeb": "https://canva.link/obc7a107uzle6ec",
    "fechaRegistro": "2026-09-10T00:01:01",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      },
      {
        "grado": "CUARTO",
        "seccion": "A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "QUIÑONES ROJAS, ERIKA URSULA",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-B-0245688-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "TERESA GONZALES DE FANNING",
      "codigoModular": "0245688",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "COLLECTION BIO MATERIALES PODER DEL MAR",
    "tematica": "CONTAMINACIÓN AMBIENTAL",
    "enlaceWeb": "https://drive.google.com/drive/folders/1lUiyFhjBrgKcNX-lxt3MUDltuNBJ-pef?usp=sharing",
    "fechaRegistro": "2026-09-07T11:29:58",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "10"
      },
      {
        "grado": "QUINTO",
        "seccion": "10"
      },
      {
        "grado": "QUINTO",
        "seccion": "10"
      },
      {
        "grado": "QUINTO",
        "seccion": "10"
      },
      {
        "grado": "QUINTO",
        "seccion": "10"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "YARLEQUE DAVILA, RUTH MARIA",
      "especialidad": "Industria del Vestido"
    }
  },
  {
    "id": "CYE26-B-0245688-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "TERESA GONZALES DE FANNING",
      "codigoModular": "0245688",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Jesus Maria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "AQUA CHANGE",
    "tematica": "HIGIENE Y CUIDADO PERSONAL",
    "enlaceWeb": "https://drive.google.com/drive/folders/1VmwEqkdW-keGFL_5fsSE4-_Jm9FU0gnV?usp=sharing",
    "fechaRegistro": "2026-09-07T12:46:56",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "7"
      },
      {
        "grado": "TERCERO",
        "seccion": "7"
      },
      {
        "grado": "TERCERO",
        "seccion": "7"
      },
      {
        "grado": "TERCERO",
        "seccion": "7"
      },
      {
        "grado": "TERCERO",
        "seccion": "7"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "FLORES CRUZ, MAGALY ESTELA",
      "especialidad": "Industria del Vestido"
    }
  },
  {
    "id": "CYE26-B-0340364-P1",
    "categoria": "B",
    "institucion": {
      "nombre": "TUPAC AMARU",
      "codigoModular": "0340364",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "MUFFINS ANDINOS",
    "tematica": "BUENA ALIMENTACION",
    "enlaceWeb": "https://drive.google.com/drive/folders/1v9DkrSTITnMJizCfCvkBkZ7RQ2NEnct4?usp=sharing",
    "fechaRegistro": "2026-09-09T00:33:49",
    "integrantes": [
      {
        "grado": "QUINTO",
        "seccion": "5A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5A"
      },
      {
        "grado": "QUINTO",
        "seccion": "5A"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "RICSE CAYSAHUANA, EDWIN",
      "especialidad": "AGROPECUARIA Y NUTRICION"
    }
  },
  {
    "id": "CYE26-B-0340364-P2",
    "categoria": "B",
    "institucion": {
      "nombre": "TUPAC AMARU",
      "codigoModular": "0340364",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "Educación Básica Regular",
      "nivel": "Secundaria",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 2,
    "tituloProyecto": "TINKUY",
    "tematica": "PRENDAS CON RETAZO DE TELA",
    "enlaceWeb": "https://drive.google.com/drive/folders/1ekDxxFMYGabuoOYON9uEzXYummxOu_fZ?usp=sharing",
    "fechaRegistro": "2026-09-09T00:07:45",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "4C"
      },
      {
        "grado": "CUARTO",
        "seccion": "4C"
      },
      {
        "grado": "CUARTO",
        "seccion": "4C"
      },
      {
        "grado": "CUARTO",
        "seccion": "4C"
      },
      {
        "grado": "CUARTO",
        "seccion": "4C"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ITOKAZU PIZARRO, MARIA LUISA",
      "especialidad": "INDUSTRIA DEL VESTIDO"
    }
  },
  {
    "id": "CYE26-C-0449645-P1",
    "categoria": "C",
    "institucion": {
      "nombre": "CEBA - 1070 MELITON CARVAJAL",
      "codigoModular": "0449645",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "Lince",
      "modalidad": "EDUCACIÓN BÁSICA ALTERNATIVA",
      "nivel": "Básica Alternativa - Avanzado",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Jabón de glicerina artesanal Eco Glow",
    "tematica": "Jabones artesanales",
    "enlaceWeb": "https://drive.google.com/drive/folders/1ngHQwvekoKCNu3JTa1xuwDBEmvZzm1kG?usp=sharing",
    "fechaRegistro": "2026-09-07T19:40:28",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "-"
      },
      {
        "grado": "TERCERO",
        "seccion": "-"
      },
      {
        "grado": "TERCERO",
        "seccion": "-"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "SULLCA QUISPE, VERONICA",
      "especialidad": "CIENCIA TECNOLOGÍA Y AMBIENTE"
    }
  },
  {
    "id": "CYE26-C-1226380-P1",
    "categoria": "C",
    "institucion": {
      "nombre": "CEBA - 1112 VICTOR ANDRES BELAUNDE",
      "codigoModular": "1226380",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "EDUCACIÓN BÁSICA ALTERNATIVA",
      "nivel": "Básica Alternativa - Avanzado",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "Rellenitas de Hierro",
    "tematica": "emprendimiento alimentario",
    "enlaceWeb": "https://drive.google.com/drive/folders/1XZH2xtT1Co_QfOOvVzRQShA8nYQYJFwN?usp=sharing",
    "fechaRegistro": "2026-09-09T21:38:39",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "-"
      },
      {
        "grado": "TERCERO",
        "seccion": "-"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "SOLANO SALINAS, PABLO FEDERICO",
      "especialidad": "Religión y ciencias sociales"
    }
  },
  {
    "id": "CYE26-C-0337337-P1",
    "categoria": "C",
    "institucion": {
      "nombre": "CEBA - BARTOLOME HERRERA",
      "codigoModular": "0337337",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "San Miguel",
      "modalidad": "EDUCACIÓN BÁSICA ALTERNATIVA",
      "nivel": "Básica Alternativa - Avanzado",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "VESTIRSE SIN BARRERAS",
    "tematica": "Vestirse sin género",
    "enlaceWeb": "https://docs.google.com/document/d/1kIcUdidtok8ZWPVgO3UKVUivSBo2IsOq/edit?usp=sharing&ouid=109240452640554368143&rtpof=true&sd=true",
    "fechaRegistro": "2026-09-09T21:11:40",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "-"
      },
      {
        "grado": "CUARTO",
        "seccion": "-"
      },
      {
        "grado": "CUARTO",
        "seccion": "-"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "VALLEJO MELGAR, KARINA YESENIA",
      "especialidad": "Industria del vestido"
    }
  },
  {
    "id": "CYE26-C-0449652-P1",
    "categoria": "C",
    "institucion": {
      "nombre": "CEBA - ISABEL LA CATOLICA",
      "codigoModular": "0449652",
      "tipoGestion": "Pública de gestión directa",
      "distrito": "La Victoria",
      "modalidad": "EDUCACIÓN BÁSICA ALTERNATIVA",
      "nivel": "Básica Alternativa - Avanzado",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "CHOCOMANIA",
    "tematica": "PRODUCE VENDE",
    "enlaceWeb": "https://docs.google.com/document/d/13Wpx9tTcFglwlNaDi5zIVMIHbSfi9sZh/edit?usp=sharing&ouid=118391962447337786208&rtpof=true&sd=true",
    "fechaRegistro": "2026-09-09T21:08:57",
    "integrantes": [
      {
        "grado": "TERCERO",
        "seccion": "-"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "RODRIGUEZ VILCA, DAVID HEZRAI",
      "especialidad": ""
    }
  },
  {
    "id": "CYE26-C-1198282-P1",
    "categoria": "C",
    "institucion": {
      "nombre": "CEBA - NUESTRA SEÑORA DE MONTSERRAT",
      "codigoModular": "1198282",
      "tipoGestion": "Privada",
      "distrito": "Lima",
      "modalidad": "EDUCACIÓN BÁSICA ALTERNATIVA",
      "nivel": "Básica Alternativa - Avanzado",
      "ugel": "UGEL 03",
      "dre": "DRE LIMA METROPOLITANA"
    },
    "puestoIE": 1,
    "tituloProyecto": "JEANS VERDE MONTSERRATINO",
    "tematica": "BOLSAS ECOLÒGICAS HECHAS DE JEANS RECICLADOS",
    "enlaceWeb": "https://www.facebook.com/CPEEIMontserrat/?locale=es_LA",
    "fechaRegistro": "2026-08-29T12:37:39",
    "integrantes": [
      {
        "grado": "CUARTO",
        "seccion": "-"
      },
      {
        "grado": "CUARTO",
        "seccion": "-"
      }
    ],
    "estudiantesEnOtrosEquipos": 0,
    "docenteAsesor": {
      "nombreCompleto": "ROJAS NARVAEZ, CLORINDA EULALIA",
      "especialidad": "Educación para el trabajo"
    }
  }
];
