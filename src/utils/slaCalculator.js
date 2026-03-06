/**
 * Calcula el estado SLA considerando horas hábiles: Lunes a Viernes, 8:00 AM a 6:00 PM (18:00 hrs)
 * @param {string} fechaLimite - Fecha límite en formato YYYY-MM-DD
 * @returns {string} 'normal' | 'warning' (amarillo) | 'danger' (rojo)
 */
export function calcularSLA(fechaLimite) {
    if (!fechaLimite) return 'normal';

    const end = new Date(fechaLimite + 'T18:00:00'); // Asumimos fin del dia laboral
    const now = new Date();

    if (now <= end) {
        return 'normal';
    }

    // Pasó la fecha límite, calculamos horas hábiles de retraso
    let delayHours = 0;
    let current = new Date(end);

    while (current < now) {
        current.setHours(current.getHours() + 1);

        // Si la hora evaluada está dentro de horario laboral (8 a 18) y no es fin de semana
        const day = current.getDay();
        const isWeekend = day === 0 || day === 6; // 0: Sunday, 6: Saturday
        const hour = current.getHours();

        if (!isWeekend && hour >= 8 && hour < 18) {
            if (current <= now) {
                delayHours++;
            }
        }
    }

    // Reglas:
    // - Retraso hasta 48 horas hábiles: warning (amarillo)
    // - Retraso mayor a 48 horas hábiles: danger (rojo)
    if (delayHours > 48) {
        return 'danger';
    } else {
        return 'warning';
    }
}
