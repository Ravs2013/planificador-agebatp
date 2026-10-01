import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { COPAE_CONFIG } from '../../data/copaeConfig';
import {
  subscribeCOPAEParticipantes,
  subscribeCOPAEEvaluaciones,
  subscribeCOPAEPanel,
  subscribeCOPAEConsolidado,
  asegurarParticipantesCOPAE
} from '../../firebase/dbCOPAE';
import { calcularConsolidadoCOPAE, evaluacionIdCOPAE } from '../../utils/copaeHelpers';
import { esPreliminarCOPAE } from '../../utils/copaeFirmas';
import {
  generarConsolidadoCOPAEPDF,
  generarTodasFichasCOPAEPDF,
  generarPaqueteCompletoCOPAEPDF
} from '../../pdf/generarFichaCOPAEPDF';

import COPAESelectorCEBA from './COPAESelectorCEBA';
import COPAEFichaEvaluacion from './COPAEFichaEvaluacion';
import COPAEConsolidado from './COPAEConsolidado';
import COPAEPanelFirmas from './COPAEPanelFirmas';

const SUB_PESTANAS = [
  { id: 'fichas', label: 'Fichas de evaluación', icon: 'clipboard' },
  { id: 'consolidado', label: 'Consolidado del Jurado', icon: 'fileText' }
];

export default function COPAEModule() {
  const { user, isRole } = useAuth();
  const esStaff = isRole('admin') || isRole('jefatura') || isRole('personal');
  const esJuradoCOPAE = Boolean(
    user?.modulo === 'copae' ||
    (user?.email && user.email.toLowerCase().includes('copae'))
  );

  const casilleroSesion = esJuradoCOPAE && Number(user?.numeroJurado) >= 1 && Number(user?.numeroJurado) <= 2
    ? Number(user.numeroJurado)
    : null;

  const [subTab, setSubTab] = useState('fichas');
  const [numeroJurado, setNumeroJurado] = useState(casilleroSesion || 1);
  const [seleccionadoId, setSeleccionadoId] = useState(null);

  const [cebas, setCebas] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [panel, setPanel] = useState(null);
  const [consolidadoMeta, setConsolidadoMeta] = useState({ observacionFinal: '' });

  const [panelAbierto, setPanelAbierto] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (casilleroSesion) setNumeroJurado(casilleroSesion);
  }, [casilleroSesion]);

  const addToast = useCallback((msg, tipo = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, msg, tipo }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  // Suscripciones en tiempo real
  useEffect(() => {
    asegurarParticipantesCOPAE();
    const bajas = [
      subscribeCOPAEParticipantes(setCebas),
      subscribeCOPAEEvaluaciones(setEvaluaciones),
      subscribeCOPAEPanel(setPanel),
      subscribeCOPAEConsolidado(setConsolidadoMeta)
    ];
    return () => bajas.forEach(b => { if (typeof b === 'function') b(); });
  }, []);

  // Consolidado computado en tiempo real
  const consolidado = useMemo(() => {
    return calcularConsolidadoCOPAE(cebas, evaluaciones);
  }, [cebas, evaluaciones]);

  const preliminar = esPreliminarCOPAE(panel);

  const cebaActivo = useMemo(() => {
    return cebas.find(c => c.id === seleccionadoId) || null;
  }, [cebas, seleccionadoId]);

  const evaluacionActiva = useMemo(() => {
    if (!cebaActivo) return null;
    return evaluaciones.find(
      ev => ev.cebaId === cebaActivo.id && Number(ev.numeroJurado) === numeroJurado
    ) || null;
  }, [cebaActivo, numeroJurado, evaluaciones]);

  // Manejo de Descargas Masivas
  const handleDescargarTodasFichas = async () => {
    try {
      setDescargando(true);
      addToast('Generando documento con todas las fichas...', 'info');
      const doc = await generarTodasFichasCOPAEPDF({
        cebas,
        evaluaciones,
        panel,
        numeroJurado: esStaff ? null : numeroJurado
      });
      doc.save('TODAS_LAS_FICHAS_COPAE_UGEL03.pdf');
      addToast('Descarga masiva de fichas completada.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Error generando PDF masivo de fichas.', 'error');
    } finally {
      setDescargando(false);
    }
  };

  const handleDescargarPaqueteCompleto = async () => {
    try {
      setDescargando(true);
      addToast('Generando paquete legal completo COPAE...', 'info');
      const doc = await generarPaqueteCompletoCOPAEPDF({
        cebas,
        evaluaciones,
        filasConsolidado: consolidado.filas,
        observacionFinal: consolidadoMeta?.observacionFinal || '',
        panel
      });
      doc.save('PAQUETE_COMPLETO_OFICIAL_COPAE_UGEL03.pdf');
      addToast('Paquete completo descargado con éxito.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Error generando paquete completo.', 'error');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px', fontFamily: 'inherit' }}>
      {/* Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          pointerEvents: 'none'
        }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            style={{
              padding: '12px 18px',
              borderRadius: 8,
              backgroundColor: t.tipo === 'success' ? '#065F46' : (t.tipo === 'error' ? '#991B1B' : '#1E3A8A'),
              color: '#FFFFFF',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              fontSize: 13,
              fontWeight: 600,
              pointerEvents: 'auto',
              maxWidth: 380,
              animation: 'fadeIn 0.2s ease'
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>

      {/* Encabezado Principal Institucional */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          padding: '20px 24px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: '#1E3A8A',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(30, 58, 138, 0.25)'
            }}
          >
            <Icon name="award" size={28} color="#F59E0B" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: -0.4 }}>
                PRECONGRESO DE COPAE – UGEL 03
              </h1>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: '#FEF3C7',
                  color: '#B45309',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid #FDE68A'
                }}
              >
                {COPAE_CONFIG.lema}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
              Consejo de Participación Escolar · Educación Básica Alternativa (EBA) · 19 CEBAs · 2 Jurados Evaluadores
            </p>
          </div>
        </div>

        {/* Acciones del Encabezado */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
          {/* Botón Panel de Firmas */}
          <button
            onClick={() => setPanelAbierto(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              backgroundColor: preliminar ? '#FEF3C7' : '#ECFDF5',
              color: preliminar ? '#92400E' : '#065F46',
              border: `1.5px solid ${preliminar ? '#F59E0B' : '#10B981'}`,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Icon name="shield" size={16} color={preliminar ? '#D97706' : '#059669'} />
            {preliminar ? 'Panel de Firmas (Borrador)' : 'Firmas Oficiales Selladas'}
          </button>

          {/* Botón Descarga Paquete Completo */}
          <button
            onClick={handleDescargarPaqueteCompleto}
            disabled={descargando}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              backgroundColor: '#1E3A8A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(30, 58, 138, 0.2)'
            }}
          >
            <Icon name="download" size={16} />
            {descargando ? 'Generando...' : 'Descargar Paquete Completo'}
          </button>

          {/* Botón Descargar Todas las Fichas */}
          <button
            onClick={handleDescargarTodasFichas}
            disabled={descargando}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              backgroundColor: '#F8FAFC',
              color: '#334155',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Icon name="clipboard" size={15} />
            Todas las Fichas (PDF)
          </button>
        </div>
      </div>

      {/* Banner de Advertencia si está preliminar */}
      {preliminar && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: 10,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            fontSize: 13
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#92400E' }}>
            <Icon name="alertTriangle" size={20} color="#D97706" />
            <div>
              <strong>Panel de firmas oficial pendiente de sellado:</strong> Ingrese al panel para registrar los nombres, DNIs y firmas de los 2 jurados para que se plasmen automáticamente en todas las fichas.
            </div>
          </div>

          <button
            onClick={() => setPanelAbierto(true)}
            style={{
              padding: '6px 14px',
              backgroundColor: '#D97706',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Configurar y Sellar
          </button>
        </div>
      )}

      {/* Pestañas Secundarias */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #E2E8F0',
          marginBottom: 18,
          gap: 8
        }}
      >
        {SUB_PESTANAS.map(tab => {
          const activa = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSubTab(tab.id);
                if (tab.id === 'fichas' && !seleccionadoId && cebas.length > 0) {
                  // Opcional
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                border: 'none',
                borderBottom: `3px solid ${activa ? '#1E3A8A' : 'transparent'}`,
                backgroundColor: 'transparent',
                color: activa ? '#1E3A8A' : '#64748B',
                fontSize: 14,
                fontWeight: activa ? 700 : 500,
                cursor: 'pointer',
                marginBottom: -2,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon name={tab.icon} size={16} />
              {tab.label}
              {tab.id === 'fichas' && (
                <span
                  style={{
                    backgroundColor: activa ? '#DBEAFE' : '#F1F5F9',
                    color: activa ? '#1E40AF' : '#64748B',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 10
                  }}
                >
                  {consolidado.completadosCount} / {consolidado.totalCebas}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vista de Subpestaña: Fichas de Evaluación */}
      {subTab === 'fichas' && (
        <div>
          {cebaActivo ? (
            <COPAEFichaEvaluacion
              ceba={cebaActivo}
              evaluacionInicial={evaluacionActiva}
              numeroJurado={numeroJurado}
              onCambiarJurado={setNumeroJurado}
              puedeCambiarJurado={esStaff}
              panel={panel}
              usuario={user}
              onVolver={() => setSeleccionadoId(null)}
              onToast={addToast}
            />
          ) : (
            <COPAESelectorCEBA
              cebas={cebas}
              evaluaciones={evaluaciones}
              seleccionadoId={seleccionadoId}
              onSeleccionar={setSeleccionadoId}
              numeroJurado={numeroJurado}
            />
          )}
        </div>
      )}

      {/* Vista de Subpestaña: Consolidado del Jurado */}
      {subTab === 'consolidado' && (
        <COPAEConsolidado
          filas={consolidado.filas}
          tieneEmpateTop1={consolidado.tieneEmpateTop1}
          tieneEmpateCorteTop7={consolidado.tieneEmpateCorteTop7}
          observacionFinal={consolidadoMeta?.observacionFinal || ''}
          panel={panel}
          usuario={user}
          onToast={addToast}
        />
      )}

      {/* Modal de Panel de Firmas */}
      <COPAEPanelFirmas
        abierto={panelAbierto}
        onCerrar={() => setPanelAbierto(false)}
        panel={panel}
        usuario={user}
        esStaff={esStaff}
        onToast={addToast}
      />
    </div>
  );
}
