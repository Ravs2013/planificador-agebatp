import { useState } from "react";
import Icon from "./Icon";
import { useAuth } from "../context/AuthContext";

const C = {
    navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
    gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
    g900: "#0F172A", g800: "#1E293B", g700: "#334155", g600: "#475569",
    g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
    g100: "#F1F5F9", g50: "#F8FAFC",
    red: "#B91C1C", amber: "#B45309", green: "#15803D",
    white: "#FFFFFF",
};

export default function ChangePasswordScreen() {
    const { changePassword, logout } = useAuth();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Todos los campos son obligatorios.");
            return;
        }

        if (newPassword.length < 6) {
            setError("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (newPassword === oldPassword) {
            setError("La nueva contraseña no puede ser igual a la anterior.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las nuevas contraseñas no coinciden.");
            return;
        }

        setLoading(true);
        try {
            const res = await changePassword(oldPassword, newPassword);
            if (res.success) {
                setSuccess("Contraseña cambiada con éxito. Redirigiendo...");
                // Automatically redirect happens in App.jsx because mustChangePassword becomes false
            } else {
                setError(res.message || "Error al cambiar la contraseña. Verifique sus datos.");
            }
        } catch (err) {
            setError("Ocurrió un error inesperado. Inténtelo más tarde.");
        }
        setLoading(false);
    };

    const inp = (extra) => ({
        width: "100%",
        padding: "12px 14px 12px 42px",
        borderRadius: 8,
        border: `1.5px solid ${C.g300}`,
        background: C.white,
        color: C.g900,
        fontSize: "0.9rem",
        outline: "none",
        transition: "border-color 0.2s",
        fontFamily: "'DM Sans',sans-serif",
        boxSizing: "border-box",
        ...extra
    });

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(160deg, ${C.navy1} 0%, ${C.navy2} 40%, ${C.navy3} 100%)` }}>
            <div style={{ width: "100%", maxWidth: 420, background: C.white, borderRadius: 16, padding: "44px 36px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, borderRadius: "16px 16px 0 0", background: `linear-gradient(90deg, ${C.gold1}, ${C.gold2}, ${C.gold1})` }} />
                
                <div style={{ textAlign: "center", marginBottom: 24 }}>
                    <img src="/logo-agebatp.jpeg" alt="Logo AGEBATP" style={{ width: 64, height: 64, borderRadius: 14, margin: "0 auto 14px", objectFit: "cover", boxShadow: `0 4px 12px ${C.gold2}40`, display: "block", border: `2px solid ${C.g200}` }} />
                    <h1 style={{ color: C.navy1, fontSize: "1.4rem", fontFamily: "'DM Serif Display',serif", fontWeight: 400, margin: 0 }}>Cambio de Contraseña Obligatorio</h1>
                    <p style={{ color: C.g500, fontSize: "0.85rem", marginTop: 6, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.4 }}>
                        Por motivos de seguridad, debe cambiar la contraseña temporal asignada a su cuenta antes de continuar.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Contraseña Actual */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", color: C.g600, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Sans'" }}>Contraseña Temporal (DNI)</label>
                        <div style={{ position: "relative" }}>
                            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                                <Icon name="lock" size={18} color={C.g400} />
                            </div>
                            <input
                                type={showPw.old ? "text" : "password"}
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                placeholder="Ingrese DNI"
                                style={inp({ paddingRight: 42 })}
                                onFocus={e => e.target.style.borderColor = C.navy4}
                                onBlur={e => e.target.style.borderColor = C.g300}
                            />
                            <button type="button" onClick={() => setShowPw(prev => ({ ...prev, old: !prev.old }))} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                                <Icon name={showPw.old ? "eyeOff" : "eye"} size={18} color={C.g400} />
                            </button>
                        </div>
                    </div>

                    {/* Nueva Contraseña */}
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", color: C.g600, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Sans'" }}>Nueva Contraseña</label>
                        <div style={{ position: "relative" }}>
                            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                                <Icon name="lock" size={18} color={C.g400} />
                            </div>
                            <input
                                type={showPw.new ? "text" : "password"}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                style={inp({ paddingRight: 42 })}
                                onFocus={e => e.target.style.borderColor = C.navy4}
                                onBlur={e => e.target.style.borderColor = C.g300}
                            />
                            <button type="button" onClick={() => setShowPw(prev => ({ ...prev, new: !prev.new }))} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                                <Icon name={showPw.new ? "eyeOff" : "eye"} size={18} color={C.g400} />
                            </button>
                        </div>
                    </div>

                    {/* Confirmar Nueva Contraseña */}
                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: "block", color: C.g600, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontFamily: "'DM Sans'" }}>Confirmar Nueva Contraseña</label>
                        <div style={{ position: "relative" }}>
                            <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                                <Icon name="lock" size={18} color={C.g400} />
                            </div>
                            <input
                                type={showPw.confirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repita la nueva contraseña"
                                style={inp({ paddingRight: 42 })}
                                onFocus={e => e.target.style.borderColor = C.navy4}
                                onBlur={e => e.target.style.borderColor = C.g300}
                            />
                            <button type="button" onClick={() => setShowPw(prev => ({ ...prev, confirm: !prev.confirm }))} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                                <Icon name={showPw.confirm ? "eyeOff" : "eye"} size={18} color={C.g400} />
                            </button>
                        </div>
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 18, background: "#FEF2F2", border: "1px solid #FECACA", color: C.red, fontSize: "0.83rem", display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans'" }}>
                            <Icon name="alert" size={16} color={C.red} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 18, background: "#F0FDF4", border: "1px solid #BBF7D0", color: C.green, fontSize: "0.83rem", display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans'" }}>
                            <Icon name="check" size={16} color={C.green} />
                            {success}
                        </div>
                    )}

                    {/* Action buttons */}
                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: 8, border: "none", cursor: loading ? "wait" : "pointer", background: `linear-gradient(135deg, ${C.navy3}, ${C.navy4})`, color: C.white, fontSize: "0.92rem", fontWeight: 600, fontFamily: "'DM Sans'", boxShadow: "0 4px 12px rgba(30,77,123,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Cambiando contraseña..." : "Cambiar Contraseña"}
                    </button>
                    
                    <button type="button" onClick={logout} style={{ width: "100%", marginTop: 12, padding: "11px", borderRadius: 8, border: `1.5px solid ${C.g300}`, cursor: "pointer", background: C.white, color: C.g600, fontSize: "0.88rem", fontWeight: 600, fontFamily: "'DM Sans'", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <Icon name="logOut" size={14} /> Cerrar Sesión
                    </button>
                </form>
            </div>
        </div>
    );
}
