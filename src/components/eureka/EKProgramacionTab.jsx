import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, CE, S, btn, btnDeshabilitado, aviso } from './ekEstilos';
import { CRONOGRAMA_EUREKA_2026 } from '../../data/eurekaCatalogos';
import {
  EUREKA_CONFIG, CATEGORIAS, getAreasDeCategoria, getArea, getCategoria
} from '../../data/eurekaConfigUGEL03';
import { formatearFechaLarga } from '../../utils/eurekaHelpers';
import { sortearOrdenPresentacion } from '../../firebase/dbEureka';
import { generarE21PDF } from '../../pdf/generarE21PDF';
import { obtenerMembreteEureka } from '../../pdf/membreteEureka';

/**
 * Programación: cronograma oficial, sede, sorteo del orden de presentación y generación
 * del Anexo E21 (Ficha Única de Reclamos).
 */
export default function EKProgramacionTab({
  categoria, areaId, participantes = [], usuario, esStaff = false, onToast
}) {
  const [sorteando, setSorteando] = useState(false);

  const cat = getCategoria(categoria);
  const area = getArea(areaId);

  const sorteo = useMemo(() => {
    const conSorteo = participantes.filter(p => p.sorteoRealizadoEn);
    if (conSorteo.length === 0) return null;
    const ultimo = conSorteo.reduce((a, b) => (a.sorteoRealizadoEn > b.sorteoRealizadoEn ? a : b));
    return { en: ultimo.sorteoRealizadoEn, por: ultimo.sorteoRealizadoPor };
  }, [participantes]);

  const ejecutarSorteo = async () => {
    if (participantes.length === 0) {
      if (onToast) onToast('No hay participantes registrados en esta categoría y área.', 'error');
      return;
    }
    if (!window.confirm(
      `Se reasignará el orden de presentación de ${participantes.length} proyecto(s).\n\n`
      + 'El sorteo debe ejecutarse en presencia de los delegados. Quedará registro de la fecha, '
      + 'la hora y el usuario que lo realizó. ¿Continuar?'
    )) return;

    try {
      setSorteando(true);
      const n = await sortearOrdenPresentacion({ categoria, areaId, usuario });
      if (onToast) onToast(`Sorteo realizado. Se asignó el orden 1 a ${n} proyectos.`, 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo realizar el sorteo: ${err.message}`, 'error');
    } finally {
      setSorteando(false);
    }
  };

  const descargarFUR = async () => {
    try {
      const banner = await obtenerMembreteEureka();
      generarE21PDF({
        categoria,
        areaId,
        fecha: EUREKA_CONFIG.fechaEvaluacion,
        lugar: EUREKA_CONFIG.sede,
        banner
      });
      if (onToast) onToast('Anexo E21 (Ficha Única de Reclamos) descargado.', 'exito');
    } catch (err) {
      if (onToast) onToast(`No se pudo generar el Anexo E21: ${err.message}`, 'error');
    }
  };

  const ordenados = useMemo(
    () => [...participantes].sort((a, b) => (a.ordenPresentacion || 999) - (b.ordenPresentacion || 999)),
    [participantes]
  );

  return (
    <div>
      {/* ── Cronograma oficial ── */}
      <div style={{ ...S.seccion }}>
        <div style={S.tituloSeccion}>Cronograma oficial Eureka 2026</div>
        <table style={S.tabla}>
          <thead>
            <tr>
              <th style={S.th}>Hito</th>
              <th style={{ ...S.th, width: 200 }}>Fechas</th>
            </tr>
          </thead>
          <tbody>
            {CRONOGRAMA_EUREKA_2026.map((h, i) => {
              const d1 = formatearFechaLarga(h.desde);
              const d2 = formatearFechaLarga(h.hasta);
              return (
                <tr key={i} style={{ background: h.destacado ? CE.verdeFondo : C.blanco }}>
                  <td style={{ ...S.td, fontWeight: h.destacado ? 700 : 400, color: h.destacado ? CE.verdeOscuro : C.gris900 }}>
                    {h.hito}
                  </td>
                  <td style={S.td}>
                    {d1.dia} de {d1.mes} al {d2.dia} de {d2.mes} de {d2.anio}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Datos de la sede ── */}
      <div style={{ ...S.seccion }}>
        <div style={S.tituloSeccion}>Sede y datos institucionales</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
          <Dato etiqueta="DRE/GRE" valor={EUREKA_CONFIG.dre} />
          <Dato etiqueta="UGEL" valor={EUREKA_CONFIG.ugel} />
          <Dato etiqueta="Región" valor={EUREKA_CONFIG.region} />
          <Dato etiqueta="Provincia" valor={EUREKA_CONFIG.provincia} />
          <Dato etiqueta="Distrito" valor={EUREKA_CONFIG.distrito} />
          <Dato etiqueta="Sede" valor={EUREKA_CONFIG.sede} />
          <Dato etiqueta="Fecha de evaluación" valor={EUREKA_CONFIG.fechaEvaluacion} />
          <Dato etiqueta="Hora del acta" valor={EUREKA_CONFIG.horaActa} />
        </div>

        {!EUREKA_CONFIG.sede && (
          <div style={{ ...aviso('alerta'), marginTop: 14 }}>
            La sede de la etapa UGEL 03 está pendiente de confirmación por la comisión organizadora.
            Ese dato se imprime en el encabezado del Anexo E19 y en el texto legal del Anexo E20; hasta
            confirmarlo, el distrito configurado por defecto es {EUREKA_CONFIG.distrito}. Se ajusta en
            frontend/src/data/eurekaConfigUGEL03.js.
          </div>
        )}
      </div>

      {/* ── Sorteo del orden de presentación ── */}
      <div style={{ ...S.seccion }}>
        <div style={S.tituloSeccion}>Sorteo del orden de presentación</div>

        <div style={{ fontSize: 12.5, color: C.gris700, lineHeight: 1.6, marginBottom: 12 }}>
          El sorteo aplica el algoritmo Fisher-Yates y se persiste de forma atómica para{' '}
          <strong>{cat ? cat.nombre : categoria}</strong> — <strong>{area ? area.nombre : areaId}</strong>.
          Debe ejecutarse en presencia de los delegados, antes del inicio de la jornada.
        </div>

        {sorteo && (
          <div style={{ ...aviso('eureka'), marginBottom: 12 }}>
            Último sorteo: {new Date(sorteo.en).toLocaleString('es-PE')} · Ejecutado por {sorteo.por}
          </div>
        )}

        {esStaff && (
          <button type="button" onClick={ejecutarSorteo} disabled={sorteando || participantes.length === 0}
            style={(sorteando || participantes.length === 0) ? btnDeshabilitado(btn('primario')) : btn('primario')}>
            <Icon name="refresh" size={13} /> {sorteando ? 'Sorteando...' : 'Ejecutar sorteo'}
          </button>
        )}

        {ordenados.length > 0 && (
          <div style={{ marginTop: 14, overflowX: 'auto' }}>
            <table style={S.tabla}>
              <thead>
                <tr>
                  <th style={{ ...S.th, width: 60, textAlign: 'center' }}>Orden</th>
                  <th style={S.th}>I. E.</th>
                  <th style={S.th}>Proyecto</th>
                </tr>
              </thead>
              <tbody>
                {ordenados.map(p => (
                  <tr key={p.id}>
                    <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: CE.verdeOscuro }}>
                      {p.ordenPresentacion || '—'}
                    </td>
                    <td style={{ ...S.td, fontSize: 11.5 }}>{p.institucion?.nombre || p.institucionNombre}</td>
                    <td style={{ ...S.td, fontSize: 11.5 }}>{p.tituloProyecto || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Cobertura de la etapa ── */}
      <div style={{ ...S.seccion }}>
        <div style={S.tituloSeccion}>Combinaciones de la etapa UGEL</div>
        <table style={S.tabla}>
          <thead>
            <tr>
              <th style={S.th}>Categoría</th>
              <th style={S.th}>Áreas de participación</th>
              <th style={{ ...S.th, width: 230 }}>Regla de clasificación</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS.map(c => (
              <tr key={c.id} style={{ background: c.id === categoria ? CE.verdeFondo : C.blanco }}>
                <td style={{ ...S.td, fontWeight: 700 }}>
                  {c.nombre}
                  <div style={{ fontWeight: 400, fontSize: 11, color: C.gris500 }}>{c.grados}</div>
                </td>
                <td style={{ ...S.td, fontSize: 11.5 }}>
                  {getAreasDeCategoria(c.id).map(a => a.nombre).join(' · ')}
                </td>
                <td style={{ ...S.td, fontSize: 11.5, color: c.finalizaEnUGEL ? CE.verdeOscuro : C.azul }}>
                  {c.finalizaEnUGEL
                    ? 'La participación finaliza en la etapa UGEL. Se reconoce a los tres primeros puestos.'
                    : 'El 1.er puesto clasifica a la etapa DRE.'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Anexo E21 ── */}
      <div style={{ ...S.seccion }}>
        <div style={S.tituloSeccion}>Anexo E21 — Ficha Única de Reclamos</div>
        <div style={{ fontSize: 12.5, color: C.gris700, lineHeight: 1.6, marginBottom: 12 }}>
          Formulario imprimible para el docente asesor. El reclamo se presenta a la comisión organizadora
          hasta veinticuatro (24) horas después de la publicación de los resultados; vencido ese plazo no
          se aceptan reclamos.
        </div>
        <button type="button" onClick={descargarFUR} style={btn('secundario')}>
          <Icon name="download" size={13} /> Descargar Anexo E21
        </button>
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.gris500, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {etiqueta}
      </div>
      <div style={{ fontSize: 12.5, color: C.gris900, marginTop: 2 }}>{valor || 'Por confirmar'}</div>
    </div>
  );
}
