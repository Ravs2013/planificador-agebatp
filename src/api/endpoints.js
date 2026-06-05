/* ════════════════════════════════════════════════════════════════
   API Endpoints — Notificaciones y Webhooks en N8N
   AGEBATP — UGEL 03
   ════════════════════════════════════════════════════════════════ */

const API_BASE = import.meta.env.VITE_N8N_BASE_URL || 'https://ravsbot-n8n.xv74e4.easypanel.host/webhook';
const WEBHOOK_TOKEN = import.meta.env.VITE_N8N_WEBHOOK_TOKEN || '';

async function request(endpoint, data, method = 'POST') {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (WEBHOOK_TOKEN) {
            headers['X-Webhook-Token'] = WEBHOOK_TOKEN;
        }
        const opts = {
            method,
            headers,
        };
        if (method === 'POST' && data) {
            opts.body = JSON.stringify(data);
        }
        const res = await fetch(`${API_BASE}/${endpoint}`, opts);
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch {
            console.warn(`Non-JSON response from ${endpoint}:`, text.substring(0, 200));
            return { success: false, message: text.substring(0, 200) };
        }
    } catch (error) {
        console.error(`Error en Webhook ${endpoint}:`, error);
        return { success: false, error: error.message };
    }
}

export const API = {
    /** Notificar creación de nueva actividad (WhatsApp + Outlook) */
    notificarNuevaActividad: (data) =>
        request('agebatp-nueva-actividad', {
            id: data.id,
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
            created_by: data.created_by || 'Sistema',
            attachments: data.attachments || []
        }),

    /** Solicitar reunión y enviar alerta al especialista */
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
            jefatura_id: data.jefatura_id || data.secretaria_id || ''
        }),

    /** Responder reunión y notificar al solicitante */
    responderReunion: (reunion_id, decision, comentario, respondido_por, personal_asignado) =>
        request('agebatp-responder-reunion', {
            reunion_id,
            decision,
            comentario,
            respondido_por,
            personal_asignado
        }),

    /** Notificar credenciales a nuevo personal */
    notificarNuevoPersonal: (data) =>
        request('agebatp-agregar-personal', {
            id: data.id,
            nombre: data.name || data.nombre,
            rol: data.role || data.rol,
            telefono: data.phone || data.telefono || '',
            email: data.email || '',
            contrasena: data.contrasena || data.password || ''
        }),

    /** Webhook para eliminar personal (notificación/limpieza) */
    eliminarPersonal: (id) =>
        request('agebatp-eliminar-personal', { id }),

    /** Crear estructura de carpetas en Google Drive / OneDrive */
    crearCarpetasDrive: (year) =>
        request('agebatp-crear-carpetas-drive', { year: year || new Date().getFullYear().toString() }),

    /** Subir evidencia a Drive/OneDrive vía n8n (fallback si no se usa Firebase Storage) */
    subirEvidencia: (actividadId, personalId, file) =>
        request('agebatp-subir-evidencia', {
            actividad_id: actividadId,
            personal_id: personalId,
            filename: file.name,
            mimeType: file.mimeType,
            base64: file.base64
        }),

    /** Notificar reclamo o queja en Libro de Reclamaciones */
    notificarReclamacion: (data) =>
        request('agebatp-reclamacion', {
            codigo: data.codigo,
            nombreCompleto: data.nombreCompleto,
            documentoTipo: data.documentoTipo,
            documentoNumero: data.documentoNumero,
            telefono: data.telefono,
            email: data.email,
            direccion: data.direccion,
            esMenor: data.esMenor,
            representanteNombre: data.representanteNombre || '',
            representanteDocumento: data.representanteDocumento || '',
            tipo: data.tipo,
            detalle: data.detalle,
            pedido: data.pedido,
            fecha: data.fecha
        })
};
