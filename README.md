# FamiliaConecta · Pruebas con Cypress

Proyecto de demostración de QA para una aplicación que ayuda a coordinar cuidados familiares. Incluye una copia aislada del prototipo con datos ficticios para que las pruebas sean reproducibles sin acceder a la aplicación familiar.

## Qué encontrarás

- [Inventario y ejecución de las pruebas](cypress/README.md): casos con identificadores, categorías y límites.
- [Caso de estudio](CASO-DE-ESTUDIO.md): riesgos, decisiones y ejemplos para explicar en una entrevista.
- [Pruebas Cypress](cypress/e2e): escenarios de acceso, respuestas, planificación, móvil y calendario.
- [Flujo de GitHub Actions](.github/workflows): configuración preparada; no se considera verificada hasta observar una ejecución real en GitHub.

La demo incluida es una **instantánea local para pruebas**, no una aplicación conectada a datos reales. El selector de perfiles no autentica usuarios; los cambios se pierden al recargar. No se deben introducir datos de personas reales.

## Empezar

Se necesita Node.js y npm. GitHub Actions está configurado con Node 22.

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 4194 --strictPort
```

En otra terminal:

```bash
npm run cypress:smoke       # selección rápida
npm run cypress:regression  # batería completa
npm run cypress:open        # interfaz de Cypress
```

Los casos smoke forman parte de la regresión y no se cuentan dos veces. Las pruebas usan exclusivamente `127.0.0.1:4194`.

## Alcance

La ejecución local documentada el 18 de noviembre de 2026 comprende 16 pruebas Cypress aprobadas. La cifra describe esa ejecución y puede cambiar al evolucionar el código. Las pruebas no acreditan acceso privado, persistencia, copias, avisos reales, concurrencia entre dispositivos ni conformidad de accesibilidad: son trabajos pendientes que requieren un entorno y evaluaciones adecuados.
