import { useState, useEffect } from 'react';
import Icon from './Icon';
import { addReclamacion } from '../firebase/db';
import { API } from '../api/endpoints';

export default function LegalPages({ path, onBack }) {
    const [activePage, setActivePage] = useState('privacidad');
    const [submittingClaim, setSubmittingClaim] = useState(false);
    const [claimSuccess, setClaimSuccess] = useState(null);
    const [claimForm, setClaimForm] = useState({
        nombreCompleto: '',
        documentoTipo: 'DNI',
        documentoNumero: '',
        telefono: '',
        email: '',
        direccion: '',
        esMenor: false,
        representanteNombre: '',
        representanteDocumento: '',
        tipo: 'reclamo', // reclamo or queja
        detalle: '',
        pedido: '',
        autorizaDatos: false
    });

    // Sync path from URL if specified
    useEffect(() => {
        if (path) {
            const page = path.split('/').pop();
            if (['privacidad', 'terminos', 'aviso', 'reclamaciones', 'eliminacion-datos'].includes(page)) {
                setActivePage(page === 'eliminacion-datos' ? 'eliminacion' : page);
            }
        }
    }, [path]);

    const handlePageChange = (page) => {
        setActivePage(page);
        const route = page === 'eliminacion' ? 'eliminacion-datos' : page;
        window.history.pushState({}, '', `/legal/${route}`);
    };

    const handleClaimSubmit = async (e) => {
        e.preventDefault();
        if (!claimForm.nombreCompleto || !claimForm.documentoNumero || !claimForm.email || !claimForm.detalle || !claimForm.pedido) {
            alert('Por favor complete todos los campos obligatorios (*).');
            return;
        }
        if (!claimForm.autorizaDatos) {
            alert('Debe autorizar el tratamiento de sus datos personales para procesar este reclamo/queja.');
            return;
        }

        setSubmittingClaim(true);
        try {
            const fechaStr = new Date().toISOString().split('T')[0];
            const dataToSave = {
                nombreCompleto: claimForm.nombreCompleto,
                documentoTipo: claimForm.documentoTipo,
                documentoNumero: claimForm.documentoNumero,
                telefono: claimForm.telefono || '',
                email: claimForm.email,
                direccion: claimForm.direccion || '',
                esMenor: claimForm.esMenor,
                representanteNombre: claimForm.esMenor ? claimForm.representanteNombre : '',
                representanteDocumento: claimForm.esMenor ? claimForm.representanteDocumento : '',
                tipo: claimForm.tipo,
                detalle: claimForm.detalle,
                pedido: claimForm.pedido,
                fecha: fechaStr
            };

            const savedDoc = await addReclamacion(dataToSave);
            
            // Notify n8n
            try {
                await API.notificarReclamacion(savedDoc);
            } catch (err) {
                console.warn('n8n notification for reclamacion failed:', err);
            }

            setClaimSuccess(savedDoc);
            // Reset form
            setClaimForm({
                nombreCompleto: '',
                documentoTipo: 'DNI',
                documentoNumero: '',
                telefono: '',
                email: '',
                direccion: '',
                esMenor: false,
                representanteNombre: '',
                representanteDocumento: '',
                tipo: 'reclamo',
                detalle: '',
                pedido: '',
                autorizaDatos: false
            });
        } catch (error) {
            console.error('Error saving claim:', error);
            alert('Ocurrió un error al enviar el reclamo. Por favor intente de nuevo.');
        } finally {
            setSubmittingClaim(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const S = {
        container: { maxWidth: 1200, margin: '0 auto', padding: '24px 16px', fontFamily: "'DM Sans', sans-serif" },
        header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #CA8A04', paddingBottom: 16, marginBottom: 24 },
        logoArea: { display: 'flex', alignItems: 'center', gap: 16 },
        logo: { width: 50, height: 50, borderRadius: 8, objectFit: 'cover' },
        title: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 24, color: '#0C1929', margin: 0 },
        subtitle: { fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4 },
        backBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: '1px solid #D6DCE8', background: '#FFFFFF', color: '#1E4D7B', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' },
        layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: 32 },
        sidebar: { background: '#FFFFFF', border: '1px solid #D6DCE8', borderRadius: 8, padding: 16, height: 'fit-content' },
        sidebarBtn: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', borderRadius: 6, border: 'none', background: active ? '#EFF6FF' : 'transparent', color: active ? '#1E4D7B' : '#475569', fontWeight: active ? 700 : 500, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', marginBottom: 6, fontSize: 13 }),
        content: { background: '#FFFFFF', border: '1px solid #D6DCE8', borderRadius: 8, padding: 32, color: '#334155', lineHeight: 1.7, fontSize: 14 },
        h1: { fontSize: 20, fontWeight: 700, color: '#0C1929', borderBottom: '2px solid #F1F5F9', paddingBottom: 12, marginTop: 0, marginBottom: 20 },
        h2: { fontSize: 16, fontWeight: 700, color: '#1E4D7B', marginTop: 24, marginBottom: 12 },
        p: { marginBottom: 16 },
        list: { paddingLeft: 20, marginBottom: 16 },
        input: { width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #D6DCE8', background: '#FFFFFF', color: '#1E293B', fontSize: 13, marginTop: 4 },
        select: { width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #D6DCE8', background: '#FFFFFF', color: '#1E293B', fontSize: 13, marginTop: 4 },
        textarea: { width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #D6DCE8', background: '#FFFFFF', color: '#1E293B', fontSize: 13, marginTop: 4, minHeight: 100, resize: 'vertical' },
        label: { fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6 },
        formGroup: { marginBottom: 16 },
        btn: { padding: '12px 24px', borderRadius: 6, border: 'none', background: '#1E4D7B', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', transition: 'all 0.15s' },
        alert: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: 14, color: '#B45309', fontSize: 12, marginBottom: 20 },
        successCard: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 24, textAlign: 'center', color: '#15803D' }
    };

    return (
        <div style={S.container}>
            {/* Header */}
            <header style={S.header} className="no-print">
                <div style={S.logoArea}>
                    <img src="/logo-agebatp.jpeg" alt="Logo AGEBATP" style={S.logo} />
                    <div>
                        <h1 style={S.title}>Portal de Transparencia y Legalidad</h1>
                        <div style={S.subtitle}>AGEBATP - UGEL 03</div>
                    </div>
                </div>
                <button onClick={onBack} style={S.backBtn}>
                    <Icon name="chevronLeft" size={16} /> Volver al Sistema
                </button>
            </header>

            {/* Print Only Header */}
            <div className="print-only" style={{ display: 'none', borderBottom: '2px solid #000', paddingBottom: 10, marginBottom: 20 }}>
                <h2>LIBRO DE RECLAMACIONES DE LA UGEL 03</h2>
                <p>Fecha de impresión: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Layout */}
            <div style={S.layout} className="print-full-width">
                {/* Sidebar */}
                <aside style={S.sidebar} className="no-print">
                    <button style={S.sidebarBtn(activePage === 'privacidad')} onClick={() => handlePageChange('privacidad')}>
                        <Icon name="shield" size={15} /> Polít. de Privacidad
                    </button>
                    <button style={S.sidebarBtn(activePage === 'terminos')} onClick={() => handlePageChange('terminos')}>
                        <Icon name="fileText" size={15} /> Términos y Condiciones
                    </button>
                    <button style={S.sidebarBtn(activePage === 'aviso')} onClick={() => handlePageChange('aviso')}>
                        <Icon name="info" size={15} /> Aviso Legal
                    </button>
                    <button style={S.sidebarBtn(activePage === 'reclamaciones')} onClick={() => handlePageChange('reclamaciones')}>
                        <Icon name="clipboard" size={15} /> Libro de Reclamaciones
                    </button>
                    <button style={S.sidebarBtn(activePage === 'eliminacion')} onClick={() => handlePageChange('eliminacion')}>
                        <Icon name="trash" size={15} /> Eliminación de Datos
                    </button>
                </aside>

                {/* Main Content */}
                <main style={S.content} className="print-no-border print-no-padding">
                    {/* PRIVACIDAD */}
                    {activePage === 'privacidad' && (
                        <div>
                            <h2 style={S.h1}>Política de Privacidad y de Protección de Datos Personales</h2>
                            <div style={S.alert}>
                                <strong>[REVISAR Y APROBAR CON EL ÁREA LEGAL]</strong> Este documento constituye una plantilla base sujeta a revisión conforme a los lineamientos específicos de la entidad.
                            </div>
                            <p style={S.p}>
                                En cumplimiento de la <strong>Ley N.° 29733 - Ley de Protección de Datos Personales</strong> y su Reglamento, aprobado por el Decreto Supremo N.° 003-2013-JUS, la Unidad de Gestión Educativa Local N.° 03 (en adelante, UGEL 03), a través del Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP), informa a los usuarios y directores sobre el tratamiento que se brinda a la información registrada en esta plataforma.
                            </p>
                            
                            <h3 style={S.h2}>1. Consentimiento del Usuario</h3>
                            <p style={S.p}>
                                Al ingresar sus credenciales y hacer uso del Planificador AGEBATP, el usuario otorga su consentimiento previo, expreso, informado e inequívoco para que sus datos de identidad, contacto, institución asignada y registros de actividades sean almacenados en el banco de datos de la UGEL 03.
                            </p>

                            <h3 style={S.h2}>2. Finalidad del Tratamiento</h3>
                            <p style={S.p}>
                                La recolección y tratamiento de los datos personales tienen como únicas finalidades:
                            </p>
                            <ul style={S.list}>
                                <li>Gestionar la planificación mensual de actividades de los CEBA y CETPRO correspondientes a la jurisdicción de la UGEL 03.</li>
                                <li>Realizar el monitoreo y acompañamiento pedagógico y administrativo de los directores.</li>
                                <li>Facilitar la comunicación interna e institucional entre los especialistas del AGEBATP y las instituciones educativas.</li>
                                <li>Generar reportes estadísticos agregados para la toma de decisiones y el cumplimiento de metas del sector educación.</li>
                            </ul>

                            <h3 style={S.h2}>3. Seguridad de los Datos</h3>
                            <p style={S.p}>
                                Se han adoptado las medidas técnicas, organizativas y legales requeridas para garantizar la seguridad de la información personal de nuestros directores, previniendo su alteración, pérdida, acceso no autorizado o tratamiento indebido. La infraestructura de almacenamiento y autenticación está soportada bajo entornos seguros con estricto control de acceso según roles de usuario.
                            </p>

                            <h3 style={S.h2}>4. Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición)</h3>
                            <p style={S.p}>
                                Los titulares de los datos personales pueden ejercer en cualquier momento sus derechos ARCO de forma gratuita, enviando una solicitud formal al correo institucional: <strong>proteccion.datos@ugel03.gob.pe</strong> o presentándola físicamente en la Mesa de Partes de la UGEL 03 ubicada en Av. Iquitos 910, La Victoria, Lima.
                            </p>
                        </div>
                    )}

                    {/* TERMINOS */}
                    {activePage === 'terminos' && (
                        <div>
                            <h2 style={S.h1}>Términos y Condiciones de Uso del Planificador AGEBATP</h2>
                            <div style={S.alert}>
                                <strong>[REVISAR Y APROBAR CON EL ÁREA LEGAL]</strong> Este documento constituye una plantilla base sujeta a revisión conforme a los lineamientos específicos de la entidad.
                            </div>
                            <p style={S.p}>
                                El presente documento establece los términos que regulan el acceso y uso del "Planificador Mensual AGEBATP", plataforma web desarrollada para la gestión administrativa de la Unidad de Gestión Educativa Local N.° 03.
                            </p>

                            <h3 style={S.h2}>1. Propósito y Carácter Oficial</h3>
                            <p style={S.p}>
                                Esta plataforma es una herramienta oficial de carácter exclusivamente laboral y técnico-pedagógico. Los usuarios que accedan a ella (personal de UGEL 03, jefaturas, directores de CEBA y CETPRO) deben utilizarla de manera responsable, ética y de acuerdo a las directivas vigentes expedidas por el Ministerio de Educación del Perú.
                            </p>

                            <h3 style={S.h2}>2. Responsabilidad de Credenciales</h3>
                            <p style={S.p}>
                                El acceso a la plataforma es personal e intransferible. La contraseña asignada inicialmente (DNI) es estrictamente temporal y **su modificación es obligatoria** al momento de realizar el primer ingreso. El resguardo, custodia y uso confidencial de la contraseña es responsabilidad exclusiva de cada usuario registrado. Queda terminantemente prohibido ceder o compartir las credenciales con terceros.
                            </p>

                            <h3 style={S.h2}>3. Veracidad de la Información</h3>
                            <p style={S.p}>
                                El usuario declara bajo juramento que toda la información reportada en la plataforma, incluyendo datos de directorio, matrícula escolar, personal docente y administrativo, talleres, y estadísticas de inclusión, es verídica, exacta y actualizada. Cualquier alteración maliciosa o ingreso de datos falsos constituirá falta administrativa de acuerdo a la Ley del Servicio Civil (Ley N.° 30057) y el Reglamento de la Ley de Procedimiento Administrativo General (Ley N.° 27444).
                            </p>

                            <h3 style={S.h2}>4. Modificaciones y Suspensión del Servicio</h3>
                            <p style={S.p}>
                                La UGEL 03 se reserva el derecho de realizar mejoras, actualizaciones técnicas y modificaciones en los módulos del sistema en cualquier momento, con el fin de optimizar el servicio. Así mismo, podrá suspender temporalmente el acceso por mantenimiento técnico o ante sospechas de incidentes de seguridad digital.
                            </p>
                        </div>
                    )}

                    {/* AVISO LEGAL */}
                    {activePage === 'aviso' && (
                        <div>
                            <h2 style={S.h1}>Aviso Legal e Información General</h2>
                            <div style={S.alert}>
                                <strong>[REVISAR Y APROBAR CON EL ÁREA LEGAL]</strong> Este documento constituye una plantilla base sujeta a revisión conforme a los lineamientos específicos de la entidad.
                            </div>
                            <p style={S.p}>
                                En cumplimiento del principio de transparencia de la Administración Pública del Perú, se proporciona a continuación la información legal de identificación correspondiente a esta herramienta digital.
                            </p>

                            <h3 style={S.h2}>1. Identidad de la Entidad</h3>
                            <ul style={S.list}>
                                <li><strong>Entidad Responsable:</strong> Unidad de Gestión Educativa Local N.° 03 - UGEL 03</li>
                                <li><strong>Dependencia Organizacional:</strong> Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP)</li>
                                <li><strong>Dirección Institucional:</strong> Av. Iquitos 910, La Victoria, Lima, Perú</li>
                                <li><strong>R.U.C. de la Entidad:</strong> 20512181512</li>
                                <li><strong>Canal Oficial de Contacto:</strong> mesa-partes@ugel03.gob.pe</li>
                            </ul>

                            <h3 style={S.h2}>2. Propiedad Intelectual</h3>
                            <p style={S.p}>
                                El diseño del software, la arquitectura, los scripts de bases de datos, los logotipos y las interfaces gráficas son de titularidad y propiedad intelectual de la UGEL 03 y el Ministerio de Educación del Perú. Queda prohibida la reproducción, distribución, ingeniería inversa o cualquier forma de explotación con fines comerciales ajenos a los objetivos institucionales de la entidad.
                            </p>

                            <h3 style={S.h2}>3. Limitación de Responsabilidad</h3>
                            <p style={S.p}>
                                La UGEL 03 realiza los mayores esfuerzos para asegurar la disponibilidad permanente del sistema y la exactitud de los datos recopilados en tiempo real. No obstante, no se responsabiliza por fallas técnicas atribuibles a los proveedores de conexión a internet de los usuarios, desconexiones fortuitas en los servicios cloud, o mal uso del sistema por parte de los operadores autorizados.
                            </p>
                        </div>
                    )}

                    {/* LIBRO DE RECLAMACIONES */}
                    {activePage === 'reclamaciones' && (
                        <div>
                            <h2 style={S.h1} className="no-print">Libro de Reclamaciones Digital</h2>
                            
                            {!claimSuccess ? (
                                <form onSubmit={handleClaimSubmit} className="no-print">
                                    <div style={S.alert}>
                                        Conforme a lo establecido en el <strong>Decreto Supremo N.° 042-2011-PCM</strong>, el Libro de Reclamaciones Digital está a disposición del ciudadano para formular reclamaciones o quejas respecto a los servicios y atención brindados por esta Unidad de Gestión Educativa Local.
                                    </div>

                                    <h3 style={S.h2}>1. Identificación del Reclamante</h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Tipo de Documento *</label>
                                            <select 
                                                value={claimForm.documentoTipo} 
                                                onChange={e => setClaimForm({...claimForm, documentoTipo: e.target.value})}
                                                style={S.select}
                                            >
                                                <option value="DNI">DNI</option>
                                                <option value="CE">Carnet de Extranjería</option>
                                                <option value="Pasaporte">Pasaporte</option>
                                            </select>
                                        </div>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Número de Documento *</label>
                                            <input 
                                                type="text" 
                                                required 
                                                placeholder="Número de documento"
                                                value={claimForm.documentoNumero} 
                                                onChange={e => setClaimForm({...claimForm, documentoNumero: e.target.value})}
                                                style={S.input}
                                            />
                                        </div>
                                    </div>

                                    <div style={S.formGroup}>
                                        <label style={S.label}>Nombres y Apellidos Completos *</label>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="Nombres y apellidos"
                                            value={claimForm.nombreCompleto} 
                                            onChange={e => setClaimForm({...claimForm, nombreCompleto: e.target.value})}
                                            style={S.input}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Teléfono de Contacto</label>
                                            <input 
                                                type="tel" 
                                                placeholder="Ej: 999888777"
                                                value={claimForm.telefono} 
                                                onChange={e => setClaimForm({...claimForm, telefono: e.target.value})}
                                                style={S.input}
                                            />
                                        </div>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Correo Electrónico *</label>
                                            <input 
                                                type="email" 
                                                required 
                                                placeholder="correo@ejemplo.com"
                                                value={claimForm.email} 
                                                onChange={e => setClaimForm({...claimForm, email: e.target.value})}
                                                style={S.input}
                                            />
                                        </div>
                                    </div>

                                    <div style={S.formGroup}>
                                        <label style={S.label}>Dirección Domiciliaria</label>
                                        <input 
                                            type="text" 
                                            placeholder="Calle, Número, Distrito, Provincia"
                                            value={claimForm.direccion} 
                                            onChange={e => setClaimForm({...claimForm, direccion: e.target.value})}
                                            style={S.input}
                                        />
                                    </div>

                                    <div style={S.formGroup}>
                                        <label style={{ ...S.label, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={claimForm.esMenor} 
                                                onChange={e => setClaimForm({...claimForm, esMenor: e.target.checked})}
                                                style={{ accentColor: '#1E4D7B' }}
                                            />
                                            Soy menor de edad
                                        </label>
                                    </div>

                                    {claimForm.esMenor && (
                                        <div style={{ background: '#F8FAFC', border: '1px solid #E8ECF3', padding: 16, borderRadius: 6, marginBottom: 16 }}>
                                            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#1E4D7B', marginTop: 0, marginBottom: 12 }}>Datos del Padre, Madre o Representante Legal</h4>
                                            <div style={S.formGroup}>
                                                <label style={S.label}>Nombre del Representante *</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Nombre completo"
                                                    required={claimForm.esMenor}
                                                    value={claimForm.representanteNombre} 
                                                    onChange={e => setClaimForm({...claimForm, representanteNombre: e.target.value})}
                                                    style={S.input}
                                                />
                                            </div>
                                            <div style={S.formGroup}>
                                                <label style={S.label}>Documento Identidad (DNI) del Representante *</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="DNI del representante"
                                                    required={claimForm.esMenor}
                                                    value={claimForm.representanteDocumento} 
                                                    onChange={e => setClaimForm({...claimForm, representanteDocumento: e.target.value})}
                                                    style={S.input}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <h3 style={S.h2}>2. Detalles del Reclamo o Queja</h3>

                                    <div style={S.formGroup}>
                                        <label style={S.label}>Tipo de Solicitud *</label>
                                        <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                                                <input 
                                                    type="radio" 
                                                    name="claim_type" 
                                                    checked={claimForm.tipo === 'reclamo'}
                                                    onChange={() => setClaimForm({...claimForm, tipo: 'reclamo'})}
                                                    style={{ accentColor: '#1E4D7B' }}
                                                />
                                                <strong>Reclamación:</strong> Disconformidad relacionada a los servicios
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                                                <input 
                                                    type="radio" 
                                                    name="claim_type" 
                                                    checked={claimForm.tipo === 'queja'}
                                                    onChange={() => setClaimForm({...claimForm, tipo: 'queja'})}
                                                    style={{ accentColor: '#1E4D7B' }}
                                                />
                                                <strong>Queja:</strong> Malestar respecto a la atención recibida
                                            </label>
                                        </div>
                                    </div>

                                    <div style={S.formGroup}>
                                        <label style={S.label}>Detalle del Reclamo o Queja *</label>
                                        <textarea 
                                            required 
                                            placeholder="Detalle de forma cronológica, clara y precisa los hechos sucedidos."
                                            value={claimForm.detalle} 
                                            onChange={e => setClaimForm({...claimForm, detalle: e.target.value})}
                                            style={S.textarea}
                                        />
                                    </div>

                                    <div style={S.formGroup}>
                                        <label style={S.label}>Pedido Concreto del Ciudadano *</label>
                                        <textarea 
                                            required 
                                            placeholder="¿Qué acción concreta solicita o espera de la UGEL 03?"
                                            value={claimForm.pedido} 
                                            onChange={e => setClaimForm({...claimForm, pedido: e.target.value})}
                                            style={S.textarea}
                                        />
                                    </div>

                                    <div style={S.formGroup}>
                                        <label style={{ display: 'flex', alignItems: 'start', gap: 8, cursor: 'pointer', fontSize: 12 }}>
                                            <input 
                                                type="checkbox" 
                                                required
                                                checked={claimForm.autorizaDatos} 
                                                onChange={e => setClaimForm({...claimForm, autorizaDatos: e.target.checked})}
                                                style={{ accentColor: '#1E4D7B', marginTop: 3 }}
                                            />
                                            <span>
                                                Autorizo el tratamiento de mis datos personales únicamente para el trámite y resolución de esta solicitud, conforme a la Ley N.° 29733. *
                                            </span>
                                        </label>
                                    </div>

                                    <button type="submit" disabled={submittingClaim} style={{ ...S.btn, width: '100%', marginTop: 24 }}>
                                        {submittingClaim ? <span className="spinner" /> : <><Icon name="save" size={16} /> Enviar Reclamación / Queja</>}
                                    </button>
                                </form>
                            ) : (
                                <div style={S.successCard}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                                        <Icon name="checkCircle" size={48} color="#15803D" />
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>¡Reclamación/Queja Registrada con Éxito!</h3>
                                    <p style={{ fontSize: 14, color: '#334155', marginBottom: 20 }}>
                                        Su solicitud ha sido ingresada en el Libro de Reclamaciones Digital de la UGEL 03.
                                    </p>
                                    
                                    <div style={{ background: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: 8, padding: 18, display: 'inline-block', textAlign: 'left', minWidth: 280, marginBottom: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} className="print-area">
                                        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Código de Registro</div>
                                        <div style={{ fontSize: 22, fontWeight: 700, color: '#0C1929', fontFamily: "'JetBrains Mono', monospace", margin: '4px 0 10px 0' }}>{claimSuccess.codigo}</div>
                                        
                                        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Fecha de Registro</div>
                                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 600, marginTop: 2 }}>{claimSuccess.fecha}</div>
                                        
                                        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginTop: 10 }}>Ciudadano</div>
                                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 600, marginTop: 2 }}>{claimSuccess.nombreCompleto}</div>
                                        
                                        <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600, marginTop: 10 }}>Tipo</div>
                                        <div style={{ fontSize: 13, color: '#334155', fontWeight: 600, marginTop: 2, textTransform: 'capitalize' }}>{claimSuccess.tipo}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }} className="no-print">
                                        <button onClick={handlePrint} style={{ ...S.btn, background: '#1E4D7B' }}>
                                            <Icon name="download" size={16} /> Imprimir Constancia
                                        </button>
                                        <button onClick={() => setClaimSuccess(null)} style={{ ...S.backBtn, height: 42 }}>
                                            Registrar otro Reclamo
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Print Version of the Claim Sheet */}
                            {claimSuccess && (
                                <div className="print-only" style={{ display: 'none', fontFamily: 'serif', padding: '20px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 10 }}>
                                        <h2>HOJA DE RECLAMACIÓN</h2>
                                        <h2>{claimSuccess.codigo}</h2>
                                    </div>
                                    
                                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: 4 }}>1. DATOS DEL CIUDADANO</h3>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ width: '30%', padding: '6px 0', fontWeight: 'bold' }}>Nombres y Apellidos:</td>
                                                <td>{claimSuccess.nombreCompleto}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Documento Identidad:</td>
                                                <td>{claimSuccess.documentoTipo} - {claimSuccess.documentoNumero}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Email:</td>
                                                <td>{claimSuccess.email}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Teléfono:</td>
                                                <td>{claimSuccess.telefono}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Dirección:</td>
                                                <td>{claimSuccess.direccion}</td>
                                            </tr>
                                            {claimSuccess.esMenor && (
                                                <>
                                                    <tr>
                                                        <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Representante Legal:</td>
                                                        <td>{claimSuccess.representanteNombre}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: '6px 0', fontWeight: 'bold' }}>Doc. Representante:</td>
                                                        <td>{claimSuccess.representanteDocumento}</td>
                                                    </tr>
                                                </>
                                            )}
                                        </tbody>
                                    </table>

                                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: 4 }}>2. DETALLE DE LA RECLAMACIÓN / QUEJA</h3>
                                    <p><strong>Tipo:</strong> {claimSuccess.tipo === 'reclamo' ? 'RECLAMACIÓN' : 'QUEJA'}</p>
                                    <p><strong>Fecha de Registro:</strong> {claimSuccess.fecha}</p>
                                    <p><strong>Detalle:</strong></p>
                                    <div style={{ border: '1px solid #ccc', padding: 12, minHeight: 120, marginBottom: 20 }}>{claimSuccess.detalle}</div>

                                    <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: 4 }}>3. PEDIDO CONCRETO</h3>
                                    <div style={{ border: '1px solid #ccc', padding: 12, minHeight: 80, marginBottom: 30 }}>{claimSuccess.pedido}</div>

                                    <table style={{ width: '100%', marginTop: 50 }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ width: '50%', textAlign: 'center' }}>
                                                    <div style={{ width: '200px', borderBottom: '1px solid #000', margin: '0 auto 10px auto' }}></div>
                                                    Firma del Ciudadano
                                                </td>
                                                <td style={{ width: '50%', textAlign: 'center' }}>
                                                    <div style={{ width: '200px', borderBottom: '1px solid #000', margin: '0 auto 10px auto' }}></div>
                                                    Firma de Recibido (UGEL 03)
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ELIMINACION */}
                    {activePage === 'eliminacion' && (
                        <div>
                            <h2 style={S.h1}>Procedimiento de Eliminación de Datos Personales</h2>
                            <div style={S.alert}>
                                <strong>[REVISAR Y APROBAR CON EL ÁREA LEGAL]</strong> Este documento constituye una plantilla base sujeta a revisión conforme a los lineamientos específicos de la entidad.
                            </div>
                            <p style={S.p}>
                                De conformidad con la Ley N.° 29733 - Ley de Protección de Datos Personales, todo usuario registrado en el "Planificador Mensual AGEBATP" tiene derecho a solicitar la cancelación o supresión de sus datos de nuestros bancos de datos cuando considere que estos no son necesarios para las finalidades que motivaron su recopilación.
                            </p>

                            <h3 style={S.h2}>¿Cómo solicitar la eliminación de datos?</h3>
                            <p style={S.p}>
                                Para solicitar la eliminación de su cuenta y la baja definitiva de sus registros personales, el titular deberá seguir los siguientes pasos:
                            </p>
                            <ul style={S.list}>
                                <li><strong>Correo Electrónico:</strong> Enviar un correo electrónico a <strong>baja.datos@ugel03.gob.pe</strong> detallando su nombre completo, cargo (Director/Especialista), Institución Educativa asociada y adjuntando una copia escaneada de su DNI.</li>
                                <li><strong>Mesa de Partes Virtual / Presencial:</strong> Ingresar una solicitud simple dirigida al Área de Gestión de la Educación Básica Alternativa y Técnico Productiva (AGEBATP) solicitando la supresión de cuenta.</li>
                            </ul>

                            <h3 style={S.h2}>Plazo de Respuesta</h3>
                            <p style={S.p}>
                                La UGEL 03 atenderá la solicitud en un plazo máximo de diez (10) días hábiles contados a partir del día siguiente de su presentación. De ser procedente, se procederá al borrado permanente del perfil en el sistema Firebase Authentication y el documento correspondiente en la colección <code>usuarios</code> de Firestore.
                            </p>

                            <h3 style={S.h2}>Limitaciones a la Eliminación</h3>
                            <p style={S.p}>
                                Es importante señalar que la solicitud de cancelación de datos no procederá cuando la conservación del registro sea obligatoria en virtud de un mandato legal (como el control patrimonial de plazas de directores y reportes consolidados oficiales al Minedu) o por fines históricos institucionales debidamente regulados.
                            </p>
                        </div>
                    )}
                </main>
            </div>
            
            {/* CSS styles to insert dynamically for printing */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .print-only {
                        display: block !important;
                    }
                    .print-full-width {
                        display: block !important;
                    }
                    .print-no-border {
                        border: none !important;
                    }
                    .print-no-padding {
                        padding: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
