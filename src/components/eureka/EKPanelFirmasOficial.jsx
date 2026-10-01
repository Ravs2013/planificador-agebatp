import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../Icon';
import FirmaDigital from '../FirmaDigital';
import { C, CE, S, btn, btnDeshabilitado, aviso, estadoCheck } from './ekEstilos';
import { TIPOS_MIEMBRO_JURADO } from '../../data/eurekaCatalogos';
import { SLOTS_JURADO, getArea, getAreasDeCategoria, CATEGORIAS } from '../../data/eurekaConfigUGEL03';
import {
  JURADOS_EVALUADORES_EUREKA, construirBloqueFirmanteEureka
} from '../../data/eurekaJuradosEvaluadores';
import {
  ALCANCES, scopeIdDe, panelVacio, verificarPanel, firmaEsValida,
  guardarFirmaEnCache, leerFirmaDeCache
} from '../../utils/eurekaFirmas';
import { normalizarDNI, validarDNI, nombreCompletoValido } from '../../utils/eurekaHelpers';
import { guardarBorradorEKPanel, sellarEKPanel, reabrirEKPanel, asegurarEKPanel } from '../../firebase/dbEureka';

const PALABRA_CONFIRMACION = 'SELLAR';

/**
 * 6 ÁREAS OFICIALES DE EUREKA 2026 (Secundaria D y E)
 * 2 Categorías x 3 Áreas = 6 Paneles = 24 Jurados, 24 Firmas y 24 DNIs.
 */
const AREAS_EUREKA_OFICIALES = [
  { categoria: 'D', areaId: 'indagacion_cientifica', nombreArea: 'Indagación científica', catNombre: 'Categoría D (1.° y 2.°)' },
  { categoria: 'D', areaId: 'soluciones_tecnologicas', nombreArea: 'Soluciones tecnológicas', catNombre: 'Categoría D (1.° y 2.°)' },
  { categoria: 'D', areaId: 'ciencias_sociales', nombreArea: 'Ciencias Sociales', catNombre: 'Categoría D (1.° y 2.°)' },
  { categoria: 'E', areaId: 'indagacion_cientifica', nombreArea: 'Indagación científica', catNombre: 'Categoría E (3.°, 4.° y 5.°)' },
  { categoria: 'E', areaId: 'soluciones_tecnologicas', nombreArea: 'Soluciones tecnológicas', catNombre: 'Categoría E (3.°, 4.° y 5.°)' },
  { categoria: 'E', areaId: 'ciencias_sociales', nombreArea: 'Ciencias Sociales', catNombre: 'Categoría E (3.°, 4.° y 5.°)' }
];

/**
 * PANEL DE FIRMAS OFICIAL — EUREKA 2026 (24 JURADOS · SECUNDARIA D Y E)
 *
 * Cada una de las 6 áreas de participación cuenta con su propio panel oficial de 4 jurados.
 * Total: 24 jurados con 24 firmas y 24 DNIs.
 * Al sellar un panel de área, sus 4 jurados gobiernan automáticamente todas las fichas (E15-E18),
 * el consolidado (E19) y el acta (E20) de esa respectiva área.
 */
export default function EKPanelFirmasOficial({
  abierto,
  onCerrar,
  panelesMap = {},
  categoria: categoriaInicial = 'D',
  areaId: areaIdInicial = 'indagacion_cientifica',
  evaluacionesDelAlcance = [],
  participantesDelAlcance = [],
  usuario,
  esAdministrador = false,
  onToast
}) {
  const [categoriaSel, setCategoriaSel] = useState(categoriaInicial || 'D');
  const [areaIdSel, setAreaIdSel] = useState(areaIdInicial || 'indagacion_cientifica');
  const [vistaModo, setVistaModo] = useState('area'); // 'area' | 'matriz'

  // Cache local de paneles editados en memoria para no perder cambios al conmutar de área
  const [panelesLocales, setPanelesLocales] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [mostrarReapertura, setMostrarReapertura] = useState(false);
  const [motivoReapertura, setMotivoReapertura] = useState('');

  // Sincronizar selección inicial si cambia la propiedad cuando se abre el modal
  useEffect(() => {
    if (abierto) {
      if (categoriaInicial && ['D', 'E'].includes(categoriaInicial)) {
        setCategoriaSel(categoriaInicial);
      }
      if (areaIdInicial) {
        setAreaIdSel(areaIdInicial);
      }
    }
  }, [abierto, categoriaInicial, areaIdInicial]);

  // ID del panel activo
  const scopeIdActivo = useMemo(() => {
    return `CAT_${categoriaSel}__AREA_${areaIdSel}`;
  }, [categoriaSel, areaIdSel]);

  // Helper para obtener el panel de un scope (local o remoto o nuevo)
  const obtenerPanelDe = (cat, aId) => {
    const sId = `CAT_${cat}__AREA_${aId}`;
    if (panelesLocales[sId]) return panelesLocales[sId];
    const remoto = panelesMap[sId];
    if (remoto) {
      return {
        ...panelVacio({ alcance: ALCANCES.CATEGORIA_AREA, categoria: cat, areaId: aId }),
        ...remoto,
        firmantes: SLOTS_JURADO.map(slot => {
          const enc = (remoto.firmantes || []).find(f => f.numeroJurado === slot);
          return enc || panelVacio({ alcance: ALCANCES.CATEGORIA_AREA, categoria: cat, areaId: aId }).firmantes[slot - 1];
        })
      };
    }
    return panelVacio({ alcance: ALCANCES.CATEGORIA_AREA, categoria: cat, areaId: aId });
  };

  const panelActivo = useMemo(() => {
    return obtenerPanelDe(categoriaSel, areaIdSel);
  }, [categoriaSel, areaIdSel, panelesLocales, panelesMap]);

  // Sincronizar cambios remotos si el estado cambió en Firestore (sellado/reabierto)
  useEffect(() => {
    const remoto = panelesMap[scopeIdActivo];
    if (remoto && (!panelActivo || panelActivo.estado !== remoto.estado)) {
      setPanelesLocales(prev => ({
        ...prev,
        [scopeIdActivo]: {
          ...panelVacio({ alcance: ALCANCES.CATEGORIA_AREA, categoria: categoriaSel, areaId: areaIdSel }),
          ...remoto,
          firmantes: SLOTS_JURADO.map(slot => {
            const enc = (remoto.firmantes || []).find(f => f.numeroJurado === slot);
            return enc || panelVacio({ alcance: ALCANCES.CATEGORIA_AREA, categoria: categoriaSel, areaId: areaIdSel }).firmantes[slot - 1];
          })
        }
      }));
    }
  }, [scopeIdActivo, panelesMap]);

  const selladoActivo = panelActivo?.estado === 'sellado';

  const verificacionActiva = useMemo(
    () => verificarPanel(panelActivo, { evaluacionesDelAlcance, participantesDelAlcance }),
    [panelActivo, evaluacionesDelAlcance, participantesDelAlcance]
  );

  /* ───── Métricas Globales de los 24 Jurados ───── */
  const metricasGlobales = useMemo(() => {
    let firmasTotales = 0;
    let dnisTotales = 0;
    let areasSelladas = 0;
    const lista24 = [];

    AREAS_EUREKA_OFICIALES.forEach((item, idxArea) => {
      const p = obtenerPanelDe(item.categoria, item.areaId);
      const esSellado = p?.estado === 'sellado';
      if (esSellado) areasSelladas += 1;

      (p?.firmantes || []).forEach((f, idxSlot) => {
        const tieneFirma = Boolean(f?.firmaDataUrl && String(f.firmaDataUrl).startsWith('data:image'));
        const tieneDni = validarDNI(f?.dni);
        if (tieneFirma) firmasTotales += 1;
        if (tieneDni) dnisTotales += 1;

        lista24.push({
          numGlobal: idxArea * 4 + idxSlot + 1,
          categoria: item.categoria,
          catNombre: item.catNombre,
          areaId: item.areaId,
          areaNombre: item.nombreArea,
          slot: f.numeroJurado || (idxSlot + 1),
          nombreCompleto: f.nombreCompleto || '',
          dni: f.dni || '',
          institucion: f.institucion || '',
          cargo: f.cargo || '',
          tipoMiembro: f.tipoMiembro || 'docente_eb',
          presidente: Boolean(f.presidente),
          tieneFirma,
          firmaDataUrl: f.firmaDataUrl,
          estadoArea: esSellado ? 'sellado' : 'borrador',
          scopeId: `CAT_${item.categoria}__AREA_${item.areaId}`
        });
      });
    });

    return {
      totalJurados: 24,
      firmasTotales,
      dnisTotales,
      areasSelladas,
      areasTotales: 6,
      lista24
    };
  }, [panelesLocales, panelesMap]);

  /* ───── Mutaciones del panel activo ───── */

  const actualizarFirmanteActivo = (slot, cambios) => {
    setPanelesLocales(prev => {
      const actual = prev[scopeIdActivo] || panelActivo;
      const nuevosFirmantes = actual.firmantes.map(f =>
        f.numeroJurado === slot ? { ...f, ...cambios } : f
      );
      return {
        ...prev,
        [scopeIdActivo]: {
          ...actual,
          firmantes: nuevosFirmantes
        }
      };
    });
  };

  const marcarPresidenteActivo = (slot) => {
    setPanelesLocales(prev => {
      const actual = prev[scopeIdActivo] || panelActivo;
      const nuevosFirmantes = actual.firmantes.map(f => ({
        ...f,
        presidente: f.numeroJurado === slot
      }));
      return {
        ...prev,
        [scopeIdActivo]: {
          ...actual,
          firmantes: nuevosFirmantes
        }
      };
    });
  };

  const autocompletarDesdePadron = (slot, dni) => {
    if (!dni) {
      actualizarFirmanteActivo(slot, { juradoOperativoRef: '' });
      return;
    }
    const bloque = construirBloqueFirmanteEureka(dni);
    if (!bloque) return;
    actualizarFirmanteActivo(slot, {
      apellidos: bloque.apellidos,
      nombres: bloque.nombres,
      nombreCompleto: bloque.nombreCompleto || `${bloque.apellidos}, ${bloque.nombres}`.trim(),
      dni: bloque.dni,
      correo: bloque.correo,
      institucion: bloque.institucion || 'UGEL 03',
      tipoMiembro: bloque.tipoMiembro,
      juradoOperativoRef: bloque.juradoOperativoRef
    });
    if (bloque.requiereValidacionNombre && onToast) {
      onToast(
        `El desglose de nombres de este jurado proviene del padrón. Verifíquelo antes de sellar.`,
        'alerta'
      );
    }
  };

  const aplicarFirmaActivo = async (slot, dataUrl) => {
    if (!dataUrl) {
      actualizarFirmanteActivo(slot, { firmaDataUrl: null });
      return;
    }
    const resultado = await firmaEsValida(dataUrl);
    if (!resultado.valida) {
      if (onToast) onToast(resultado.motivo || 'El trazo de firma es insuficiente.', 'error');
      return;
    }
    actualizarFirmanteActivo(slot, { firmaDataUrl: dataUrl });
    const firmante = panelActivo.firmantes.find(f => f.numeroJurado === slot);
    guardarFirmaEnCache(scopeIdActivo, slot, firmante?.dni, dataUrl);
  };

  const recuperarFirmaGuardada = (slot) => {
    const firmante = panelActivo.firmantes.find(f => f.numeroJurado === slot);
    const cached = leerFirmaDeCache(scopeIdActivo, slot, firmante?.dni);
    if (cached) {
      actualizarFirmanteActivo(slot, { firmaDataUrl: cached });
      if (onToast) onToast(`Firma recuperada para el Jurado N.° ${slot}.`, 'exito');
    } else if (onToast) {
      onToast('No hay firma guardada para este jurado en la memoria local.', 'alerta');
    }
  };

  /* ───── Acciones Remotas ───── */

  const guardarBorrador = async () => {
    try {
      setGuardando(true);
      await asegurarEKPanel({ alcance: ALCANCES.CATEGORIA_AREA, categoria: categoriaSel, areaId: areaIdSel }, usuario);
      await guardarBorradorEKPanel({
        ...panelActivo,
        id: scopeIdActivo,
        alcance: ALCANCES.CATEGORIA_AREA,
        categoria: categoriaSel,
        areaId: areaIdSel
      }, usuario);
      if (onToast) onToast(`Borrador guardado para ${obtenerNombreArea(areaIdSel)} (Cat. ${categoriaSel}).`, 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo guardar el borrador: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarSellado = async () => {
    if (textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION) {
      if (onToast) onToast(`Escriba ${PALABRA_CONFIRMACION} para confirmar la acción.`, 'error');
      return;
    }
    try {
      setGuardando(true);
      await asegurarEKPanel({ alcance: ALCANCES.CATEGORIA_AREA, categoria: categoriaSel, areaId: areaIdSel }, usuario);
      await sellarEKPanel({
        ...panelActivo,
        id: scopeIdActivo,
        alcance: ALCANCES.CATEGORIA_AREA,
        categoria: categoriaSel,
        areaId: areaIdSel
      }, usuario);
      setMostrarConfirmacion(false);
      setTextoConfirmacion('');
      if (onToast) onToast(`Panel sellado para ${obtenerNombreArea(areaIdSel)} (Cat. ${categoriaSel}). Las firmas rigen oficialmente.`, 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo sellar el panel: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarReapertura = async () => {
    try {
      setGuardando(true);
      await reabrirEKPanel(scopeIdActivo, motivoReapertura, usuario);
      setMostrarReapertura(false);
      setMotivoReapertura('');
      if (onToast) onToast('Panel reabierto. Se registró el motivo en el historial.', 'alerta');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  function obtenerNombreArea(aId) {
    const a = getArea(aId);
    return a ? a.nombre : aId;
  }

  if (!abierto) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.76)', zIndex: 200,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '16px 12px', overflowY: 'auto', backdropFilter: 'blur(3px)'
      }}
      onClick={onCerrar}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: C.gris50, borderRadius: 10, width: '100%', maxWidth: 1320,
          margin: '0 auto', boxShadow: '0 16px 48px rgba(0,0,0,0.45)', overflow: 'hidden'
        }}
      >
        {/* ── Encabezado Institucional ── */}
        <div style={{ background: C.navy2, color: C.blanco, padding: '16px 24px', borderBottom: `3px solid ${CE.verdeEureka}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: CE.verdeEureka, color: C.blanco, fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  Eureka 2026 · Secundaria
                </span>
                <span style={{ fontSize: 12, color: CE.verdeHalo, fontWeight: 600 }}>
                  Etapa UGEL 03
                </span>
              </div>
              <h2 style={{ margin: '6px 0 2px', fontSize: 19, fontWeight: 700, letterSpacing: 0.3 }}>
                Panel de Firmas Oficial — Jurados Calificadores (24 Jurados)
              </h2>
              <div style={{ fontSize: 12, color: '#E2E8F0' }}>
                4 jurados evaluadores por cada área de participación · Categorías D y E · Firmas digitales diferidas
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.12)', padding: 3, borderRadius: 6 }}>
                <button
                  type="button"
                  onClick={() => setVistaModo('area')}
                  style={{
                    padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                    background: vistaModo === 'area' ? CE.verdeEureka : 'transparent',
                    color: vistaModo === 'area' ? C.blanco : '#CBD5E1',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Icon name="edit" size={13} color={vistaModo === 'area' ? C.blanco : '#CBD5E1'} />
                  Gestión por Área
                </button>
                <button
                  type="button"
                  onClick={() => setVistaModo('matriz')}
                  style={{
                    padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                    background: vistaModo === 'matriz' ? CE.verdeEureka : 'transparent',
                    color: vistaModo === 'matriz' ? C.blanco : '#CBD5E1',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Icon name="table" size={13} color={vistaModo === 'matriz' ? C.blanco : '#CBD5E1'} />
                  Matriz General (24 Jurados)
                </button>
              </div>

              <button
                type="button"
                onClick={onCerrar}
                style={{ ...btn('plano'), color: C.blanco, padding: '6px 10px', background: 'rgba(255,255,255,0.08)', borderRadius: 6 }}
                title="Cerrar ventana"
              >
                <Icon name="x" size={18} color={C.blanco} />
              </button>
            </div>
          </div>

          {/* ── Métricas Globales del Panel (24 Jurados / 6 Áreas) ── */}
          <div style={{
            marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.14)',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10
          }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="shield" size={18} color={CE.verdeHalo} />
              <div>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: CE.verdeHalo, fontWeight: 700 }}>Dotación Oficial</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>24 Jurados Calificadores</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="edit" size={18} color={metricasGlobales.firmasTotales >= 24 ? '#86EFAC' : '#FDE68A'} />
              <div>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#CBD5E1', fontWeight: 700 }}>Firmas Registradas</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: metricasGlobales.firmasTotales >= 24 ? '#86EFAC' : '#FEF08A' }}>
                  {metricasGlobales.firmasTotales} de 24 firmas ({Math.round((metricasGlobales.firmasTotales / 24) * 100)}%)
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="checkCircle" size={18} color={metricasGlobales.areasSelladas >= 6 ? '#86EFAC' : '#93C5FD'} />
              <div>
                <div style={{ fontSize: 10.5, textTransform: 'uppercase', color: '#CBD5E1', fontWeight: 700 }}>Áreas Selladas</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: metricasGlobales.areasSelladas >= 6 ? '#86EFAC' : '#BFDBFE' }}>
                  {metricasGlobales.areasSelladas} de 6 áreas oficiales
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navegador de las 6 Áreas (Solo en modo 'area') ── */}
        {vistaModo === 'area' && (
          <div style={{ background: C.blanco, borderBottom: `1px solid ${C.border}`, padding: '12px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
              {/* Selector de Categoría (D o E) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.navy2, textTransform: 'uppercase' }}>
                  Categoría:
                </span>
                {['D', 'E'].map(catId => {
                  const activa = categoriaSel === catId;
                  const catData = CATEGORIAS.find(c => c.id === catId);
                  return (
                    <button
                      key={catId}
                      type="button"
                      onClick={() => setCategoriaSel(catId)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, fontSize: 12.5, fontWeight: 800,
                        cursor: 'pointer', fontFamily: 'inherit',
                        background: activa ? C.navy2 : C.gris100,
                        color: activa ? C.blanco : C.gris700,
                        border: `1.5px solid ${activa ? C.navy2 : C.gris300}`
                      }}
                    >
                      {catData ? catData.nombre : `Categoría ${catId}`}
                    </button>
                  );
                })}
              </div>

              {/* Estado del panel activo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, color: C.gris500 }}>
                  Área seleccionada: <strong>{scopeIdActivo}</strong>
                </span>
                <span style={S.chip(
                  selladoActivo ? '#DCFCE7' : '#FEF3C7',
                  selladoActivo ? C.exito : C.alerta,
                  selladoActivo ? '#86EFAC' : '#FCD34D'
                )}>
                  {selladoActivo ? 'SELLADO' : 'BORRADOR'}
                </span>
              </div>
            </div>

            {/* Selector de las 3 Áreas de la Categoría Seleccionada */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8, marginTop: 10 }}>
              {getAreasDeCategoria(categoriaSel).map(a => {
                const activo = areaIdSel === a.id;
                const panelArea = obtenerPanelDe(categoriaSel, a.id);
                const esSellado = panelArea?.estado === 'sellado';
                const firmasCont = (panelArea?.firmantes || []).filter(f => f?.firmaDataUrl).length;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAreaIdSel(a.id)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      background: activo ? '#F0FDF4' : C.gris50,
                      border: `1.5px solid ${activo ? CE.verdeEureka : (esSellado ? '#BBF7D0' : C.gris300)}`,
                      boxShadow: activo ? '0 2px 8px rgba(21,128,61,0.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: activo ? CE.verdeOscuro : C.navy2 }}>
                        {a.nombre}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                        background: esSellado ? '#DCFCE7' : (firmasCont > 0 ? '#FEF3C7' : C.gris200),
                        color: esSellado ? C.exito : (firmasCont > 0 ? C.alerta : C.gris700)
                      }}>
                        {esSellado ? 'SELLADO' : `${firmasCont}/4 FIRMAS`}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.gris500 }}>
                      4 Jurados Calificadores · {esSellado ? 'Firmas activas' : 'En configuración'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CUERPO: MODO ÁREA (4 JURADOS) ── */}
        {vistaModo === 'area' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 0, alignItems: 'start' }}>
            {/* Tarjetas de los 4 Jurados */}
            <div style={{ padding: 20 }}>
              {selladoActivo && (
                <div style={{ ...aviso('exito'), marginBottom: 16 }}>
                  Este panel de área está <strong>SELLADO</strong>. Los 4 jurados y sus firmas gobiernan todas las fichas, consolidados y actas de <strong>{obtenerNombreArea(areaIdSel)} (Cat. {categoriaSel})</strong>.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                {panelActivo.firmantes.map(firmante => (
                  <TarjetaFirmante
                    key={firmante.numeroJurado}
                    firmante={firmante}
                    scopeId={scopeIdActivo}
                    soloLectura={selladoActivo}
                    onCampo={(cambios) => actualizarFirmanteActivo(firmante.numeroJurado, cambios)}
                    onPresidente={() => marcarPresidenteActivo(firmante.numeroJurado)}
                    onPadron={(dni) => autocompletarDesdePadron(firmante.numeroJurado, dni)}
                    onFirma={(dataUrl) => aplicarFirmaActivo(firmante.numeroJurado, dataUrl)}
                    onRecuperarFirma={() => recuperarFirmaGuardada(firmante.numeroJurado)}
                  />
                ))}
              </div>
            </div>

            {/* Barra lateral de verificación del área */}
            <div style={{ padding: '20px 20px 20px 0' }}>
              <div style={{ ...S.tarjeta, padding: 16, position: 'sticky', top: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.navy2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                  Verificación de Área
                </div>
                <div style={{ fontSize: 11, color: C.gris500, marginBottom: 12 }}>
                  Área: <strong>{obtenerNombreArea(areaIdSel)}</strong> ({categoriaSel})
                </div>

                {verificacionActiva.checks.map(check => {
                  const est = estadoCheck(check.ok, check.bloqueante);
                  return (
                    <div key={check.id} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{
                          display: 'inline-block', minWidth: 44, textAlign: 'center',
                          fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase',
                          padding: '2px 5px', borderRadius: 3,
                          background: est.fondo, color: est.color, border: `1px solid ${est.color}33`
                        }}>
                          {est.texto}
                        </span>
                        <span style={{ fontSize: 11.5, color: C.gris700, lineHeight: 1.4 }}>{check.label}</span>
                      </div>
                      {!check.ok && (check.detalle || []).length > 0 && (
                        <ul style={{ margin: '4px 0 0 52px', paddingLeft: 12, fontSize: 10.5, color: est.color, lineHeight: 1.5 }}>
                          {check.detalle.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      )}
                    </div>
                  );
                })}

                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, fontSize: 11, color: C.gris500 }}>
                  Gobernanza oficial:<br />
                  Este panel suscribe los <strong>Anexos de Fichas</strong>, el <strong>Consolidado E19</strong> y el <strong>Acta E20</strong> de {obtenerNombreArea(areaIdSel)}.
                </div>

                {(panelActivo.historial || []).length > 0 && (
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ fontSize: 11, fontWeight: 700, color: C.gris500, cursor: 'pointer' }}>
                      Historial del área ({panelActivo.historial.length})
                    </summary>
                    <div style={{ marginTop: 6, maxHeight: 150, overflowY: 'auto' }}>
                      {[...panelActivo.historial].reverse().map((h, i) => (
                        <div key={i} style={{ fontSize: 10, color: C.gris500, padding: '3px 0', borderBottom: `1px solid ${C.gris100}` }}>
                          <strong style={{ color: C.gris700 }}>{h.accion}</strong> · {h.correo || h.uid} ·{' '}
                          {h.en ? new Date(h.en).toLocaleString('es-PE') : ''}
                          {h.motivo && <div style={{ fontStyle: 'italic' }}>Motivo: {h.motivo}</div>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CUERPO: MODO MATRIZ GENERAL (24 JURADOS) ── */}
        {vistaModo === 'matriz' && (
          <div style={{ padding: 22 }}>
            <div style={{ ...S.tarjeta, padding: 18, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.navy2 }}>
                    Nómina Consolidada de los 24 Jurados Calificadores (Eureka 2026)
                  </h3>
                  <div style={{ fontSize: 12, color: C.gris500, marginTop: 2 }}>
                    Visualización completa de las 6 áreas de participación (Categorías D y E) y el estado de sus firmas
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={S.chip('#DCFCE7', C.exito, '#86EFAC')}>
                    {metricasGlobales.firmasTotales} / 24 Firmas registradas
                  </span>
                  <span style={S.chip('#EFF6FF', '#1E40AF', '#BFDBFE')}>
                    {metricasGlobales.areasSelladas} / 6 Áreas selladas
                  </span>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ ...S.tabla, borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#1B3A5C', color: '#FFFFFF' }}>
                      <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', width: 40, textAlign: 'center' }}>N.°</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', width: 90, textAlign: 'center' }}>CATEGORÍA</th>
                      <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', width: 180 }}>ÁREA DE PARTICIPACIÓN</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', width: 80, textAlign: 'center' }}>CASILLERO</th>
                      <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1' }}>JURADO CALIFICADOR (NOMBRE Y APELLIDOS)</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', width: 90, textAlign: 'center' }}>DNI</th>
                      <th style={{ padding: '8px 12px', border: '1px solid #CBD5E1', width: 140 }}>INSTITUCIÓN</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', width: 90, textAlign: 'center' }}>ROL</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', width: 110, textAlign: 'center' }}>FIRMA</th>
                      <th style={{ padding: '8px 10px', border: '1px solid #CBD5E1', width: 90, textAlign: 'center' }}>ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricasGlobales.lista24.map(row => {
                      const esSellado = row.estadoArea === 'sellado';
                      return (
                        <tr key={row.numGlobal} style={{ background: row.presidente ? '#FEFCE8' : (row.numGlobal % 2 === 0 ? '#F8FAFC' : '#FFFFFF') }}>
                          <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>{row.numGlobal}</td>
                          <td style={{ ...S.td, textAlign: 'center', fontWeight: 800, color: C.navy2 }}>Cat. {row.categoria}</td>
                          <td style={{ ...S.td, fontWeight: 600 }}>{row.areaNombre}</td>
                          <td style={{ ...S.td, textAlign: 'center', fontWeight: 700 }}>Jurado {row.slot}</td>
                          <td style={{ ...S.td, fontWeight: row.nombreCompleto ? 700 : 400, color: row.nombreCompleto ? C.gris900 : C.gris300 }}>
                            {row.nombreCompleto || '— Pendiente de asignar —'}
                          </td>
                          <td style={{ ...S.td, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>
                            {row.dni || '—'}
                          </td>
                          <td style={{ ...S.td, fontSize: 11 }}>{row.institucion || 'UGEL 03'}</td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            {row.presidente ? (
                              <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF9C3', color: '#854D0E', padding: '2px 6px', borderRadius: 4, border: '1px solid #FDE68A' }}>
                                Presidente
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: C.gris500 }}>Miembro</span>
                            )}
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            {row.tieneFirma ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 800, color: C.exito, background: '#F0FDF4', padding: '2px 6px', borderRadius: 4, border: '1px solid #BBF7D0' }}>
                                  ✓ Registrada
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: C.error, background: '#FEF2F2', padding: '2px 6px', borderRadius: 4, border: '1px solid #FECACA' }}>
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setCategoriaSel(row.categoria);
                                setAreaIdSel(row.areaId);
                                setVistaModo('area');
                              }}
                              style={{
                                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                background: C.gris100, border: `1px solid ${C.gris300}`, color: C.navy2,
                                cursor: 'pointer'
                              }}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Pie de Acciones ── */}
        <div style={{
          padding: '14px 24px', background: C.blanco, borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap'
        }}>
          <button type="button" onClick={onCerrar} style={btn('secundario')}>Cerrar</button>

          {vistaModo === 'area' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {!selladoActivo && (
                <button
                  type="button"
                  onClick={guardarBorrador}
                  disabled={guardando}
                  style={guardando ? btnDeshabilitado(btn('secundario')) : btn('secundario')}
                >
                  <Icon name="save" size={14} /> Guardar borrador ({obtenerNombreArea(areaIdSel)})
                </button>
              )}

              {!selladoActivo && (
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion(true)}
                  disabled={!verificacionActiva.puedeSellar || guardando}
                  style={(!verificacionActiva.puedeSellar || guardando) ? btnDeshabilitado(btn('primario')) : btn('primario')}
                  title={verificacionActiva.puedeSellar ? '' : 'Resuelva las comprobaciones bloqueantes antes de sellar.'}
                >
                  <Icon name="shield" size={14} /> SELLAR PANEL ({obtenerNombreArea(areaIdSel)})
                </button>
              )}

              {selladoActivo && esAdministrador && (
                <button type="button" onClick={() => setMostrarReapertura(true)} style={btn('peligro')}>
                  <Icon name="refresh" size={14} /> Reabrir panel de esta área
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Diálogo de confirmación de sellado ── */}
      {mostrarConfirmacion && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.8)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ ...S.tarjeta, padding: 24, maxWidth: 620, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.navy2, marginBottom: 14 }}>
              Confirmar Sellado del Área: {obtenerNombreArea(areaIdSel)} (Cat. {categoriaSel})
            </div>

            <div style={{ fontSize: 13, color: C.gris700, lineHeight: 1.6, marginBottom: 14 }}>
              Al sellar el panel de esta área, las firmas y datos de sus cuatro jurados designados se incorporarán a
              todas las fichas de evaluación, consolidados y actas de esta respectiva área. Los documentos
              dejarán de emitirse como preliminares.
            </div>

            <div style={{ ...aviso('eureka'), marginBottom: 14 }}>
              <div><strong>Área gobernada:</strong> {obtenerNombreArea(areaIdSel)} — Categoría {categoriaSel}</div>
              <div><strong>Identificador:</strong> {scopeIdActivo}</div>
            </div>

            {verificacionActiva.advertencias.length > 0 && (
              <div style={{ ...aviso('alerta'), marginBottom: 14 }}>
                <div style={{ fontWeight: 700, marginBottom: 5 }}>Advertencias no bloqueantes:</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {verificacionActiva.advertencias.flatMap(a => a.detalle).map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}

            <label style={S.etiqueta}>Escriba {PALABRA_CONFIRMACION} para confirmar</label>
            <input
              autoFocus
              value={textoConfirmacion}
              onChange={e => setTextoConfirmacion(e.target.value)}
              style={{ ...S.input, letterSpacing: 2, fontWeight: 700, textTransform: 'uppercase' }}
              placeholder={PALABRA_CONFIRMACION}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                onClick={() => { setMostrarConfirmacion(false); setTextoConfirmacion(''); }}
                style={btn('secundario')}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarSellado}
                disabled={guardando || textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION}
                style={(guardando || textoConfirmacion.trim().toUpperCase() !== PALABRA_CONFIRMACION)
                  ? btnDeshabilitado(btn('primario')) : btn('primario')}
              >
                <Icon name="shield" size={14} /> Sellar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Diálogo de reapertura ── */}
      {mostrarReapertura && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(12,25,41,0.8)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ ...S.tarjeta, padding: 24, maxWidth: 560, width: '100%' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.error, marginBottom: 12 }}>
              Reabrir el Panel de {obtenerNombreArea(areaIdSel)} (Cat. {categoriaSel})
            </div>
            <div style={{ fontSize: 12.5, color: C.gris700, lineHeight: 1.6, marginBottom: 14 }}>
              Al reabrir el panel, todos los documentos de esta área vuelven a emitirse como preliminares
              hasta que se selle de nuevo. El motivo queda registrado en el historial auditado.
            </div>
            <label style={S.etiqueta}>Motivo de la reapertura (obligatorio, mínimo 10 caracteres)</label>
            <textarea
              autoFocus
              value={motivoReapertura}
              onChange={e => setMotivoReapertura(e.target.value)}
              style={S.textarea}
              placeholder="Indique la razón por la que la comisión organizadora autoriza reabrir el panel."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button type="button" onClick={() => setMostrarReapertura(false)} style={btn('secundario')}>Cancelar</button>
              <button
                type="button"
                onClick={confirmarReapertura}
                disabled={guardando || motivoReapertura.trim().length < 10}
                style={(guardando || motivoReapertura.trim().length < 10) ? btnDeshabilitado(btn('critico')) : btn('critico')}
              >
                Reabrir panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Tarjeta de un Casillero de Jurado (1..4) ───── */

function TarjetaFirmante({ firmante, scopeId, soloLectura, onCampo, onPresidente, onPadron, onFirma, onRecuperarFirma }) {
  const [filtro, setFiltro] = useState('');

  const candidatos = useMemo(() => {
    const f = filtro.trim().toLowerCase();
    if (!f) return JURADOS_EVALUADORES_EUREKA;
    return JURADOS_EVALUADORES_EUREKA.filter(
      j => (j.nombreCompleto || '').toLowerCase().includes(f) || (j.dni || '').includes(f)
    );
  }, [filtro]);

  const nombreOk = nombreCompletoValido(firmante.nombreCompleto);
  const dniOk = validarDNI(firmante.dni);
  const firmaOk = Boolean(firmante.firmaDataUrl && String(firmante.firmaDataUrl).startsWith('data:image'));

  const claveCache = `ek_sig_${scopeId}_j${firmante.numeroJurado}_dni_${normalizarDNI(firmante.dni)}`;

  return (
    <div style={{
      ...S.tarjeta,
      padding: 14,
      border: `1px solid ${firmante.presidente ? C.dorado : C.border}`,
      borderTop: `3px solid ${firmante.presidente ? C.dorado : CE.verdeEureka}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: C.navy2 }}>
          Jurado N.° {firmante.numeroJurado}
        </div>
        {firmante.presidente && (
          <span style={S.chip('#FEF9C3', '#854D0E', '#FDE68A')}>Presidente del Jurado</span>
        )}
      </div>

      {!soloLectura && (
        <div style={{ marginBottom: 10 }}>
          <label style={S.etiqueta}>Autocompletar desde padrón (opcional)</label>
          <input
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
            placeholder="Buscar por nombre o DNI"
            style={{ ...S.input, marginBottom: 5, fontSize: 11.5 }}
          />
          <select
            value={firmante.juradoOperativoRef || ''}
            onChange={e => onPadron(e.target.value)}
            style={{ ...S.input, fontSize: 11.5 }}
          >
            <option value="">Alta manual / teclear datos</option>
            {candidatos.map(j => (
              <option key={j.dni} value={j.dni}>
                {j.nombreCompleto} — DNI {j.dni}
              </option>
            ))}
          </select>
        </div>
      )}

      <Campo
        etiqueta="Apellidos"
        valor={firmante.apellidos}
        soloLectura={soloLectura}
        onChange={v => onCampo({ apellidos: v, nombreCompleto: `${v}, ${firmante.nombres || ''}`.replace(/^,\s*|,\s*$/g, '') })}
      />

      <Campo
        etiqueta="Nombres"
        valor={firmante.nombres}
        soloLectura={soloLectura}
        onChange={v => onCampo({ nombres: v, nombreCompleto: `${firmante.apellidos || ''}, ${v}`.replace(/^,\s*|,\s*$/g, '') })}
      />

      <Campo
        etiqueta="Nombre completo tal como se imprimirá en actas y fichas"
        valor={firmante.nombreCompleto}
        soloLectura={soloLectura}
        onChange={v => onCampo({ nombreCompleto: v })}
        error={!nombreOk ? 'Requiere al menos nombre y apellido.' : null}
      />

      <Campo
        etiqueta="DNI (8 dígitos)"
        valor={firmante.dni}
        soloLectura={soloLectura}
        onChange={v => onCampo({ dni: String(v).replace(/\D/g, '').slice(0, 8) })}
        error={!dniOk ? 'El DNI debe tener exactamente 8 dígitos.' : null}
      />

      <Campo
        etiqueta="Institución / Centro de trabajo"
        valor={firmante.institucion}
        soloLectura={soloLectura}
        onChange={v => onCampo({ institucion: v })}
      />

      <div style={{ marginBottom: 9 }}>
        <label style={S.etiqueta}>Tipo de miembro</label>
        <select
          value={firmante.tipoMiembro || 'docente_eb'}
          disabled={soloLectura}
          onChange={e => onCampo({ tipoMiembro: e.target.value })}
          style={{ ...S.input, fontSize: 12 }}
        >
          {TIPOS_MIEMBRO_JURADO.filter(t => t.id !== 'por_definir').map(t => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>

      <Campo
        etiqueta="Cargo o especialidad académica (opcional)"
        valor={firmante.cargo}
        soloLectura={soloLectura}
        onChange={v => onCampo({ cargo: v })}
      />

      <label style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        fontSize: 12, color: C.gris700, cursor: soloLectura ? 'default' : 'pointer'
      }}>
        <input
          type="checkbox"
          checked={Boolean(firmante.presidente)}
          disabled={soloLectura}
          onChange={onPresidente}
          style={{ accentColor: C.dorado }}
        />
        Presidente del jurado calificador de esta área
      </label>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <label style={{ ...S.etiqueta, marginBottom: 0 }}>Firma Digital</label>
          <span style={S.chip(
            firmaOk ? '#F0FDF4' : '#FEF2F2',
            firmaOk ? C.exito : C.error,
            firmaOk ? '#BBF7D0' : '#FECACA'
          )}>
            {firmaOk ? 'Registrada ✓' : 'Pendiente'}
          </span>
        </div>

        {soloLectura ? (
          <div style={{
            border: `1px solid ${C.gris300}`, borderRadius: 6, padding: 8, background: C.blanco,
            minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {firmante.firmaDataUrl
              ? <img src={firmante.firmaDataUrl} alt={`Firma del Jurado N.° ${firmante.numeroJurado}`} style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 11.5, color: C.gris500 }}>Sin firma registrada</span>}
          </div>
        ) : (
          <>
            <FirmaDigital
              value={firmante.firmaDataUrl}
              onChange={onFirma}
              label=""
              storageKey={claveCache}
            />
            <button
              type="button"
              onClick={onRecuperarFirma}
              style={btn('plano', { padding: '4px 8px', fontSize: 11, marginTop: 4 })}
            >
              <Icon name="refresh" size={11} /> Recuperar firma guardada en caché
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Campo({ etiqueta, valor, onChange, soloLectura, error }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <label style={S.etiqueta}>{etiqueta}</label>
      <input
        value={valor || ''}
        readOnly={soloLectura}
        onChange={e => onChange(e.target.value)}
        style={{
          ...S.input,
          fontSize: 12,
          background: soloLectura ? C.gris100 : C.blanco,
          borderColor: error ? C.error : C.gris300
        }}
      />
      {error && !soloLectura && (
        <div style={{ fontSize: 10.5, color: C.error, marginTop: 2 }}>{error}</div>
      )}
    </div>
  );
}
