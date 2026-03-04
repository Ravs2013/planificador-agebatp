import { useState } from 'react';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

export default function RegisterForm({ onSwitchToLogin, onClose }) {
    const { register } = useAuth();
    const [form, setForm] = useState({ nombre: '', email: '', telefono: '', cargo: '', institucion: '', password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const upd = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.email || !form.password) { setError('Complete los campos obligatorios'); return; }
        if (form.password !== form.confirmPassword) { setError('Las contrasenas no coinciden'); return; }
        if (form.password.length < 6) { setError('La contrasena debe tener al menos 6 caracteres'); return; }
        setLoading(true); setError('');
        try {
            const result = await register({ nombre: form.nombre, email: form.email, telefono: form.telefono, cargo: form.cargo, institucion: form.institucion, password: form.password });
            if (result.success) { setSuccess(true); } else { setError(result.message || 'Error en el registro'); }
        } catch { setError('Error de conexion con el servidor'); }
        setLoading(false);
    };

    if (success) {
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
                <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 36, width: '100%', maxWidth: 420, textAlign: 'center', animation: 'fadeIn 0.25s ease' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F0FDF4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Icon name="check" size={28} color="#15803D" />
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: '#122240', marginBottom: 8 }}>Registro Exitoso</div>
                    <div style={{ fontSize: 13, color: '#64748B', marginBottom: 24 }}>Su cuenta ha sido creada como usuario publico. Ahora puede iniciar sesion.</div>
                    <button onClick={onSwitchToLogin} style={{ padding: '10px 24px', borderRadius: 6, border: 'none', background: '#1B3A5C', color: '#FFFFFF', fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans'" }}>Iniciar Sesion</button>
                </div>
            </div>
        );
    }

    const fieldStyle = { width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #D6DCE8', fontSize: 13, fontFamily: "'DM Sans'" };
    const labelStyle = { fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.6 };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(6px)', padding: 20 }}>
            <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 32, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(15,23,42,0.25)', animation: 'fadeIn 0.25s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: '#122240' }}>Registro de Usuario</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Acceso publico al Planificador AGEBATP</div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 14 }}><label style={labelStyle}>Nombre Completo *</label><input value={form.nombre} onChange={e => upd('nombre', e.target.value)} placeholder="Nombre y apellidos" style={fieldStyle} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div><label style={labelStyle}>Correo Electronico *</label><input type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="correo@institucion.gob.pe" style={fieldStyle} /></div>
                        <div><label style={labelStyle}>Telefono</label><input value={form.telefono} onChange={e => upd('telefono', e.target.value)} placeholder="51999999999" style={fieldStyle} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                        <div><label style={labelStyle}>Cargo</label><input value={form.cargo} onChange={e => upd('cargo', e.target.value)} placeholder="Director, Coordinador..." style={fieldStyle} /></div>
                        <div><label style={labelStyle}>Institucion</label><input value={form.institucion} onChange={e => upd('institucion', e.target.value)} placeholder="I.E., UGEL, DRE..." style={fieldStyle} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                        <div><label style={labelStyle}>Contrasena *</label><input type="password" value={form.password} onChange={e => upd('password', e.target.value)} placeholder="Min. 6 caracteres" style={fieldStyle} /></div>
                        <div><label style={labelStyle}>Confirmar *</label><input type="password" value={form.confirmPassword} onChange={e => upd('confirmPassword', e.target.value)} placeholder="Repita contrasena" style={fieldStyle} /></div>
                    </div>
                    {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#B91C1C', fontSize: 12, fontWeight: 600, marginBottom: 14 }}>{error}</div>}
                    <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 20px', borderRadius: 6, border: 'none', background: '#1B3A5C', color: '#FFFFFF', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                        {loading ? <span className="spinner" /> : <><Icon name="userPlus" size={16} color="#fff" /> Crear Cuenta</>}
                    </button>
                </form>
                <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #E8ECF3' }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Ya tiene cuenta? </span>
                    <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#1E4D7B', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans'" }}>Iniciar Sesion</button>
                </div>
            </div>
        </div>
    );
}
