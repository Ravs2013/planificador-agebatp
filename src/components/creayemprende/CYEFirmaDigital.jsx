import React, { useRef, useState, useEffect } from 'react';
import Icon from '../Icon';
import { C, btn } from './cyeEstilos';

/**
 * Captura de firma para el Panel de Firmas Oficial.
 * Mismo comportamiento del componente de Juegos Florales y Eureka (trazo con dedo o mouse,
 * recorte automático, carga de foto de una firma en papel), sin símbolos decorativos.
 */
export default function CYEFirmaDigital({ value, onChange, firmaGuardada = null }) {
  const canvasRef = useRef(null);
  const dibujandoRef = useRef(false);
  const limitesRef = useRef({ minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
  const [vacio, setVacio] = useState(true);

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
    limitesRef.current = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    setVacio(true);
  }, [value]);

  const coordenadas = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const ampliarLimites = ({ x, y }) => {
    const l = limitesRef.current;
    l.minX = Math.min(l.minX, x); l.minY = Math.min(l.minY, y);
    l.maxX = Math.max(l.maxX, x); l.maxY = Math.max(l.maxY, y);
  };

  const iniciar = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = coordenadas(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    dibujandoRef.current = true;
    ampliarLimites(p);
  };

  const trazar = (e) => {
    if (!dibujandoRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = coordenadas(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ampliarLimites(p);
    setVacio(false);
  };

  const terminar = () => { dibujandoRef.current = false; };

  const borrar = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    limitesRef.current = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    setVacio(true);
    onChange(null);
  };

  const confirmar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const l = limitesRef.current;
    try {
      if (l.minX !== Infinity && l.maxX > l.minX && l.maxY > l.minY) {
        const pad = 10;
        const sx = Math.max(0, l.minX - pad);
        const sy = Math.max(0, l.minY - pad);
        const sw = Math.min(canvas.width / dpr - sx, l.maxX - l.minX + pad * 2);
        const sh = Math.min(canvas.height / dpr - sy, l.maxY - l.minY + pad * 2);
        if (sw > 10 && sh > 10) {
          const tmp = document.createElement('canvas');
          tmp.width = sw;
          tmp.height = sh;
          tmp.getContext('2d').drawImage(canvas, sx * dpr, sy * dpr, sw * dpr, sh * dpr, 0, 0, sw, sh);
          onChange(tmp.toDataURL('image/png'));
          return;
        }
      }
      onChange(canvas.toDataURL('image/png'));
    } catch (err) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const cargarFoto = (e) => {
    const archivo = e.target.files && e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = evt => onChange(evt.target.result);
    lector.readAsDataURL(archivo);
    e.target.value = '';
  };

  const botonMini = (fondo, color, borde) => ({
    padding: '5px 9px', borderRadius: 6, background: fondo, color, border: `1px solid ${borde}`,
    fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{
        position: 'relative', width: '100%', height: 200, border: `1px solid ${C.g200}`, borderRadius: 8,
        background: C.white, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {value ? (
          <>
            <img src={value} alt="Firma registrada" style={{ maxHeight: '88%', maxWidth: '92%', objectFit: 'contain', pointerEvents: 'none' }} />
            <button type="button" onClick={borrar} style={{ ...botonMini('#FEF2F2', C.red, '#FECACA'), position: 'absolute', top: 8, right: 8 }}>
              <Icon name="trash" size={11} /> Volver a firmar
            </button>
          </>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              onPointerDown={iniciar}
              onPointerMove={trazar}
              onPointerUp={terminar}
              onPointerLeave={terminar}
              style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
            />
            {!vacio && (
              <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 6 }}>
                <button type="button" onClick={borrar} style={botonMini('#FEF2F2', C.red, '#FECACA')}>
                  <Icon name="trash" size={11} /> Borrar
                </button>
                <button type="button" onClick={confirmar} style={botonMini('#F0FDF4', C.green, '#BBF7D0')}>
                  <Icon name="check" size={11} /> Confirmar firma
                </button>
              </div>
            )}
            {vacio && (
              <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', color: C.g500, fontSize: 11, fontWeight: 600 }}>
                Firme aquí con el dedo o el mouse
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {firmaGuardada && !value && (
          <button type="button" onClick={() => onChange(firmaGuardada)} style={btn('gris', { padding: '5px 10px', fontSize: 11 })}>
            <Icon name="refresh" size={11} /> Usar firma guardada en este equipo
          </button>
        )}
        <label style={{ ...btn('gris', { padding: '5px 10px', fontSize: 11 }) }}>
          <Icon name="image" size={11} /> Cargar foto de la firma
          <input type="file" accept="image/*" onChange={cargarFoto} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
