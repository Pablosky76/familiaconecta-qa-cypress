# Cobertura trasladada a Cypress

Las 28 comprobaciones de lógica anteriores se han trasladado a Cypress: se ejecutan directamente contra módulos de la demo en el navegador. No son recorridos E2E ni pruebas de seguridad del servidor. Cada prueba usa datos ficticios y un repositorio simulado aislado.

| ID | Comprobación | Archivo de reglas |
| --- | --- | --- |
| REG-01 | una solicitud pendiente no es cobertura confirmada. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-02 | un cambio de horario marca revisión y conserva la confirmación anterior. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-03 | los datos de demo incluyen tareas confirmadas, pendientes, sin asignar y un conflicto. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-04 | cada lote de solicitudes simultáneas tiene como mucho un ganador. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-05 | las recogidas de niños distintos en centros distintos son tareas separadas. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-06 | la semana empieza en lunes y se navega de 7 en 7 días. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-07 | la excepción del jueves sustituye el turno de Javier. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-08 | la situación prevista de cada niño es independiente. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-09 | una franja con solicitud pendiente aparece sin cobertura confirmada. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-10 | una confirmación pendiente de revisión no cuenta como cobertura confirmada. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-11 | si todos rechazan, la tarea requiere atención. | [domain.cy.js](e2e/06_reglas/domain.cy.js) |
| REG-12 | propone a ambos abuelos y solo confirma después de una respuesta. | [new-care.cy.js](e2e/06_reglas/new-care.cy.js) |
| REG-13 | impide creación por abuelos, intervalos inválidos y duplicados. | [new-care.cy.js](e2e/06_reglas/new-care.cy.js) |
| REG-14 | conserva la necesidad sin confirmarla si no hay disponibilidad. | [new-care.cy.js](e2e/06_reglas/new-care.cy.js) |
| REG-15 | guarda un turno, lo recupera y reinicia la demo. | [planning-repository.cy.js](e2e/06_reglas/planning-repository.cy.js) |
| REG-16 | rechaza datos inválidos y un cambio de otro perfil. | [planning-repository.cy.js](e2e/06_reglas/planning-repository.cy.js) |
| REG-17 | actualiza el horario escolar y conserva las confirmaciones afectadas. | [planning-repository.cy.js](e2e/06_reglas/planning-repository.cy.js) |
| REG-18 | registra disponibilidad y bloquea cambios por abuelos. | [planning-repository.cy.js](e2e/06_reglas/planning-repository.cy.js) |
| REG-19 | acepta una sola vez y cierra las demás solicitudes de la tarea. | [responses.cy.js](e2e/06_reglas/responses.cy.js) |
| REG-20 | rechaza responder por otra persona y no permite compromisos simultáneos. | [responses.cy.js](e2e/06_reglas/responses.cy.js) |
| REG-21 | no acepta solicitudes ya terminadas. | [responses.cy.js](e2e/06_reglas/responses.cy.js) |
| REG-22 | cubre el día y no supone que un progenitor libre esté a cargo. | [timeline.cy.js](e2e/06_reglas/timeline.cy.js) |
| REG-23 | muestra solicitudes pendientes sin asignar cuidador y preserva avisos de revisión. | [timeline.cy.js](e2e/06_reglas/timeline.cy.js) |
| REG-24 | advierte si dos planes incompatibles se solapan. | [timeline.cy.js](e2e/06_reglas/timeline.cy.js) |
| REG-25 | distingue solapamiento, margen insuficiente y el límite exacto. | [travel.cy.js](e2e/06_reglas/travel.cy.js) |
| REG-26 | valida el margen al proponer y otra vez al aceptar. | [travel.cy.js](e2e/06_reglas/travel.cy.js) |
| REG-27 | avisa si un margen nuevo afecta cuidados confirmados sin borrar las confirmaciones. | [travel.cy.js](e2e/06_reglas/travel.cy.js) |
| REG-28 | solo los padres pueden ajustar el margen de la demo. | [travel.cy.js](e2e/06_reglas/travel.cy.js) |

Las seis comprobaciones anteriores de correspondencia de rutas se han sustituido por [seis recorridos de navegación](e2e/07_rutas/navegacion.cy.js), RUT-01 a RUT-06. Comprueban la página visible para un perfil de demo; no verifican permisos reales.

Los conteos de las pruebas de interfaz y de reglas son niveles distintos, aunque pueden cubrir riesgos comunes. La prueba de aceptación secuencial o el análisis de un lote en memoria no demuestran concurrencia entre dispositivos.
