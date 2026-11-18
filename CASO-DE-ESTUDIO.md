# Caso de estudio · FamiliaConecta y Cypress

## Contexto
FamiliaConecta es un prototipo de coordinación de cuidados. Una familia necesita saber cuándo hay una responsabilidad pendiente y quién la ha confirmado. La claridad para personas con poca experiencia digital es parte del objetivo. La demo utiliza únicamente datos ficticios y no representa la aplicación familiar final.

## Estrategia
La batería se organiza por acceso a la demo, respuestas de abuelos, planificación, controles móviles y calendario. Cada caso tiene un identificador y puede localizarse en el [inventario](cypress/README.md). La selección rápida ejecuta archivos de la misma regresión para evitar duplicar pruebas. Las pruebas comprueban comportamientos visibles e incluyen situaciones positivas y negativas.

## Ejemplos de decisiones
- **PLA-01 y PLA-05:** una necesidad pendiente o sin personas disponibles no debe mostrarse como cuidado confirmado.
- **SOL-04:** una persona acepta y la otra ve la solicitud cubierta, en una misma pestaña y de forma secuencial. Esto no demuestra concurrencia real.
- **PLA-03 y CAL-01:** la planificación de los dos niños y la leyenda ofrecen información textual; no constituyen una evaluación completa de accesibilidad.
- **SOL-03:** una recarga restablece los datos ficticios; la demo no ofrece persistencia compartida.

## Evidencia verificada
El 18 de noviembre de 2026 la regresión local ejecutó **16 casos y 16 pasaron**, con Cypress 15.21.2, Electron sin interfaz y Node 25.8.1. La selección rápida ejecutó 8 casos y los 8 pasaron en una ejecución local anterior ese mismo día. La [ejecución en GitHub Actions](https://github.com/Pablosky76/familiaconecta-qa-cypress/actions/runs/44304590302) posterior pasó los 16 casos en Ubuntu con Node 22. La primera ejecución falló durante el arranque; se corrigió y el historial conserva ambos resultados.

## Límites y trabajo pendiente
La batería Cypress todavía no sustituye toda la cobertura de lógica que existía en la copia de desarrollo; queda pendiente revisar y trasladar escenarios relevantes.
La selección de perfiles no autentica ni protege datos. Quedan pendientes pruebas de identidad y permisos, persistencia, envío real de avisos, restauración de copias y aceptación simultánea contra un backend aislado. La prueba móvil cubre un tamaño de pantalla y no sustituye pruebas con usuarios ni una auditoría de accesibilidad. No deben utilizarse datos familiares en el proyecto público de pruebas.

## Para explicar en una entrevista
La prioridad fue evitar que una necesidad sin respuesta pareciera cubierta. A partir de ese riesgo se añadieron comprobaciones para solicitudes pendientes, ausencia de disponibilidad y respuesta de ambos abuelos. Los resultados se presentan con fecha, entorno y limitaciones; los riesgos que requieren un servidor siguen abiertos.
