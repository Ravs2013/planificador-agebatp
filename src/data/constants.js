/* ═══ Shared Data & Configuration ═══ */

export const STAFF = [
    { id: 1, name: "Liz Miluska Gutierrez Silva", role: "Especialista ETP", phone: "51987654321", email: "lgutierrez@ugel03.gob.pe", initials: "LG" },
    { id: 2, name: "Juan Alberto Quispe Solano", role: "Especialista ETP", phone: "51976543210", email: "jquispe@ugel03.gob.pe", initials: "JQ" },
    { id: 3, name: "Nelida Albino Igreda", role: "Especialista EBA", phone: "51965432109", email: "nalbino@ugel03.gob.pe", initials: "NA" },
    { id: 4, name: "Francisco Villalobos Gonzales", role: "Especialista ETP", phone: "51954321098", email: "fvillalobos@ugel03.gob.pe", initials: "FV" },
    { id: 5, name: "Lucy Ana Vasquez Aliaga", role: "Especialista EBA", phone: "51943210987", email: "lvasquez@ugel03.gob.pe", initials: "LV" },
    { id: 6, name: "Beronica Olinda Cuellar Cornelio", role: "Especialista ETP", phone: "51932109876", email: "bcuellar@ugel03.gob.pe", initials: "BC" },
    { id: 7, name: "Rosa Isabel Ninamango Baldeon", role: "Secretaria", phone: "51921098765", email: "rninamango@ugel03.gob.pe", initials: "RN" },
];

export const INITIAL_ACTIVITIES = [
    { id: 1, title: "Buen Inicio del Ano Escolar 2026", type: "estrategica", date: "2026-03-16", endDate: "2026-03-16", time: "08:00 - 17:00", location: "Instituciones Educativas - UGEL 03", priority: "alta", status: "pendiente", progress: 0, assigned: [1, 2, 3, 4, 5, 6], description: "Supervision y acompanamiento del inicio del ano escolar en las II.EE. del ambito de la UGEL 03.", actions: ["Verificar condiciones de infraestructura en II.EE.", "Reportar incidencias al area correspondiente", "Acompanar a directivos en jornada de acogida"] },
    { id: 2, title: "Reunion Estrategias FORT - REI - EBA", type: "reunion", date: "2026-03-18", endDate: "2026-03-18", time: "08:30 - 13:00", location: "UGEL 06", priority: "alta", status: "pendiente", progress: 0, assigned: [1, 3, 5], description: "Reunion de coordinacion sobre estrategias de fortalecimiento, redes educativas institucionales y educacion basica alternativa.", actions: ["Preparar informes tecnicos previos", "Llevar material de trabajo institucional", "Registrar acuerdos y compromisos"] },
    { id: 3, title: "Asistencia Tecnica Directivos EBA", type: "asistencia_tecnica", date: "2026-03-25", endDate: "2026-03-25", time: "14:30 - 17:30", location: "San Francisco de Sales", priority: "media", status: "pendiente", progress: 0, assigned: [3, 5], description: "Asistencia tecnica dirigida a directivos de Educacion Basica Alternativa.", actions: ["Elaborar material de asistencia tecnica", "Coordinar logistica con directivos EBA", "Elaborar informe posterior a la A.T."] },
];

/* ═══ Expedientes con fechas reales — dias se calculan dinamicamente ═══ */

/** Calcula dias restantes desde hoy hasta la fecha de vencimiento */
export function calcularDiasRestantes(fechaVencimientoISO) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const venc = new Date(fechaVencimientoISO);
    venc.setHours(0, 0, 0, 0);
    return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
}

/** Parsea fecha DD/MM/YYYY a ISO YYYY-MM-DD */
export function parseFechaDMY(fechaDMY) {
    if (!fechaDMY) return null;
    const parts = fechaDMY.split('/');
    if (parts.length !== 3) return fechaDMY;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

export const EXPEDIENTES_POR_VENCER = [
    { id: "EAP2026-INT-0088100", especialista: "Liz Miluska Gutierrez Silva", oficina: "ARH", fechaIngreso: "2026-01-22", fechaVencimiento: "2026-03-05", plazo: 30, asunto: "Comunica personal de apoyo" },
    { id: "MPD2026-EXT-0101527", especialista: "Juan Alberto Quispe Solano", oficina: "MPT", fechaIngreso: "2026-01-26", fechaVencimiento: "2026-03-09", plazo: 30, asunto: "Informo continuidad de modulos del ciclo" },
];

export const EXPEDIENTES_EN_PLAZO = [
    { id: "MPD2026-EXT-0113171", especialista: "FBRC UGEL03", oficina: "AGEBATP", fechaVencimiento: "2026-03-11", asunto: "Solicito autorizacion para ofertar programas" },
    { id: "ESP-EBR-EBE2026-INT-0091471", especialista: "Juan Alberto Quispe Solano", oficina: "DIR", fechaVencimiento: "2026-03-12", asunto: "Aprobacion conformacion de la estructura" },
    { id: "AGEBATP2026-INT-0011486", especialista: "Liz Miluska Gutierrez Silva", oficina: "NE", fechaVencimiento: "2026-03-13", asunto: "Se eleva a consideracion de la DRELM" },
    { id: "MPD2026-EXT-0135097", especialista: "Juan Alberto Quispe Solano", oficina: "MPT", fechaVencimiento: "2026-03-17", asunto: "Remito DNI, RD y correo del director" },
    { id: "MPD2026-EXT-0141871", especialista: "Francisco Villalobos Gonzales", oficina: "MPT", fechaVencimiento: "2026-03-18", asunto: "Solicita aprobacion de modulos basico 2025" },
];

export const EXPEDIENTES_ELABORACION = [
    { id: "AGEBATP2026-INT-0199203", especialista: "Liz Miluska Gutierrez Silva", oficina: "AGEBATP", asunto: "Documento en elaboracion" },
    { id: "AGEBATP2026-INT-0242953", especialista: "Lucy Ana Vasquez Aliaga", oficina: "AGEBATP", asunto: "Solicito apoyo como facilitador en la asistencia" },
    { id: "AGEBATP2026-INT-0253365", especialista: "Liz Miluska Gutierrez Silva", oficina: "AGEBATP", asunto: "Remite informe detallado sobre trabajo" },
];

export const priorityConfig = {
    alta: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA", label: "ALTA" },
    media: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A", label: "MEDIA" },
    baja: { color: "#15803D", bg: "#F0FDF4", border: "#BBF7D0", label: "BAJA" }
};

export const statusConfig = {
    pendiente: { color: "#64748B", bg: "#F1F5F9", label: "Pendiente" },
    en_proceso: { color: "#1D4ED8", bg: "#EFF6FF", label: "En Proceso" },
    completado: { color: "#15803D", bg: "#F0FDF4", label: "Completado" },
    retrasado: { color: "#B91C1C", bg: "#FEF2F2", label: "Retrasado" }
};

export const typeConfig = {
    estrategica: { color: "#7C3AED", bg: "#F5F3FF", label: "Accion Estrategica" },
    reunion: { color: "#0369A1", bg: "#F0F9FF", label: "Reunion" },
    asistencia_tecnica: { color: "#C2410C", bg: "#FFF7ED", label: "Asistencia Tecnica" },
    monitoreo: { color: "#0F766E", bg: "#F0FDFA", label: "Monitoreo" },
    gestion: { color: "#4338CA", bg: "#EEF2FF", label: "Gestion Documentaria" }
};

export const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
export const dayNames = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

export function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
export function getFirstDayOfMonth(y, m) { return new Date(y, m, 1).getDay(); }
export function fmtDate(y, m, d) { return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
export function todayStr() {
    const d = new Date();
    return fmtDate(d.getFullYear(), d.getMonth(), d.getDate());
}
