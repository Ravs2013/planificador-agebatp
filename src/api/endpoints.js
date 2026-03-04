/* ════════════════════════════════════════════════════════════════
   API Endpoints — Conexion real a N8N via Webhooks de Produccion
   AGEBATP — UGEL 03
   ════════════════════════════════════════════════════════════════ */

const API_BASE = 'https://ravsbot-n8n.xv74e4.easypanel.host/webhook';

async function request(endpoint, data) {
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        return await res.json();
    } catch (error) {
        console.error(`Error en ${endpoint}:`, error);
        throw error;
    }
}

export const API = {
    /** Login de usuario — retorna token + rol + permisos */
    login: (email, password) =>
        request('agebatp-auth-login', { email, password }),

    /** Registro de usuario publico */
    register: (data) =>
        request('agebatp-auth-register', data),

    /** Crear nueva actividad — guarda en Sheets y notifica por WhatsApp */
    crearActividad: (data) =>
        request('agebatp-nueva-actividad', {
            id: data.id || `ACT-${Date.now()}`,
            title: data.title,
            type: data.type,
            date: data.date,
            endDate: data.endDate || data.date,
            time: data.time,
            location: data.location,
            priority: data.priority,
            description: data.description,
            assigned: JSON.stringify(data.assigned || []),
            actions: data.actions || [],
            created_by: data.created_by || 'Sistema'
        }),

    /** Solicitar reunion (usuario publico) */
    solicitarReunion: (data) =>
        request('agebatp-solicitar-reunion', {
            nombre: data.nombre,
            telefono: data.telefono,
            email: data.email,
            cargo: data.cargo,
            institucion: data.institucion,
            fecha: data.fecha,
            hora: data.hora,
            motivo: data.motivo,
            personal_id: data.personal_id,
            comentario: data.comentario || ''
        }),

    /** Responder solicitud de reunion (admin/personal) */
    responderReunion: (reunion_id, decision, comentario, respondido_por) =>
        request('agebatp-responder-reunion', {
            reunion_id,
            decision,
            comentario,
            respondido_por
        }),

    /** Crear estructura de carpetas en Google Drive y OneDrive */
    crearCarpetasDrive: (year) =>
        request('agebatp-crear-carpetas-drive', { year: year || new Date().getFullYear().toString() })
};
