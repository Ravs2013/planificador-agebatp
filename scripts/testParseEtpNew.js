const ROMAN_MAP = { I: 1, II: 2, III: 3, IV: 4 };

const sampleText = `FICHA DE MONITOREO ETP

2. DATOS DE LA SESIÓN OBSERVADA:

Ciclo:
 
Auxiliar Técnico

Programa de estudio:
 
Albañilería

Módulo:
 
Levantamiento y construcción de muros de albañilería

Unidad didáctica:
 
Construcción de muros

Nombre de la actividad:
 
Simulacro de abastecimiento de frente de obra

Estudiantes matriculados:
 
4

Estudiantes presentes:
 
3

Turno:
 
M

Fecha de observación:
 
2026-06-04

Hora de inicio:
 
08:00:00

Hora de término:
 
10:30:00`;

const fechaMatch = sampleText.match(/Fecha de observación:\s*[\r\n]*\s*([\d\-]+)/i);
console.log("fechaMatch:", fechaMatch);
if (fechaMatch) {
  console.log("fechaMatch[1]:", JSON.stringify(fechaMatch[1]));
}
