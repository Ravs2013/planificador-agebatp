import { useState, useRef, useCallback } from "react";
import Icon from "./Icon";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = [
    "image/jpeg", "image/png", "image/jpg", "image/webp",
    "application/pdf",
    "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];
const EXT_LABEL = "JPG, PNG, PDF, Word, Excel";

const C = {
    navy1: "#0C1929", navy3: "#1B3A5C", navy4: "#1E4D7B",
    gold2: "#CA8A04",
    g300: "#CBD5E1", g400: "#94A3B8", g500: "#64748B", g600: "#475569", g900: "#0F172A",
    bg: "#F8FAFC", white: "#FFFFFF", red: "#B91C1C", green: "#15803D"
};

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // strip data:...;base64,
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
}

const iconForMime = (mime) => {
    if (mime.startsWith("image/")) return "image";
    if (mime.includes("pdf")) return "file";
    if (mime.includes("word") || mime.includes("document")) return "file";
    if (mime.includes("excel") || mime.includes("sheet")) return "file";
    return "file";
};

/**
 * FileAttachment — Drag & Drop multi-file selector
 * Props:
 *   files:       Array of { name, size, mimeType, base64 }
 *   onChange:    (files) => void
 *   maxFiles:    number (default 10)
 *   label:       string
 *   compact:     boolean (smaller UI for create-activity modal)
 */
export default function FileAttachment({ files = [], onChange, maxFiles = 10, label, compact = false }) {
    const inputRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);
    const [errors, setErrors] = useState([]);

    const processFiles = useCallback(async (rawFiles) => {
        const errs = [];
        const valid = [];
        for (const f of rawFiles) {
            if (!ALLOWED.includes(f.type)) {
                errs.push(`"${f.name}" — tipo no permitido`);
                continue;
            }
            if (f.size > MAX_SIZE) {
                errs.push(`"${f.name}" — excede 5 MB (${formatSize(f.size)})`);
                continue;
            }
            if (files.length + valid.length >= maxFiles) {
                errs.push(`Máximo ${maxFiles} archivos`);
                break;
            }
            try {
                const base64 = await fileToBase64(f);
                valid.push({ name: f.name, size: f.size, mimeType: f.type, base64 });
            } catch {
                errs.push(`"${f.name}" — error al leer archivo`);
            }
        }
        setErrors(errs);
        if (valid.length > 0) onChange([...files, ...valid]);
    }, [files, maxFiles, onChange]);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        processFiles([...e.dataTransfer.files]);
    };

    const handleSelect = (e) => {
        if (e.target.files) processFiles([...e.target.files]);
        e.target.value = "";
    };

    const remove = (idx) => {
        onChange(files.filter((_, i) => i !== idx));
        setErrors([]);
    };

    const dropStyle = {
        border: `2px dashed ${dragOver ? C.navy4 : C.g300}`,
        borderRadius: 8,
        background: dragOver ? "#EFF6FF" : C.bg,
        padding: compact ? "14px 16px" : "24px 20px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.2s"
    };

    return (
        <div>
            {label && <div style={{ fontSize: 11, fontWeight: 700, color: C.g600, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.6, fontFamily: "'DM Sans'" }}>{label}</div>}

            <div
                style={dropStyle}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                <Icon name="upload" size={compact ? 18 : 24} color={C.g400} />
                <div style={{ fontSize: compact ? 11 : 13, color: C.g500, marginTop: 6, fontFamily: "'DM Sans'" }}>
                    {compact ? "Click o arrastre archivos aquí" : "Arrastre archivos aquí o haga click para seleccionar"}
                </div>
                <div style={{ fontSize: 10, color: C.g400, marginTop: 4, fontFamily: "'DM Sans'" }}>
                    {EXT_LABEL} — Máx {formatSize(MAX_SIZE)} por archivo
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleSelect}
                    style={{ display: "none" }}
                />
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div style={{ marginTop: 8 }}>
                    {errors.map((e, i) => (
                        <div key={i} style={{ fontSize: 11, color: C.red, display: "flex", alignItems: "center", gap: 4, marginBottom: 2, fontFamily: "'DM Sans'" }}>
                            <Icon name="alert" size={12} color={C.red} /> {e}
                        </div>
                    ))}
                </div>
            )}

            {/* File list */}
            {files.length > 0 && (
                <div style={{ marginTop: 10 }}>
                    {files.map((f, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 12px", borderRadius: 6,
                            background: C.white, border: `1px solid ${C.g300}`,
                            marginBottom: 4, fontSize: 12, fontFamily: "'DM Sans'"
                        }}>
                            <Icon name={iconForMime(f.mimeType)} size={16} color={C.navy4} />
                            <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.g900, fontWeight: 500 }}>
                                {f.name}
                            </div>
                            <span style={{ fontSize: 10, color: C.g400, flexShrink: 0 }}>{formatSize(f.size)}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); remove(i); }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: C.red, padding: 2, display: "flex" }}
                            >
                                <Icon name="x" size={14} color={C.red} />
                            </button>
                        </div>
                    ))}
                    <div style={{ fontSize: 10, color: C.g400, marginTop: 4, fontFamily: "'DM Sans'" }}>
                        {files.length} archivo{files.length !== 1 ? "s" : ""} ({formatSize(files.reduce((s, f) => s + f.size, 0))} total)
                    </div>
                </div>
            )}
        </div>
    );
}
