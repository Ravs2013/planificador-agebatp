import React, { useRef, useState, useEffect } from 'react';
import Icon from './Icon';

const C = {
  navy3: "#1B3A5C",
  g500: "#64748B",
  g200: "#E2E8F0",
  g50: "#F8FAFC",
  white: "#FFFFFF",
  red: "#B91C1C",
  redBg: "#FEF2F2",
  redBorder: "#FECACA"
};

export default function FirmaDigital({ value, onChange, label = "Firma digital", storageKey = null }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Clear legacy global cache if present
  useEffect(() => {
    try {
      localStorage.removeItem('jf_saved_signature_cache');
    } catch (e) {}
  }, []);

  // Track bounding box for auto-cropping
  const boundsRef = useRef({ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#000000';
    
    // Reset state when canvas is mounted
    setIsEmpty(true);
    boundsRef.current = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  }, [value]);

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoords(e, canvas);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);

    updateBounds(coords.x, coords.y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const coords = getCanvasCoords(e, canvas);

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    updateBounds(coords.x, coords.y);
    setIsEmpty(false);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
  };

  const updateBounds = (x, y) => {
    const bounds = boundsRef.current;
    if (x < bounds.minX) bounds.minX = x;
    if (y < bounds.minY) bounds.minY = y;
    if (x > bounds.maxX) bounds.maxX = x;
    if (y > bounds.maxY) bounds.maxY = y;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    boundsRef.current = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    setIsEmpty(true);
    onChange(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const bounds = boundsRef.current;
      const dpr = window.devicePixelRatio || 1;

      if (bounds.minX !== Infinity && bounds.maxX > bounds.minX && bounds.maxY > bounds.minY) {
        const pad = 10;
        const sx = Math.max(0, bounds.minX - pad);
        const sy = Math.max(0, bounds.minY - pad);
        const sw = Math.min(canvas.width / dpr - sx, bounds.maxX - bounds.minX + pad * 2);
        const sh = Math.min(canvas.height / dpr - sy, bounds.maxY - bounds.minY + pad * 2);

        if (sw > 10 && sh > 10) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = sw;
          tempCanvas.height = sh;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(
            canvas,
            sx * dpr,
            sy * dpr,
            sw * dpr,
            sh * dpr,
            0,
            0,
            sw,
            sh
          );
          const croppedData = tempCanvas.toDataURL('image/png');
          if (croppedData && croppedData.length > 100) {
            onChange(croppedData);
            return;
          }
        }
      }

      // Fallback
      const fullData = canvas.toDataURL('image/png');
      onChange(fullData);
    } catch (err) {
      console.error("Error al guardar firma:", err);
      if (canvas) {
        onChange(canvas.toDataURL('image/png'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.g500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: 260, 
        border: `1px solid ${C.g200}`, 
        borderRadius: 8, 
        background: C.white, 
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        boxSizing: 'border-box'
      }}>
        {value ? (
          <>
            <img 
              src={value} 
              alt="Firma digital" 
              style={{ 
                maxHeight: '100%', 
                maxWidth: '100%', 
                objectFit: 'contain',
                pointerEvents: 'none'
              }} 
            />
            <button
              type="button"
              onClick={clearCanvas}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                padding: '4px 8px',
                borderRadius: 6,
                background: C.redBg,
                border: `1px solid ${C.redBorder}`,
                color: C.red,
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Icon name="trash" size={10} /> Volver a firmar
            </button>
          </>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                cursor: 'crosshair',
                touchAction: 'none'
              }}
            />
            {!isEmpty && (
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={clearCanvas}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: C.redBg,
                    border: `1px solid ${C.redBorder}`,
                    color: C.red,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Icon name="trash" size={10} /> Borrar
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  style={{
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#15803D',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Icon name="check" size={10} /> ✓ Confirmar firma
                </button>
              </div>
            )}
            {isEmpty && (
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', color: C.g500, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Firme aquí con el dedo o mouse
              </div>
            )}
          </>
        )}
      </div>

      {/* Opción de Cargar Foto de Firma o Usar Firma Guardada */}
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontSize: 10, color: C.g500 }}>
          ¿Firmó en papel? Tome foto con el celular o utilice su firma de sesión:
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {storageKey && localStorage.getItem(storageKey) && !value && (
            <button
              type="button"
              onClick={() => {
                const cached = localStorage.getItem(storageKey);
                if (cached) onChange(cached);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#15803D',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✨ Aplicar mi firma guardada
            </button>
          )}
          <label style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            borderRadius: 6,
            background: C.g50,
            border: `1px solid ${C.g200}`,
            color: C.navy3,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            Cargar foto
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files && e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    onChange(evt.target.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
