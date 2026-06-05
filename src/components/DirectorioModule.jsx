import { useState, useEffect } from "react";
import DirectorioCEBA from "./DirectorioCEBA";
import DirectorioCETPRO from "./DirectorioCETPRO";
import { subscribeConfig, setConfig } from "../firebase/db";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";

export default function DirectorioModule() {
    const { user, isRole } = useAuth();
    const [activeSubTab, setActiveSubTab] = useState("ceba");
    const [labels, setLabels] = useState({ cebaLabel: "CEBA", cetproLabel: "CETPRO" });
    const [showEditModal, setShowEditModal] = useState(false);
    const [tempCebaLabel, setTempCebaLabel] = useState("");
    const [tempCetproLabel, setTempCetproLabel] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user && user.rol === "director") {
            setActiveSubTab(user.institucionTipo === "CETPRO" ? "cetpro" : "ceba");
        }
    }, [user]);

    useEffect(() => {
        const unsubscribe = subscribeConfig("directorioTabs", (data) => {
            if (data && (data.cebaLabel || data.cetproLabel)) {
                setLabels({
                    cebaLabel: data.cebaLabel || "CEBA",
                    cetproLabel: data.cetproLabel || "CETPRO"
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const handleOpenEdit = () => {
        setTempCebaLabel(labels.cebaLabel);
        setTempCetproLabel(labels.cetproLabel);
        setShowEditModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!tempCebaLabel.trim() || !tempCetproLabel.trim()) {
            alert("Las etiquetas no pueden estar vacías");
            return;
        }
        setSaving(true);
        try {
            await setConfig("directorioTabs", {
                cebaLabel: tempCebaLabel.trim(),
                cetproLabel: tempCetproLabel.trim()
            });
            setShowEditModal(false);
        } catch (err) {
            console.error("Error saving tab config:", err);
            alert("Error al guardar la configuración de pestañas.");
        }
        setSaving(false);
    };

    const canEdit = isRole("admin") || isRole("jefatura");

    const SUB_TABS = [
        { id: "ceba", label: labels.cebaLabel },
        { id: "cetpro", label: labels.cetproLabel },
    ];

    return (
        <div>
            {/* Sub-tab bar */}
            {!isRole("director") && (
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: "1px solid #D6DCE8", width: "fit-content" }}>
                        {SUB_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id)}
                                style={{
                                    padding: "9px 28px",
                                    border: "none",
                                    cursor: "pointer",
                                    background: activeSubTab === tab.id ? "#1B3A5C" : "transparent",
                                    color: activeSubTab === tab.id ? "#FFFFFF" : "#64748B",
                                    fontSize: "0.82rem",
                                    fontWeight: activeSubTab === tab.id ? 700 : 500,
                                    fontFamily: "'DM Sans', sans-serif",
                                    letterSpacing: "0.03em",
                                    transition: "all 0.15s",
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    {canEdit && (
                        <button
                            onClick={handleOpenEdit}
                            style={{
                                background: "#F1F5F9",
                                border: "1px solid #CBD5E1",
                                borderRadius: 6,
                                padding: "8px 14px",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                color: "#1E293B",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontFamily: "'DM Sans', sans-serif",
                                transition: "all 0.15s"
                            }}
                        >
                            <Icon name="settings" size={14} /> Configurar Pestañas
                        </button>
                    )}
                </div>
            )}

            {/* Content */}
            {activeSubTab === "ceba" && <DirectorioCEBA />}
            {activeSubTab === "cetpro" && <DirectorioCETPRO />}

            {/* Edit modal */}
            {showEditModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(12,25,41,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(3px)" }}>
                    <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 24, boxShadow: "0 4px 20px rgba(15,23,42,0.15)", width: "100%", maxWidth: 400, fontFamily: "'DM Sans', sans-serif" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#0C1929", fontFamily: "'DM Serif Display', serif" }}>Configurar Etiquetas de Pestañas</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#94A3B8" }}>&times;</button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Pestaña 1 (CEBA)</label>
                                <input
                                    type="text"
                                    maxLength={20}
                                    value={tempCebaLabel}
                                    onChange={e => setTempCebaLabel(e.target.value)}
                                    style={{ width: "100%", padding: "9px 14px", borderRadius: 6, border: "1px solid #D6DCE8", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Pestaña 2 (CETPRO)</label>
                                <input
                                    type="text"
                                    maxLength={20}
                                    value={tempCetproLabel}
                                    onChange={e => setTempCetproLabel(e.target.value)}
                                    style={{ width: "100%", padding: "9px 14px", borderRadius: 6, border: "1px solid #D6DCE8", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                                <button type="button" onClick={() => setShowEditModal(false)} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>Cancelar</button>
                                <button type="submit" disabled={saving} style={{ background: "#1B3A5C", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 600, color: "#FFFFFF", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                                    {saving ? "Guardando..." : "Guardar Cambios"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

