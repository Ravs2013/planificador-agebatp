import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { API } from './api/endpoints';
import Icon from './components/Icon';
import QRCode from './components/QRCode';
import LoginScreen from './components/LoginScreen';
import MeetingRequest from './components/MeetingRequest';
import MonitoreoModule from './components/MonitoreoModule';
import FileAttachment from './components/FileAttachment';
import { STAFF, calcularDiasRestantes, formatDateDMY, priorityConfig, statusConfig, typeConfig, monthNames, dayNames, getDaysInMonth, getFirstDayOfMonth, fmtDate, todayStr } from './data/constants';
import { calcularSLA } from './utils/slaCalculator';

export default function App() {
    const { user, logout, isRole } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [activities, setActivities] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [activeTab, setActiveTab] = useState('calendario');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [staffFilter, setStaffFilter] = useState('todos');
    const [viewExpedientes, setViewExpedientes] = useState('vencer');
    const [toasts, setToasts] = useState([]);
    const [addLoading, setAddLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [newStaffForm, setNewStaffForm] = useState({ name: '', role: '', phone: '', email: '', password: '' });
    const [showAddExpediente, setShowAddExpediente] = useState(false);
    const [newExpediente, setNewExpediente] = useState({ id: '', asunto: '', especialista: '', oficina: '', categoria: 'vencer', fechaVencimiento: '', origen: '' });
    const [meetingRequests, setMeetingRequests] = useState([]);
    const [expedientes, setExpedientes] = useState([]);
    const [newActivity, setNewActivity] = useState({ title: '', type: 'estrategica', date: '', endDate: '', timeStart: '', timeEnd: '', location: '', priority: 'media', assigned: [], description: '', actions: [''] });
    const [activityFiles, setActivityFiles] = useState([]);
    const [evidenceFiles, setEvidenceFiles] = useState([]);
    const [evidenceLoading, setEvidenceLoading] = useState(false);
    const [existingEvidence, setExistingEvidence] = useState([]);
    const [selectedExpediente, setSelectedExpediente] = useState(null);
    const [expEvidenceFiles, setExpEvidenceFiles] = useState([]);
    const [expEvidenceLoading, setExpEvidenceLoading] = useState(false);
    const [expEvidenceMap, setExpEvidenceMap] = useState({});
    const [expSaveLoading, setExpSaveLoading] = useState(false);

    // Funcion para cargar actividades de Google Sheets
    const loadActividades = useCallback(async () => {
        try {
            const result = await API.listarActividades();
            if (result && Array.isArray(result) && result.length > 0) {
                const mapped = result.map((row, i) => ({
                    id: row.id || row.actividad_id || `ACT-${i}`,
                    title: row.titulo || row.title || '',
                    type: row.tipo || row.type || 'estrategica',
                    date: row.fecha_inicio || row.date || '',
                    endDate: row.fecha_fin || row.endDate || row.fecha_inicio || '',
                    time: row.horario || row.time || '',
                    location: row.lugar || row.location || '',
                    priority: row.prioridad || row.priority || 'media',
                    status: row.estado || row.status || 'pendiente',
                    progress: Math.max(
                        parseInt(row.progreso || row.progress || '0'), 
                        parseInt(JSON.parse(localStorage.getItem('agebatp_progress_override') || '{}')[row.id || row.actividad_id] || 0)
                    ),
                    assigned: typeof row.personal_asignado === 'string' ? JSON.parse(row.personal_asignado || '[]') : (row.assigned || []),
                    description: row.descripcion || row.description || '',
                    actions: typeof row.acciones === 'string' ? JSON.parse(row.acciones || '[]') : (row.actions || [])
                }));
                setActivities(mapped);
            }
        } catch (err) {
            console.warn('No se pudo cargar actividades de Sheets:', err.message);
        }
        setDataLoading(false);
    }, []);

    // Funcion para cargar expedientes de Google Sheets
    const loadExpedientes = useCallback(async () => {
        try {
            const result = await API.listarExpedientes();
            if (result && Array.isArray(result) && result.length > 0) {
                setExpedientes(result.map(row => ({
                    id: row.expediente_id || row.id || '',
                    asunto: row.asunto || '',
                    especialista: row.especialista || '',
                    oficina: row.oficina || '',
                    categoria: row.categoria || 'plazo',
                    fechaVencimiento: row.fecha_vencimiento || '',
                    origen: row.origen || ''
                })));
            }
        } catch (err) {
            console.warn('No se pudo cargar expedientes:', err.message);
        }
    }, []);

    // Cargar al montar + auto-refresh cada 30s — para TODOS los roles
    useEffect(() => {
        if (!user) {
            setDataLoading(false);
            return;
        }
        loadActividades();
        loadExpedientes();
        const interval = setInterval(() => { loadActividades(); loadExpedientes(); }, 30000);
        return () => clearInterval(interval);
    }, [loadActividades, loadExpedientes, user]);

    // Fetch evidencias al abrir modal de Actividad y recalcular progreso asincronamente
    useEffect(() => {
        if (selectedActivity) {
            setExistingEvidence([]);
            API.listarEvidencias(selectedActivity.id, 'actividad')
                .then(r => { 
                    if (r && Array.isArray(r.evidencias)) {
                        setExistingEvidence(r.evidencias);
                        const totalEvidencias = r.evidencias.length;
                        const totalAcciones = selectedActivity.actions && selectedActivity.actions.length > 0 ? selectedActivity.actions.length : 4;
                        const nuevoProgreso = Math.min(100, Math.round((totalEvidencias / totalAcciones) * 100));
                        
                        updateProgress(selectedActivity.id, nuevoProgreso);
                        
                        const overrides = JSON.parse(localStorage.getItem('agebatp_progress_override') || '{}');
                        overrides[selectedActivity.id] = nuevoProgreso;
                        localStorage.setItem('agebatp_progress_override', JSON.stringify(overrides));
                    }
                })
                .catch(() => {});
        }
    }, [selectedActivity]);

    // Fetch evidencias al abrir modal de Expediente
    useEffect(() => {
        if (selectedExpediente) {
            setExistingEvidence([]);
            API.listarEvidencias(selectedExpediente.id, 'expediente')
                .then(r => { if (r && Array.isArray(r.evidencias)) setExistingEvidence(r.evidencias); })
                .catch(() => {});
        }
    }, [selectedExpediente]);



    const [notifications, setNotifications] = useState([
        { id: 1, type: 'vencimiento', msg: 'Expediente EAP2026-INT-0088100 vence en 2 dias', time: 'Hace 1 hora', read: false },
        { id: 2, type: 'whatsapp', msg: 'Liz Gutierrez confirmo avance en actividad BIAE', time: 'Hace 2 horas', read: false },
        { id: 3, type: 'email', msg: 'Alerta enviada a Juan Quispe - Expediente proximo a vencer', time: 'Hace 3 horas', read: true },
    ]);

    const today = todayStr();
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const addToast = (msg, type = 'info') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    const getActivitiesForDay = useCallback((day) => {
        const ds = fmtDate(currentYear, currentMonth, day);
        return activities.filter(a => a.date <= ds && (a.endDate || a.date) >= ds);
    }, [activities, currentMonth, currentYear]);

    const filteredActivities = useMemo(() => {
        let f = [...activities];
        if (searchTerm) f = f.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
        if (staffFilter !== 'todos') f = f.filter(a => a.assigned.includes(parseInt(staffFilter)));
        return f.sort((a, b) => {
            const aComplete = a.progress >= 100 ? 1 : 0;
            const bComplete = b.progress >= 100 ? 1 : 0;
            if (aComplete !== bComplete) return aComplete - bComplete;
            const dc = a.date.localeCompare(b.date);
            if (dc !== 0) return dc;
            const tA = (a.time || '').split('-')[0]?.trim() || '99:99';
            const tB = (b.time || '').split('-')[0]?.trim() || '99:99';
            return tA.localeCompare(tB);
        });
    }, [activities, searchTerm, staffFilter]);

    const stats = useMemo(() => ({ total: activities.length, completadas: activities.filter(a => a.status === 'completado').length, enProceso: activities.filter(a => a.status === 'en_proceso').length, pendientes: activities.filter(a => a.status === 'pendiente').length }), [activities]);

    const handleAddActivity = async () => {
        if (!newActivity.title || !newActivity.date) { addToast('Complete titulo y fecha', 'error'); return; }
        const validActions = newActivity.actions.filter(a => a.trim());
        if (validActions.length === 0) { addToast('Debe agregar al menos 1 acción estratégica', 'error'); return; }
        const actData = {
            ...newActivity,
            id: `ACT-${Date.now()}`,
            status: 'pendiente',
            progress: 0,
            endDate: newActivity.endDate || newActivity.date,
            time: newActivity.timeStart && newActivity.timeEnd ? `${newActivity.timeStart} - ${newActivity.timeEnd}` : newActivity.timeStart || '',
            actions: newActivity.actions.filter(a => a.trim()),
            created_by: user?.nombre || 'Admin',
            attachments: activityFiles.map(f => ({ name: f.name, base64: f.base64, mimeType: f.mimeType }))
        };
        setAddLoading(true);
        try {
            const result = await API.crearActividad(actData);
            if (result.success) {
                setActivities(prev => [...prev, actData]);
                setNewActivity({ title: '', type: 'estrategica', date: '', endDate: '', timeStart: '', timeEnd: '', location: '', priority: 'media', assigned: [], description: '', actions: [''] });
                setActivityFiles([]);
                setShowAddModal(false);
                addToast('Actividad creada. Se notifico al personal asignado.', 'success');
            } else { addToast('Error al crear la actividad', 'error'); }
        } catch { addToast('Error de conexion con el servidor', 'error'); }
        setAddLoading(false);
    };

    const handleUploadEvidence = async (activity) => {
        if (evidenceFiles.length === 0) { addToast('Seleccione al menos un archivo', 'error'); return; }
        setEvidenceLoading(true);
        try {
            for (const file of evidenceFiles) {
                await API.subirEvidencia(activity.id, user?.id || 'admin', file);
            }
            addToast(`${evidenceFiles.length} evidencia(s) subida(s) correctamente`, 'success');
            setEvidenceFiles([]);
            // Reload evidences
            try {
                const ev = await API.listarEvidencias(activity.id);
                if (Array.isArray(ev)) {
                    setExistingEvidence(ev);
                    
                    // Calcular el nuevo progreso exclusivamente con codigo frontend
                    const totalEvidencias = ev.length;
                    const totalAcciones = activity.actions && activity.actions.length > 0 ? activity.actions.length : 4;
                    const nuevoProgreso = Math.min(100, Math.round((totalEvidencias / totalAcciones) * 100));
                    
                    // Actualizar UI
                    updateProgress(activity.id, nuevoProgreso);
                    
                    // Guardar en cache local para que no se borre al refrescar de GSheets
                    const overrides = JSON.parse(localStorage.getItem('agebatp_progress_override') || '{}');
                    overrides[activity.id] = nuevoProgreso;
                    localStorage.setItem('agebatp_progress_override', JSON.stringify(overrides));
                }
            } catch { /* no-op */ }
        } catch { addToast('Error al subir evidencia', 'error'); }
        setEvidenceLoading(false);
    };

    const updateProgress = (actId, progress) => {
        setActivities(prev => prev.map(a => a.id === actId ? { ...a, progress, status: progress >= 100 ? 'completado' : progress > 0 ? 'en_proceso' : 'pendiente' } : a));
    };

    const exportToCSV = () => {
        const sep = '\t';
        const h = ['N', 'Actividad', 'Tipo', 'Fecha Inicio', 'Fecha Fin', 'Horario', 'Lugar', 'Prioridad', 'Estado', 'Avance', 'Personal', 'Descripcion'];
        const r = activities.map((a, i) => [i + 1, a.title, typeConfig[a.type]?.label || a.type, a.date, a.endDate || a.date, a.time, a.location, priorityConfig[a.priority]?.label || a.priority, statusConfig[a.status]?.label || a.status, `${a.progress}%`, a.assigned.map(id => STAFF.find(s => s.id === id)?.name || '').join('; '), a.description]);
        const csv = [h, ...r].map(row => row.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(sep)).join('\r\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Planificador_AGEBATP_${monthNames[currentMonth]}_${currentYear}.csv`; link.click();
    };

    const unreadNotifs = notifications.filter(n => !n.read).length;
    const canCreate = user && (isRole('admin') || isRole('jefatura') || isRole('personal'));
    const canExport = !user || isRole('admin') || isRole('jefatura') || isRole('personal');
    const isPublic = user && isRole('publico');

    const ROLE_PERMS = {
        admin: ["calendario", "actividades", "personal", "expedientes", "reuniones", "monitoreo"],
        jefatura: ["calendario", "actividades", "personal", "expedientes", "reuniones", "monitoreo"],
        personal: ["calendario", "actividades", "expedientes", "reuniones"],
        publico: ["calendario", "reuniones"]
    };
    const perms = user ? (ROLE_PERMS[user.rol] || []) : [];

    const allTabs = [
        { id: 'calendario', label: 'Calendario', icon: 'calendar' },
        { id: 'actividades', label: 'Actividades', icon: 'list' },
        { id: 'personal', label: 'Personal', icon: 'users' },
        { id: 'expedientes', label: 'Expedientes', icon: 'folder' },
        { id: 'reuniones', label: 'Reuniones', icon: 'calendar' },
        { id: 'monitoreo', label: 'Monitoreo', icon: 'barChart' }
    ];
    const tabs = allTabs.filter(t => perms.includes(t.id));

    useEffect(() => {
        if (user && !perms.includes(activeTab) && tabs.length > 0) {
            setActiveTab(perms.includes('monitoreo') ? 'monitoreo' : tabs[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, user]);

    if (!user) {
        return <LoginScreen />;
    }

    // Inline styles
    const S = {
        card: { background: '#FFFFFF', border: '1px solid #D6DCE8', borderRadius: 8, padding: 20, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' },
        sectionTitle: { fontSize: 13, fontWeight: 700, color: '#122240', textTransform: 'uppercase', letterSpacing: 0.6, paddingBottom: 14, marginBottom: 16, borderBottom: '2px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 },
        badge: (bg, color, border) => ({ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: bg, color, border: `1px solid ${border || color + '30'}`, letterSpacing: 0.3 }),
        input: { width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #D6DCE8', background: '#FFFFFF', color: '#1E293B', fontFamily: "'DM Sans'", fontSize: 13 },
        label: { fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.6 },
        btn: (bg, color, border) => ({ padding: '8px 16px', borderRadius: 6, border: `1px solid ${border || bg}`, background: bg, color, cursor: 'pointer', fontFamily: "'DM Sans'", fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, transition: 'all 0.15s' }),
        progressBar: (pct) => ({ height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden', children: { height: '100%', borderRadius: 3, width: `${pct}%`, background: pct < 30 ? '#B91C1C' : pct < 70 ? '#B45309' : '#15803D', transition: 'width 0.3s' } })
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: "'DM Sans',sans-serif", color: '#1E293B' }}>
            {/* TOASTS */}
            <div className="toast-container">
                {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>)}
            </div>

            {/* AUTH MODALS REMOVED */}
            <header style={{ background: 'linear-gradient(180deg,#0C1929 0%,#122240 100%)', borderBottom: '3px solid #CA8A04', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <img src="/logo-agebatp.jpeg" alt="AGEBATP" style={{ width: 46, height: 46, borderRadius: 8, objectFit: 'cover', boxShadow: '0 2px 8px rgba(202,138,4,0.3)' }} />
                        <div>
                            <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 19, color: '#FFFFFF', letterSpacing: 0.2 }}>Planificador Mensual AGEBATP</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>UGEL 03 - Unidad de Gestion Educativa Local</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => setShowQR(true)} style={S.btn('rgba(255,255,255,0.06)', '#E2E8F0', 'rgba(255,255,255,0.15)')}><Icon name="qrcode" size={14} />Acceso QR</button>
                        {canExport && <button onClick={exportToCSV} style={S.btn('rgba(255,255,255,0.06)', '#E2E8F0', 'rgba(255,255,255,0.15)')}><Icon name="download" size={14} />Exportar</button>}
                        {canCreate && <button onClick={() => setShowAddModal(true)} style={S.btn('#1E4D7B', '#FFFFFF', '#2563A0')}><Icon name="plus" size={14} />Nueva Actividad</button>}
                        {isPublic && <button onClick={() => setActiveTab('reuniones')} style={S.btn('#7C3AED', '#FFFFFF', '#6D28D9')}><Icon name="calendar" size={14} />Solicitar Reunion</button>}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowNotifPanel(!showNotifPanel)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Icon name="bell" size={14} />
                                {unreadNotifs > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#B91C1C', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0C1929' }}>{unreadNotifs}</span>}
                            </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: '#1B3A5C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{(user.nombre || '').split(' ').map(n => n[0] || '').slice(0, 2).join('')}</div>
                            <div><div style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 600 }}>{(user.nombre || '').split(' ').slice(0, 2).join(' ')}</div><div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase' }}>{user.rol}</div></div>
                            <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#E2E8F0', cursor: 'pointer' }}><Icon name="logOut" size={14} /></button>
                        </div>
                    </div>
                </div>
                <nav style={{ maxWidth: 1400, margin: '0 auto', padding: '0 28px', display: 'flex', gap: 0, borderTop: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto' }}>
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            style={{ padding: '11px 20px', fontSize: 12, fontWeight: 600, color: activeTab === tab.id ? '#CA8A04' : '#94A3B8', cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: "'DM Sans'", borderBottom: activeTab === tab.id ? '2px solid #CA8A04' : '2px solid transparent', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 7, letterSpacing: 0.3 }}>
                            <Icon name={tab.icon} size={14} />{tab.label}
                        </button>
                    ))}
                </nav>
            </header>

            {/* NOTIF PANEL */}
            {showNotifPanel && (
                <div style={{ position: 'fixed', top: 64, right: 28, width: 380, ...S.card, zIndex: 90, boxShadow: '0 12px 32px rgba(15,23,42,0.12)', animation: 'slideDown 0.2s ease', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#122240' }}>Notificaciones</span>
                        <button onClick={() => { setNotifications(n => n.map(x => ({ ...x, read: true }))); setShowNotifPanel(false); }} style={{ background: 'none', border: 'none', color: '#2563A0', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans'" }}>MARCAR LEIDAS</button>
                    </div>
                    {notifications.map(n => (
                        <div key={n.id} style={{ padding: 12, borderRadius: 6, marginBottom: 6, display: 'flex', gap: 12, fontSize: 12, background: !n.read ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${!n.read ? '#DBEAFE' : '#E8ECF3'}`, borderLeft: !n.read ? '3px solid #1E4D7B' : '1px solid #E8ECF3' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: n.type === 'vencimiento' ? '#FEF2F2' : n.type === 'whatsapp' ? '#F0FDF4' : '#EFF6FF' }}>
                                <Icon name={n.type === 'vencimiento' ? 'alert' : n.type === 'whatsapp' ? 'message' : 'mail'} size={14} color={n.type === 'vencimiento' ? '#B91C1C' : n.type === 'whatsapp' ? '#15803D' : '#1E4D7B'} />
                            </div>
                            <div style={{ flex: 1 }}><div style={{ lineHeight: 1.5, color: '#334155' }}>{n.msg}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{n.time}</div></div>
                        </div>
                    ))}
                </div>
            )}

            {/* QR MODAL */}
            {showQR && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }} onClick={() => setShowQR(false)}>
                    <div style={{ ...S.card, padding: 36, textAlign: 'center', animation: 'fadeIn 0.2s ease', maxWidth: 340 }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: '#122240', marginBottom: 20 }}>Acceso Movil al Planificador</h3>
                        <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 8, display: 'inline-block', border: '1px solid #D6DCE8' }}><QRCode size={220} /></div>
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>Escanee el codigo o acceda directamente:</div>
                            <a href="https://ravsbot-planificador.xv74e4.easypanel.host" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#1E4D7B', textDecoration: 'none', padding: '6px 14px', borderRadius: 6, border: '1px solid #DBEAFE', background: '#EFF6FF', display: 'inline-block' }}>ravsbot-planificador.xv74e4.easypanel.host</a>
                        </div>
                        <button onClick={() => setShowQR(false)} style={{ marginTop: 20, ...S.btn('#F8FAFC', '#475569', '#D6DCE8') }}>Cerrar</button>
                    </div>
                </div>
            )}

            {/* MAIN */}
            <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px' }}>
                {/* STATS */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
                    {[
                        { n: stats.total, label: 'Total Actividades', color: '#1E4D7B' },
                        { n: stats.completadas, label: 'Completadas', color: '#15803D' },
                        { n: stats.enProceso, label: 'En Proceso', color: '#B45309' },
                        { n: stats.pendientes, label: 'Pendientes', color: '#B91C1C' },
                        { n: expedientes.filter(e => e.categoria === 'vencer').length, label: 'Exp. por Vencer', color: '#B91C1C' },
                        { n: expedientes.filter(e => e.categoria === 'plazo').length, label: 'Exp. en Plazo', color: '#B45309' },
                        { n: expedientes.filter(e => e.categoria === 'elaboracion').length, label: 'En Elaboracion', color: '#1E4D7B' },
                    ].map((s, i) => (
                        <div key={i} style={{ ...S.card, padding: '18px 20px', position: 'relative', overflow: 'hidden', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: s.color }} />
                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 30, fontWeight: 600, letterSpacing: -1, lineHeight: 1, color: s.color }}>{s.n}</div>
                            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 }}>{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* TAB CONTENT: CALENDARIO */}
                {activeTab === 'calendario' && (
                    <div className="grid-calendar" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) } else setCurrentMonth(m => m - 1) }} style={{ width: 34, height: 34, borderRadius: 6, border: '1px solid #D6DCE8', background: '#FFFFFF', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevronLeft" size={16} /></button>
                                    <span style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 24, color: '#122240' }}>{monthNames[currentMonth]} {currentYear}</span>
                                    <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) } else setCurrentMonth(m => m + 1) }} style={{ width: 34, height: 34, borderRadius: 6, border: '1px solid #D6DCE8', background: '#FFFFFF', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="chevronRight" size={16} /></button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
                                {dayNames.map(d => <div key={d} style={{ padding: '10px 4px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, background: '#F8FAFC', borderRadius: 4 }}>{d}</div>)}
                                {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} style={{ minHeight: 36, background: '#F8FAFC', borderRadius: 4 }} />)}
                                {Array.from({ length: daysInMonth }, (_, i) => {
                                    const day = i + 1, ds = fmtDate(currentYear, currentMonth, day), acts = getActivitiesForDay(day), isToday = ds === today, isSel = selectedDay === day;
                                    return (
                                        <div key={day} onClick={() => setSelectedDay(isSel ? null : day)}
                                            style={{ minHeight: 96, background: isSel ? '#FEF9C3' : '#FFFFFF', border: `1px solid ${isToday ? '#1E4D7B' : isSel ? '#CA8A04' : '#E8ECF3'}`, borderRadius: 4, padding: '6px 8px', cursor: 'pointer', boxShadow: isToday ? 'inset 0 0 0 1px #1E4D7B' : 'none' }}>
                                            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600, color: isToday ? '#FFFFFF' : '#334155', marginBottom: 4, ...(isToday ? { background: '#1B3A5C', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>{day}</div>
                                            {acts.slice(0, 3).map(a => (
                                                <div key={a.id} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: typeConfig[a.type]?.bg, color: typeConfig[a.type]?.color, borderLeft: `2px solid ${typeConfig[a.type]?.color}` }}>{a.title.substring(0, 20)}</div>
                                            ))}
                                            {acts.length > 3 && <div style={{ fontSize: 9, color: '#94A3B8', textAlign: 'center', fontWeight: 600 }}>+{acts.length - 3} mas</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <div style={S.card}>
                                <div style={S.sectionTitle}><Icon name="calendar" size={16} color="#1E4D7B" />{selectedDay ? `${selectedDay} de ${monthNames[currentMonth]}` : 'Proximas Actividades'}</div>
                                {(selectedDay ? getActivitiesForDay(selectedDay) : filteredActivities.slice(0, 5)).map(a => (
                                    <div key={a.id} onClick={() => setSelectedActivity(a)} style={{ ...S.card, borderLeft: `4px solid ${priorityConfig[a.priority]?.color}`, padding: 14, marginBottom: 10, cursor: 'pointer' }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#122240', marginBottom: 6 }}>{a.title}</div>
                                        <div style={{ fontSize: 11, color: '#64748B', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={11} />{a.date}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} />{a.time}</span>
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748B', display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}><Icon name="mapPin" size={11} />{a.location}</div>
                                        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                            <span style={S.badge(statusConfig[a.status]?.bg, statusConfig[a.status]?.color)}>{statusConfig[a.status]?.label}</span>
                                            <span style={S.badge(priorityConfig[a.priority]?.bg, priorityConfig[a.priority]?.color, priorityConfig[a.priority]?.border)}>{priorityConfig[a.priority]?.label}</span>
                                        </div>
                                        <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 10, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, width: `${a.progress}%`, background: a.progress < 30 ? '#B91C1C' : a.progress < 70 ? '#B45309' : '#15803D', transition: 'width 0.3s' }} /></div>
                                        <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'right', fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{a.progress}% completado</div>
                                    </div>
                                ))}
                                {selectedDay && getActivitiesForDay(selectedDay).length === 0 && <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 13 }}>Sin actividades programadas.</div>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVIDADES */}
                {activeTab === 'actividades' && (
                    <div>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                            <input placeholder="Buscar actividad..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...S.input, maxWidth: 320 }} />
                            <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} style={{ ...S.input, maxWidth: 280 }}>
                                <option value="todos">Todo el personal</option>
                                {STAFF.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        {filteredActivities.map(a => (
                            <div key={a.id} onClick={() => setSelectedActivity(a)} style={{ ...S.card, borderLeft: `4px solid ${priorityConfig[a.priority]?.color}`, padding: 16, marginBottom: 12, cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 12, flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#122240', marginBottom: 6 }}>{a.title}</div>
                                        <div style={{ fontSize: 11, color: '#64748B', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={11} />{a.date}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="clock" size={11} />{a.time}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="mapPin" size={11} />{a.location}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <span style={S.badge(typeConfig[a.type]?.bg, typeConfig[a.type]?.color)}>{typeConfig[a.type]?.label}</span>
                                        <span style={S.badge(priorityConfig[a.priority]?.bg, priorityConfig[a.priority]?.color, priorityConfig[a.priority]?.border)}>{priorityConfig[a.priority]?.label}</span>
                                        {(() => {
                                            if (a.progress >= 100) return <span style={S.badge('#F0FDF4', '#15803D', '#BBF7D0')}>COMPLETADO</span>;
                                            const sla = calcularSLA(a.endDate || a.date);
                                            const bg = sla === 'danger' ? '#FEF2F2' : sla === 'warning' ? '#FFFBEB' : '#F0FDF4';
                                            const fg = sla === 'danger' ? '#B91C1C' : sla === 'warning' ? '#B45309' : '#15803D';
                                            const border = sla === 'danger' ? '#FECACA' : sla === 'warning' ? '#FDE68A' : '#BBF7D0';
                                            const text = sla === 'danger' ? 'RETRASO CRITICO' : sla === 'warning' ? 'ATRASADO' : 'EN PLAZO';
                                            return <span style={S.badge(bg, fg, border)}>{text}</span>;
                                        })()}
                                    </div>
                                </div>
                                {a.description && <div style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>{a.description}</div>}
                                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                                    {a.assigned.map(id => { const s = STAFF.find(x => x.id === id); return s ? <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #E8ECF3', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#475569' }}><div style={{ width: 20, height: 20, borderRadius: 4, background: '#1B3A5C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{s.initials}</div>{s.name.split(' ').slice(0, 2).join(' ')}</div> : null; })}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                                    <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, width: `${a.progress}%`, background: a.progress < 30 ? '#B91C1C' : a.progress < 70 ? '#B45309' : '#15803D' }} /></div>
                                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'right', color: a.progress < 30 ? '#B91C1C' : a.progress < 70 ? '#B45309' : '#15803D' }}>{a.progress}%</span>
                                    <input type="range" min="0" max="100" value={a.progress} onChange={e => { e.stopPropagation(); updateProgress(a.id, parseInt(e.target.value)); }} onClick={e => e.stopPropagation()} style={{ width: 90, accentColor: '#1E4D7B' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PERSONAL */}
                {activeTab === 'personal' && (
                    <div className="grid-personal" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
                        <div style={S.card}>
                            <div style={{ ...S.sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="users" size={16} color="#1E4D7B" />Equipo AGEBATP - Monitoreo Diario</span>
                                {(isRole('admin') || isRole('jefatura')) && <button onClick={() => setShowAddStaff(!showAddStaff)} style={{ ...S.btn('#1B3A5C', '#FFF'), fontSize: 12, padding: '6px 14px' }}>{showAddStaff ? 'Cancelar' : '+ Agregar Personal'}</button>}
                            </div>
                            {/* ADMIN: Formulario agregar personal */}
                            {(isRole('admin') || isRole('jefatura')) && showAddStaff && (
                                <div style={{ ...S.card, background: '#F8FAFC', padding: 16, marginBottom: 16, border: '1px dashed #CBD5E1' }}>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: '#122240', marginBottom: 12 }}>Nuevo Personal Administrativo</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div><label style={S.label}>Nombre Completo *</label><input value={newStaffForm.name} onChange={e => setNewStaffForm(p => ({ ...p, name: e.target.value }))} style={S.input} placeholder="Nombre completo" /></div>
                                        <div><label style={S.label}>Cargo / Rol *</label><input value={newStaffForm.role} onChange={e => setNewStaffForm(p => ({ ...p, role: e.target.value }))} style={S.input} placeholder="Ej: Especialista ETP" /></div>
                                        <div><label style={S.label}>Telefono</label><input value={newStaffForm.phone} onChange={e => setNewStaffForm(p => ({ ...p, phone: e.target.value }))} style={S.input} placeholder="51XXXXXXXXX" /></div>
                                        <div><label style={S.label}>Email *</label><input value={newStaffForm.email} onChange={e => setNewStaffForm(p => ({ ...p, email: e.target.value }))} style={S.input} placeholder="correo@ugel03.gob.pe" /></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Contraseña de Acceso *</label><input type="password" value={newStaffForm.password} onChange={e => setNewStaffForm(p => ({ ...p, password: e.target.value }))} style={S.input} placeholder="Contraseña para iniciar sesión" /></div>
                                    </div>
                                    <button onClick={async () => {
                                        if (!newStaffForm.name || !newStaffForm.role) { addToast('Complete nombre y cargo', 'error'); return; }
                                        if (!newStaffForm.email) { addToast('El email es obligatorio para el login del personal', 'error'); return; }
                                        if (!newStaffForm.password || newStaffForm.password.length < 4) { addToast('La contraseña debe tener al menos 4 caracteres', 'error'); return; }
                                        const initials = newStaffForm.name.split(' ').filter(w => w.length > 2).slice(0, 2).map(w => w[0].toUpperCase()).join('');
                                        const newId = Math.max(...STAFF.map(s => s.id)) + 1;
                                        const newPerson = { id: newId, name: newStaffForm.name, role: newStaffForm.role, phone: newStaffForm.phone || '', email: newStaffForm.email || '', initials, password: newStaffForm.password };
                                        STAFF.push(newPerson);
                                        try { await API.agregarPersonal(newPerson); } catch (e) { console.warn('Staff sync error:', e); }
                                        setNewStaffForm({ name: '', role: '', phone: '', email: '', password: '' });
                                        setShowAddStaff(false);
                                        addToast(`${newStaffForm.name} agregado al equipo y guardado en Sheets`, 'success');
                                    }} style={{ ...S.btn('#15803D', '#FFF'), marginTop: 12, width: '100%' }}>Agregar al Equipo</button>
                                </div>
                            )}
                            {STAFF.map(s => {
                                const sa = activities.filter(a => a.assigned.includes(s.id));
                                const avg = sa.length ? Math.round(sa.reduce((sum, a) => sum + a.progress, 0) / sa.length) : 0;
                                return (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, ...S.card, marginBottom: 8 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 6, background: '#1B3A5C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{s.initials}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#122240' }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748B' }}>{s.role} {s.email && <span style={{ marginLeft: 8, color: '#94A3B8' }}>{s.email}</span>}</div>
                                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{sa.length} actividad{sa.length !== 1 ? 'es' : ''} | Avance: {avg}%</div>
                                            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, width: `${avg}%`, background: avg < 30 ? '#B91C1C' : avg < 70 ? '#B45309' : '#15803D' }} /></div>
                                        </div>
                                        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color: avg < 30 ? '#B91C1C' : avg < 70 ? '#B45309' : '#15803D' }}>{avg}%</div>
                                        {(isRole('admin') || isRole('jefatura')) && (
                                            <button onClick={async (e) => { e.stopPropagation(); if (confirm(`¿Eliminar a ${s.name} del equipo?`)) { const idx = STAFF.findIndex(x => x.id === s.id); if (idx > -1) { const removed = STAFF.splice(idx, 1)[0]; try { await API.eliminarPersonal(removed.id); } catch (err) { console.warn('Error syncing delete:', err); } addToast(`${s.name} eliminado del equipo y de Sheets`, 'success'); setSearchTerm(t => t); } } }} style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontSize: 16, padding: '4px 8px', borderRadius: 4 }} title="Eliminar personal">✕</button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div style={S.card}>
                            <div style={S.sectionTitle}><Icon name="barChart" size={16} color="#1E4D7B" />Resumen del Equipo</div>
                            <div style={{ textAlign: 'center', padding: 20 }}><div style={{ fontSize: 52, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: '#1B3A5C' }}>{STAFF.length}</div><div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 }}>Personal Activo</div></div>
                            {(isRole('admin') || isRole('jefatura')) && (
                                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 16 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#122240', marginBottom: 10 }}>Panel de Administracion</div>
                                    <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
                                        <p>• Usa el boton "+ Agregar Personal" para anadir miembros</p>
                                        <p>• Click en ✕ para eliminar un miembro del equipo</p>
                                        <p>• Los cambios se reflejan en la Google Sheet de Personal</p>
                                        <p>• Recuerda sincronizar con la hoja "Personal" en Sheets</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* EXPEDIENTES */}
                {activeTab === 'expedientes' && (
                    <div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                            {[{ key: 'vencer', label: 'Por Vencer', count: expedientes.filter(e => e.categoria === 'vencer').length }, { key: 'plazo', label: 'Dentro del Plazo', count: expedientes.filter(e => e.categoria === 'plazo').length }, { key: 'elaboracion', label: 'En Elaboracion', count: expedientes.filter(e => e.categoria === 'elaboracion').length }].map(t => (
                                <button key={t.key} onClick={() => setViewExpedientes(t.key)} style={{ ...S.btn(viewExpedientes === t.key ? '#1B3A5C' : '#FFFFFF', viewExpedientes === t.key ? '#FFFFFF' : '#475569', viewExpedientes === t.key ? '#1B3A5C' : '#D6DCE8') }}>{t.label} <span style={{ minWidth: 22, height: 22, borderRadius: 4, background: viewExpedientes === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{t.count}</span></button>
                            ))}
                            {canCreate && <button onClick={() => setShowAddExpediente(!showAddExpediente)} style={{ ...S.btn('#1B3A5C', '#FFF'), marginLeft: 'auto' }}>{showAddExpediente ? 'Cancelar' : '+ Nuevo Expediente'}</button>}
                        </div>
                        {canCreate && showAddExpediente && (
                            <div style={{ ...S.card, background: '#F8FAFC', padding: 16, marginBottom: 16, border: '1px dashed #CBD5E1' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#122240', marginBottom: 12 }}>Registrar Nuevo Expediente</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ gridColumn: '1 / -1' }}><label style={S.label}>Numero de Expediente *</label><input value={newExpediente.id} onChange={e => setNewExpediente(p => ({ ...p, id: e.target.value }))} style={S.input} placeholder="Ej: MPD2026-EXT-0113171" /></div>
                                    <div><label style={S.label}>Asunto *</label><input value={newExpediente.asunto} onChange={e => setNewExpediente(p => ({ ...p, asunto: e.target.value }))} style={S.input} placeholder="Asunto del expediente" /></div>
                                    <div><label style={S.label}>Especialista *</label><select value={newExpediente.especialista} onChange={e => setNewExpediente(p => ({ ...p, especialista: e.target.value }))} style={S.input}><option value="">Seleccionar...</option>{STAFF.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                                    <div><label style={S.label}>Oficina</label><input value={newExpediente.oficina} onChange={e => setNewExpediente(p => ({ ...p, oficina: e.target.value }))} style={S.input} placeholder="Ej: AGEBATP" /></div>
                                    <div><label style={S.label}>Categoria</label><select value={newExpediente.categoria} onChange={e => setNewExpediente(p => ({ ...p, categoria: e.target.value }))} style={S.input}><option value="vencer">Por Vencer</option><option value="plazo">En Plazo</option><option value="elaboracion">En Elaboracion</option></select></div>
                                    <div><label style={S.label}>Fecha Vencimiento</label><input type="date" value={newExpediente.fechaVencimiento} onChange={e => setNewExpediente(p => ({ ...p, fechaVencimiento: e.target.value }))} style={S.input} /></div>
                                    <div><label style={S.label}>Origen</label><input value={newExpediente.origen} onChange={e => setNewExpediente(p => ({ ...p, origen: e.target.value }))} style={S.input} placeholder="Ej: DRELM, UGEL" /></div>
                                </div>
                                <button disabled={expSaveLoading} onClick={async () => {
                                    if (!newExpediente.id || !newExpediente.asunto || !newExpediente.especialista) { addToast('Complete numero de expediente, asunto y especialista', 'error'); return; }
                                    setExpSaveLoading(true);
                                    try {
                                        // Add to local state immediately for instant feedback
                                        setExpedientes(prev => [...prev, { ...newExpediente }]);
                                        setNewExpediente({ id: '', asunto: '', especialista: '', oficina: '', categoria: 'vencer', fechaVencimiento: '', origen: '' });
                                        setShowAddExpediente(false);
                                        setExpSaveLoading(false);
                                        addToast('Expediente registrado y guardado en Sheets', 'success');
                                        // Fire-and-forget API call — don't block UI
                                        API.agregarExpediente(newExpediente).catch(err => console.warn('Sync expediente error:', err));
                                    } catch { addToast('Error al guardar expediente', 'error'); setExpSaveLoading(false); }
                                }} style={{ ...S.btn('#15803D', '#FFF'), marginTop: 12, width: '100%', opacity: expSaveLoading ? 0.7 : 1 }}>
                                    {expSaveLoading ? <span className="spinner" /> : 'Guardar Expediente'}
                                </button>
                            </div>
                        )}
                        {expedientes.filter(e => e.categoria === viewExpedientes).map(e => {
                            try {
                            const diasR = e.fechaVencimiento ? calcularDiasRestantes(e.fechaVencimiento) : null;
                            const isDRELM = e.origen === 'DRELM' || (e.asunto && e.asunto.toUpperCase().includes('DRELM'));
                            const expProgress = expEvidenceMap[e.id] ? 100 : 0;
                            return (
                                <div key={e.id} onClick={() => setSelectedExpediente(e)} style={{ ...S.card, borderLeft: `4px solid ${isDRELM ? '#7C3AED' : viewExpedientes === 'vencer' ? '#B91C1C' : viewExpedientes === 'plazo' ? '#B45309' : '#1E4D7B'}`, padding: 14, marginBottom: 10, background: isDRELM ? '#F5F3FF' : '#FFFFFF', boxShadow: isDRELM ? '0 0 0 1px #C4B5FD, 0 2px 8px rgba(124,58,237,0.08)' : undefined, cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                                            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#1E4D7B', fontWeight: 600 }}>{e.id}</span>
                                            {isDRELM && <span style={{ fontSize: 9, fontWeight: 800, color: '#7C3AED', background: '#EDE9FE', border: '1px solid #C4B5FD', padding: '2px 8px', borderRadius: 4, letterSpacing: 0.8 }}>DRELM</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                            {expProgress >= 100 && <span style={S.badge('#F0FDF4', '#15803D', '#BBF7D0')}>EVIDENCIA ✓</span>}
                                            {(() => {
                                                try {
                                                if (!e.fechaVencimiento) return null;
                                                const sla = calcularSLA(e.fechaVencimiento);
                                                const bg = sla === 'danger' ? '#FEF2F2' : sla === 'warning' ? '#FFFBEB' : '#F0FDF4';
                                                const fg = sla === 'danger' ? '#B91C1C' : sla === 'warning' ? '#B45309' : '#15803D';
                                                const border = sla === 'danger' ? '#FECACA' : sla === 'warning' ? '#FDE68A' : '#BBF7D0';
                                                const text = sla === 'danger' ? 'RETRASO CRITICO' : sla === 'warning' ? 'VENCIDO' : (diasR !== null ? (diasR <= 3 && diasR > 0 ? `Vence en ${diasR} dias` : `${diasR} dias restantes`) : 'EN PLAZO');
                                                return <span style={S.badge(bg, fg, border)}>{text}</span>;
                                                } catch { return null; }
                                            })()}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: isDRELM ? '#5B21B6' : '#1E293B', margin: '4px 0' }}>{e.asunto}</div>
                                    <div style={{ display: 'flex', gap: 16, color: '#64748B', fontSize: 11, flexWrap: 'wrap' }}><span>Especialista: {e.especialista}</span><span>Oficina: {e.oficina}</span>{e.fechaVencimiento && <span>Vencimiento: {formatDateDMY(e.fechaVencimiento)}</span>}</div>
                                    {/* Progress bar */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                                        <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, width: `${expProgress}%`, background: expProgress >= 100 ? '#15803D' : '#B91C1C', transition: 'width 0.3s' }} /></div>
                                        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'right', color: expProgress >= 100 ? '#15803D' : '#B91C1C' }}>{expProgress}%</span>
                                    </div>
                                </div>
                            );
                            } catch (err) { console.warn('Error rendering expediente:', e?.id, err); return null; }
                        })}
                        {expedientes.filter(ex => ex.categoria === viewExpedientes).length === 0 && (
                            <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontSize: 13 }}>No hay expedientes en esta categoria. Usa "+ Nuevo Expediente" para agregar o espera la sincronizacion desde Sheets.</div>
                        )}
                    </div>
                )}

                {/* REUNIONES */}
                {activeTab === 'reuniones' && (
                    <div>
                        <MeetingRequest onToast={addToast} />
                        {/* Panel de Estado de Solicitudes - visible para publico */}
                        {user && (
                            <div style={{ ...S.card, marginTop: 20 }}>
                                <div style={{ ...S.sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="list" size={16} color="#1E4D7B" />Mis Solicitudes de Reunion</span>
                                    <button onClick={async () => { try { const data = await API.listarReuniones(); if (Array.isArray(data)) setMeetingRequests(data); } catch { addToast('Error cargando reuniones', 'error'); } }} style={{ ...S.btn('rgba(30,77,123,0.1)', '#1E4D7B'), fontSize: 11 }}>Actualizar</button>
                                </div>
                                {meetingRequests.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 13 }}>No hay solicitudes registradas. Haz click en "Actualizar" para cargar.</div>
                                ) : meetingRequests.map((r, i) => {
                                    const st = r.estado?.toLowerCase();
                                    const stColor = st === 'aceptada' ? '#15803D' : st === 'rechazada' ? '#B91C1C' : '#B45309';
                                    const stBg = st === 'aceptada' ? '#F0FDF4' : st === 'rechazada' ? '#FEF2F2' : '#FFFBEB';
                                    return (
                                        <div key={i} style={{ ...S.card, borderLeft: `4px solid ${stColor}`, padding: 14, marginBottom: 10, background: stBg }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 8 }}>
                                                <div><span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#1E4D7B', fontWeight: 600 }}>{r.reunion_id}</span></div>
                                                <span style={S.badge(stBg, stColor)}>{st === 'aceptada' ? '✓ ACEPTADA' : st === 'rechazada' ? '✕ RECHAZADA' : '⏳ PENDIENTE'}</span>
                                            </div>
                                            <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '4px 0' }}>{r.motivo || 'Sin motivo'}</div>
                                            <div style={{ display: 'flex', gap: 16, color: '#64748B', fontSize: 11, flexWrap: 'wrap' }}>
                                                <span>Solicitante: {r.solicitante_nombre}</span>
                                                <span>Personal: {STAFF.find(x => x.id === parseInt(r.personal_destino_id || r.personal_id))?.name || 'Personal'}</span>
                                                <span>Fecha: {r.fecha_propuesta}</span>
                                                <span>Hora: {r.hora_propuesta}</span>
                                            </div>
                                            {st === 'rechazada' && r.comentario_admin && (
                                                <div style={{ marginTop: 8, padding: 10, background: '#FEE2E2', borderRadius: 6, fontSize: 12, color: '#991B1B' }}>
                                                    <strong>Motivo del rechazo:</strong> {r.comentario_admin}
                                                </div>
                                            )}
                                            {st === 'aceptada' && r.comentario_admin && (
                                                <div style={{ marginTop: 8, padding: 10, background: '#DCFCE7', borderRadius: 6, fontSize: 12, color: '#166534' }}>
                                                    <strong>Comentario:</strong> {r.comentario_admin}
                                                </div>
                                            )}
                                            {r.respondido_por && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 6 }}>Respondido por: {r.respondido_por} | {r.fecha_respuesta}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}



                {/* MONITOREO */}
                {activeTab === 'monitoreo' && (
                    <MonitoreoModule />
                )}
            </main>

            {/* ADD ACTIVITY MODAL */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }} onClick={() => setShowAddModal(false)}>
                    <div style={{ ...S.card, padding: 28, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: '#122240', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #F1F5F9' }}>Registrar Nueva Actividad</div>
                        <div style={{ marginBottom: 16 }}><label style={S.label}>Denominacion de la Actividad</label><input placeholder="Titulo de la actividad" value={newActivity.title} onChange={e => setNewActivity({ ...newActivity, title: e.target.value })} style={S.input} /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                            <div><label style={S.label}>Tipo</label><select value={newActivity.type} onChange={e => setNewActivity({ ...newActivity, type: e.target.value })} style={S.input}>{Object.entries(typeConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                            <div><label style={S.label}>Prioridad</label><select value={newActivity.priority} onChange={e => setNewActivity({ ...newActivity, priority: e.target.value })} style={S.input}>{Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                            <div><label style={S.label}>Fecha Inicio</label><input type="date" value={newActivity.date} onChange={e => setNewActivity({ ...newActivity, date: e.target.value })} style={S.input} /></div>
                            <div><label style={S.label}>Fecha Termino</label><input type="date" value={newActivity.endDate} onChange={e => setNewActivity({ ...newActivity, endDate: e.target.value })} style={S.input} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                            <div><label style={S.label}>Hora Inicio</label><input type="time" value={newActivity.timeStart} onChange={e => setNewActivity({ ...newActivity, timeStart: e.target.value })} style={S.input} /></div>
                            <div><label style={S.label}>Hora Fin</label><input type="time" value={newActivity.timeEnd} onChange={e => setNewActivity({ ...newActivity, timeEnd: e.target.value })} style={S.input} /></div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 16 }}>
                            <div><label style={S.label}>Lugar</label><input placeholder="Ubicacion" value={newActivity.location} onChange={e => setNewActivity({ ...newActivity, location: e.target.value })} style={S.input} /></div>
                        </div>
                        <div style={{ marginBottom: 16 }}><label style={S.label}>Descripcion</label><textarea placeholder="Objetivos de la actividad" value={newActivity.description} onChange={e => setNewActivity({ ...newActivity, description: e.target.value })} style={{ ...S.input, resize: 'vertical', minHeight: 80 }} /></div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={S.label}>Personal Asignado</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                {STAFF.map(s => <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}><input type="checkbox" checked={newActivity.assigned.includes(s.id)} onChange={e => { if (e.target.checked) setNewActivity({ ...newActivity, assigned: [...newActivity.assigned, s.id] }); else setNewActivity({ ...newActivity, assigned: newActivity.assigned.filter(x => x !== s.id) }) }} style={{ accentColor: '#1E4D7B' }} />{s.name.split(' ').slice(0, 3).join(' ')}</label>)}
                            </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                            <label style={S.label}>Acciones Estrategicas</label>
                            {newActivity.actions.map((action, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 600, color: '#94A3B8', padding: '10px 0', minWidth: 24 }}>{String(idx + 1).padStart(2, '0')}</span>
                                    <input placeholder={`Accion ${idx + 1}`} value={action} onChange={e => { const a = [...newActivity.actions]; a[idx] = e.target.value; setNewActivity({ ...newActivity, actions: a }); }} style={{ ...S.input, flex: 1 }} />
                                    {idx === newActivity.actions.length - 1 && <button onClick={() => setNewActivity({ ...newActivity, actions: [...newActivity.actions, ''] })} style={{ padding: '8px 14px', border: '1px solid #D6DCE8', borderRadius: 6, background: '#F8FAFC', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569' }}>+</button>}
                                </div>
                            ))}
                        </div>
                        {/* File Attachments (optional) */}
                        <div style={{ marginBottom: 16 }}>
                            <FileAttachment
                                files={activityFiles}
                                onChange={setActivityFiles}
                                label="Adjuntar Archivos (opcional — se envían por correo)"
                                compact
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #E8ECF3' }}>
                            <button onClick={() => { setShowAddModal(false); setActivityFiles([]); }} style={S.btn('#FFFFFF', '#475569', '#D6DCE8')}>Cancelar</button>
                            <button onClick={handleAddActivity} disabled={addLoading} style={{ ...S.btn('#1B3A5C', '#FFFFFF', '#1E4D7B'), opacity: addLoading ? 0.7 : 1 }}>
                                {addLoading ? <span className="spinner" /> : 'Guardar Actividad'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedActivity && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(3px)' }} onClick={() => setSelectedActivity(null)}>
                    <div style={{ ...S.card, padding: 28, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: typeConfig[selectedActivity.type]?.color, textTransform: 'uppercase', letterSpacing: 1 }}>{typeConfig[selectedActivity.type]?.label}</div>
                                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: '#122240', marginTop: 4 }}>{selectedActivity.title}</div>
                            </div>
                            <button onClick={() => setSelectedActivity(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><Icon name="x" size={20} /></button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                            {[{ icon: 'calendar', label: 'Fecha', value: selectedActivity.date }, { icon: 'clock', label: 'Horario', value: selectedActivity.time }, { icon: 'mapPin', label: 'Lugar', value: selectedActivity.location }].map((d, i) => (
                                <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E8ECF3', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><Icon name={d.icon} size={14} color="#1E4D7B" /></div>
                                    <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>{d.label}</div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginTop: 2 }}>{d.value}</div>
                                </div>
                            ))}
                        </div>
                        {selectedActivity.description && <div style={{ fontSize: 13, color: '#475569', marginBottom: 20, lineHeight: 1.7, padding: 14, background: '#F8FAFC', borderRadius: 6, border: '1px solid #E8ECF3' }}>{selectedActivity.description}</div>}
                        <div style={{ marginBottom: 20 }}>
                            <div style={S.label}>Avance de la Actividad (Evidencia o Checklist)</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ flex: 1, height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 5, width: `${selectedActivity.progress}%`, background: selectedActivity.progress < 30 ? '#B91C1C' : selectedActivity.progress < 70 ? '#B45309' : '#15803D' }} /></div>
                                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 18 }}>{selectedActivity.progress}%</span>
                            </div>
                            <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>* El progreso aumenta un {selectedActivity.actions?.length > 0 ? Math.round(100 / Math.max(1, selectedActivity.actions.length)) : 25}% por cada acción completada (checklist o evidencia). {selectedActivity.actions?.length > 0 ? selectedActivity.actions.length : 4} acción(es) para 100%.</div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <div style={S.label}>Personal Asignado</div>
                            {selectedActivity.assigned.map(id => { const s = STAFF.find(x => x.id === id); return s ? <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #E8ECF3' }}><div style={{ width: 32, height: 32, borderRadius: 6, background: '#1B3A5C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>{s.initials}</div><div><div style={{ fontSize: 13, fontWeight: 700, color: '#122240' }}>{s.name}</div><div style={{ fontSize: 11, color: '#64748B' }}>{s.role}</div></div></div> : null; })}
                        </div>
                        {selectedActivity.actions?.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <div style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 6 }}>Acciones Estrategicas — Checklist <span style={{ fontSize: 9, background: '#1E4D7B', color: 'white', padding: '1px 6px', borderRadius: 3 }}>Click para completar</span></div>
                                {selectedActivity.actions.map((action, idx) => {
                                    const checkedActions = JSON.parse(localStorage.getItem(`agebatp_checklist_${selectedActivity.id}`) || '[]');
                                    const isChecked = checkedActions.includes(idx);
                                    return <div key={idx} onClick={(ev) => {
                                        ev.stopPropagation();
                                        const current = JSON.parse(localStorage.getItem(`agebatp_checklist_${selectedActivity.id}`) || '[]');
                                        let updated;
                                        if (current.includes(idx)) {
                                            updated = current.filter(i => i !== idx);
                                        } else {
                                            updated = [...current, idx];
                                        }
                                        localStorage.setItem(`agebatp_checklist_${selectedActivity.id}`, JSON.stringify(updated));
                                        // Recalculate progress: max(checklist%, evidence%)
                                        const totalAcciones = selectedActivity.actions.length;
                                        const checklistCount = updated.length;
                                        const evidenceCount = existingEvidence.length;
                                        const maxCompleted = Math.max(checklistCount, evidenceCount);
                                        const nuevoProgreso = Math.min(100, Math.round((maxCompleted / totalAcciones) * 100));
                                        // Update in activities state
                                        setActivities(prev => prev.map(a => a.id === selectedActivity.id ? { ...a, progress: nuevoProgreso } : a));
                                        // Also persist in localStorage override
                                        const overrides = JSON.parse(localStorage.getItem('agebatp_progress_override') || '{}');
                                        overrides[selectedActivity.id] = nuevoProgreso;
                                        localStorage.setItem('agebatp_progress_override', JSON.stringify(overrides));
                                        // Force re-render of the modal
                                        setSelectedActivity(prev => ({...prev, progress: nuevoProgreso}));
                                    }} style={{ display: 'flex', gap: 10, padding: '10px 8px', fontSize: 13, borderBottom: '1px solid #E8ECF3', color: isChecked ? '#15803D' : '#334155', cursor: 'pointer', background: isChecked ? '#F0FDF4' : 'transparent', borderRadius: 4, transition: 'all 0.15s', alignItems: 'center' }}>
                                        <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid ${isChecked ? '#15803D' : '#CBD5E1'}`, background: isChecked ? '#15803D' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>{isChecked && <span style={{ color: 'white', fontSize: 14, fontWeight: 700, lineHeight: 1 }}>✓</span>}</div>
                                        <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: '#1E4D7B', fontSize: 12, minWidth: 24, flexShrink: 0 }}>{String(idx + 1).padStart(2, '0')}</span>
                                        <span style={{ textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.7 : 1 }}>{action}</span>
                                    </div>;
                                })}
                            </div>
                        )}
                        {/* Evidence Upload Section */}
                        {canCreate && (
                            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '2px solid #F1F5F9' }}>
                                <div style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Icon name="upload" size={14} color="#1E4D7B" />
                                    Subir Evidencia de Avance <span style={{ fontSize: 9, background: '#1E4D7B', color: 'white', padding: '1px 5px', borderRadius: 3, marginLeft: 4 }}>OPCIONAL</span>
                                </div>
                                <FileAttachment
                                    files={evidenceFiles}
                                    onChange={setEvidenceFiles}
                                    label=""
                                    compact
                                />
                                <button
                                    onClick={() => handleUploadEvidence(selectedActivity)}
                                    disabled={evidenceLoading || evidenceFiles.length === 0}
                                    style={{ ...S.btn(evidenceFiles.length > 0 ? '#15803D' : '#94A3B8', '#FFFFFF'), marginTop: 10, width: '100%', justifyContent: 'center', opacity: evidenceLoading ? 0.7 : 1 }}
                                >
                                    {evidenceLoading ? <span className="spinner" /> : <><Icon name="upload" size={14} /> Subir {evidenceFiles.length} Evidencia(s)</>}
                                </button>
                                {existingEvidence.length > 0 && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Evidencias Registradas ({existingEvidence.length})</div>
                                        {existingEvidence.map((ev, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, marginBottom: 4, fontSize: 12, color: '#15803D' }}>
                                                <Icon name="check" size={14} color="#15803D" />
                                                <span style={{ flex: 1 }}>{ev.nombre_archivo || ev.filename || `Evidencia ${i + 1}`}</span>
                                                <span style={{ fontSize: 10, color: '#94A3B8' }}>{ev.fecha || ''}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL DETALLE EXPEDIENTE */}
            {selectedExpediente && (() => {
                const e = selectedExpediente;
                const expProgress = expEvidenceMap[e.id] ? 100 : 0;
                const isDone = expProgress >= 100;
                return (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 16, backdropFilter: 'blur(4px)' }} onClick={() => { setSelectedExpediente(null); setExpEvidenceFiles([]); }}>
                        <div onClick={ev => ev.stopPropagation()} style={{ background: '#FFF', borderRadius: 12, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
                            {/* Header */}
                            <div style={{ background: '#1B3A5C', padding: '18px 24px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color: '#94A3B8' }}>{e.id}</div>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF', marginTop: 2 }}>{e.asunto}</div>
                                </div>
                                <button onClick={() => { setSelectedExpediente(null); setExpEvidenceFiles([]); }} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 20, cursor: 'pointer', padding: 4 }}>&times;</button>
                            </div>
                            {/* Info */}
                            <div style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                    <div><div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Especialista</div><div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{e.especialista}</div></div>
                                    <div><div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Oficina</div><div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{e.oficina}</div></div>
                                    <div><div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Origen</div><div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{e.origen || '—'}</div></div>
                                    <div><div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vencimiento</div><div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>{e.fechaVencimiento ? formatDateDMY(e.fechaVencimiento) : '—'}</div></div>
                                </div>
                                {/* Progress */}
                                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 16, border: '1px solid #E2E8F0', marginBottom: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>Progreso de Evidencia</span>
                                        <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700, color: isDone ? '#15803D' : '#B91C1C' }}>{expProgress}%</span>
                                    </div>
                                    <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 4, width: `${expProgress}%`, background: isDone ? '#15803D' : '#B91C1C', transition: 'width 0.4s ease' }} />
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
                                        {isDone ? '✓ Evidencia enviada — Expediente completo' : 'Falta enviar 1 evidencia para completar el expediente'}
                                    </div>
                                </div>
                                {/* Upload evidence */}
                                {isDone ? (
                                    <div style={{ background: '#F0FDF4', borderRadius: 8, padding: 16, border: '1px solid #BBF7D0', textAlign: 'center' }}>
                                        <div style={{ fontSize: 32, marginBottom: 6 }}>✅</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>Evidencia Completada</div>
                                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>La evidencia fue subida exitosamente a Google Drive</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Subir Evidencia del Expediente</div>
                                        <FileAttachment files={expEvidenceFiles} onChange={setExpEvidenceFiles} maxFiles={1} compact label="Archivo de evidencia (1 archivo)" />
                                        <button
                                            disabled={expEvidenceFiles.length === 0 || expEvidenceLoading}
                                            onClick={async () => {
                                                if (expEvidenceFiles.length === 0) return;
                                                setExpEvidenceLoading(true);
                                                try {
                                                    await API.subirEvidenciaExpediente({
                                                        expediente_id: e.id,
                                                        asunto: e.asunto,
                                                        especialista: e.especialista,
                                                        archivos: expEvidenceFiles
                                                    });
                                                    setExpEvidenceMap(prev => ({ ...prev, [e.id]: true }));
                                                    setExpEvidenceFiles([]);
                                                    addToast(`Evidencia del expediente ${e.id} subida exitosamente — 100% completo`, 'success');
                                                } catch (err) {
                                                    addToast('Error al subir evidencia: ' + (err.message || 'Error desconocido'), 'error');
                                                } finally {
                                                    setExpEvidenceLoading(false);
                                                }
                                            }}
                                            style={{ ...S.btn(expEvidenceFiles.length === 0 ? '#94A3B8' : '#15803D', '#FFF'), width: '100%', marginTop: 12, padding: '12px 20px', fontSize: 13, opacity: expEvidenceFiles.length === 0 ? 0.6 : 1 }}
                                        >
                                            {expEvidenceLoading ? <><span className="spinner" style={{ marginRight: 8 }} />Subiendo...</> : '📤 Enviar Evidencia (100% al completar)'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* FOOTER */}
            <footer style={{ borderTop: '3px solid #CA8A04', background: '#0C1929', padding: '16px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 0.5 }}>Planificador Mensual AGEBATP - UGEL 03 - Unidad de Gestion Educativa Local</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Area de Gestion de la Educacion Basica y Tecnico Productiva - {monthNames[currentMonth]} {currentYear}</div>
            </footer>
        </div>
    );
}
