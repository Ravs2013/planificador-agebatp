const PLANIFICADOR_URL = 'https://planificador-agebatp.web.app/';

export default function QRCode({ size = 220 }) {
    return (
        <img
            src="/assets/qr-planificador.jpeg"
            alt="QR Acceso al Planificador AGEBATP"
            width={size}
            height={size}
            style={{ borderRadius: 4, objectFit: 'contain' }}
        />
    );
}

export { PLANIFICADOR_URL };
