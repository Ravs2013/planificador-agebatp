/* ═══════════════════════════════════════════════════════════
   DIRECTORIO EXCEL — PARSERS Y NORMALIZADORES (v2 y Legacy)
   AGEBATP UGEL 03
   ═══════════════════════════════════════════════════════════ */

import * as XLSX from "xlsx";

/** Normaliza texto para comparacion: sin tildes, mayusculas, espacios colapsados. */
export function normalizarTexto(v) {
    if (v === null || v === undefined) return "";
    return String(v)
        .replace(/\u00A0/g, " ")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();
}

/** Clave alfanumerica estricta (solo A-Z y 0-9) para cruces inmunes a puntuacion. */
export function clave(v) {
    return normalizarTexto(v).replace(/[^A-Z0-9]/g, "");
}

/** Retorna texto limpio o null si esta vacio o es valor centinela. */
export function txt(v) {
    if (v === null || v === undefined) return null;
    const s = String(v).replace(/\u00A0/g, " ").trim();
    if (!s) return null;
    const c = clave(s);
    if (c === "" || c === "NA" || c === "SD" || c === "SININFORMACION" || c === "PORDEFINIR") return null;
    if (s === "-" || s === "--") return null;
    return s;
}

/** Retorna numero o null. Nunca retorna 0 por defecto. */
export function num(v) {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    const s = String(v).replace(/[^\d.,-]/g, "").replace(/,/g, "");
    if (s === "" || s === "-") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

/** Booleano de tres estados: true | false | null. */
export function bool3(v) {
    const s = clave(v);
    if (!s) return null;
    if (["SI", "S", "X", "1", "TRUE", "VERDADERO"].includes(s)) return true;
    if (["NO", "N", "0", "FALSE", "FALSO"].includes(s)) return false;
    return null;
}

/** Suma no nula: suma tratando nulls como 0, pero si todos son nulos retorna null. */
export function sumaNoNula(...valores) {
    let tieneValor = false;
    let total = 0;
    for (const v of valores) {
        if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
            tieneValor = true;
            total += Number(v);
        }
    }
    return tieneValor ? total : null;
}

/** Separa apellidos y nombres de director en formato 'APELLIDOS, NOMBRES' o libre. */
export function separarDirector(valor) {
    const raw = txt(valor);
    const vacio = { directorNombreCompleto: null, apellidoPaterno: null, apellidoMaterno: null, nombres: null };
    if (!raw) return vacio;
    if (raw.includes(",")) {
        const [ape, nom] = raw.split(",");
        const partes = ape.trim().split(/\s+/);
        return {
            directorNombreCompleto: raw,
            apellidoPaterno: partes[0] || null,
            apellidoMaterno: partes.slice(1).join(" ") || null,
            nombres: (nom && nom.trim()) || null,
        };
    }
    const p = raw.trim().split(/\s+/);
    if (p.length >= 3) {
        return { directorNombreCompleto: raw, apellidoPaterno: p[0], apellidoMaterno: p[1], nombres: p.slice(2).join(" ") };
    }
    if (p.length === 2) {
        return { directorNombreCompleto: raw, apellidoPaterno: p[0], apellidoMaterno: null, nombres: p[1] };
    }
    return { directorNombreCompleto: raw, apellidoPaterno: null, apellidoMaterno: null, nombres: raw };
}

/** Separa correos multiples separados por punto medio, coma o punto y coma. */
export function separarCorreos(valor) {
    const raw = txt(valor);
    if (!raw) return { correoPersonal: null, correosPersonales: [] };
    const lista = raw.split(/[·;,\n]+/).map(s => s.trim()).filter(s => s.includes("@"));
    return { correoPersonal: raw, correosPersonales: lista };
}

/** Separa turnos preservando turnos compuestos con guion. */
export function separarTurnos(valor) {
    const raw = txt(valor);
    if (!raw) return { turnos: null, turnosLista: [] };
    const lista = raw.split(/[,/;]| y | e /i).map(s => s.trim()).filter(Boolean);
    return { turnos: raw, turnosLista: lista };
}

/** Localiza una hoja en el libro por una lista de nombres o alias posibles. */
export function buscarHoja(wb, alias) {
    if (!wb || !wb.SheetNames) return null;
    const objetivo = alias.map(clave);
    const nombre = wb.SheetNames.find(n => objetivo.includes(clave(n)));
    return nombre ? { nombre, ws: wb.Sheets[nombre] } : null;
}

/** Convierte hoja a arreglo bidimensional seguro. */
export function filasDeHoja(ws) {
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false, raw: true });
}

/** Localiza indices de columna en la cabecera segun un mapa de alias. */
export function indiceCabecera(filaCabecera, mapaAlias) {
    const cols = (filaCabecera || []).map(clave);
    const idx = {};
    for (const [campo, variantes] of Object.entries(mapaAlias)) {
        idx[campo] = -1;
        for (const v of variantes) {
            const k = clave(v);
            let p = cols.indexOf(k);
            if (p === -1) {
                p = cols.findIndex(c => c && (c.startsWith(k) || k.startsWith(c)) && Math.abs(c.length - k.length) <= 4);
            }
            if (p !== -1) {
                idx[campo] = p;
                break;
            }
        }
    }
    return idx;
}

/** Lector seguro de celda por campo. */
export const leer = (fila, idx, campo) => (idx && idx[campo] >= 0 && fila ? fila[idx[campo]] : null);

/* ═══════════════════════════════════════════════════════════
   ALIAS DE HOJAS Y MAPAS DE COLUMNAS
   ═══════════════════════════════════════════════════════════ */

export const HOJAS_CEBA = {
    principal: ["DIRECTORIO CEBA", "DIRECTORIO DE CEBA", "CEBA"],
    areas:     ["ÁREAS CURRICULARES", "AREAS CURRICULARES", "AREAS"],
    sedes:     ["SEDES Y LOCALES", "SEDES", "LOCALES"],
    personal:  ["PERSONAL DOCENTE", "PERSONAL"],
    distancia: ["ATENCIÓN A DISTANCIA", "ATENCION A DISTANCIA", "DISTANCIA"],
    resumen:   ["RESUMEN", "RESUMEN GENERAL"],
};

export const HOJAS_CETPRO = {
    principal: ["DIRECTORIO CETPRO", "DIRECTORIO DE CETPRO", "CETPRO"],
    programas: ["PROGRAMAS DE ESTUDIO", "PROGRAMAS"],
    continua:  ["FORMACIÓN CONTINUA", "FORMACION CONTINUA"],
    talleres:  ["TALLERES Y SEDES", "TALLERES"],
    personal:  ["PERSONAL DOCENTE", "PERSONAL"],
    resumen:   ["RESUMEN", "RESUMEN GENERAL"],
};

export const COLS_CEBA_PRINCIPAL = {
    numeroOrden:                    ["N°", "NRO", "NUMERO"],
    codigoLocal:                    ["Cód. local", "Codigo local", "Cod local"],
    codigoModularInicialIntermedio: ["Cód. mod. Inicial/Interm.", "Codigo modular Inicial Intermedio", "Cod mod Inicial"],
    codigoModularAvanzado:          ["Cód. mod. Avanzado", "Codigo modular Avanzado", "Cod mod Avanzado"],
    nombre:                         ["Nombre del CEBA", "Nombre de la IE", "CEBA", "Institucion"],
    tipoGestion:                    ["Tipo de gestión", "Tipo de gestion", "Gestion"],
    distrito:                       ["Distrito"],
    direccion:                      ["Dirección exacta", "Direccion exacta", "Direccion"],
    director:                       ["Director(a) — apellidos y nombres", "Director", "Director(a)"],
    dni:                            ["DNI"],
    cargo:                          ["Cargo"],
    celular:                        ["Celular", "Telefono"],
    correoInstitucional:            ["Correo institucional"],
    correoPersonal:                 ["Correo personal"],
    turnos:                         ["Turnos", "Turno"],
    cicloInicial:                   ["Ciclo Inicial"],
    cicloIntermedio:                ["Ciclo Intermedio"],
    cicloAvanzado:                  ["Ciclo Avanzado"],
    presencial:                     ["Presencial"],
    semipresencial:                 ["Semipresencial"],
    aDistancia:                     ["A distancia"],
    alumnosCenso:                   ["Estudiantes matriculados", "Alumnos censo", "Total estudiantes"],
    docentesNombrados:              ["Docentes nombrados"],
    docentesContratados:            ["Docentes contratados"],
    directivosJerarquicos:          ["Directivos y jerárquicos", "Directivos y jerarquicos", "Directivos"],
    totalDocentes:                  ["Total de docentes", "Total docentes"],
    cantidadPerifericos:            ["N° de periféricos", "N° de perifericos", "Perifericos"],
    areasDeclaradas:                ["Áreas curriculares", "Areas curriculares"],
    sedesDeclaradas:                ["Sedes registradas", "Sedes"],
    personalDeclarado:              ["Personal registrado", "Personal"],
    observaciones:                  ["Observaciones del director(a)", "Observaciones", "Observacion"],
};

export const COLS_CEBA_AREAS = {
    institucion: ["CEBA", "Institucion", "Nombre del CEBA"],
    area:        ["Área curricular", "Area curricular", "Area"],
    ciclos:      ["Ciclo(s)", "Ciclos", "Ciclo"],
    turnos:      ["Turno(s)", "Turnos", "Turno"],
    docentes:    ["N° de docentes", "Docentes"],
    estudiantes: ["N° de estudiantes", "Estudiantes", "Alumnos"],
};

export const COLS_CEBA_SEDES = {
    institucion:   ["CEBA", "Institucion", "Nombre del CEBA"],
    tipoSede:      ["Tipo de sede", "Sede", "Tipo sede"],
    direccion:     ["Dirección exacta", "Direccion exacta", "Direccion"],
    formaAtencion: ["Forma de atención", "Forma de atencion"],
    dias:          ["Días", "Dias"],
    horario:       ["Horario de atención", "Horario"],
};

export const COLS_CEBA_PERSONAL = {
    institucion:    ["CEBA", "Institucion", "Nombre del CEBA"],
    nombreCompleto: ["Apellidos y nombres", "Apellidos y nombres completos", "Nombre"],
    dni:            ["DNI"],
    cargo:          ["Cargo"],
    situacion:      ["Situación", "Situacion"],
    area:           ["Área que enseña", "Area que enseña", "Area"],
    cicloGrado:     ["Ciclo / grado", "Ciclo grado", "Grado"],
    turno:          ["Turno"],
    observacion:    ["Observación de la visita de monitoreo", "Observacion", "Observaciones"],
};

export const COLS_CEBA_DISTANCIA = {
    institucion:      ["CEBA", "Institucion", "Nombre del CEBA"],
    rd:               ["RD que autoriza", "RD de autorizacion", "RD"],
    plataformasTexto: ["Plataformas / canales", "Plataformas y canales", "Plataformas"],
    estudiantes:      ["Estudiantes a distancia", "Estudiantes distancia"],
    diasHorario:      ["Días y horario", "Dias y horario", "Horario"],
    docentesTexto:    ["Docentes que atienden", "Docentes a cargo", "Docentes"],
    plataformas:      ["Plataformas marcadas en el cuadro", "Plataformas marcadas"],
};

export const COLS_CETPRO_PRINCIPAL = {
    numeroOrden:                ["N°", "NRO", "NUMERO"],
    codigoLocal:                ["Cód. local", "Codigo local", "Cod local"],
    codigoModular:              ["Código modular", "Codigo modular", "Cod modular"],
    nombre:                     ["Nombre del CETPRO", "CETPRO", "Institucion"],
    tipoGestion:                ["Tipo de gestión", "Tipo de gestion", "Gestion"],
    distrito:                   ["Distrito"],
    direccion:                  ["Dirección exacta", "Direccion exacta", "Direccion"],
    director:                   ["Director(a) — apellidos y nombres", "Director", "Director(a)"],
    dni:                        ["DNI"],
    cargo:                      ["Cargo"],
    celular:                    ["Celular"],
    telefonoInstitucional:      ["Teléfono institucional", "Telefono institucional", "Telefono"],
    correoInstitucional:        ["Correo institucional"],
    correoPersonal:             ["Correo personal"],
    turnos:                     ["Turnos", "Turno"],
    horarioInicio:              ["Horario — inicio por turno", "Horario inicio"],
    horarioTermino:             ["Horario — término por turno", "Horario termino"],
    permanenciaDirectivo:       ["Permanencia del director(a)", "Permanencia"],
    alumnosCenso:               ["Estudiantes matriculados", "Alumnos censo", "Total estudiantes"],
    docentesNombrados:          ["Docentes nombrados"],
    docentesContratados:        ["Docentes contratados"],
    directivosJerarquicos:      ["Directivos y jerárquicos", "Directivos y jerarquicos", "Directivos"],
    totalDocentes:              ["Total de docentes", "Total docentes"],
    adminNombrados:             ["Administrativos nombrados"],
    adminContratados:           ["Administrativos contratados"],
    talleresCenso:              ["N° de talleres", "Talleres censo", "Talleres"],
    programasDeclarados:        ["Programas de estudio", "Programas"],
    formacionContinuaDeclarada: ["Módulos de formación continua", "Modulos formacion continua"],
    personalDeclarado:          ["Personal registrado", "Personal"],
    observaciones:              ["Observaciones del director(a)", "Observaciones", "Observacion"],
};

export const COLS_CETPRO_PROGRAMAS = {
    institucion:    ["CETPRO", "Institucion", "Nombre del CETPRO"],
    programa:       ["Programa de estudio", "Programa", "Especialidad"],
    codigo:         ["Código", "Codigo"],
    nivelFormativo: ["Nivel formativo", "Nivel"],
    turnos:         ["Turno(s)", "Turnos", "Turno"],
    docentes:       ["N° de docentes", "Docentes"],
    estudiantes:    ["N° de estudiantes", "Estudiantes", "Alumnos"],
};

export const COLS_CETPRO_CONTINUA = {
    institucion: ["CETPRO", "Institucion", "Nombre del CETPRO"],
    modulo:      ["Módulo / curso de formación continua", "Modulo de formacion continua", "Modulo"],
    observacion: ["Docente a cargo / observación", "Docente a cargo / observacion", "Observacion", "Docente a cargo"],
};

export const COLS_CETPRO_TALLERES = {
    institucion: ["CETPRO", "Institucion", "Nombre del CETPRO"],
    tipoSede:    ["Taller / sede", "Taller", "Sede", "Tipo de sede"],
    direccion:   ["Dirección exacta", "Direccion exacta", "Direccion"],
    turnos:      ["Turno(s)", "Turnos", "Turno"],
    horario:     ["Horario de atención", "Horario"],
};

export const COLS_CETPRO_PERSONAL = {
    institucion:    ["CETPRO", "Institucion", "Nombre del CETPRO"],
    nombreCompleto: ["Apellidos y nombres", "Nombre completo", "Nombre"],
    dni:            ["DNI"],
    cargo:          ["Cargo"],
    situacion:      ["Situación", "Situacion"],
    programa:       ["Programa que enseña", "Programa", "Especialidad"],
    turno:          ["Turno"],
    observacion:    ["Módulo ocupacional / observación", "Modulo ocupacional / observacion", "Observacion"],
};

/* ═══════════════════════════════════════════════════════════
   DETECCION DE FORMATO
   ═══════════════════════════════════════════════════════════ */

export const FORMATOS = {
    CEBA_V2: "F-07-v2",
    CETPRO_V2: "F-08-v2",
    LEGACY_MEGA: "legacy-mega",
    LEGACY_PLANO: "legacy-plano",
    DESCONOCIDO: "desconocido",
};

export function detectarFormato(wb) {
    if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) return FORMATOS.DESCONOCIDO;
    if (buscarHoja(wb, HOJAS_CEBA.principal)) return FORMATOS.CEBA_V2;
    if (buscarHoja(wb, HOJAS_CETPRO.principal)) return FORMATOS.CETPRO_V2;
    if (wb.SheetNames.includes("PORTADA") || wb.SheetNames.some(n => /^\d+_/i.test(n))) return FORMATOS.LEGACY_MEGA;
    if (wb.SheetNames.length >= 1) return FORMATOS.LEGACY_PLANO;
    return FORMATOS.DESCONOCIDO;
}

/** Localiza la fila de cabecera buscando en las primeras 12 filas. */
function detectarFilaCabecera(filas) {
    for (let i = 0; i < Math.min(12, filas.length); i++) {
        const fila = filas[i];
        if (!Array.isArray(fila)) continue;
        const col0 = clave(fila[0]);
        const celdasNoVacias = fila.filter(c => c !== null && c !== undefined && String(c).trim() !== "").length;
        if ((col0 === "N" || col0 === "NRO" || col0 === "NUMERO") && celdasNoVacias >= 3) {
            return i;
        }
    }
    return 4; // Fila 5 (indice 4) por defecto
}

/* ═══════════════════════════════════════════════════════════
   PARSER CEBA v2 (F-07-v2)
   ═══════════════════════════════════════════════════════════ */

export function parseDirectorioCebaV2(wb, meta = {}) {
    const incidencias = [];
    const hojaPrin = buscarHoja(wb, HOJAS_CEBA.principal);
    if (!hojaPrin) {
        incidencias.push({ nivel: "error", codigo: "HOJA_FALTANTE", mensaje: 'No se encontro la hoja principal "DIRECTORIO CEBA" en el archivo.' });
        return { formato: FORMATOS.CEBA_V2, instituciones: [], resumen: null, incidencias };
    }

    const filasPrin = filasDeHoja(hojaPrin.ws);
    const idxFilaCabecera = detectarFilaCabecera(filasPrin);
    const idx = indiceCabecera(filasPrin[idxFilaCabecera], COLS_CEBA_PRINCIPAL);

    // Advertir columnas faltantes clave
    ["nombre", "tipoGestion", "distrito"].forEach(col => {
        if (idx[col] === -1) {
            incidencias.push({ nivel: "aviso", codigo: "COLUMNA_FALTANTE", mensaje: `Columna requerida "${col}" no encontrada en la cabecera principal.` });
        }
    });

    const instituciones = [];
    const mapInst = new Map();
    const nombresVistos = new Set();

    for (let r = idxFilaCabecera + 1; r < filasPrin.length; r++) {
        const fila = filasPrin[r];
        if (!fila || fila.length === 0) continue;
        const nombreRaw = txt(leer(fila, idx, "nombre"));
        if (!nombreRaw) continue;

        const kNombre = clave(nombreRaw);
        if (nombresVistos.has(kNombre)) {
            incidencias.push({ nivel: "error", codigo: "NOMBRE_DUPLICADO", mensaje: `Nombre de CEBA duplicado en fila ${r + 1}: ${nombreRaw}`, institucion: nombreRaw });
        }
        nombresVistos.add(kNombre);

        const dirParts = separarDirector(leer(fila, idx, "director"));
        const mailParts = separarCorreos(leer(fila, idx, "correoPersonal"));
        const turnParts = separarTurnos(leer(fila, idx, "turnos"));

        const nomb = num(leer(fila, idx, "docentesNombrados"));
        const cont = num(leer(fila, idx, "docentesContratados"));
        const dirJer = num(leer(fila, idx, "directivosJerarquicos"));
        const totalDoc = num(leer(fila, idx, "totalDocentes")) ?? sumaNoNula(nomb, cont, dirJer);

        const inst = {
            numeroOrden: num(leer(fila, idx, "numeroOrden")),
            codigoLocal: txt(leer(fila, idx, "codigoLocal")),
            codigoModularInicialIntermedio: txt(leer(fila, idx, "codigoModularInicialIntermedio")),
            codigoModularAvanzado: txt(leer(fila, idx, "codigoModularAvanzado")),
            nombre: nombreRaw,
            tipoGestion: txt(leer(fila, idx, "tipoGestion")),
            distrito: txt(leer(fila, idx, "distrito")),
            direccion: txt(leer(fila, idx, "direccion")),

            directorNombreCompleto: dirParts.directorNombreCompleto,
            apellidoPaterno: dirParts.apellidoPaterno,
            apellidoMaterno: dirParts.apellidoMaterno,
            nombres: dirParts.nombres,
            dni: txt(leer(fila, idx, "dni")),
            cargo: txt(leer(fila, idx, "cargo")),
            celular: txt(leer(fila, idx, "celular")),
            correoInstitucional: txt(leer(fila, idx, "correoInstitucional")),
            correoPersonal: mailParts.correoPersonal,
            correosPersonales: mailParts.correosPersonales,

            turnos: turnParts.turnos,
            turnosLista: turnParts.turnosLista,
            cicloInicial: bool3(leer(fila, idx, "cicloInicial")),
            cicloIntermedio: bool3(leer(fila, idx, "cicloIntermedio")),
            cicloAvanzado: bool3(leer(fila, idx, "cicloAvanzado")),
            presencial: bool3(leer(fila, idx, "presencial")),
            semipresencial: bool3(leer(fila, idx, "semipresencial")),
            aDistancia: bool3(leer(fila, idx, "aDistancia")),

            alumnosCenso: num(leer(fila, idx, "alumnosCenso")),
            docentesNombrados: nomb,
            docentesContratados: cont,
            directivosJerarquicos: dirJer,
            totalDocentes: totalDoc,
            cantidadPerifericos: num(leer(fila, idx, "cantidadPerifericos")),

            areasDeclaradas: num(leer(fila, idx, "areasDeclaradas")),
            sedesDeclaradas: num(leer(fila, idx, "sedesDeclaradas")),
            personalDeclarado: num(leer(fila, idx, "personalDeclarado")),
            observaciones: txt(leer(fila, idx, "observaciones")),

            areas: [],
            sedes: [],
            personal: [],
            atencionDistancia: null,

            _importacion: {
                archivo: meta.nombreArchivo || "DIRECTORIO_CEBA_UGEL03.xlsx",
                formato: FORMATOS.CEBA_V2,
                fila: r + 1,
                importadoEn: new Date().toISOString(),
                importadoPor: meta.userName || "Administrador AGEBATP",
            },
        };

        instituciones.push(inst);
        mapInst.set(kNombre, inst);
    }

    // ── Hoja ÁREAS CURRICULARES ──
    const hojaAreas = buscarHoja(wb, HOJAS_CEBA.areas);
    if (hojaAreas) {
        const filas = filasDeHoja(hojaAreas.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CEBA_AREAS);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            const areaNom = txt(leer(f, idxH, "area"));
            if (!instNom || !areaNom) continue;

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                inst.areas.push({
                    area: areaNom,
                    ciclos: txt(leer(f, idxH, "ciclos")),
                    turnos: txt(leer(f, idxH, "turnos")),
                    docentes: num(leer(f, idxH, "docentes")),
                    estudiantes: num(leer(f, idxH, "estudiantes")),
                });
            } else {
                incidencias.push({ nivel: "aviso", codigo: "HUERFANO", mensaje: `Registro huérfano en ÁREAS (fila ${r + 1}): "${instNom}" no coincide con el directorio principal.` });
            }
        }
    }

    // ── Hoja SEDES Y LOCALES ──
    const hojaSedes = buscarHoja(wb, HOJAS_CEBA.sedes);
    if (hojaSedes) {
        const filas = filasDeHoja(hojaSedes.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CEBA_SEDES);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            const tipoSede = txt(leer(f, idxH, "tipoSede"));
            if (!instNom || !tipoSede) continue;

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                const sObj = {
                    tipoSede,
                    sede: tipoSede, // Retrocompatibilidad
                    direccion: txt(leer(f, idxH, "direccion")),
                    formaAtencion: txt(leer(f, idxH, "formaAtencion")),
                    dias: txt(leer(f, idxH, "dias")),
                    horario: txt(leer(f, idxH, "horario")),
                };
                inst.sedes.push(sObj);
            } else {
                incidencias.push({ nivel: "aviso", codigo: "HUERFANO", mensaje: `Registro huérfano en SEDES (fila ${r + 1}): "${instNom}" no coincide con el directorio principal.` });
            }
        }
    }

    // ── Hoja PERSONAL DOCENTE ──
    const hojaPersonal = buscarHoja(wb, HOJAS_CEBA.personal);
    if (hojaPersonal) {
        const filas = filasDeHoja(hojaPersonal.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CEBA_PERSONAL);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            let nomComp = txt(leer(f, idxH, "nombreCompleto"));
            const dniVal = txt(leer(f, idxH, "dni"));
            const sitVal = txt(leer(f, idxH, "situacion"));
            if (!nomComp && (clave(dniVal) === "VACANTE" || clave(sitVal) === "VACANTE")) {
                nomComp = "VACANTE";
            }
            if (!instNom || !nomComp) continue;

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                inst.personal.push({
                    nombreCompleto: nomComp,
                    dni: dniVal,
                    cargo: txt(leer(f, idxH, "cargo")),
                    situacion: sitVal,
                    area: txt(leer(f, idxH, "area")),
                    cicloGrado: txt(leer(f, idxH, "cicloGrado")),
                    turno: txt(leer(f, idxH, "turno")),
                    observacion: txt(leer(f, idxH, "observacion")),
                });
            } else {
                incidencias.push({ nivel: "aviso", codigo: "HUERFANO", mensaje: `Registro huérfano en PERSONAL (fila ${r + 1}): "${instNom}" no coincide con el directorio principal.` });
            }
        }
    }

    // ── Hoja ATENCIÓN A DISTANCIA ──
    const hojaDist = buscarHoja(wb, HOJAS_CEBA.distancia);
    if (hojaDist) {
        const filas = filasDeHoja(hojaDist.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CEBA_DISTANCIA);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            if (!instNom) continue;

            const platRaw = txt(leer(f, idxH, "plataformas"));
            const platList = platRaw ? platRaw.split(/[;,]+/).map(s => s.trim()).filter(Boolean) : [];

            const distObj = {
                rd: txt(leer(f, idxH, "rd")),
                plataformasTexto: txt(leer(f, idxH, "plataformasTexto")),
                plataformas: platList,
                estudiantes: num(leer(f, idxH, "estudiantes")),
                diasHorario: txt(leer(f, idxH, "diasHorario")),
                docentesTexto: txt(leer(f, idxH, "docentesTexto")),
            };

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                const tieneContenido = Object.values(distObj).some(v => v !== null && (Array.isArray(v) ? v.length > 0 : true));
                inst.atencionDistancia = tieneContenido ? distObj : null;
            }
        }
    }

    // Post-procesamiento y validaciones por institucion
    instituciones.forEach(inst => {
        const sinResponsable = !inst.directorNombreCompleto;
        const sinAlumnos = inst.alumnosCenso === null;
        const sinCorreo = !inst.correoInstitucional;
        inst.fichaPendiente = sinResponsable && sinAlumnos && sinCorreo;

        if (inst.fichaPendiente) {
            incidencias.push({ nivel: "info", codigo: "FICHA_PENDIENTE", mensaje: `Institución sin ficha devuelta: ${inst.nombre}.`, institucion: inst.nombre });
        }
        if (!inst.codigoModularAvanzado && !inst.codigoModularInicialIntermedio) {
            incidencias.push({ nivel: "aviso", codigo: "SIN_CODIGO_MODULAR", mensaje: `CEBA sin código modular registrado: ${inst.nombre}. Se usará código de local como ID.`, institucion: inst.nombre });
        }
        if (inst.areasDeclaradas !== null && inst.areasDeclaradas !== inst.areas.length) {
            incidencias.push({ nivel: "info", codigo: "CONTEO_DISCREPANTE", mensaje: `${inst.nombre}: Áreas declaradas (${inst.areasDeclaradas}) difiere de filas en hoja (${inst.areas.length}).`, institucion: inst.nombre });
        }
        if (inst.sedesDeclaradas !== null && inst.sedesDeclaradas !== inst.sedes.length) {
            incidencias.push({ nivel: "info", codigo: "CONTEO_DISCREPANTE", mensaje: `${inst.nombre}: Sedes declaradas (${inst.sedesDeclaradas}) difiere de filas en hoja (${inst.sedes.length}).`, institucion: inst.nombre });
        }
        if (inst.personalDeclarado !== null && inst.personalDeclarado !== inst.personal.length) {
            incidencias.push({ nivel: "info", codigo: "CONTEO_DISCREPANTE", mensaje: `${inst.nombre}: Personal declarado (${inst.personalDeclarado}) difiere de filas en hoja (${inst.personal.length}).`, institucion: inst.nombre });
        }
    });

    return {
        formato: FORMATOS.CEBA_V2,
        instituciones,
        incidencias,
    };
}

/* ═══════════════════════════════════════════════════════════
   PARSER CETPRO v2 (F-08-v2)
   ═══════════════════════════════════════════════════════════ */

export function parseDirectorioCetproV2(wb, meta = {}) {
    const incidencias = [];
    const hojaPrin = buscarHoja(wb, HOJAS_CETPRO.principal);
    if (!hojaPrin) {
        incidencias.push({ nivel: "error", codigo: "HOJA_FALTANTE", mensaje: 'No se encontro la hoja principal "DIRECTORIO CETPRO" en el archivo.' });
        return { formato: FORMATOS.CETPRO_V2, instituciones: [], resumen: null, incidencias };
    }

    const filasPrin = filasDeHoja(hojaPrin.ws);
    const idxFilaCabecera = detectarFilaCabecera(filasPrin);
    const idx = indiceCabecera(filasPrin[idxFilaCabecera], COLS_CETPRO_PRINCIPAL);

    ["nombre", "tipoGestion", "distrito"].forEach(col => {
        if (idx[col] === -1) {
            incidencias.push({ nivel: "aviso", codigo: "COLUMNA_FALTANTE", mensaje: `Columna requerida "${col}" no encontrada en la cabecera CETPRO.` });
        }
    });

    const instituciones = [];
    const mapInst = new Map();
    const nombresVistos = new Set();

    for (let r = idxFilaCabecera + 1; r < filasPrin.length; r++) {
        const fila = filasPrin[r];
        if (!fila || fila.length === 0) continue;
        const nombreRaw = txt(leer(fila, idx, "nombre"));
        if (!nombreRaw) continue;

        const kNombre = clave(nombreRaw);
        if (nombresVistos.has(kNombre)) {
            incidencias.push({ nivel: "error", codigo: "NOMBRE_DUPLICADO", mensaje: `Nombre de CETPRO duplicado en fila ${r + 1}: ${nombreRaw}`, institucion: nombreRaw });
        }
        nombresVistos.add(kNombre);

        const dirParts = separarDirector(leer(fila, idx, "director"));
        const mailParts = separarCorreos(leer(fila, idx, "correoPersonal"));
        const turnParts = separarTurnos(leer(fila, idx, "turnos"));

        const nomb = num(leer(fila, idx, "docentesNombrados"));
        const cont = num(leer(fila, idx, "docentesContratados"));
        const dirJer = num(leer(fila, idx, "directivosJerarquicos"));
        const totalDoc = num(leer(fila, idx, "totalDocentes")) ?? sumaNoNula(nomb, cont, dirJer);

        const inst = {
            numeroOrden: num(leer(fila, idx, "numeroOrden")),
            codigoLocal: txt(leer(fila, idx, "codigoLocal")),
            codigoModular: txt(leer(fila, idx, "codigoModular")),
            nombre: nombreRaw,
            tipoGestion: txt(leer(fila, idx, "tipoGestion")),
            distrito: txt(leer(fila, idx, "distrito")),
            direccion: txt(leer(fila, idx, "direccion")),

            directorNombreCompleto: dirParts.directorNombreCompleto,
            apellidoPaterno: dirParts.apellidoPaterno,
            apellidoMaterno: dirParts.apellidoMaterno,
            nombres: dirParts.nombres,
            dni: txt(leer(fila, idx, "dni")),
            cargo: txt(leer(fila, idx, "cargo")),
            celular: txt(leer(fila, idx, "celular")),
            telefonoInstitucional: txt(leer(fila, idx, "telefonoInstitucional")),
            correoInstitucional: txt(leer(fila, idx, "correoInstitucional")),
            correoPersonal: mailParts.correoPersonal,
            correosPersonales: mailParts.correosPersonales,

            turnos: turnParts.turnos,
            turnosLista: turnParts.turnosLista,
            horarioInicio: txt(leer(fila, idx, "horarioInicio")),
            horarioTermino: txt(leer(fila, idx, "horarioTermino")),
            permanenciaDirectivo: txt(leer(fila, idx, "permanenciaDirectivo")),

            alumnosCenso: num(leer(fila, idx, "alumnosCenso")),
            docentesNombrados: nomb,
            docentesContratados: cont,
            directivosJerarquicos: dirJer,
            totalDocentes: totalDoc,
            docentesCenso: totalDoc, // Espejo por compatibilidad

            adminNombrados: num(leer(fila, idx, "adminNombrados")),
            adminContratados: num(leer(fila, idx, "adminContratados")),
            talleresCenso: num(leer(fila, idx, "talleresCenso")),

            programasDeclarados: num(leer(fila, idx, "programasDeclarados")),
            formacionContinuaDeclarada: num(leer(fila, idx, "formacionContinuaDeclarada")),
            personalDeclarado: num(leer(fila, idx, "personalDeclarado")),
            observaciones: txt(leer(fila, idx, "observaciones")),

            programas: [],
            modulosFormacionContinua: [],
            talleres: [],
            personal: [],
            ofertaFormativa: [],
            formacionContinua: [],

            _importacion: {
                archivo: meta.nombreArchivo || "DIRECTORIO_CETPRO_UGEL03.xlsx",
                formato: FORMATOS.CETPRO_V2,
                fila: r + 1,
                importadoEn: new Date().toISOString(),
                importadoPor: meta.userName || "Administrador AGEBATP",
            },
        };

        instituciones.push(inst);
        mapInst.set(kNombre, inst);
    }

    // ── Hoja PROGRAMAS DE ESTUDIO ──
    const hojaProg = buscarHoja(wb, HOJAS_CETPRO.programas);
    if (hojaProg) {
        const filas = filasDeHoja(hojaProg.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CETPRO_PROGRAMAS);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            const progNom = txt(leer(f, idxH, "programa"));
            if (!instNom || !progNom) continue;

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                inst.programas.push({
                    programa: progNom,
                    codigo: txt(leer(f, idxH, "codigo")),
                    nivelFormativo: txt(leer(f, idxH, "nivelFormativo")),
                    turnos: txt(leer(f, idxH, "turnos")),
                    docentes: num(leer(f, idxH, "docentes")),
                    estudiantes: num(leer(f, idxH, "estudiantes")),
                });
                inst.ofertaFormativa.push(progNom);
            } else {
                incidencias.push({ nivel: "aviso", codigo: "HUERFANO", mensaje: `Registro huérfano en PROGRAMAS (fila ${r + 1}): "${instNom}" no coincide con el directorio principal.` });
            }
        }
    }

    // ── Hoja FORMACIÓN CONTINUA (con filtro de artefactos D1) ──
    const hojaCont = buscarHoja(wb, HOJAS_CETPRO.continua);
    if (hojaCont) {
        const filas = filasDeHoja(hojaCont.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CETPRO_CONTINUA);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            const modNom = txt(leer(f, idxH, "modulo"));
            const obs = txt(leer(f, idxH, "observacion"));
            if (!instNom || !modNom) continue;

            // Filtro de artefacto D1: cabecera copiada en fila de datos
            const kMod = clave(modNom);
            const kObs = clave(obs);
            const esCabeceraModulo = kMod.includes("MODULO") && (kMod.includes("FORMACIONCONTINUA") || kMod.includes("CURSO"));
            const esCabeceraObs = kObs.includes("DOCENTEACARGO") || kObs.includes("OBSERVACIONESTADO");
            if (esCabeceraModulo || esCabeceraObs) {
                incidencias.push({ nivel: "info", codigo: "FILA_ARTEFACTO", mensaje: `Fila ${r + 1} de FORMACIÓN CONTINUA descartada por contener texto de cabecera duplicado.` });
                continue;
            }

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                inst.modulosFormacionContinua.push({ modulo: modNom, observacion: obs });
                inst.formacionContinua.push(modNom);
            } else {
                incidencias.push({ nivel: "aviso", codigo: "HUERFANO", mensaje: `Registro huérfano en FORMACIÓN CONTINUA (fila ${r + 1}): "${instNom}" no coincide con el directorio principal.` });
            }
        }
    }

    // ── Hoja TALLERES Y SEDES ──
    const hojaTall = buscarHoja(wb, HOJAS_CETPRO.talleres);
    if (hojaTall) {
        const filas = filasDeHoja(hojaTall.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CETPRO_TALLERES);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            const tipoSede = txt(leer(f, idxH, "tipoSede"));
            if (!instNom || !tipoSede) continue;

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                inst.talleres.push({
                    tipoSede,
                    sede: tipoSede, // Retrocompatibilidad
                    direccion: txt(leer(f, idxH, "direccion")),
                    turnos: txt(leer(f, idxH, "turnos")),
                    horario: txt(leer(f, idxH, "horario")),
                });
            } else {
                incidencias.push({ nivel: "aviso", codigo: "HUERFANO", mensaje: `Registro huérfano en TALLERES (fila ${r + 1}): "${instNom}" no coincide con el directorio principal.` });
            }
        }
    }

    // ── Hoja PERSONAL DOCENTE ──
    const hojaPersonal = buscarHoja(wb, HOJAS_CETPRO.personal);
    if (hojaPersonal) {
        const filas = filasDeHoja(hojaPersonal.ws);
        const idxH = indiceCabecera(filas[detectarFilaCabecera(filas)], COLS_CETPRO_PERSONAL);
        for (let r = detectarFilaCabecera(filas) + 1; r < filas.length; r++) {
            const f = filas[r];
            if (!f || f.length === 0) continue;
            const instNom = txt(leer(f, idxH, "institucion"));
            let nomComp = txt(leer(f, idxH, "nombreCompleto"));
            const dniVal = txt(leer(f, idxH, "dni"));
            const sitVal = txt(leer(f, idxH, "situacion"));
            if (!nomComp && (clave(dniVal) === "VACANTE" || clave(sitVal) === "VACANTE")) {
                nomComp = "VACANTE";
            }
            if (!instNom || !nomComp) continue;

            const inst = mapInst.get(clave(instNom));
            if (inst) {
                inst.personal.push({
                    nombreCompleto: nomComp,
                    dni: dniVal,
                    cargo: txt(leer(f, idxH, "cargo")),
                    situacion: sitVal,
                    programa: txt(leer(f, idxH, "programa")),
                    turno: txt(leer(f, idxH, "turno")),
                    observacion: txt(leer(f, idxH, "observacion")),
                });
            } else {
                incidencias.push({ nivel: "aviso", codigo: "HUERFANO", mensaje: `Registro huérfano en PERSONAL (fila ${r + 1}): "${instNom}" no coincide con el directorio principal.` });
            }
        }
    }

    // Post-procesamiento
    instituciones.forEach(inst => {
        inst.ofertaFormativaRaw = inst.ofertaFormativa.join("\n");
        inst.formacionContinuaRaw = inst.formacionContinua.join("\n");

        const sinResponsable = !inst.directorNombreCompleto;
        const sinAlumnos = inst.alumnosCenso === null;
        const sinCorreo = !inst.correoInstitucional;
        inst.fichaPendiente = sinResponsable && sinAlumnos && sinCorreo;

        if (inst.fichaPendiente) {
            incidencias.push({ nivel: "info", codigo: "FICHA_PENDIENTE", mensaje: `Institución sin ficha devuelta: ${inst.nombre}.`, institucion: inst.nombre });
        }
        if (!inst.codigoModular) {
            incidencias.push({ nivel: "aviso", codigo: "SIN_CODIGO_MODULAR", mensaje: `CETPRO sin código modular registrado: ${inst.nombre}. Se usará código de local como ID.`, institucion: inst.nombre });
        }
    });

    return {
        formato: FORMATOS.CETPRO_V2,
        instituciones,
        incidencias,
    };
}

/* ═══════════════════════════════════════════════════════════
   PARSERS LEGACY (Mapeados desde implementaciones previas)
   ═══════════════════════════════════════════════════════════ */

export function splitName(fullName) {
    return separarDirector(fullName);
}

export function parseDirectorioCEBA(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const fmt = detectarFormato(wb);

                if (fmt === FORMATOS.CEBA_V2) {
                    const res = parseDirectorioCebaV2(wb, { nombreArchivo: file.name });
                    resolve(res.instituciones);
                    return;
                }

                const isMega = wb.SheetNames.includes("PORTADA") || wb.SheetNames.some(name => /^\d+_/i.test(name));
                if (isMega) {
                    const cebas = [];
                    const sheetNames = wb.SheetNames.filter(name => 
                        !["PORTADA", "RESUMEN GENERAL", "GUÍA EBA", "GUÍA GENERAL", "GUÍA DE INCLUSIÓN", "CATÁLOGO DE PROGRAMAS"].includes(name.toUpperCase().trim())
                    );

                    sheetNames.forEach(sheetName => {
                        const ws = wb.Sheets[sheetName];
                        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                        if (rows.length < 15) return;

                        const val = (r, c) => (rows[r] && rows[r][c] !== undefined ? String(rows[r][c]).trim() : "");
                        const valNum = (r, c) => num(rows[r] && rows[r][c]);
                        const valBool = (r, c) => {
                            const s = val(r, c).toUpperCase();
                            return s === "SI" || s === "SÍ" || s === "S" || s === "X";
                        };

                        const rawName = val(0, 0);
                        const cleanName = rawName.trim();
                        const fullName = val(6, 3);
                        const nameParts = splitName(fullName);

                        const sedes = [];
                        let r = 24;
                        while (r < rows.length) {
                            const check = val(r, 0);
                            if (check.includes("3. DATOS ESTADÍSTICOS") || !val(r, 1)) break;
                            sedes.push({
                                tipoSede: val(r, 1),
                                sede: val(r, 1),
                                direccion: val(r, 2),
                                formaAtencion: val(r, 3),
                                dias: val(r, 4),
                                horario: val(r, 5)
                            });
                            r++;
                        }

                        cebas.push({
                            codigoModularInicialIntermedio: val(2, 3),
                            codigoModularAvanzado: val(3, 3),
                            codigoLocal: val(4, 3),
                            nombre: cleanName,
                            tipoGestion: val(5, 3),
                            directorNombreCompleto: fullName,
                            apellidoPaterno: nameParts.apellidoPaterno,
                            apellidoMaterno: nameParts.apellidoMaterno,
                            nombres: nameParts.nombres,
                            dni: val(7, 3),
                            cargo: val(8, 3),
                            celular: val(9, 3),
                            correoInstitucional: val(10, 3),
                            correoPersonal: val(11, 3),
                            direccion: val(12, 3),
                            distrito: val(13, 3),
                            turnos: val(14, 3),
                            cicloInicial: valBool(17, 3),
                            cicloIntermedio: valBool(18, 3),
                            cicloAvanzado: valBool(19, 3),
                            presencial: valBool(20, 3),
                            semipresencial: valBool(21, 3),
                            aDistancia: valBool(22, 3),
                            sedes,
                            alumnosInicial: valNum(26, 2),
                            alumnosIntermedio: valNum(26, 3),
                            alumnosAvanzado: valNum(26, 4),
                            alumnosCenso: valNum(26, 5),
                            docentesInicial: valNum(27, 2),
                            docentesIntermedio: valNum(27, 3),
                            docentesAvanzado: valNum(27, 4),
                            totalDocentes: valNum(27, 5) || null,
                            aulasInicial: valNum(28, 2),
                            aulasIntermedio: valNum(28, 3),
                            aulasAvanzado: valNum(28, 4),
                            cantidadPerifericos: valNum(29, 3),
                            apoyoIntermitenteLeve: valNum(32, 3),
                            apoyoContinuoModerado: valNum(33, 3),
                            apoyoIntensoSevero: valNum(34, 3),
                            totalInclusivos: valNum(35, 3),
                            porcentajeInclusion: val(36, 3),
                            observaciones: val(39, 0),
                            fichaPendiente: false,
                        });
                    });
                    resolve(cebas);
                } else {
                    const firstSheet = wb.Sheets[wb.SheetNames[0]];
                    const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
                    const startIdx = rawRows.findIndex(r => r && r[0] && String(r[0]).match(/^\d+$/));
                    if (startIdx === -1) {
                        resolve([]);
                        return;
                    }
                    const dataRows = rawRows.slice(startIdx);
                    const cebas = dataRows.map(r => {
                        const fullName = r[7] ? `${r[8] || ""} ${r[9] || ""}, ${r[10] || ""}`.trim() : "";
                        const nameParts = splitName(fullName);
                        return {
                            codigoLocal: String(r[1] || "").trim(),
                            codigoModularInicialIntermedio: String(r[2] || "").trim(),
                            codigoModularAvanzado: String(r[3] || "").trim(),
                            nombre: String(r[4] || "").trim(),
                            tipoGestion: String(r[5] || "").trim(),
                            distrito: String(r[6] || "").trim(),
                            direccion: String(r[15] || "").trim(),
                            directorNombreCompleto: fullName,
                            apellidoPaterno: nameParts.apellidoPaterno,
                            apellidoMaterno: nameParts.apellidoMaterno,
                            nombres: nameParts.nombres,
                            dni: String(r[11] || "").trim(),
                            cargo: String(r[7] || "").trim(),
                            celular: String(r[12] || "").trim(),
                            correoInstitucional: String(r[13] || "").trim(),
                            correoPersonal: String(r[14] || "").trim(),
                            turnos: String(r[16] || "").trim(),
                            alumnosCenso: num(r[21]) || null,
                            totalDocentes: num(r[25]) || null,
                            cantidadPerifericos: num(r[26]) || null,
                            observaciones: String(r[30] || "").trim() || null,
                            areas: [],
                            sedes: [],
                            personal: [],
                            atencionDistancia: null,
                            fichaPendiente: false,
                        };
                    }).filter(c => c.nombre);
                    resolve(cebas);
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function parseDirectorioCETPRO(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = new Uint8Array(ev.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const fmt = detectarFormato(wb);

                if (fmt === FORMATOS.CETPRO_V2) {
                    const res = parseDirectorioCetproV2(wb, { nombreArchivo: file.name });
                    resolve(res.instituciones);
                    return;
                }

                const isMega = wb.SheetNames.includes("PORTADA") || wb.SheetNames.some(name => /^\d+_/i.test(name));
                if (isMega) {
                    const cetpros = [];
                    const sheetNames = wb.SheetNames.filter(name => 
                        !["PORTADA", "RESUMEN GENERAL", "GUÍA DE INCLUSIÓN", "CATÁLOGO DE PROGRAMAS"].includes(name.toUpperCase().trim())
                    );

                    sheetNames.forEach(sheetName => {
                        const ws = wb.Sheets[sheetName];
                        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
                        if (rows.length < 15) return;

                        const val = (r, c) => (rows[r] && rows[r][c] !== undefined ? String(rows[r][c]).trim() : "");
                        const valNum = (r, c) => num(rows[r] && rows[r][c]);

                        const rawName = val(0, 0);
                        const cleanName = rawName.trim();
                        const fullName = val(6, 3);
                        const nameParts = splitName(fullName);

                        const programas = [];
                        let r = 34;
                        while (r < rows.length) {
                            const check = val(r, 0);
                            if (check.includes("TOTALES DEL CETPRO") || !val(r, 1)) break;
                            programas.push(val(r, 1));
                            r++;
                        }

                        let fcStart = -1;
                        for (let i = 40; i < rows.length; i++) {
                            if (val(i, 0).includes("FORMACIÓN CONTINUA")) {
                                fcStart = i + 2;
                                break;
                            }
                        }
                        const cursos = [];
                        if (fcStart !== -1) {
                            let idx = fcStart;
                            while (idx < rows.length) {
                                const check = val(idx, 0);
                                if (check.includes("5.  OBSERVACIONES") || !val(idx, 1)) break;
                                cursos.push(val(idx, 1));
                                idx++;
                            }
                        }

                        cetpros.push({
                            codigoModular: val(2, 3),
                            codigoLocal: val(3, 3),
                            nombre: cleanName,
                            tipoGestion: val(4, 3),
                            direccion: val(5, 3),
                            distrito: val(5, 7),
                            directorNombreCompleto: fullName,
                            apellidoPaterno: nameParts.apellidoPaterno,
                            apellidoMaterno: nameParts.apellidoMaterno,
                            nombres: nameParts.nombres,
                            dni: val(7, 3),
                            cargo: val(8, 3),
                            celular: val(9, 3),
                            telefonoInstitucional: val(9, 7),
                            correoInstitucional: val(10, 3),
                            correoPersonal: val(11, 3),
                            turnos: val(12, 3),
                            permanenciaDirectivo: val(13, 3),
                            alumnosCenso: valNum(18, 5),
                            docentesNombrados: valNum(19, 2),
                            docentesContratados: valNum(19, 3),
                            directivosJerarquicos: valNum(19, 4),
                            totalDocentes: valNum(19, 5) || null,
                            docentesCenso: valNum(19, 5) || null,
                            adminNombrados: valNum(20, 2),
                            adminContratados: valNum(20, 3),
                            talleresCenso: valNum(21, 3),
                            ofertaFormativa: programas,
                            ofertaFormativaRaw: programas.join("\n"),
                            formacionContinua: cursos,
                            formacionContinuaRaw: cursos.join("\n"),
                            observaciones: val(fcStart !== -1 ? fcStart + cursos.length + 3 : 55, 0),
                            programas: programas.map(p => ({ programa: p })),
                            modulosFormacionContinua: cursos.map(c => ({ modulo: c })),
                            talleres: [],
                            personal: [],
                            fichaPendiente: false,
                        });
                    });
                    resolve(cetpros);
                } else {
                    const firstSheet = wb.Sheets[wb.SheetNames[0]];
                    const rawRows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" });
                    const startIdx = rawRows.findIndex(r => r && r[0] && String(r[0]).match(/^\d+$/));
                    if (startIdx === -1) {
                        resolve([]);
                        return;
                    }
                    const dataRows = rawRows.slice(startIdx);
                    const cetpros = dataRows.map(r => {
                        const fullName = String(r[7] || "").trim();
                        const nameParts = splitName(fullName);
                        return {
                            codigoLocal: String(r[1] || "").trim(),
                            codigoModular: String(r[2] || "").trim(),
                            nombre: String(r[3] || "").trim(),
                            tipoGestion: String(r[4] || "").trim(),
                            distrito: String(r[5] || "").trim(),
                            direccion: String(r[6] || "").trim(),
                            directorNombreCompleto: fullName,
                            apellidoPaterno: nameParts.apellidoPaterno,
                            apellidoMaterno: nameParts.apellidoMaterno,
                            nombres: nameParts.nombres,
                            dni: String(r[8] || "").trim(),
                            cargo: String(r[9] || "").trim(),
                            celular: String(r[10] || "").trim(),
                            telefonoInstitucional: String(r[11] || "").trim(),
                            correoInstitucional: String(r[12] || "").trim(),
                            correoPersonal: String(r[13] || "").trim(),
                            turnos: String(r[14] || "").trim(),
                            alumnosCenso: num(r[18]) || null,
                            totalDocentes: num(r[22]) || null,
                            docentesCenso: num(r[22]) || null,
                            talleresCenso: num(r[25]) || null,
                            observaciones: String(r[29] || "").trim() || null,
                            programas: [],
                            modulosFormacionContinua: [],
                            talleres: [],
                            personal: [],
                            ofertaFormativa: [],
                            formacionContinua: [],
                            fichaPendiente: false,
                        };
                    }).filter(c => c.nombre);
                    resolve(cetpros);
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}
