/* ═══════════════════════════════════════════════════════════
   DIRECTORIO FORMATO — UTILIDADES DE RENDERIZADO Y METRICAS
   AGEBATP UGEL 03
   ═══════════════════════════════════════════════════════════ */

/** Determina si existe un dato valido (no nulo, no indefinido, no vacio). El numero 0 si es dato. */
export function hayDato(v) {
    if (v === null || v === undefined) return false;
    if (typeof v === "string") return v.trim() !== "";
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "number") return Number.isFinite(v);
    return true;
}

/** Metrica visible para baldosas y KPIs: hay dato y es estrictamente mayor que cero. */
export function metricaVisible(v) {
    return hayDato(v) && Number(v) > 0;
}

/** Formatea un numero para visualizacion en la interfaz o retorna null si no hay dato. */
export function fmt(v) {
    return hayDato(v) ? Number(v).toLocaleString("es-PE") : null;
}

/** Convierte valores de formulario a numero o null. Preserva el 0 explicito y descarta cadenas vacias. */
export function numeroFormulario(v) {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
}

/** Retorna la metadata visual del tipo de gestion institucional (3 estados + sin dato). */
export function gestionMeta(tipoGestion) {
    if (!tipoGestion) return { etiqueta: "SIN DATO", bg: "#F1F5F9", color: "#64748B", borde: "#E2E8F0" };
    const t = String(tipoGestion)
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Z0-9]/gi, "")
        .toUpperCase();

    if (t.includes("PARROQUIAL")) {
        return { etiqueta: "PARROQUIAL", bg: "#EEF2FF", color: "#4338CA", borde: "#C7D2FE" };
    }
    if (t.includes("CONVENIO")) {
        return { etiqueta: "CONVENIO", bg: "#FFFBEB", color: "#B45309", borde: "#FDE68A" };
    }
    if (t.includes("ESTATAL")) {
        return { etiqueta: "ESTATAL", bg: "#F0FDF4", color: "#15803D", borde: "#BBF7D0" };
    }
    return { etiqueta: "SIN DATO", bg: "#F1F5F9", color: "#64748B", borde: "#E2E8F0" };
}

/** Obtiene el nombre formateado del director a partir del objeto institucional. */
export function nombreDirector(d) {
    if (!d) return null;
    if (d.directorNombreCompleto && String(d.directorNombreCompleto).trim()) {
        return String(d.directorNombreCompleto).trim();
    }
    const nombres = [d.nombres, d.apellidoPaterno, d.apellidoMaterno].filter(Boolean).join(" ");
    return nombres.trim() || null;
}

/** Calcula el resumen de personal por situacion contractual ordenado descendentemente. */
export function resumenSituacionPersonal(personal = []) {
    if (!Array.isArray(personal) || personal.length === 0) return [];
    const conteos = {};
    personal.forEach((p) => {
        const sit = (p.situacion && String(p.situacion).trim()) || "Sin especificar";
        conteos[sit] = (conteos[sit] || 0) + 1;
    });
    return Object.entries(conteos)
        .map(([situacion, cantidad]) => ({ situacion, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
}

/** Obtiene la paleta para chips de situacion laboral. */
export function situacionBadgeStyle(situacion) {
    const s = String(situacion || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

    if (s.includes("NOMBRADO")) return { bg: "#F0FDF4", color: "#15803D", borde: "#BBF7D0" };
    if (s.includes("CONTRATADO")) return { bg: "#FFFBEB", color: "#B45309", borde: "#FDE68A" };
    if (s.includes("DESIGNADO")) return { bg: "#EEF2FF", color: "#4338CA", borde: "#C7D2FE" };
    if (s.includes("ENCARGADO")) return { bg: "#F0FDFA", color: "#0F766E", borde: "#99F6E4" };
    if (s.includes("VACANTE")) return { bg: "#FEF2F2", color: "#B91C1C", borde: "#FECACA" };
    if (s.includes("DESTACADO")) return { bg: "#FAF5FF", color: "#7C3AED", borde: "#E9D5FF" };
    return { bg: "#F1F5F9", color: "#64748B", borde: "#E2E8F0" };
}

/** Genera texto de cobertura para subtitulos de graficos. */
export function cobertura(lista = [], campo = "alumnosCenso", concepto = "matricula reportada") {
    const total = lista.length;
    const conDato = lista.filter((item) => metricaVisible(item[campo])).length;
    return `${conDato} de ${total} instituciones con ${concepto}`;
}
