import { useState, useEffect, useRef, useMemo } from "react";
import { subscribeActividades, subscribeReuniones, subscribeEsinadSemanas, subscribeDirectorioCeba, subscribeDirectorioCetpro, subscribeMonitoreoDocente } from "../firebase/db";
import { getChatModel } from "../firebase/config";

const C = {
    navy1: "#0C1929", navy3: "#1B3A5C", navy4: "#1E4D7B",
    gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
    g900: "#0F172A", g700: "#334155", g500: "#64748B",
    g200: "#E2E8F0", g100: "#F1F5F9", g50: "#F8FAFC",
    white: "#FFFFFF",
};

const SparkIcon = ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
        {/* Spark 1 (Larger) */}
        <path d="M10 3C10 6.86599 6.86599 10 3 10C6.86599 10 10 13.134 10 17C10 13.134 13.134 10 17 10C13.134 10 10 6.86599 10 3Z" fill="#CA8A04" />
        {/* Spark 2 (Smaller, Offset) */}
        <path d="M18 12C18 14.2091 16.2091 16 14 16C16 16 18 17.7909 18 20C18 17.7909 19.7909 16 22 16C19.7909 16 18 14.2091 18 12Z" fill="#EAB308" />
    </svg>
);

export default function ChatbotIA() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "model", text: "¡Hola! Soy tu Asistente IA de AGEBATP. ¿En qué puedo ayudarte hoy?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [chatSession, setChatSession] = useState(null);
    const messagesEndRef = useRef(null);

    // Context states from Firestore
    const [activities, setActivities] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [esinadWeeks, setEsinadWeeks] = useState([]);
    const [cebas, setCebas] = useState([]);
    const [cetpros, setCetpros] = useState([]);
    const [monitoreosEba, setMonitoreosEba] = useState([]);
    const [monitoreosEtp, setMonitoreosEtp] = useState([]);

    // Subscriptions
    useEffect(() => {
        const unsubAct = subscribeActividades(setActivities);
        const unsubMeet = subscribeReuniones(setMeetings);
        const unsubSinad = subscribeEsinadSemanas(setEsinadWeeks);
        const unsubCeba = subscribeDirectorioCeba(setCebas);
        const unsubCetpro = subscribeDirectorioCetpro(setCetpros);
        const unsubEba = subscribeMonitoreoDocente("EBA", setMonitoreosEba);
        const unsubEtp = subscribeMonitoreoDocente("ETP", setMonitoreosEtp);
        return () => {
            unsubAct();
            unsubMeet();
            unsubSinad();
            unsubCeba();
            unsubCetpro();
            unsubEba();
            unsubEtp();
        };
    }, []);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    // Build real-time system context
    const systemContext = useMemo(() => {
        const totalAct = activities.length;
        const pendAct = activities.filter(a => a.estado === "pendiente" || !a.estado).length;
        const procAct = activities.filter(a => a.estado === "en_proceso").length;
        const compAct = activities.filter(a => a.estado === "completado").length;

        const pendingMeets = meetings.filter(m => m.estado === "pendiente" || !m.estado).length;
        const approvedMeets = meetings.filter(m => m.estado === "aprobado").length;

        const totalSinadRows = esinadWeeks.reduce((acc, w) => acc + (w.totalFilas || 0), 0);

        // Format Cebas Directory (compact)
        const cebasFormatted = cebas.map(c => {
            const dirName = [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");
            return `- CEBA: ${c.nombre || "Sin Nombre"} (CodMod: ${c.codigoModularInicialIntermedio || c.codigoModularAvanzado || "N/A"}, local: ${c.codigoLocal || "N/A"}, Distrito: ${c.distrito || "N/A"}). Dir: ${dirName || "N/A"}, Cel: ${c.celular || "N/A"}, Alumnos: ${c.alumnosCenso || 0}`;
        }).join("\n");

        // Format Cetpros Directory (compact)
        const cetprosFormatted = cetpros.map(c => {
            const dirName = [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(" ");
            return `- CETPRO: ${c.nombre || "Sin Nombre"} (CodMod: ${c.codigoModular || "N/A"}, local: ${c.codigoLocal || "N/A"}, Distrito: ${c.distrito || "N/A"}). Dir: ${dirName || "N/A"}, Cel: ${c.celular || "N/A"}, Alumnos: ${c.alumnosCenso || 0}`;
        }).join("\n");

        // Format Monitoreos EBA (compact)
        const ebaFormatted = monitoreosEba.map(m => {
            const r1 = m.desempeno?.regulaComportamiento?.nivel || m.desempeno?.regulaComportamiento || "N/A";
            const r2 = m.desempeno?.involucraEstudiantes?.nivel || m.desempeno?.involucraEstudiantes || "N/A";
            const r3 = m.desempeno?.promueveRazonamiento?.nivel || m.desempeno?.promueveRazonamiento || "N/A";
            const r4 = m.desempeno?.evaluaProgreso?.nivel || m.desempeno?.evaluaProgreso || "N/A";
            const r5 = m.desempeno?.ambienteRespeto?.nivel || m.desempeno?.ambienteRespeto || "N/A";
            return `- EBA Docente: ${m.docenteNombre || "Sin Nombre"} en CEBA ${m.institucionNombre || "N/A"} el ${m.fechaEjecucion || "N/A"}. Promedio: ${m.promedioGeneral || 0}. Rúbricas: Regula=${r1}, Involucra=${r2}, Razonamiento=${r3}, Evalúa=${r4}, Respeto=${r5}`;
        }).join("\n");

        // Format Monitoreos ETP (compact)
        const etpFormatted = monitoreosEtp.map(m => {
            const r1 = m.desempeno?.regulaComportamiento?.nivel || m.desempeno?.regulaComportamiento || "N/A";
            const r2 = m.desempeno?.involucraEstudiantes?.nivel || m.desempeno?.involucraEstudiantes || "N/A";
            const r3 = m.desempeno?.promueveRazonamiento?.nivel || m.desempeno?.promueveRazonamiento || "N/A";
            const r4 = m.desempeno?.evaluaProgreso?.nivel || m.desempeno?.evaluaProgreso || "N/A";
            const r5 = m.desempeno?.ambienteRespeto?.nivel || m.desempeno?.ambienteRespeto || "N/A";
            return `- ETP Docente: ${m.docenteNombre || "Sin Nombre"} en CETPRO ${m.institucionNombre || "N/A"} el ${m.fechaEjecucion || "N/A"}. Promedio: ${m.promedioGeneral || 0}. Rúbricas (ETP): Planificación/Regula=${r1}, Involucra=${r2}, Razonamiento=${r3}, Evalúa=${r4}, Respeto=${r5}`;
        }).join("\n");

        return `Eres el Asistente IA del Planificador Mensual de AGEBATP (UGEL 03).
Tu objetivo es responder de forma profesional, clara y concisa en español a los miembros del equipo educativo.
El usuario está autenticado y tiene acceso a la plataforma.

Aquí tienes el estado actual del sistema en tiempo real:
- Actividades totales del planificador mensual: ${totalAct}
  * Pendientes: ${pendAct}
  * En proceso: ${procAct}
  * Completadas: ${compAct}
- Solicitudes de reuniones: ${meetings.length} en total.
  * Pendientes de aprobación: ${pendingMeets}
  * Aprobadas/Programadas: ${approvedMeets}
- Monitoreo E-SINAD:
  * Semanas de expedientes registradas: ${esinadWeeks.length}
  * Total de expedientes cargados e investigados en el sistema: ${totalSinadRows}

Responde a preguntas específicas sobre docentes, directores, cantidad de alumnos, distritos, celulares, correos o promedios generales y por criterios utilizando la información detallada de los directorios y monitoreos provistos abajo. Si te preguntan por un docente o institución que no figure en los listados, indícalo amablemente.
Responde de manera muy breve, no más de 3 o 4 líneas por respuesta si es posible, a menos que se requiera un desglose ordenado.

--- DATOS EN TIEMPO REAL ---

DIRECTORIO CEBA:
${cebasFormatted || "No hay registros."}

DIRECTORIO CETPRO:
${cetprosFormatted || "No hay registros."}

MONITOREO DOCENTE EBA (Fichas de Monitoreo):
${ebaFormatted || "No hay registros."}

MONITOREO DOCENTE ETP (Fichas de Monitoreo):
${etpFormatted || "No hay registros."}`;
    }, [activities, meetings, esinadWeeks, cebas, cetpros, monitoreosEba, monitoreosEtp]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userMsg }]);
        setLoading(true);

        try {
            const model = await getChatModel();
            
            // Format history for Vertex AI / Gemini SDK standard:
            // SDK expects history elements with { role: 'user'|'model', parts: [{ text: '...' }] }
            // History MUST start with a 'user' turn.
            const firstUserIndex = messages.findIndex(msg => msg.role === "user");
            const historyMessages = firstUserIndex !== -1 ? messages.slice(firstUserIndex) : [];

            const historyFormatted = historyMessages.map(msg => ({
                role: msg.role === "assistant" ? "model" : msg.role,
                parts: [{ text: msg.text }]
            }));

            const chat = model.startChat({
                history: historyFormatted,
                systemInstruction: {
                    parts: [{ text: systemContext }]
                }
            });

            const result = await chat.sendMessage(userMsg);
            const rawText = typeof result.response.text === "function" ? result.response.text() : result.response.text;
            
            setMessages(prev => [...prev, { role: "model", text: rawText || "No obtuve respuesta del asistente." }]);
        } catch (err) {
            console.error("Error sending message to Gemini:", err);
            setMessages(prev => [...prev, { role: "model", text: "Lo siento, experimenté un error al conectarme con el servicio de IA. Inténtalo de nuevo." }]);
        }
        setLoading(false);
    };

    return (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .dot {
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: ${C.navy4};
                    margin-right: 3px;
                    animation: bounce 0.6s infinite alternate;
                }
                .dot:nth-child(2) { animation-delay: 0.2s; }
                .dot:nth-child(3) { animation-delay: 0.4s; }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .chat-window {
                    animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {/* Bubble Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: C.navy3,
                        border: `2px solid ${C.gold2}`,
                        color: C.white,
                        fontSize: "1.5rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 16px rgba(12,25,41,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.08)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                    <SparkIcon size={24} />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div
                    className="chat-window"
                    style={{
                        width: 360,
                        height: 480,
                        background: C.white,
                        border: `1px solid ${C.g200}`,
                        borderRadius: 12,
                        boxShadow: "0 10px 30px rgba(12,25,41,0.18)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }}
                >
                    {/* Header */}
                    <div style={{ background: C.navy1, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2px solid ${C.gold2}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <SparkIcon size={20} />
                            <div>
                                <div style={{ color: C.white, fontSize: "0.85rem", fontWeight: 700, fontFamily: "'DM Serif Display', serif", letterSpacing: "0.02em" }}>Asistente IA AGEBATP</div>
                                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.68rem" }}>En línea · Gemini 2.5</div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", fontSize: "1.2rem", cursor: "pointer", padding: 4 }}
                        >
                            &times;
                        </button>
                    </div>

                    {/* Messages Body */}
                    <div style={{ flex: 1, padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: C.g50 }}>
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                style={{
                                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "80%",
                                    background: msg.role === "user" ? C.navy3 : C.white,
                                    color: msg.role === "user" ? C.white : C.g900,
                                    padding: "10px 14px",
                                    borderRadius: msg.role === "user" ? "12px 12px 0 12px" : "12px 12px 12px 0",
                                    fontSize: "0.78rem",
                                    lineHeight: 1.4,
                                    boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
                                    border: msg.role === "user" ? "none" : `1px solid ${C.g200}`
                                }}
                            >
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: "flex-start", background: C.white, padding: "10px 14px", borderRadius: "12px 12px 12px 0", border: `1px solid ${C.g200}`, boxShadow: "0 1px 2px rgba(15,23,42,0.05)", display: "flex", alignItems: "center", minHeight: 24 }}>
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Footer */}
                    <form onSubmit={handleSend} style={{ padding: 12, borderTop: `1px solid ${C.g200}`, background: C.white, display: "flex", gap: 8 }}>
                        <input
                            type="text"
                            placeholder="Escribe tu consulta aquí..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid #D6DCE8",
                                fontSize: "0.78rem",
                                outline: "none",
                                fontFamily: "'DM Sans', sans-serif"
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            style={{
                                background: C.navy3,
                                border: "none",
                                borderRadius: 6,
                                padding: "8px 14px",
                                color: C.white,
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                opacity: (loading || !input.trim()) ? 0.6 : 1,
                                transition: "all 0.15s"
                            }}
                        >
                            Enviar
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
