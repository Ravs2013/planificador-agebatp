import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IIEE_UGEL03,
  getParticipantes,
  buscarParticipantes,
  normalizar
} from '../data/juegosFloralesPadronSICE';
import { C } from '../data/juegosFloralesCatalogos';
import Icon from './Icon';

export default function JFSelectorParticipante({
  disciplinaId,
  categoria,
  participanteSeleccionado,
  onSelectParticipante,
  onRegistrarManual,
  onRegistrarIEManual,
  tienesPuntajesCargados = false,
  readOnly = false
}) {
  // Participantes del padrón para esta combinación
  const participantesPadron = useMemo(() => {
    return getParticipantes(disciplinaId, categoria);
  }, [disciplinaId, categoria]);

  // Estados del combo de participante
  const [busquedaPart, setBusquedaPart] = useState('');
  const [openPartMenu, setOpenPartMenu] = useState(false);
  const [highlightPartIdx, setHighlightPartIdx] = useState(0);

  // Estados del combo de IE
  const [busquedaIE, setBusquedaIE] = useState('');
  const [openIEMenu, setOpenIEMenu] = useState(false);
  const [highlightIEIdx, setHighlightIEIdx] = useState(0);

  const containerRef = useRef(null);

  // Sincronizar texto cuando cambia el participante seleccionado
  useEffect(() => {
    if (participanteSeleccionado) {
      const ieNombre = participanteSeleccionado.institucion?.nombre || participanteSeleccionado.institucionNombre || participanteSeleccionado.iiee || '';
      const codigo = participanteSeleccionado.codigoParticipante || participanteSeleccionado.codigo || '';
      const titulo = participanteSeleccionado.tituloObra || participanteSeleccionado.titulo || '';
      const seudónimo = participanteSeleccionado.seudonimo ? ` · seudónimo: ${participanteSeleccionado.seudonimo}` : '';

      setBusquedaPart(ieNombre ? `${ieNombre} (${codigo})${seudónimo}` : codigo);
      setBusquedaIE(ieNombre);
    } else {
      setBusquedaPart('');
      setBusquedaIE('');
    }
  }, [participanteSeleccionado]);

  // Filtrado de participantes
  const participantesFiltrados = useMemo(() => {
    if (!busquedaPart.trim()) return participantesPadron;
    return buscarParticipantes(busquedaPart, { disciplinaId, categoria, limite: 50 });
  }, [busquedaPart, participantesPadron, disciplinaId, categoria]);

  // Filtrado de IIEE (63 opciones)
  const iieeFiltradas = useMemo(() => {
    const t = normalizar(busquedaIE);
    if (!t) return IIEE_UGEL03;
    return IIEE_UGEL03.filter(ie => normalizar(ie.nombre).includes(t));
  }, [busquedaIE]);

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpenPartMenu(false);
        setOpenIEMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAttemptSelectPart = (part) => {
    if (readOnly) return;
    if (tienesPuntajesCargados && participanteSeleccionado && participanteSeleccionado.id !== part.id) {
      if (!confirm("Hay puntajes registrados. Si cambia de participante se perderán. ¿Desea continuar?")) {
        return;
      }
    }
    onSelectParticipante(part);
    setOpenPartMenu(false);
  };

  const handleAttemptSelectIE = (ieObj) => {
    if (readOnly) return;
    onSelectParticipante({
      ...(participanteSeleccionado || {}),
      iieeId: ieObj.id,
      iiee: ieObj.nombre,
      institucionNombre: ieObj.nombre,
      institucion: {
        ...(participanteSeleccionado?.institucion || {}),
        nombre: ieObj.nombre
      }
    });
    setOpenIEMenu(false);
  };

  const handlePartKeyDown = (e) => {
    if (!openPartMenu) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpenPartMenu(true);
      }
      return;
    }

    const totalOptions = participantesFiltrados.length + 1; // +1 por "+ Registrar manual"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightPartIdx(prev => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightPartIdx(prev => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightPartIdx < participantesFiltrados.length) {
        handleAttemptSelectPart(participantesFiltrados[highlightPartIdx]);
      } else {
        // Escape hatch manual
        setOpenPartMenu(false);
        onRegistrarManual();
      }
    } else if (e.key === 'Escape') {
      setOpenPartMenu(false);
    }
  };

  const handleIEKeyDown = (e) => {
    if (!openIEMenu) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpenIEMenu(true);
      }
      return;
    }

    const totalOptions = iieeFiltradas.length + 1; // +1 por "+ Registrar IE manual"

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIEIdx(prev => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIEIdx(prev => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIEIdx < iieeFiltradas.length) {
        handleAttemptSelectIE(iieeFiltradas[highlightIEIdx]);
      } else {
        setOpenIEMenu(false);
        onRegistrarIEManual();
      }
    } else if (e.key === 'Escape') {
      setOpenIEMenu(false);
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 16 }}>
      {/* 1. Selector de Participante Completo (Combo Autocomplete) */}
      <div style={{ position: 'relative' }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>
          SELECCIONAR PARTICIPANTE DE PADRÓN SICE * ({participantesPadron.length} inscritos)
        </label>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            disabled={readOnly}
            value={busquedaPart}
            onChange={e => {
              setBusquedaPart(e.target.value);
              setOpenPartMenu(true);
              setHighlightPartIdx(0);
            }}
            onFocus={() => setOpenPartMenu(true)}
            onKeyDown={handlePartKeyDown}
            placeholder="Buscar por colegio, título, seudónimo o código SICE..."
            style={{
              width: '100%',
              padding: '10px 36px 10px 12px',
              borderRadius: 6,
              border: `1px solid ${openPartMenu ? C.navy3 : C.border}`,
              fontSize: 13,
              fontWeight: 600,
              color: C.navy2,
              background: readOnly ? C.g100 : C.white,
              boxShadow: openPartMenu ? `0 0 0 3px rgba(27,58,92,0.1)` : 'none'
            }}
          />
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon name="search" size={16} color={C.g500} />
          </div>
        </div>

        {/* Desplegable de sugerencias de Participantes */}
        {openPartMenu && !readOnly && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxHeight: 280,
            overflowY: 'auto',
            marginTop: 4
          }}>
            {participantesFiltrados.map((p, idx) => {
              const isHighlight = idx === highlightPartIdx;
              const ieNombre = p.iiee || p.institucion?.nombre || p.institucionNombre || '';
              const codigo = p.codigo || p.codigoParticipante || '';
              const titulo = p.titulo || p.tituloObra || 'Sin título';
              const seudónimo = p.seudonimo || 'Sin seudónimo';

              return (
                <div
                  key={p.codigo || p.id || idx}
                  onMouseDown={() => handleAttemptSelectPart(p)}
                  onMouseEnter={() => setHighlightPartIdx(idx)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${C.g100}`,
                    background: isHighlight ? '#F1F5F9' : C.white,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: C.navy2 }}>
                    <span>{ieNombre}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: C.g500 }}>{codigo}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.g800, marginTop: 2 }}>
                    <strong>{titulo}</strong> &nbsp;·&nbsp; <span style={{ color: C.gold, fontWeight: 700 }}>seudónimo: {seudónimo}</span>
                  </div>
                </div>
              );
            })}

            {/* Salida de escape A: Registrar libre manual */}
            <div
              onMouseDown={() => {
                setOpenPartMenu(false);
                onRegistrarManual();
              }}
              onMouseEnter={() => setHighlightPartIdx(participantesFiltrados.length)}
              style={{
                padding: '10px 12px',
                background: highlightPartIdx === participantesFiltrados.length ? '#FFFBEB' : '#FEF3C7',
                color: C.amber,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                borderTop: `2px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Icon name="plus" size={14} color={C.amber} />
              + Registrar participante que no figura en el padrón
            </div>
          </div>
        )}
      </div>

      {/* 2. Selector Independiente de Institución Educativa (63 IIEE) */}
      <div style={{ position: 'relative' }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.g500, display: 'block', marginBottom: 4 }}>
          INSTITUCIÓN EDUCATIVA (63 IIEE)
        </label>

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            disabled={readOnly}
            value={busquedaIE}
            onChange={e => {
              const val = e.target.value;
              setBusquedaIE(val);
              setOpenIEMenu(true);
              setHighlightIEIdx(0);
              if (!readOnly) {
                onSelectParticipante({
                  ...(participanteSeleccionado || {}),
                  iiee: val,
                  institucionNombre: val,
                  institucion: {
                    ...(participanteSeleccionado?.institucion || {}),
                    nombre: val
                  }
                });
              }
            }}
            onFocus={() => setOpenIEMenu(true)}
            onKeyDown={handleIEKeyDown}
            placeholder="Seleccionar o escribir colegio..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 6,
              border: `1px solid ${openIEMenu ? C.navy3 : C.border}`,
              fontSize: 13,
              fontWeight: 600,
              color: C.navy2,
              background: readOnly ? C.g100 : C.white
            }}
          />
        </div>

        {/* Desplegable de sugerencias de IIEE */}
        {openIEMenu && !readOnly && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            maxHeight: 240,
            overflowY: 'auto',
            marginTop: 4
          }}>
            {iieeFiltradas.map((ieObj, idx) => {
              const isHighlight = idx === highlightIEIdx;
              return (
                <div
                  key={ieObj.id}
                  onMouseDown={() => handleAttemptSelectIE(ieObj)}
                  onMouseEnter={() => setHighlightIEIdx(idx)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${C.g100}`,
                    background: isHighlight ? '#F1F5F9' : C.white,
                    fontSize: 12,
                    fontWeight: 600,
                    color: ieObj.tipo === 'CEBA' ? C.navy3 : C.navy2,
                    cursor: 'pointer'
                  }}
                >
                  {ieObj.nombre} {ieObj.tipo === 'CEBA' ? '(CEBA)' : ''}
                </div>
              );
            })}

            {/* Salida de escape B: Registrar IE manual */}
            <div
              onMouseDown={() => {
                setOpenIEMenu(false);
                onRegistrarIEManual();
              }}
              onMouseEnter={() => setHighlightIEIdx(iieeFiltradas.length)}
              style={{
                padding: '8px 12px',
                background: highlightIEIdx === iieeFiltradas.length ? '#FFFBEB' : '#FEF3C7',
                color: C.amber,
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                borderTop: `1px solid ${C.border}`
              }}
            >
              + Registrar institución educativa que no figura en la lista
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
