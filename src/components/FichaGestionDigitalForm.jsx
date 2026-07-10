import React, { useEffect } from 'react';
import { FICHA_GESTION_ITEMS } from '../data/fichaGestionItems';

const C = {
  navy1: "#0C1929", navy3: "#1B3A5C", navy4: "#1E4D7B",
  gold1: "#A16207", gold2: "#CA8A04", gold3: "#FEF9C3",
  g500: "#64748B", g200: "#E2E8F0", g100: "#F1F5F9", g50: "#F8FAFC",
  white: "#FFFFFF"
};

export default function FichaGestionDigitalForm({ data, onChange }) {
  // Ensure basic structure exists
  useEffect(() => {
    if (!data.aspectos) {
      const initialAspects = {};
      FICHA_GESTION_ITEMS.forEach((aspGroup, idx) => {
        const key = String(idx + 1).padStart(2, '0');
        const itemsList = aspGroup.items.map(item => ({
          item: item.num,
          texto: item.texto,
          si: false,
          no: false,
          evidencia: ""
        }));
        
        initialAspects[key] = itemsList;
        
        // Add default nested table structures for Aspecto 02
        if (key === "02") {
          initialAspects[key].tablasConteo = {
            certificados: [
              { prog: "Opciones Ocupacionales", y2024: 0, y2025: 0, y2026: 0, total: 0 },
              { prog: "Especialidades", y2024: 0, y2025: 0, y2026: 0, total: 0 },
              { prog: "Programa de estudios Auxiliar técnico", y2024: 0, y2025: 0, y2026: 0, total: 0 },
              { prog: "Programa de estudios técnico", y2024: 0, y2025: 0, y2026: 0, total: 0 }
            ],
            titulos: [
              { prog: "Opciones Ocupacionales", y2024: 0, y2025: 0, y2026: 0, total: 0 },
              { prog: "Especialidades", y2024: 0, y2025: 0, y2026: 0, total: 0 },
              { prog: "Programa de estudios Auxiliar técnico", y2024: 0, y2025: 0, y2026: 0, total: 0 },
              { prog: "Programa de estudios técnico", y2024: 0, y2025: 0, y2026: 0, total: 0 }
            ]
          };
        }
      });

      onChange({
        ...data,
        aspectos: initialAspects
      });
    }
  }, [data, onChange]);

  if (!data.aspectos) return <div style={{ color: C.g500, fontSize: 13 }}>Inicializando formulario...</div>;

  const handleValueChange = (aspKey, itemNum, field, val) => {
    const updatedAspects = { ...data.aspectos };
    const list = [...(updatedAspects[aspKey] || [])];
    const idx = list.findIndex(i => i.item === itemNum);

    if (idx !== -1) {
      const updatedItem = { ...list[idx] };
      if (field === 'si') {
        updatedItem.si = val;
        if (val) updatedItem.no = false;
      } else if (field === 'no') {
        updatedItem.no = val;
        if (val) updatedItem.si = false;
      } else {
        updatedItem[field] = val;
      }
      list[idx] = updatedItem;
      updatedAspects[aspKey] = list;

      onChange({
        ...data,
        aspectos: updatedAspects
      });
    }
  };

  const handleTableValueChange = (tableType, rowIdx, yearField, val) => {
    const updatedAspects = { ...data.aspectos };
    const aspect02 = { ...updatedAspects["02"] };
    const tablasConteo = { ...aspect02.tablasConteo };
    const tableList = [...(tablasConteo[tableType] || [])];
    
    if (tableList[rowIdx]) {
      const numVal = parseInt(val, 10) || 0;
      const updatedRow = { ...tableList[rowIdx], [yearField]: numVal };
      updatedRow.total = (updatedRow.y2024 || 0) + (updatedRow.y2025 || 0) + (updatedRow.y2026 || 0);
      tableList[rowIdx] = updatedRow;
      tablasConteo[tableType] = tableList;
      aspect02.tablasConteo = tablasConteo;
      updatedAspects["02"] = aspect02;

      onChange({
        ...data,
        aspectos: updatedAspects
      });
    }
  };

  const S = {
    groupTitle: { fontSize: "0.95rem", fontWeight: 700, color: C.navy3, background: `${C.navy3}10`, padding: "8px 12px", borderRadius: 6, margin: "24px 0 12px" },
    row: { display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.g100}`, alignItems: "center" },
    num: { width: 30, fontSize: 12, fontWeight: 700, color: C.navy4, textAlign: "center" },
    text: { flex: 1, fontSize: 12.5, color: C.navy1 },
    checks: { display: "flex", gap: 12, width: 90, justifyContent: "center" },
    input: { padding: "6px 10px", borderRadius: 6, border: `1px solid ${C.g200}`, width: 180, fontSize: 12, fontFamily: "'DM Sans'" },
    checkbox: { cursor: "pointer", width: 15, height: 15 },
    table: { width: "100%", borderCollapse: "collapse", margin: "10px 0 16px", fontSize: 11 },
    th: { background: C.g100, border: `1px solid ${C.g200}`, padding: "6px", fontWeight: 700, color: C.navy3, textAlign: "center" },
    td: { border: `1px solid ${C.g200}`, padding: "6px", textAlign: "center" },
    tdLeft: { border: `1px solid ${C.g200}`, padding: "6px", textAlign: "left", fontWeight: 600, color: C.navy1 }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {FICHA_GESTION_ITEMS.map((aspGroup, groupIdx) => {
        const aspKey = String(groupIdx + 1).padStart(2, '0');
        const items = Array.isArray(data.aspectos[aspKey]) ? data.aspectos[aspKey] : [];
        const tablasConteo = data.aspectos["02"]?.tablasConteo || {};

        return (
          <div key={aspKey} style={{ marginBottom: 20 }}>
            <div style={S.groupTitle}>
              {aspGroup.seccion} — {aspGroup.aspecto}
            </div>

            {aspGroup.consignarNoAplica && (
              <div style={{ fontSize: 11, color: C.gold1, padding: "4px 12px", background: `${C.gold2}10`, borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                Nota: Si la institución no cuenta con Programas de Formación Continua (PFC), consignar NO APLICA en los comentarios/observaciones.
              </div>
            )}

            <div>
              {aspGroup.items.map((itemObj) => {
                const uAns = items.find(i => i.item === itemObj.num) || {};
                
                return (
                  <div key={itemObj.num} style={{ marginBottom: 10 }}>
                    {/* Standard Question Row */}
                    <div style={S.row}>
                      <div style={S.num}>{itemObj.num}</div>
                      <div style={S.text}>{itemObj.texto}</div>
                      
                      <div style={S.checks}>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: C.navy3 }}>
                          <input
                            type="checkbox"
                            checked={uAns.si === true}
                            onChange={(e) => handleValueChange(aspKey, itemObj.num, 'si', e.target.checked)}
                            style={S.checkbox}
                          />
                          SÍ
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", fontSize: 11.5, fontWeight: 600, color: C.navy3 }}>
                          <input
                            type="checkbox"
                            checked={uAns.no === true}
                            onChange={(e) => handleValueChange(aspKey, itemObj.num, 'no', e.target.checked)}
                            style={S.checkbox}
                          />
                          NO
                        </label>
                      </div>

                      <input
                        type="text"
                        placeholder="Evidencia / Observación..."
                        value={uAns.evidencia || ""}
                        onChange={(e) => handleValueChange(aspKey, itemObj.num, 'evidencia', e.target.value)}
                        style={S.input}
                      />
                    </div>

                    {/* Certificados Sub-table (Item 13) */}
                    {itemObj.isTableCertificados && tablasConteo.certificados && (
                      <div style={{ paddingLeft: 40, marginTop: 8 }}>
                        <p style={{ margin: "4px 0", fontSize: 11.5, fontWeight: 700, color: C.navy3 }}>Detalle de Certificados Emitidos:</p>
                        <table style={S.table}>
                          <thead>
                            <tr>
                              <th style={{ ...S.th, textAlign: "left" }}>Programa</th>
                              <th style={S.th}>2024</th>
                              <th style={S.th}>2025</th>
                              <th style={S.th}>2026</th>
                              <th style={S.th}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tablasConteo.certificados.map((row, rIdx) => {
                              const rTotal = (row.y2024 || 0) + (row.y2025 || 0) + (row.y2026 || 0);
                              return (
                                <tr key={rIdx}>
                                  <td style={S.tdLeft}>{row.prog}</td>
                                  <td style={S.td}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.y2024 || 0}
                                      onChange={(e) => handleTableValueChange('certificados', rIdx, 'y2024', e.target.value)}
                                      style={{ width: 50, padding: 3, fontSize: 11, textAlign: "center" }}
                                    />
                                  </td>
                                  <td style={S.td}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.y2025 || 0}
                                      onChange={(e) => handleTableValueChange('certificados', rIdx, 'y2025', e.target.value)}
                                      style={{ width: 50, padding: 3, fontSize: 11, textAlign: "center" }}
                                    />
                                  </td>
                                  <td style={S.td}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.y2026 || 0}
                                      onChange={(e) => handleTableValueChange('certificados', rIdx, 'y2026', e.target.value)}
                                      style={{ width: 50, padding: 3, fontSize: 11, textAlign: "center" }}
                                    />
                                  </td>
                                  <td style={{ ...S.td, fontWeight: 700, color: C.navy3 }}>{row.total || rTotal}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Títulos Sub-table (Item 21) */}
                    {itemObj.isTableTitulos && tablasConteo.titulos && (
                      <div style={{ paddingLeft: 40, marginTop: 8 }}>
                        <p style={{ margin: "4px 0", fontSize: 11.5, fontWeight: 700, color: C.navy3 }}>Detalle de Títulos Emitidos:</p>
                        <table style={S.table}>
                          <thead>
                            <tr>
                              <th style={{ ...S.th, textAlign: "left" }}>Programa</th>
                              <th style={S.th}>2024</th>
                              <th style={S.th}>2025</th>
                              <th style={S.th}>2026</th>
                              <th style={S.th}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tablasConteo.titulos.map((row, rIdx) => {
                              const rTotal = (row.y2024 || 0) + (row.y2025 || 0) + (row.y2026 || 0);
                              return (
                                <tr key={rIdx}>
                                  <td style={S.tdLeft}>{row.prog}</td>
                                  <td style={S.td}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.y2024 || 0}
                                      onChange={(e) => handleTableValueChange('titulos', rIdx, 'y2024', e.target.value)}
                                      style={{ width: 50, padding: 3, fontSize: 11, textAlign: "center" }}
                                    />
                                  </td>
                                  <td style={S.td}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.y2025 || 0}
                                      onChange={(e) => handleTableValueChange('titulos', rIdx, 'y2025', e.target.value)}
                                      style={{ width: 50, padding: 3, fontSize: 11, textAlign: "center" }}
                                    />
                                  </td>
                                  <td style={S.td}>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.y2026 || 0}
                                      onChange={(e) => handleTableValueChange('titulos', rIdx, 'y2026', e.target.value)}
                                      style={{ width: 50, padding: 3, fontSize: 11, textAlign: "center" }}
                                    />
                                  </td>
                                  <td style={{ ...S.td, fontWeight: 700, color: C.navy3 }}>{row.total || rTotal}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
