/**
 * Calcula el estado SLA considerando horas hábiles: Lunes a Viernes, 8:00 AM a 6:00 PM (18:00 hrs)
 * @param {string} fechaLimite - Fecha límite en formato YYYY-MM-DD
 * @returns {string} 'normal' | 'warning' (amarillo) | 'danger' (rojo)
 */
export function calcularSLA(fechaLimite) {
    if (!fechaLimite) return 'normal';

    try {
        const end = new Date(fechaLimite + 'T18:00:00');
        if (isNaN(end.getTime())) return 'normal';
        const now = new Date();

        if (now <= end) {
            return 'normal';
        }

        // Pasó la fecha límite, calculamos horas hábiles de retraso
        // Safeguard: max 5000 iterations (~200 business days) to prevent browser freeze
        let delayHours = 0;
        let current = new Date(end);
        let iterations = 0;
        const MAX_ITERATIONS = 5000;

        while (current < now && iterations < MAX_ITERATIONS) {
            current.setHours(current.getHours() + 1);
            iterations++;

            const day = current.getDay();
            const isWeekend = day === 0 || day === 6;
            const hour = current.getHours();

            if (!isWeekend && hour >= 8 && hour < 18) {
                if (current <= now) {
                    delayHours++;
                }
            }
        }

        if (delayHours > 48) {
            return 'danger';
        } else {
            return 'warning';
        }
    } catch {
        return 'normal';
    }
}
