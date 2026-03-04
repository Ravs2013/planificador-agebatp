import { useState } from 'react';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { API } from '../api/endpoints';
import { STAFF } from '../data/constants';

export default function MeetingRequest({ onToast }) {
    const { user, isRole } = useAuth();
    const [activeView, setActiveView] = useState('solicitar');
    const [form, setForm] = useState({ nombre: '', telefono: '', email: '', cargo: '', institucion: '', fecha: '', hora: '', motivo: '', personal_id: '', comentario: '' });
    const [loading, setLoading] = useState(false);
    const [solicitudes, setSolicitudes] = useState([]);
    const [respondLoading, setRespondLoading] = useState(null);

    const upd = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
    const fieldStyle = { width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #D6DCE8', fontSize: 13, fontFamily: "'DM Sans'" };
    const labelStyle = { fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.6 };

    const handleSolicitar = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.fecha || !form.hora || !form.motivo || !form.personal_id) {
            onToast('Complete los campos obligatorios', 'error'); return;
        }
        setLoading(true);
        try {
            const result = await API.solicitarReunion(form);
            if (result.success) {
                onToast('Solicitud de reunion registrada. El personal sera notificado.', 'success');
                if (result.tiene_conflicto) {
                    onToast('Advertencia: el personal tiene actividades programadas en esa fecha.', 'info');
                }
                setSolicitudes(prev => [...prev, { ...form, reunion_id: result.reunion_id, estado: 'pendiente', tiene_conflicto: result.tiene_conflicto }]);
                setForm({ nombre: '', telefono: '', email: '', cargo: '', institucion: '', fecha: '', hora: '', motivo: '', personal_id: '', comentario: '' });
            } else {
                onToast('Error al enviar la solicitud', 'error');
            }
        } catch { onToast('Error de conexion con el servidor', 'error'); }
        setLoading(false);
    };

    const handleResponder = async (reunion_id, decision) => {
        const comentario = prompt(decision === 'aceptada' ? 'Comentario (opcional):' : 'Motivo del rechazo:') || '';
        setRespondLoading(reunion_id);
        try {
            await API.responderReunion(reunion_id, decision, comentario, user?.nombre || 'Admin');
            setSolicitudes(prev => prev.map(s => s.reunion_id === reunion_id ? { ...s, estado: decision, comentario_admin: comentario } : s));
            onToast(`Reunion ${decision}`, 'success');
        } catch { onToast('Error al responder', 'error'); }
        setRespondLoading(null);
    };

    const canApprove = isRole('admin') || isRole('personal');

    return (
        <div>
            {canApprove && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                    {[{ key: 'solicitar', label: 'Solicitar Reunion' }, { key: 'aprobar', label: 'Solicitudes Pendientes' }].map(t => (
                        <button key={t.key} onClick={() => setActiveView(t.key)}
                            style={{ padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: `1px solid ${activeView === t.key ? '#1B3A5C' : '#D6DCE8'}`, background: activeView === t.key ? '#1B3A5C' : '#FFFFFF', color: activeView === t.key ? '#FFFFFF' : '#475569', fontFamily: "'DM Sans'" }}>
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {activeView === 'solicitar' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }} className="grid-calendar">
                    <div style={{ background: '#FFFFFF', border: '1px solid #D6DCE8', borderRadius: 8, padding: 24, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#122240', textTransform: 'uppercase', letterSpacing: 0.6, paddingBottom: 14, marginBottom: 16, borderBottom: '2px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name="calendar" size={16} color="#1E4D7B" /> Formulario de Solicitud de Reunion
                        </div>
                        <form onSubmit={handleSolicitar}>
                            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Nombre Completo *</label><input value={form.nombre} onChange={e => upd('nombre', e.target.value)} placeholder="Nombre y apellidos del solicitante" style={fieldStyle} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div><label style={labelStyle}>Cargo</label><input value={form.cargo} onChange={e => upd('cargo', e.target.value)} placeholder="Director, Coordinador..." style={fieldStyle} /></div>
                                <div><label style={labelStyle}>Institucion</label><input value={form.institucion} onChange={e => upd('institucion', e.target.value)} placeholder="I.E., UGEL, DRE..." style={fieldStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div><label style={labelStyle}>Telefono</label><input value={form.telefono} onChange={e => upd('telefono', e.target.value)} placeholder="51999999999" style={fieldStyle} /></div>
                                <div><label style={labelStyle}>Correo Electronico</label><input type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="correo@institucion.gob.pe" style={fieldStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                <div><label style={labelStyle}>Fecha Propuesta *</label><input type="date" value={form.fecha} onChange={e => upd('fecha', e.target.value)} style={fieldStyle} /></div>
                                <div><label style={labelStyle}>Hora Propuesta *</label><input type="time" value={form.hora} onChange={e => upd('hora', e.target.value)} style={fieldStyle} /></div>
                            </div>
                            <div style={{ marginBottom: 14 }}>
                                <label style={labelStyle}>Personal con quien desea reunirse *</label>
                                <select value={form.personal_id} onChange={e => upd('personal_id', e.target.value)} style={fieldStyle}>
                                    <option value="">Seleccione personal</option>
                                    {STAFF.map(s => <option key={s.id} value={s.id}>{s.name} - {s.role}</option>)}
                                </select>
                            </div>
                            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Motivo de la Reunion *</label><textarea value={form.motivo} onChange={e => upd('motivo', e.target.value)} placeholder="Describa el motivo de la reunion" style={{ ...fieldStyle, minHeight: 80, resize: 'vertical' }} /></div>
                            <div style={{ marginBottom: 18 }}><label style={labelStyle}>Comentario Adicional</label><input value={form.comentario} onChange={e => upd('comentario', e.target.value)} placeholder="Informacion adicional (opcional)" style={fieldStyle} /></div>
                            <button type="submit" disabled={loading} style={{ padding: '12px 24px', borderRadius: 6, border: 'none', background: '#1B3A5C', color: '#FFFFFF', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                                {loading ? <span className="spinner" /> : <><Icon name="calendar" size={15} color="#fff" /> Enviar Solicitud</>}
                            </button>
                        </form>
                    </div>

                    <div style={{ background: '#FFFFFF', border: '1px solid #D6DCE8', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#122240', textTransform: 'uppercase', letterSpacing: 0.6, paddingBottom: 14, marginBottom: 16, borderBottom: '2px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Icon name="activity" size={16} color="#1E4D7B" /> Instrucciones
                        </div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 2 }}>
                            <div>1. Complete el formulario con sus datos de contacto</div>
                            <div>2. Seleccione al personal con quien desea reunirse</div>
                            <div>3. Proponga una fecha y hora disponible</div>
                            <div>4. Describa el motivo de la reunion</div>
                            <div>5. El personal sera notificado por WhatsApp</div>
                            <div>6. Recibira confirmacion de aceptacion o rechazo</div>
                        </div>
                        <div style={{ marginTop: 16, padding: 12, background: '#F0F9FF', border: '1px solid #DBEAFE', borderRadius: 6, fontSize: 11, color: '#1E4D7B', fontWeight: 500 }}>
                            Horario de atencion: Lunes a Viernes, 08:00 - 17:00 hrs.
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'aprobar' && canApprove && (
                <div style={{ background: '#FFFFFF', border: '1px solid #D6DCE8', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#122240', textTransform: 'uppercase', letterSpacing: 0.6, paddingBottom: 14, marginBottom: 16, borderBottom: '2px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon name="list" size={16} color="#1E4D7B" /> Solicitudes de Reunion
                    </div>
                    {solicitudes.filter(s => s.estado === 'pendiente').length === 0 && (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 13 }}>No hay solicitudes pendientes en esta sesion.</div>
                    )}
                    {solicitudes.filter(s => s.estado === 'pendiente').map((s, i) => (
                        <div key={i} style={{ border: '1px solid #D6DCE8', borderLeft: s.tiene_conflicto ? '4px solid #B91C1C' : '4px solid #1E4D7B', borderRadius: 6, padding: 16, marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 8 }}>
                                <div>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#1E4D7B', fontWeight: 600 }}>{s.reunion_id}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#122240', marginTop: 4 }}>{s.nombre}</div>
                                    <div style={{ fontSize: 12, color: '#64748B' }}>{s.cargo} - {s.institucion}</div>
                                </div>
                                {s.tiene_conflicto && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>Conflicto de horario</span>}
                            </div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: '#64748B' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={11} /> {s.fecha}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} /> {s.hora}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="phone" size={11} /> {s.telefono}</span>
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 8 }}><strong>Motivo:</strong> {s.motivo}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button onClick={() => handleResponder(s.reunion_id, 'aceptada')} disabled={respondLoading === s.reunion_id}
                                    style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #15803D', background: '#F0FDF4', color: '#15803D', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Icon name="check" size={13} color="#15803D" /> Aceptar
                                </button>
                                <button onClick={() => handleResponder(s.reunion_id, 'rechazada')} disabled={respondLoading === s.reunion_id}
                                    style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #B91C1C', background: '#FEF2F2', color: '#B91C1C', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Icon name="x" size={13} color="#B91C1C" /> Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
