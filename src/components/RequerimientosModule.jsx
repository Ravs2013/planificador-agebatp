import { useState } from "react";
import RequerimientosCEBA from "./RequerimientosCEBA";
import RequerimientosCETPRO from "./RequerimientosCETPRO";

const SUB_TABS = [
    { id: "ceba", label: "CEBA" },
    { id: "cetpro", label: "CETPRO" },
];

export default function RequerimientosModule() {
    const [activeSubTab, setActiveSubTab] = useState("ceba");

    return (
        <div>
            {/* Sub-tab bar */}
            <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid #D6DCE8", width: "fit-content" }}>
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

            {/* Content */}
            {activeSubTab === "ceba" && <RequerimientosCEBA />}
            {activeSubTab === "cetpro" && <RequerimientosCETPRO />}
        </div>
    );
}
