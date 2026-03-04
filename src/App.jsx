import { useState, useCallback, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { API } from './api/endpoints';
import Icon from './components/Icon';
import QRCode from './components/QRCode';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import MeetingRequest from './components/MeetingRequest';
import { STAFF, INITIAL_ACTIVITIES, EXPEDIENTES_POR_VENCER, EXPEDIENTES_EN_PLAZO, EXPEDIENTES_ELABORACION, priorityConfig, statusConfig, typeConfig, monthNames, dayNames, getDaysInMonth, getFirstDayOfMonth, fmtDate, todayStr } from './data/constants';

export default function App() {
    const { user, logout, isRole } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [activities, setActivities] = useState(INITIAL_ACTIVITIES);
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
    const [newActivity, setNewActivity] = useState({ title: '', type: 'estrategica', date: '', endDate: '', time: '', location: '', priority: 'media', assigned: [], description: '', actions: [''] });

    const [whatsappLog] = useState([
        { from: 'Liz Gutierrez', time: '08:32', msg: 'Confirmado asistencia al BIAE. Me encuentro en la I.E. Abraham Valdelomar N. 1150.', date: '2026-03-16', isYesterday: true },
        { from: 'Juan Quispe', time: '09:15', msg: 'Informe de supervision de I.E. completado. Se adjuntan evidencias fotograficas.', date: '2026-03-16', isYesterday: true },
        { from: 'Nelida Albino', time: '10:45', msg: 'En proceso de revision del expediente MPT2026-EXT-0145633. Estimado de cierre: hoy 15:00.', date: '2026-03-17', isYesterday: false },
        { from: 'Francisco Villalobos', time: '11:20', msg: 'Coordinacion con CETPRO completada. Modulos verificados segun normativa vigente.', date: '2026-03-17', isYesterday: false },
    ]);

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
        return f.sort((a, b) => a.date.localeCompare(b.date));
    }, [activities, searchTerm, staffFilter]);

    const stats = useMemo(() => ({ total: activities.length, completadas: activities.filter(a => a.status === 'completado').length, enProceso: activities.filter(a => a.status === 'en_proceso').length, pendientes: activities.filter(a => a.status === 'pendiente').length }), [activities]);

    const handleAddActivity = async () => {
        if (!newActivity.title || !newActivity.date) { addToast('Complete titulo y fecha', 'error'); return; }
        const actData = { ...newActivity, id: `ACT-${Date.now()}`, status: 'pendiente', progress: 0, endDate: newActivity.endDate || newActivity.date, actions: newActivity.actions.filter(a => a.trim()), created_by: user?.nombre || 'Admin' };
        setAddLoading(true);
        try {
            const result = await API.crearActividad(actData);
            if (result.success) {
                setActivities(prev => [...prev, actData]);
                setNewActivity({ title: '', type: 'estrategica', date: '', endDate: '', time: '', location: '', priority: 'media', assigned: [], description: '', actions: [''] });
                setShowAddModal(false);
                addToast('Actividad creada. Se notifico al personal asignado.', 'success');
            } else { addToast('Error al crear la actividad', 'error'); }
        } catch { addToast('Error de conexion con el servidor', 'error'); }
        setAddLoading(false);
    };

    const updateProgress = (actId, progress) => {
        setActivities(prev => prev.map(a => a.id === actId ? { ...a, progress, status: progress >= 100 ? 'completado' : progress > 0 ? 'en_proceso' : 'pendiente' } : a));
    };

    const exportToCSV = () => {
        const h = ['N', 'Actividad', 'Tipo', 'Fecha Inicio', 'Fecha Fin', 'Horario', 'Lugar', 'Prioridad', 'Estado', 'Avance', 'Personal', 'Descripcion'];
        const r = activities.map((a, i) => [i + 1, a.title, typeConfig[a.type]?.label, a.date, a.endDate || a.date, a.time, a.location, priorityConfig[a.priority]?.label, statusConfig[a.status]?.label, `${a.progress}%`, a.assigned.map(id => STAFF.find(s => s.id === id)?.name || '').join('; '), a.description]);
        const csv = [h, ...r].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Planificador_AGEBATP_${monthNames[currentMonth]}_${currentYear}.csv`; link.click();
    };

    const unreadNotifs = notifications.filter(n => !n.read).length;
    const canCreate = !user || isRole('admin');
    const canExport = !user || isRole('admin') || isRole('personal');

    const allTabs = [
        { id: 'calendario', label: 'Calendario', icon: 'calendar' },
        { id: 'actividades', label: 'Actividades', icon: 'list' },
        { id: 'personal', label: 'Personal', icon: 'users' },
        { id: 'expedientes', label: 'Expedientes', icon: 'folder' },
        { id: 'reuniones', label: 'Reuniones', icon: 'calendar', show: true },
        { id: 'whatsapp', label: 'Comunicaciones', icon: 'message' },
        { id: 'integraciones', label: 'Integraciones', icon: 'settings', show: !user || isRole('admin') }
    ];
    const tabs = allTabs.filter(t => t.show !== false);

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

            {/* AUTH MODALS */}
            {showLogin && <LoginForm onClose={() => setShowLogin(false)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />}
            {showRegister && <RegisterForm onClose={() => setShowRegister(false)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} />}

            {/* HEADER */}
            <header style={{ background: 'linear-gradient(180deg,#0C1929 0%,#122240 100%)', borderBottom: '3px solid #CA8A04', position: 'sticky', top: 0, zIndex: 50 }}>
                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 8, background: 'linear-gradient(135deg,#CA8A04,#A16207)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(202,138,4,0.3)' }}>
                            <Icon name="shield" size={22} color="#FFFFFF" />
                        </div>
                        <div>
                            <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 19, color: '#FFFFFF', letterSpacing: 0.2 }}>Planificador Mensual AGEBATP</div>
                            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>UGEL 03 - Unidad de Gestion Educativa Local</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => setShowQR(true)} style={S.btn('rgba(255,255,255,0.06)', '#E2E8F0', 'rgba(255,255,255,0.15)')}><Icon name="qrcode" size={14} />Acceso QR</button>
                        {canExport && <button onClick={exportToCSV} style={S.btn('rgba(255,255,255,0.06)', '#E2E8F0', 'rgba(255,255,255,0.15)')}><Icon name="download" size={14} />Exportar</button>}
                        {canCreate && <button onClick={() => setShowAddModal(true)} style={S.btn('#1E4D7B', '#FFFFFF', '#2563A0')}><Icon name="plus" size={14} />Nueva Actividad</button>}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowNotifPanel(!showNotifPanel)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Icon name="bell" size={14} />
                                {unreadNotifs > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#B91C1C', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0C1929' }}>{unreadNotifs}</span>}
                            </button>
                        </div>
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#1B3A5C', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{user.nombre?.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                                <div><div style={{ fontSize: 11, color: '#E2E8F0', fontWeight: 600 }}>{user.nombre?.split(' ').slice(0, 2).join(' ')}</div><div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase' }}>{user.rol}</div></div>
                                <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#E2E8F0', cursor: 'pointer' }}><Icon name="logOut" size={14} /></button>
                            </div>
                        ) : (
                            <button onClick={() => setShowLogin(true)} style={S.btn('rgba(255,255,255,0.06)', '#E2E8F0', 'rgba(255,255,255,0.15)')}><Icon name="logIn" size={14} />Ingresar</button>
                        )}
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
                    <div style={{ ...S.card, padding: 36, textAlign: 'center', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: '#122240', marginBottom: 20 }}>Acceso Movil al Planificador</h3>
                        <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 8, display: 'inline-block', border: '1px solid #D6DCE8' }}><QRCode text="https://planificador.xv74e4.easypanel.host" size={200} /></div>
                        <div style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>Escanee el codigo o acceda directamente:</div>
                            <a href="https://planificador.xv74e4.easypanel.host" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600, color: '#1E4D7B', textDecoration: 'none', padding: '6px 14px', borderRadius: 6, border: '1px solid #DBEAFE', background: '#EFF6FF', display: 'inline-block' }}>planificador.xv74e4.easypanel.host</a>
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
                        { n: EXPEDIENTES_POR_VENCER.length, label: 'Exp. por Vencer', color: '#B91C1C' },
                        { n: EXPEDIENTES_EN_PLAZO.length, label: 'Exp. en Plazo', color: '#B45309' },
                        { n: EXPEDIENTES_ELABORACION.length, label: 'En Elaboracion', color: '#1E4D7B' },
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
                            <div style={S.sectionTitle}><Icon name="users" size={16} color="#1E4D7B" />Equipo AGEBATP - Monitoreo Diario</div>
                            {STAFF.map(s => {
                                const sa = activities.filter(a => a.assigned.includes(s.id));
                                const avg = sa.length ? Math.round(sa.reduce((sum, a) => sum + a.progress, 0) / sa.length) : 0;
                                return (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, ...S.card, marginBottom: 8 }}>
                                        <div style={{ width: 42, height: 42, borderRadius: 6, background: '#1B3A5C', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{s.initials}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: '#122240' }}>{s.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748B' }}>{s.role}</div>
                                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{sa.length} actividad{sa.length !== 1 ? 'es' : ''} | Avance: {avg}%</div>
                                            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, width: `${avg}%`, background: avg < 30 ? '#B91C1C' : avg < 70 ? '#B45309' : '#15803D' }} /></div>
                                        </div>
                                        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 22, fontWeight: 700, color: avg < 30 ? '#B91C1C' : avg < 70 ? '#B45309' : '#15803D' }}>{avg}%</div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={S.card}>
                            <div style={S.sectionTitle}><Icon name="barChart" size={16} color="#1E4D7B" />Resumen del Equipo</div>
                            <div style={{ textAlign: 'center', padding: 20 }}><div style={{ fontSize: 52, fontWeight: 700, fontFamily: "'JetBrains Mono'", color: '#1B3A5C' }}>{STAFF.length}</div><div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 6 }}>Personal Activo</div></div>
                        </div>
                    </div>
                )}

                {/* EXPEDIENTES */}
                {activeTab === 'expedientes' && (
                    <div>
                        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                            {[{ key: 'vencer', label: 'Por Vencer', count: EXPEDIENTES_POR_VENCER.length }, { key: 'plazo', label: 'Dentro del Plazo', count: EXPEDIENTES_EN_PLAZO.length }, { key: 'elaboracion', label: 'En Elaboracion', count: EXPEDIENTES_ELABORACION.length }].map(t => (
                                <button key={t.key} onClick={() => setViewExpedientes(t.key)} style={{ ...S.btn(viewExpedientes === t.key ? '#1B3A5C' : '#FFFFFF', viewExpedientes === t.key ? '#FFFFFF' : '#475569', viewExpedientes === t.key ? '#1B3A5C' : '#D6DCE8') }}>{t.label} <span style={{ minWidth: 22, height: 22, borderRadius: 4, background: viewExpedientes === t.key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{t.count}</span></button>
                            ))}
                        </div>
                        {(viewExpedientes === 'vencer' ? EXPEDIENTES_POR_VENCER : viewExpedientes === 'plazo' ? EXPEDIENTES_EN_PLAZO : EXPEDIENTES_ELABORACION).map(e => (
                            <div key={e.id} style={{ ...S.card, borderLeft: `4px solid ${viewExpedientes === 'vencer' ? '#B91C1C' : viewExpedientes === 'plazo' ? '#B45309' : '#1E4D7B'}`, padding: 14, marginBottom: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: 8 }}>
                                    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#1E4D7B', fontWeight: 600 }}>{e.id}</div>
                                    {e.diasVigentes != null && <span style={S.badge(viewExpedientes === 'vencer' ? '#FEF2F2' : '#FFFBEB', viewExpedientes === 'vencer' ? '#B91C1C' : '#B45309', viewExpedientes === 'vencer' ? '#FECACA' : '#FDE68A')}>{viewExpedientes === 'vencer' ? `Vence en ${e.diasVigentes} dias` : `${e.diasVigentes} dias restantes`}</span>}
                                </div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '4px 0' }}>{e.asunto}</div>
                                <div style={{ display: 'flex', gap: 16, color: '#64748B', fontSize: 11, flexWrap: 'wrap' }}><span>Especialista: {e.especialista}</span><span>Oficina: {e.oficina}</span>{e.fechaVencimiento && <span>Vencimiento: {e.fechaVencimiento}</span>}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* REUNIONES */}
                {activeTab === 'reuniones' && <MeetingRequest onToast={addToast} />}

                {/* COMUNICACIONES */}
                {activeTab === 'whatsapp' && (
                    <div className="grid-comms" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
                        <div style={S.card}>
                            <div style={S.sectionTitle}><Icon name="message" size={16} color="#1E4D7B" />Canal de Comunicaciones - Evolution API</div>
                            <div style={{ marginBottom: 14, padding: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, fontSize: 12, color: '#15803D', fontWeight: 600 }}>Conexion activa - Evolution API + N8N EasyPanel</div>
                            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                                {whatsappLog.map((msg, i) => (
                                    <div key={i} style={{ padding: '12px 16px', borderRadius: 8, marginBottom: 10, maxWidth: '85%', fontSize: 13, lineHeight: 1.6, background: msg.isYesterday ? '#FEF9C3' : '#F8FAFC', border: `1px solid ${msg.isYesterday ? '#FDE68A' : '#E8ECF3'}` }}>
                                        {msg.isYesterday && <div style={{ fontSize: 9, fontWeight: 700, color: '#A16207', background: '#FEF9C3', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 3, display: 'inline-block', marginBottom: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>Avance del dia anterior</div>}
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1B3A5C', marginBottom: 3 }}>{msg.from}</div>
                                        <div>{msg.msg}</div>
                                        <div style={{ fontSize: 10, color: '#94A3B8', textAlign: 'right', marginTop: 6 }}>{msg.date} - {msg.time} hrs.</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={S.card}>
                            <div style={S.sectionTitle}><Icon name="alert" size={16} color="#1E4D7B" />Reglas de Alerta Automatica</div>
                            {[{ label: 'Expedientes proximos a vencer', freq: 'Notificacion diaria', color: '#B91C1C' }, { label: 'Actividades pendientes', freq: '48 horas antes del evento', color: '#B45309' }, { label: 'Solicitud de avance diario', freq: 'Todos los dias a las 08:00', color: '#1E4D7B' }].map((rule, i) => (
                                <div key={i} style={{ padding: '10px 0', borderBottom: i < 2 ? '1px solid #E8ECF3' : 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: rule.color }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{rule.label}</span></div><div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2, paddingLeft: 16 }}>{rule.freq}</div></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* INTEGRACIONES */}
                {activeTab === 'integraciones' && (
                    <div className="integrations-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 16 }}>
                        {[
                            { icon: 'settings', title: 'N8N - EasyPanel', desc: 'Motor de automatizacion que orquesta todos los flujos del planificador.', code: '# Webhook del planificador\nPOST /webhook/RavsBot\nPOST /webhook/agebatp-nueva-actividad\nPOST /webhook/agebatp-auth-login\nPOST /webhook/agebatp-solicitar-reunion' },
                            { icon: 'message', title: 'Evolution API - WhatsApp Business', desc: 'Interfaz de mensajeria para enviar y recibir comunicaciones del personal administrativo.', code: '# Instancia\nEndpoint: /message/sendText/{instance}\n# Capacidades:\n- Alertas de vencimiento\n- Confirmaciones de avance\n- Documentos adjuntos' },
                            { icon: 'mail', title: 'Notificaciones por Correo', desc: 'Alertas por correo electronico configurado en N8N mediante SMTP institucional.' },
                            { icon: 'download', title: 'Exportacion a Excel', desc: 'Descarga del planificador mensual en formato CSV compatible con Excel.', hasExport: true },
                        ].map((item, i) => (
                            <div key={i} style={S.card}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#122240', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}><Icon name={item.icon} size={16} color="#1E4D7B" />{item.title}</h3>
                                <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.7 }}>{item.desc}</p>
                                {item.code && <div style={{ background: '#0C1929', borderRadius: 6, padding: '14px 16px', fontFamily: "'JetBrains Mono'", fontSize: 11, color: '#93C5FD', marginTop: 12, lineHeight: 1.7, border: '1px solid #1B3A5C' }}><pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.code}</pre></div>}
                                {item.hasExport && <button onClick={exportToCSV} style={{ marginTop: 14, ...S.btn('#1B3A5C', 'white', '#1E4D7B') }}><Icon name="download" size={14} color="white" />Descargar {monthNames[currentMonth]} {currentYear}</button>}
                            </div>
                        ))}
                    </div>
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
                            <div><label style={S.label}>Horario</label><input placeholder="Ej: 08:30 - 13:00" value={newActivity.time} onChange={e => setNewActivity({ ...newActivity, time: e.target.value })} style={S.input} /></div>
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
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #E8ECF3' }}>
                            <button onClick={() => setShowAddModal(false)} style={S.btn('#FFFFFF', '#475569', '#D6DCE8')}>Cancelar</button>
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
                            <div style={S.label}>Avance de la Actividad</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{ flex: 1, height: 10, background: '#F1F5F9', borderRadius: 5, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 5, width: `${selectedActivity.progress}%`, background: selectedActivity.progress < 30 ? '#B91C1C' : selectedActivity.progress < 70 ? '#B45309' : '#15803D' }} /></div>
                                <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 18 }}>{selectedActivity.progress}%</span>
                            </div>
                            <input type="range" min="0" max="100" value={selectedActivity.progress} onChange={e => { const v = parseInt(e.target.value); updateProgress(selectedActivity.id, v); setSelectedActivity({ ...selectedActivity, progress: v }); }} style={{ width: '100%', marginTop: 8, accentColor: '#1E4D7B' }} />
                        </div>
                        <div style={{ marginBottom: 20 }}>
                            <div style={S.label}>Personal Asignado</div>
                            {selectedActivity.assigned.map(id => { const s = STAFF.find(x => x.id === id); return s ? <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #E8ECF3' }}><div style={{ width: 32, height: 32, borderRadius: 6, background: '#1B3A5C', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10 }}>{s.initials}</div><div><div style={{ fontSize: 13, fontWeight: 700, color: '#122240' }}>{s.name}</div><div style={{ fontSize: 11, color: '#64748B' }}>{s.role}</div></div></div> : null; })}
                        </div>
                        {selectedActivity.actions?.length > 0 && (
                            <div>
                                <div style={S.label}>Acciones Estrategicas</div>
                                {selectedActivity.actions.map((action, idx) => <div key={idx} style={{ display: 'flex', gap: 10, padding: '8px 0', fontSize: 13, borderBottom: '1px solid #E8ECF3', color: '#334155' }}><span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, color: '#1E4D7B', fontSize: 12, minWidth: 24 }}>{String(idx + 1).padStart(2, '0')}</span>{action}</div>)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer style={{ borderTop: '3px solid #CA8A04', background: '#0C1929', padding: '16px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', letterSpacing: 0.5 }}>Planificador Mensual AGEBATP - UGEL 03 - Unidad de Gestion Educativa Local</div>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>Area de Gestion de la Educacion Basica y Tecnico Productiva - {monthNames[currentMonth]} {currentYear}</div>
            </footer>
        </div>
    );
}
