const PLANIFICADOR_URL = 'https://ravsbot-planificador.xv74e4.easypanel.host';

export default function QRCode({ size = 220 }) {
    return (
        <img
            src="/assets/qr-planificador.png"
            alt="QR Acceso al Planificador AGEBATP"
            width={size}
            height={size}
            style={{ borderRadius: 4 }}
        />
    );
}

export { PLANIFICADOR_URL };
