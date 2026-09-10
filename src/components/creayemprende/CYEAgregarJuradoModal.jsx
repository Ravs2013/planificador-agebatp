import React, { useMemo, useState } from 'react';
import Icon from '../Icon';
import { C, FUENTES, S, btn, btnDeshabilitado, aviso, MODAL_FONDO, MODAL_CAJA } from './cyeEstilos';
import { GRUPOS_BASE_CYE, categoriasDeGrupo } from '../../data/creaEmprendeConfig';
import { credencialCYE, siguienteNumeroCredencial } from '../../data/creaEmprendeJurados';
import { agregarJuradoCYE } from '../../firebase/dbCreaEmprende';
import { soloDigitos } from '../../utils/creaEmprendeHelpers';

/**
 * Alta de un jurado que llega el mismo día. Queda disponible al instante en el Panel de
 * Firmas y, si se marca, recibe su credencial grupo{G}jurado{N}@ugel03.gob.pe.
 */
export default function CYEAgregarJuradoModal({ abierto, onCerrar, onCreado, juradosFirestore = [], usuario, onToast, grupoSugerido = 1 }) {
  const [form, setForm] = useState({ grupo: grupoSugerido, apellidos: '', nombres: '', dni: '', institucion: '', cargo: '' });
  const [crearCredencial, setCrearCredencial] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const grupos = useMemo(() => {
    const set = new Set(GRUPOS_BASE_CYE.map(g => g.grupo));
    juradosFirestore.forEach(j => set.add(Number(j.grupo)));
    return Array.from(set).filter(Boolean).sort((a, b) => a - b);
  }, [juradosFirestore]);

  const numero = siguienteNumeroCredencial(form.grupo, juradosFirestore);
  const credencial = credencialCYE(form.grupo, numero);
  const categorias = categoriasDeGrupo(form.grupo);
  const valido = form.apellidos.trim() && form.nombres.trim() && soloDigitos(form.dni).length === 8 && Number(form.grupo) > 0;

  if (!abierto) return null;

  const campo = (clave, etiqueta, extra = {}) => (
    <div style={{ marginBottom: 10 }}>
      <label style={S.etiqueta}>{etiqueta}</label>
      <input
        value={form[clave]}
        onChange={e => setForm(f => ({ ...f, [clave]: clave === 'dni' ? soloDigitos(e.target.value).slice(0, 8) : e.target.value }))}
        style={S.input}
        {...extra}
      />
    </div>
  );

  const guardar = async () => {
    try {
      setGuardando(true);
      const res = await agregarJuradoCYE({ ...form, categorias }, usuario, { juradosFirestore, crearCredencial });
      setResultado(res);
      if (onCreado) {
        onCreado({
          correo: res.correo, grupo: Number(form.grupo), numeroCredencial: res.numeroCredencial, categorias,
          apellidos: form.apellidos.trim(), nombres: form.nombres.trim(),
          nombreCompleto: `${form.apellidos.trim()}, ${form.nombres.trim()}`.toUpperCase(),
          dni: soloDigitos(form.dni), institucion: form.institucion.trim(), cargo: form.cargo.trim(), origen: 'alta'
        });
      }
      if (onToast) onToast(res.advertencia || 'Jurado agregado.', res.advertencia ? 'info' : 'success');
    } catch (err) {
      if (onToast) onToast(err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const cerrar = () => {
    setResultado(null);
    setForm({ grupo: grupoSugerido, apellidos: '', nombres: '', dni: '', institucion: '', cargo: '' });
    onCerrar();
  };

  return (
    <div style={{ ...MODAL_FONDO, zIndex: 1300 }} onClick={e => e.stopPropagation()}>
      <div style={MODAL_CAJA}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${C.g100}` }}>
          <h3 style={{ margin: 0, fontSize: 16, color: C.navy2, fontFamily: FUENTES.sans }}>Agregar jurado</h3>
          <button type="button" onClick={cerrar} style={btn('plano', { padding: 4 })}><Icon name="x" size={18} /></button>
        </div>

        {resultado ? (
          <div>
            <div style={{ ...aviso('exito'), marginBottom: 14 }}>
              {resultado.credencialCreada ? 'Jurado registrado y credencial creada.' : 'Jurado registrado.'}
              {resultado.advertencia && <div style={{ marginTop: 4 }}>{resultado.advertencia}</div>}
            </div>
            {(resultado.credencialCreada || resultado.advertencia) && (
              <div style={{ background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, fontSize: 13, color: C.g800 }}>
                <div><strong>Usuario:</strong> <span style={{ fontFamily: FUENTES.mono }}>{resultado.correo}</span></div>
                <div style={{ marginTop: 4 }}><strong>Contraseña:</strong> <span style={{ fontFamily: FUENTES.mono }}>{resultado.contrasena}</span></div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" onClick={cerrar} style={btn('primario')}>Listo</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ marginBottom: 10 }}>
                <label style={S.etiqueta}>Grupo</label>
                <select value={form.grupo} onChange={e => setForm(f => ({ ...f, grupo: Number(e.target.value) }))} style={S.input}>
                  {grupos.map(g => <option key={g} value={g}>Grupo {g} ({categoriasDeGrupo(g).join(' y ') || 'sin categoría'})</option>)}
                </select>
              </div>
              {campo('dni', 'DNI', { inputMode: 'numeric', placeholder: '8 dígitos' })}
            </div>
            {campo('apellidos', 'Apellidos', { placeholder: 'Como figuran en el DNI' })}
            {campo('nombres', 'Nombres')}
            {campo('institucion', 'Institución que representa')}
            {campo('cargo', 'Cargo (opcional)')}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: C.g800, margin: '6px 0 10px', cursor: 'pointer' }}>
              <input type="checkbox" checked={crearCredencial} onChange={e => setCrearCredencial(e.target.checked)} style={{ accentColor: C.navy3 }} />
              Crear credencial de acceso
            </label>
            {crearCredencial && (
              <div style={{ fontSize: 12, color: C.g500, background: C.g50, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px' }}>
                Usuario y contraseña: <span style={{ fontFamily: FUENTES.mono, color: C.navy2, fontWeight: 700 }}>{credencial}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button type="button" onClick={cerrar} style={btn('secundario')}>Cancelar</button>
              <button type="button" onClick={guardar} disabled={!valido || guardando} style={!valido || guardando ? btnDeshabilitado(btn('primario')) : btn('primario')}>
                <Icon name="userPlus" size={14} color={C.white} /> {guardando ? 'Registrando...' : 'Agregar jurado'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
