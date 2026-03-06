/* ════════════════════════════════════════════════════════════════
   API Endpoints — Conexion real a N8N via Webhooks de Produccion
   AGEBATP — UGEL 03
   ════════════════════════════════════════════════════════════════ */

const API_BASE = 'https://ravsbot-n8n.xv74e4.easypanel.host/webhook';

async function request(endpoint, data, method = 'POST') {
    try {
        const opts = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (method === 'POST' && data) {
            opts.body = JSON.stringify(data);
        }
        const res = await fetch(`${API_BASE}/${endpoint}`, opts);
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch {
            // N8N sometimes returns non-JSON (HTML error pages)
            console.warn(`Non-JSON response from ${endpoint}:`, text.substring(0, 200));
            return { success: false, message: text.substring(0, 200) };
        }
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

    /** Listar actividades desde Google Sheets */
    listarActividades: () =>
        request('agebatp-listar-actividades', null, 'GET'),

    /** Listar expedientes desde Google Sheets */
    listarExpedientes: () =>
        request('agebatp-listar-expedientes', null, 'GET'),

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
            personal_asignado: data.personal_asignado,
            comentario: data.descripcion || data.comentario || '',
            descripcion: data.descripcion || '',
            secretaria_id: data.secretaria_id || ''
        }),

    /** Responder solicitud de reunion (admin/personal) */
    responderReunion: (reunion_id, decision, comentario, respondido_por) =>
        request('agebatp-responder-reunion', {
            reunion_id,
            decision,
            comentario,
            respondido_por
        }),

    /** Agregar personal administrativo (admin only) */
    agregarPersonal: (data) =>
        request('agebatp-agregar-personal', {
            id: data.id,
            nombre: data.name,
            rol: data.role,
            telefono: data.phone || '',
            email: data.email || ''
        }),

    /** Eliminar personal (admin only) */
    eliminarPersonal: (id) =>
        request('agebatp-eliminar-personal', { id }),

    /** Agregar expediente */
    agregarExpediente: (data) =>
        request('agebatp-agregar-expediente', {
            id: data.id || `EXP-${Date.now()}`,
            asunto: data.asunto,
            especialista: data.especialista,
            oficina: data.oficina,
            categoria: data.categoria,
            fechaVencimiento: data.fechaVencimiento || '',
            origen: data.origen || ''
        }),

    /** Listar reuniones/solicitudes (para panel publico) */
    listarReuniones: () =>
        request('agebatp-listar-reuniones', null, 'GET'),

    /** Crear estructura de carpetas en Google Drive y OneDrive */
    crearCarpetasDrive: (year) =>
        request('agebatp-crear-carpetas-drive', { year: year || new Date().getFullYear().toString() })
};
