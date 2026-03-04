import { QRCodeSVG } from 'qrcode.react';

const PLANIFICADOR_URL = 'https://ravsbot-planificador.xv74e4.easypanel.host';

export default function QRCode({ text, size = 200 }) {
    return (
        <QRCodeSVG
            value={text || PLANIFICADOR_URL}
            size={size}
            bgColor="#FFFFFF"
            fgColor="#1B2A4A"
            level="M"
            includeMargin={false}
        />
    );
}

export { PLANIFICADOR_URL };
