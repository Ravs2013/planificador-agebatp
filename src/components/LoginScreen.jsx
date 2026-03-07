import { useState } from "react";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";

/* ═══════════════════════════════════════════════════════════
   PALETA GUBERNAMENTAL UGEL 03 — AGEBATP
   ═══════════════════════════════════════════════════════════ */
const C = {
    navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
    gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
    g900: "#0F172A", g800: "#1E293B", g700: "#334155", g600: "#475569",
    g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
    g100: "#F1F5F9", g50: "#F8FAFC",
    bg: "#F5F6FA",
    red: "#B91C1C", amber: "#B45309", green: "#15803D",
    white: "#FFFFFF",
};

export default function LoginScreen() {
    const { login, register } = useAuth();
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [mode, setMode] = useState("login");
    const [reg, setReg] = useState({ nombre: "", email: "", telefono: "", cargo: "", institucion: "", password: "", confirm: "" });
    const [errorObj, setErrorObj] = useState(null); // { type: 'login' | 'register', msg: '' }
    const [loading, setLoading] = useState(false);

    const submitLogin = async () => {
        if (!email || !pw) {
            setErrorObj({ type: 'login', msg: "Complete todos los campos del login." });
            return;
        }
        setLoading(true);
        setErrorObj(null);
        try {
            const result = await login(email, pw);
            if (!result.success) {
                setErrorObj({ type: 'login', msg: result.message || "Credenciales incorrectas" });
            }
        } catch {
            setErrorObj({ type: 'login', msg: "Error de conexion con el servidor" });
        }
        setLoading(false);
    };

    const submitRegister = async () => {
        if (!reg.nombre || !reg.email || !reg.password) {
            setErrorObj({ type: 'register', msg: "Nombre, correo y contraseña obligatorios." });
            return;
        }
        if (reg.password !== reg.confirm) {
            setErrorObj({ type: 'register', msg: "Las contraseñas no coinciden." });
            return;
        }
        if (reg.password.length < 6) {
            setErrorObj({ type: 'register', msg: "Mínimo 6 caracteres en la contraseña." });
            return;
        }

        setLoading(true);
        setErrorObj(null);
        try {
            const result = await register({
                nombre: reg.nombre,
                email: reg.email,
                telefono: reg.telefono,
                cargo: reg.cargo,
                institucion: reg.institucion,
                password: reg.password
            });

            if (result.success) {
                // Si el registro fue exitoso cambia al modo login para que el usuario ingrese
                setMode("login");
                setEmail(reg.email);
                setPw("");
                setErrorObj({ type: 'login', msg: "Registro exitoso. Por favor inicie sesión." }); // Show success on login screen
            } else {
                setErrorObj({ type: 'register', msg: result.message || 'El registro falló.' });
            }
        } catch {
            setErrorObj({ type: 'register', msg: "Error de conexion con el servidor" });
        }
        setLoading(false);
    };

    const inp = (extra) => ({ width: "100%", padding: "12px 14px 12px 42px", borderRadius: 8, border: `1.5px solid ${C.g300}`, background: C.white, color: C.g900, fontSize: "0.9rem", outline: "none", transition: "border-color 0.2s", fontFamily: "'DM Sans',sans-serif", boxSizing: "border-box", ...extra });

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 40%, ${C.navy3} 100%)` }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
            <div style={{ width: "100%", maxWidth: mode === "register" ? 460 : 400, background: C.white, borderRadius: 16, padding: "44px 36px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, borderRadius: "16px 16px 0 0", background: `linear-gradient(90deg, ${C.gold1}, ${C.gold2}, ${C.gold1})` }} />
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px", background: `linear-gradient(135deg, ${C.gold2}, ${C.gold1})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${C.gold2}40` }}>
                        <Icon name="shield" size={28} color={C.white} />
                    </div>
                    <h1 style={{ color: C.navy1, fontSize: "1.6rem", fontFamily: "'DM Serif Display',serif", fontWeight: 400, margin: 0 }}>Acceso al Sistema</h1>
                    <p style={{ color: C.g500, fontSize: "0.85rem", marginTop: 4, fontFamily: "'DM Sans',sans-serif" }}>Planificador AGEBATP — UGEL 03</p>
                </div>

                {mode === "login" ? (
                    <>
                        <div style={{ marginBottom: 18 }}>
                            <label style={{ display: "block", color: C.g600, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Sans'" }}>Correo Electrónico</label>
                            <div style={{ position: "relative" }}>
                                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                                    <Icon name="mail" size={18} color={C.g400} />
                                </div>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submitLogin()} placeholder="correo@ugel03.gob.pe" style={inp()} onFocus={e => e.target.style.borderColor = C.navy4} onBlur={e => e.target.style.borderColor = C.g300} />
                            </div>
                        </div>
                        <div style={{ marginBottom: 22 }}>
                            <label style={{ display: "block", color: C.g600, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Sans'" }}>Contraseña</label>
                            <div style={{ position: "relative" }}>
                                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                                    <Icon name="lock" size={18} color={C.g400} />
                                </div>
                                <input type={showPw ? "text" : "password"} value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submitLogin()} placeholder="........" style={inp({ paddingRight: 42 })} onFocus={e => e.target.style.borderColor = C.navy4} onBlur={e => e.target.style.borderColor = C.g300} />
                                <button onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                                    <Icon name={showPw ? "eyeOff" : "eye"} size={18} color={C.g400} />
                                </button>
                            </div>
                        </div>

                        {errorObj && errorObj.type === 'login' && (
                            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 18, background: errorObj.msg.includes('exitoso') ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${errorObj.msg.includes('exitoso') ? "#BBF7D0" : "#FECACA"}`, color: errorObj.msg.includes('exitoso') ? C.green : C.red, fontSize: "0.83rem", display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans'" }}>
                                {errorObj.msg.includes('exitoso') ? <Icon name="check" size={16} color={C.green} /> : <Icon name="alert" size={16} color={C.red} />}
                                {errorObj.msg}
                            </div>
                        )}

                        <button onClick={submitLogin} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: loading ? "wait" : "pointer", background: `linear-gradient(135deg, ${C.navy3}, ${C.navy4})`, color: C.white, fontSize: "0.92rem", fontWeight: 600, fontFamily: "'DM Sans'", boxShadow: "0 4px 12px rgba(30,77,123,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Verificando..." : "Ingresar al Sistema"}
                        </button>
                        <p style={{ textAlign: "center", marginTop: 22, color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>¿No tiene cuenta? <span onClick={() => { setMode("register"); setErrorObj(null); }} style={{ color: C.navy4, cursor: "pointer", fontWeight: 700 }}>Registrarse</span></p>
                    </>
                ) : (
                    <>
                        {[
                            { k: "nombre", l: "Nombre Completo *", t: "text" },
                            { k: "email", l: "Correo Electrónico *", t: "email" },
                            { k: "telefono", l: "Teléfono", t: "text" },
                            { k: "cargo", l: "Cargo", t: "text" },
                            { k: "institucion", l: "Institución", t: "text" }
                        ].map(f => (
                            <div key={f.k} style={{ marginBottom: 12 }}>
                                <label style={{ display: "block", color: C.g600, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'DM Sans'" }}>{f.l}</label>
                                <input type={f.t} value={reg[f.k]} onChange={e => setReg({ ...reg, [f.k]: e.target.value })} style={inp({ paddingLeft: 14 })} onFocus={e => e.target.style.borderColor = C.navy4} onBlur={e => e.target.style.borderColor = C.g300} />
                            </div>
                        ))}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                            {[
                                { k: "password", l: "Contraseña *" },
                                { k: "confirm", l: "Confirmar *" }
                            ].map(f => (
                                <div key={f.k}>
                                    <label style={{ display: "block", color: C.g600, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5, fontFamily: "'DM Sans'" }}>{f.l}</label>
                                    <input type="password" value={reg[f.k]} onChange={e => setReg({ ...reg, [f.k]: e.target.value })} style={inp({ paddingLeft: 14 })} onFocus={e => e.target.style.borderColor = C.navy4} onBlur={e => e.target.style.borderColor = C.g300} />
                                </div>
                            ))}
                        </div>

                        {errorObj && errorObj.type === 'register' && (
                            <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, background: "#FEF2F2", border: "1px solid #FECACA", color: C.red, fontSize: "0.8rem", fontFamily: "'DM Sans'", display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Icon name="alert" size={16} color={C.red} /> {errorObj.msg}
                            </div>
                        )}

                        <button onClick={submitRegister} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: loading ? "wait" : "pointer", background: `linear-gradient(135deg, ${C.navy3}, ${C.navy4})`, color: C.white, fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans'", boxShadow: "0 4px 12px rgba(30,77,123,0.3)", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Creando..." : "Crear Cuenta"}
                        </button>
                        <p style={{ textAlign: "center", marginTop: 16, color: C.g500, fontSize: "0.85rem", fontFamily: "'DM Sans'" }}>¿Ya tiene cuenta? <span onClick={() => { setMode("login"); setErrorObj(null); }} style={{ color: C.navy4, cursor: "pointer", fontWeight: 700 }}>Iniciar Sesión</span></p>
                    </>
                )}
            </div>
        </div>
    );
}
