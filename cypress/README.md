# Cypress · FamiliaConecta

Batería E2E para la **demo local con datos ficticios**. El objetivo es comprobar recorridos prioritarios para padres y abuelos y documentar sus riesgos. No apunta a producción ni a Supabase y no comprueba identidad ni permisos reales.

## Clasificación

| Carpeta | Qué comprueba |
| --- | --- |
| `01_acceso` | Perfiles ficticios y navegación simplificada de abuelos. |
| `02_familia` | Aceptación y rechazo simulados. |
| `03_planificacion` | Petición de ayuda y validación de horas. |
| `04_accesibilidad` | Controles visibles y ausencia de desbordamiento en un tamaño móvil. No es una auditoría completa de accesibilidad. |
| `05_calendario` | Leyenda de estados y navegación semanal para los abuelos. |

## Ejecutar localmente

Con Node.js y dependencias instaladas (`npm ci`), inicia la demo en una terminal:

```bash
npm run dev -- --host 127.0.0.1 --port 4194 --strictPort
```

En otra terminal ejecuta `npm run cypress:smoke` para la selección rápida, `npm run cypress:regression` para toda la batería, o `npm run cypress:open` para usar la interfaz de Cypress. La configuración apunta a `127.0.0.1:4194`. La selección rápida utiliza tres archivos de la regresión: no duplica los casos. La aceptación secuencial entre perfiles, la creación de solicitudes, el control móvil y el calendario solo se ejecutan en la regresión completa.

## Casos críticos y límites

Las pruebas comprueban estados visibles, pero no demuestran seguridad real, protección de datos, mensajería, persistencia, restauración ni concurrencia entre dispositivos. La demo no comparte cambios ni datos entre navegadores. Para probar la primera aceptación concurrente se necesita un entorno aislado con servidor y base de datos reales. No ejecutar contra datos familiares.

GitHub Actions está preparado para ejecutar esta batería en cada cambio y conservar capturas de fallos durante siete días; aún debe verificarse cuando exista un repositorio conectado.

## Inventario de casos

| ID | Comprobación |
| --- | --- |
| ACC-01 | La selección de perfiles indica que es una demo ficticia. |
| ACC-02 | La vista del abuelo presenta navegación simplificada. |
| ACC-03 | El abuelo ve una explicación al abrir la vista de los padres; es un filtro de interfaz, no seguridad. |
| SOL-01 | Un abuelo acepta una solicitud de ejemplo. |
| SOL-02 | Un abuelo rechaza una solicitud sin confirmarla. |
| SOL-03 | Los cambios de la demo se pierden al recargar y vuelve la solicitud inicial. |
| SOL-04 | Tras una aceptación secuencial en la misma pestaña, la solicitud figura cubierta para el otro abuelo. |
| PLA-01 | Se prepara una solicitud y permanece pendiente. |
| PLA-02 | Se rechaza una hora de fin anterior al inicio. |
| PLA-03 | Se muestran dos líneas de planificación con detalles y aviso de previsión. |
| PLA-04 | Se puede cambiar de día y volver al día de la demo. |
| PLA-05 | Una necesidad queda sin asignar si ningún abuelo está disponible. |
| PLA-06 | No se puede crear una solicitud en una fecha anterior a la demo. |
| CAL-01 | La leyenda explica los estados con texto. |
| CAL-02 | El calendario permite cambiar de semana y volver a la demo. |
| MOV-01 | Los controles principales se muestran en móvil sin desbordamiento horizontal. |

## Resultado local

El 18 de noviembre de 2026 se ejecutaron los siete archivos con Cypress 15.21.2, Electron en modo sin interfaz y Node 25.8.1: **16 pruebas de regresión aprobadas, 0 fallidas**. La selección rápida ejecutó 8 de esas mismas pruebas y también terminó sin fallos. Es un resultado local de esta demo, no una ejecución en GitHub ni una certificación de seguridad o accesibilidad.
