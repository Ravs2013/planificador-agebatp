import { useState } from 'react';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';

export default function LoginForm({ onSwitchToRegister, onClose }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Complete todos los campos'); return; }
        setLoading(true);
        setError('');
        try {
            const result = await login(email, password);
            if (result.success) {
                onClose();
            } else {
                setError(result.message || 'Credenciales incorrectas');
            }
        } catch {
            setError('Error de conexion con el servidor');
        }
        setLoading(false);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(6px)' }}>
            <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 36, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(15,23,42,0.25)', animation: 'fadeIn 0.25s ease' }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <img src="/logo-agebatp.jpeg" alt="Logo AGEBATP - UGEL 03" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', boxShadow: '0 4px 12px rgba(15,23,42,0.15)', marginBottom: 16, border: '2px solid #E2E8F0' }} />
                    <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 22, color: '#122240' }}>Acceso al Sistema</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 }}>Planificador AGEBATP — UGEL 03</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Correo Electronico</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@ugel03.gob.pe"
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 6, border: '1px solid #D6DCE8', fontSize: 13, fontFamily: "'DM Sans'" }} />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>Contrasena</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Ingrese su contrasena"
                            style={{ width: '100%', padding: '11px 14px', borderRadius: 6, border: '1px solid #D6DCE8', fontSize: 13, fontFamily: "'DM Sans'" }} />
                    </div>

                    {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#B91C1C', fontSize: 12, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

                    <button type="submit" disabled={loading}
                        style={{ width: '100%', padding: '12px 20px', borderRadius: 6, border: 'none', background: '#1B3A5C', color: '#FFFFFF', fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
                        {loading ? <span className="spinner" /> : <><Icon name="logIn" size={16} color="#fff" /> Ingresar al Sistema</>}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid #E8ECF3' }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>No tiene cuenta? </span>
                    <button onClick={onSwitchToRegister} style={{ background: 'none', border: 'none', color: '#1E4D7B', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans'" }}>Registrarse</button>
                </div>
            </div>
        </div>
    );
}
