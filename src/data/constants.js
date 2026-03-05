/* ═══ Shared Data & Configuration ═══ */

export const STAFF = [
    { id: 1, name: "Liz Miluska Gutierrez Silva", role: "Especialista ETP", phone: "51987654321", email: "lgutierrez@ugel03.gob.pe", initials: "LG" },
    { id: 2, name: "Juan Alberto Quispe Solano", role: "Especialista ETP", phone: "51976543210", email: "jquispe@ugel03.gob.pe", initials: "JQ" },
    { id: 3, name: "Nelida Albino Igreda", role: "Especialista EBA", phone: "51965432109", email: "nalbino@ugel03.gob.pe", initials: "NA" },
    { id: 4, name: "Francisco Villalobos Gonzales", role: "Especialista ETP", phone: "51954321098", email: "fvillalobos@ugel03.gob.pe", initials: "FV" },
    { id: 5, name: "Lucy Ana Vasquez Aliaga", role: "Especialista EBA", phone: "51943210987", email: "lvasquez@ugel03.gob.pe", initials: "LV" },
    { id: 6, name: "Beronica Olinda Cuellar Cornelio", role: "Especialista ETP", phone: "51932109876", email: "bcuellar@ugel03.gob.pe", initials: "BC" },
    { id: 7, name: "Rosa Isabel Ninamango Baldeon", role: "Secretaria", phone: "51921098765", email: "rninamango@ugel03.gob.pe", initials: "RN" },
    { id: 8, name: "Ricardo Alejandro Viera Suarez", role: "Sistemas", phone: "51917349479", email: "perumaster201@gmail.com", initials: "RV" },
];

/* ═══ Expedientes — ahora se cargan desde Google Sheets (no hardcoded) ═══ */

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

/** Formatea fecha ISO YYYY-MM-DD a DD/MM/YYYY */
export function formatDateDMY(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

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
