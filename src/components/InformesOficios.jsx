import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeInformesMonitoreo, deleteInformeMonitoreo } from '../firebase/db';
import WizardInformeIndividual from './WizardInformeIndividual';
import WizardInformeDirector from './WizardInformeDirector';
import InformeAsistenciaTecnica from './InformeAsistenciaTecnica';
import WizardDiaLogro from './WizardDiaLogro';
import Icon from './Icon';

const C = {
  navy1: "#0C1929", navy2: "#122240", navy3: "#1B3A5C", navy4: "#1E4D7B", navy5: "#2563A0",
  gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
  g500: "#64748B", g400: "#94A3B8", g300: "#CBD5E1", g200: "#E2E8F0",
  g100: "#F1F5F9", g50: "#F8FAFC",
  red: "#B91C1C", redBg: "#FEF2F2", redBorder: "#FECACA",
  amber: "#B45309", amberBg: "#FFFBEB",
  green: "#15803D", greenBg: "#F0FDF4", greenBorder: "#BBF7D0",
  blue: "#2563A0", blueBg: "#EFF6FF", blueBorder: "#DBEAFE",
  white: "#FFFFFF",
};

const ESTADO_BADGE = {
  borrador: { bg: '#FEF3C7', color: '#92400E', label: 'Borrador' },
  generado: { bg: '#DBEAFE', color: '#1E40AF', label: 'Generado' },
  finalizado: { bg: '#D1FAE5', color: '#065F46', label: 'Finalizado' },
};

export default function InformesOficios() {
  const { user, isRole } = useAuth();
  const esStaff = isRole('admin') || isRole('jefatura') || isRole('personal');
  
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showWizardDocente, setShowWizardDocente] = useState(false);
  const [showWizardDirector, setShowWizardDirector] = useState(false);
  const [showInformeAT, setShowInformeAT] = useState(false);
  const [showWizardDiaLogro, setShowWizardDiaLogro] = useState(false);
  const [editingInforme, setEditingInforme] = useState(null);
  
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  // Subscribe to informes
  useEffect(() => {
    const unsub = subscribeInformesMonitoreo((list) => {
      setInformes(list || []);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (id, nombre) => {
    if (confirm(`¿Eliminar el informe "${nombre}"?`)) {
      try {
        await deleteInformeMonitoreo(id);
        showToast('Informe eliminado.');
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    }
  };

  const S = {
    card: { background: C.white, borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: `1px solid ${C.g200}` },
    sectionTitle: { fontSize: "1.1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 16 },
    btn: (bg, color, border) => ({ padding: "10px 20px", borderRadius: 8, border: `1px solid ${border || bg}`, background: bg, color, cursor: "pointer", fontFamily: "'DM Sans'", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, transition: "all 0.15s" }),
    label: { fontSize: 11, fontWeight: 700, color: C.g500, marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans'" },
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: C.navy1 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 80, right: 28, zIndex: 220, padding: "10px 20px", borderRadius: 8, fontSize: "0.82rem", fontWeight: 600, color: toast.type === "success" ? C.green : C.red, background: toast.type === "success" ? C.greenBg : C.redBg, border: `1px solid ${toast.type === "success" ? C.greenBorder : C.redBorder}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: C.navy1, fontSize: "1.45rem", margin: 0, fontFamily: "'DM Serif Display',serif" }}>Informes y Oficios de Monitoreo</h2>
        <p style={{ color: C.g500, fontSize: "0.82rem", margin: "4px 0 0" }}>
          Genere informes (docente/director/día del logro) con asistencia de IA. Edite antes de exportar a PDF.
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid-informes" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        {/* Individual Docente */}
        <div style={{ ...S.card, borderTop: `4px solid ${C.navy5}`, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>
              <Icon name="clipboard" size={16} color={C.navy5} style={{marginRight: 6}} /> Informe — Docente
            </h3>
            <p style={{ fontSize: "0.82rem", color: C.g500, marginBottom: 16, lineHeight: 1.5 }}>
              Wizard de 4 pasos: Acta de Inicio → Sección de Clase → Ficha OCR por IA → Informe + Oficio generados por IA.
            </p>
          </div>
          <button onClick={() => setShowWizardDocente(true)} style={S.btn(C.navy4, C.white, C.navy5)}>
            <Icon name="plus" size={14} /> Nuevo Informe Docente
          </button>
        </div>

        {/* Individual Director */}
        <div style={{ ...S.card, borderTop: `4px solid ${C.gold2}`, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>
              <Icon name="building" size={16} color={C.gold2} style={{marginRight: 6}} /> Informe — Director
            </h3>
            <p style={{ fontSize: "0.82rem", color: C.g500, marginBottom: 16, lineHeight: 1.5 }}>
              Mismo wizard adaptado para monitoreo de gestión directiva (CEBA/CETPRO).
            </p>
          </div>
          <button onClick={() => setShowWizardDirector(true)} style={S.btn(C.gold2, C.white, C.gold1)}>
            <Icon name="plus" size={14} /> Nuevo Informe Director
          </button>
        </div>

        {/* Día del Logro / Emprendimiento */}
        <div style={{ ...S.card, borderTop: `4px solid ${C.green}`, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>
              <Icon name="award" size={16} color={C.green} style={{marginRight: 6}} /> Informe — Día del Logro / Emprendimiento
            </h3>
            <p style={{ fontSize: "0.82rem", color: C.g500, marginBottom: 16, lineHeight: 1.5 }}>
              Wizard para Día del Logro (EBA) o Feria de Emprendimiento (CETPRO). Incluye múltiples fichas de monitoreo y redacción autónoma con IA.
            </p>
          </div>
          <button onClick={() => setShowWizardDiaLogro(true)} style={S.btn(C.green, C.white, C.green)}>
            <Icon name="plus" size={14} /> Nuevo Día del Logro / Emprendimiento
          </button>
        </div>

        {/* Informe Asistencia Técnica */}
        <div style={{ ...S.card, borderTop: `4px solid ${C.blue}`, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.navy1, fontFamily: "'DM Serif Display',serif", marginBottom: 8 }}>
              <Icon name="barChart" size={16} color={C.blue} style={{marginRight: 6}} /> Informe Asistencia Técnica
            </h3>
            <p style={{ fontSize: "0.82rem", color: C.g500, marginBottom: 16, lineHeight: 1.5 }}>
              Cargue el Excel de Microsoft Forms para procesar satisfacción, promedios y generar reporte con gráficas.
            </p>
          </div>
          <button onClick={() => setShowInformeAT(true)} style={S.btn(C.blue, C.white, C.blue)}>
            <Icon name="plus" size={14} /> Nuevo Informe AT
          </button>
        </div>
      </div>

      {/* Existing Informes List */}
      <div style={S.card}>
        <h3 style={S.sectionTitle}>Informes Generados</h3>
        
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: C.g500 }}>Cargando informes...</div>
        ) : informes.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: C.g500 }}>
            <Icon name="folder" size={40} color={C.g300} />
            <p style={{ marginTop: 12, fontSize: "0.85rem" }}>Aún no se han generado informes. Use los botones superiores para crear uno.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: "auto" }}>
            {/* Table Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 80px 100px 160px", padding: "10px 14px", gap: 8, borderBottom: `2px solid ${C.g200}`, background: C.g50, minWidth: 720 }}>
              {["Descripción", "Tipo", "Programa", "Estado", "Fecha", "Acciones"].map(h =>
                <p key={h} style={{ color: C.g500, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, fontFamily: "'DM Sans'" }}>{h}</p>
              )}
            </div>
            {/* Table Rows */}
            {informes.map(inf => {
              const estado = ESTADO_BADGE[inf.estado] || ESTADO_BADGE.borrador;
              let desc = "";
              try {
                if (inf.tipoMonitoreo === 'asistencia_tecnica') {
                  desc = `Informe Mensual AT 2026`;
                } else if (inf.tipoMonitoreo === 'dia_logro_emprendimiento') {
                  desc = `Día del Logro / Emprendimiento — ${inf.institucionNombre || 'Sin IE'}`;
                } else if (inf.tipo === 'consolidado_ie' || inf.tipo === 'individual') {
                  desc = `${inf.tipoMonitoreo === 'director' ? 'Director' : 'Docente'} — ${inf.institucionNombre || 'Sin IE'}`;
                } else {
                  desc = `Informe — ${inf.programa} ${inf.periodo?.mes || ''} ${inf.periodo?.anio || ''}`;
                }
              } catch (e) {
                console.error("Error formatting description:", e);
                desc = "Informe de Monitoreo";
              }
              
              return (
                <div key={inf.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 90px 80px 100px 160px", padding: "12px 14px", gap: 8, borderBottom: `1px solid ${C.g100}`, alignItems: "center", minWidth: 720 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: C.navy1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: C.g400 }}>{inf.especialistaNombre || ''}</p>
                  </div>
                  <span style={{ fontSize: 11, color: C.g500 }}>
                    {inf.tipoMonitoreo === 'asistencia_tecnica' ? 'Asistencia Técnica' : inf.tipoMonitoreo === 'dia_logro_emprendimiento' ? 'Día Logro / Emprend.' : inf.tipo === 'individual' ? 'Individual' : inf.tipo === 'consolidado_ie' ? 'Visita IE' : 'Informe'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.navy3 }}>{inf.programa || '—'}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: estado.bg, color: estado.color, textAlign: "center" }}>{estado.label}</span>
                  <span style={{ fontSize: 11, color: C.g500, fontFamily: "'JetBrains Mono'" }}>
                    {(() => {
                      if (inf.createdAt) {
                        const d = new Date(inf.createdAt);
                        if (!isNaN(d.getTime())) return d.toLocaleDateString('es-PE');
                      }
                      const rawF = inf.acta?.fecha || inf.fecha;
                      if (rawF) {
                        const d = new Date(rawF);
                        if (!isNaN(d.getTime())) return d.toLocaleDateString('es-PE');
                        return String(rawF);
                      }
                      return '—';
                    })()}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {inf.estado === 'borrador' ? (
                      <button onClick={() => setEditingInforme(inf)} style={{ background: "none", border: `1px solid ${C.navy5}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: C.navy5, fontWeight: 600 }}>
                        Continuar
                      </button>
                    ) : (
                      <button onClick={() => setEditingInforme(inf)} style={{ background: "none", border: `1px solid ${C.green}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: C.green, fontWeight: 600 }}>
                        Ver
                      </button>
                    )}
                    <button onClick={() => handleDelete(inf.id, desc)} style={{ background: "none", border: `1px solid ${C.redBorder}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 11, color: C.red, fontWeight: 600 }}>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </div>

      {/* Wizard Modals */}
      {showWizardDocente && (
        <WizardInformeIndividual
          tipoMonitoreo="docente"
          onClose={() => setShowWizardDocente(false)}
          onSaved={() => showToast('Informe docente guardado exitosamente.')}
        />
      )}
      {showWizardDirector && (
        <WizardInformeDirector
          onClose={() => setShowWizardDirector(false)}
          onSaved={() => showToast('Informe director guardado exitosamente.')}
        />
      )}
      {showWizardDiaLogro && (
        <WizardDiaLogro
          onClose={() => setShowWizardDiaLogro(false)}
          onSaved={() => showToast('Informe de Día del Logro / Emprendimiento guardado.')}
        />
      )}
      {showInformeAT && (
        <InformeAsistenciaTecnica
          onClose={() => setShowInformeAT(false)}
          onSaved={() => showToast('Informe de Asistencia Técnica guardado.')}
        />
      )}
      {editingInforme && (
        editingInforme.tipoMonitoreo === 'director' ? (
          <WizardInformeDirector
            initialData={editingInforme}
            onClose={() => setEditingInforme(null)}
            onSaved={() => {
              showToast('Informe actualizado exitosamente.');
              setEditingInforme(null);
            }}
          />
        ) : editingInforme.tipoMonitoreo === 'asistencia_tecnica' ? (
          <InformeAsistenciaTecnica
            initialData={editingInforme}
            onClose={() => setEditingInforme(null)}
            onSaved={() => {
              showToast('Informe actualizado exitosamente.');
              setEditingInforme(null);
            }}
          />
        ) : editingInforme.tipoMonitoreo === 'dia_logro_emprendimiento' ? (
          <WizardDiaLogro
            initialData={editingInforme}
            onClose={() => setEditingInforme(null)}
            onSaved={() => {
              showToast('Informe actualizado exitosamente.');
              setEditingInforme(null);
            }}
          />
        ) : (
          <WizardInformeIndividual
            tipoMonitoreo={editingInforme.tipoMonitoreo}
            initialData={editingInforme}
            onClose={() => setEditingInforme(null)}
            onSaved={() => {
              showToast('Informe actualizado exitosamente.');
              setEditingInforme(null);
            }}
          />
        )
      )}
    </div>
  );
}
