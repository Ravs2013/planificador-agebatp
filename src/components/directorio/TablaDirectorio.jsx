/* ═══════════════════════════════════════════════════════════
   TABLA DIRECTORIO — COMPONENTE DE TABLA REUTILIZABLE
   AGEBATP UGEL 03
   ═══════════════════════════════════════════════════════════ */

import React from "react";
import { hayDato, fmt } from "../../utils/directorioFormato";

const C = {
    g800: "#1E293B",
    g700: "#334155",
    g600: "#475569",
    g500: "#64748B",
    g400: "#94A3B8",
    g200: "#E2E8F0",
    g100: "#F1F5F9",
    g50: "#F8FAFC",
    white: "#FFFFFF",
    navy4: "#1E4D7B",
};

/**
 * Tabla generica para colecciones embebidas del Directorio (Areas, Sedes, Personal, Programas, Talleres).
 * 
 * @param {Array} columnas - [{ key, label, isNum, width, minWidth, render }]
 * @param {Array} filas - Arreglo de objetos de datos
 * @param {Object} totales - Fila opcional de totales acumulados
 * @param {string} vacioMensaje - Texto para estado vacio
 */
export default function TablaDirectorio({
    columnas = [],
    filas = [],
    totales = null,
    vacioMensaje = "No hay registros disponibles en esta sección.",
}) {
    if (!filas || filas.length === 0) {
        return (
            <div style={{
                padding: "24px 16px",
                textAlign: "center",
                background: C.g50,
                borderRadius: 8,
                border: `1px dashed ${C.g200}`,
                color: C.g500,
                fontSize: "0.8rem",
                fontFamily: "'DM Sans', sans-serif"
            }}>
                {vacioMensaje}
            </div>
        );
    }

    return (
        <div style={{ width: "100%", overflowX: "auto", borderRadius: 8, border: `1px solid ${C.g200}`, background: C.white }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif" }}>
                <thead>
                    <tr style={{ background: C.g50, borderBottom: `2px solid ${C.g200}` }}>
                        {columnas.map((col, idx) => (
                            <th
                                key={col.key || idx}
                                style={{
                                    padding: "10px 12px",
                                    color: C.g600,
                                    fontSize: "0.7rem",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                    textAlign: col.isNum ? "right" : "left",
                                    width: col.width,
                                    minWidth: col.minWidth,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filas.map((fila, rIdx) => (
                        <tr
                            key={rIdx}
                            style={{
                                borderBottom: `1px solid ${C.g100}`,
                                background: rIdx % 2 === 1 ? "#FAFBFD" : C.white,
                                transition: "background 0.15s ease",
                            }}
                        >
                            {columnas.map((col, cIdx) => {
                                const val = fila[col.key];
                                let contenido;
                                if (col.render) {
                                    contenido = col.render(val, fila, rIdx);
                                } else if (col.isNum) {
                                    contenido = hayDato(val) ? fmt(val) : "-";
                                } else {
                                    contenido = hayDato(val) ? String(val) : "-";
                                }

                                return (
                                    <td
                                        key={col.key || cIdx}
                                        style={{
                                            padding: "9px 12px",
                                            color: C.g800,
                                            textAlign: col.isNum ? "right" : "left",
                                            fontFamily: col.isNum ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
                                            fontWeight: col.isNum ? 600 : 400,
                                            verticalAlign: "middle",
                                            whiteSpace: col.whiteSpace || (col.isNum ? "nowrap" : "normal"),
                                        }}
                                    >
                                        {contenido}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    {totales && (
                        <tr style={{ background: "#F1F5F9", borderTop: `2px solid ${C.g200}`, fontWeight: 700 }}>
                            {columnas.map((col, idx) => {
                                const val = totales[col.key];
                                return (
                                    <td
                                        key={col.key || idx}
                                        style={{
                                            padding: "10px 12px",
                                            color: C.navy4,
                                            textAlign: col.isNum ? "right" : "left",
                                            fontFamily: col.isNum ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
                                            fontSize: "0.8rem",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {idx === 0 && !val ? "TOTAL" : (hayDato(val) ? (col.isNum ? fmt(val) : val) : "")}
                                    </td>
                                );
                            })}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
