/* ═══════════════════════════════════════════════════════════
   PESTAÑAS DETALLE — NAVEGACION INTERNA DEL MODAL DE DETALLE
   AGEBATP UGEL 03
   ═══════════════════════════════════════════════════════════ */

import React from "react";

/**
 * Barra de pestañas para el modal de detalle institucional.
 * Oculta automaticamente pestañas no visibles o sin elementos (regla R-3e).
 * 
 * @param {Array} pestanas - [{ id, label, conteo, visible }]
 * @param {string} activa - ID de la pestaña activa
 * @param {Function} onCambiar - Callback al seleccionar pestaña (id)
 */
export default function PestanasDetalle({
    pestanas = [],
    activa,
    onCambiar,
}) {
    // Filtrar pestañas visibles (por defecto visible = true, si define visible se evalua)
    const pestanasVisibles = pestanas.filter((p) => p.visible !== false && p.visible !== 0);

    if (pestanasVisibles.length <= 1) return null;

    return (
        <div style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            padding: "4px 0 12px",
            borderBottom: "1px solid #E2E8F0",
            marginBottom: 18,
            position: "sticky",
            top: 0,
            background: "#FFFFFF",
            zIndex: 10,
        }}>
            {pestanasVisibles.map((tab) => {
                const esActivo = activa === tab.id;
                const tieneConteo = tab.conteo !== undefined && tab.conteo !== null;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onCambiar(tab.id)}
                        style={{
                            padding: "7px 14px",
                            borderRadius: 6,
                            border: esActivo ? "1px solid #1B3A5C" : "1px solid #E2E8F0",
                            background: esActivo ? "#1B3A5C" : "#F8FAFC",
                            color: esActivo ? "#FFFFFF" : "#64748B",
                            fontSize: "0.78rem",
                            fontWeight: esActivo ? 700 : 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontFamily: "'DM Sans', sans-serif",
                            whiteSpace: "nowrap",
                            transition: "all 0.15s ease",
                        }}
                    >
                        <span>{tab.label}</span>
                        {tieneConteo && (
                            <span
                                style={{
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: 10,
                                    background: esActivo ? "rgba(255,255,255,0.25)" : "#E2E8F0",
                                    color: esActivo ? "#FFFFFF" : "#475569",
                                    fontFamily: "'JetBrains Mono', monospace",
                                }}
                            >
                                {tab.conteo}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
