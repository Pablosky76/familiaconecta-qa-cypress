# FamiliaConecta · Pruebas con Cypress

Proyecto de demostración de QA para una aplicación que ayuda a coordinar cuidados familiares. Incluye una copia aislada del prototipo con datos ficticios para que las pruebas sean reproducibles sin acceder a la aplicación familiar.

## Qué encontrarás

- [Inventario y ejecución de las pruebas](cypress/README.md): casos con identificadores, categorías y límites.
- [Caso de estudio](CASO-DE-ESTUDIO.md): riesgos, decisiones y ejemplos para explicar en una entrevista.
- [Pruebas Cypress](cypress/e2e): escenarios de acceso, respuestas, planificación, móvil y calendario.
- [Flujo de GitHub Actions](.github/workflows): configuración verificada en una ejecución real de GitHub.

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

La regresión local del 18 de noviembre de 2026 comprende 50 pruebas Cypress aprobadas: 22 de interfaz y 28 de reglas simuladas. En la [ejecución de GitHub Actions](https://github.com/Pablosky76/familiaconecta-qa-cypress/actions/runs/44304590302) del mismo día pasaron también las 16 pruebas. La batería ampliada de 50 pruebas también pasó en [GitHub Actions](https://github.com/Pablosky76/familiaconecta-qa-cypress/actions/runs/44318554318). Las cifras describen ejecuciones concretas y pueden cambiar al evolucionar el código. Las pruebas no acreditan acceso privado, persistencia, copias, avisos reales, concurrencia entre dispositivos ni conformidad de accesibilidad: son trabajos pendientes que requieren un entorno y evaluaciones adecuados.
