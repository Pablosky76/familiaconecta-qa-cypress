describe('02 · Solicitud compartida en la demo', () => {
  it('[SOL-04] una aceptación deja la solicitud cubierta para el otro abuelo en la misma pestaña', () => {
    cy.elegirPerfil('Laura');
    cy.contains('a', 'Pedir ayuda').first().click();
    cy.contains('label', 'Día').find('input').clear().type('2026-11-18');
    cy.contains('label', 'Desde').find('input').clear().type('18:00');
    cy.contains('label', 'Hasta').find('input').clear().type('19:00');
    cy.contains('label', '¿Dónde?').find('input').type('Biblioteca de ejemplo');
    cy.contains('button', 'Preparar solicitud de prueba').click();
    cy.contains('Solicitud de ejemplo preparada para Carmen y Antonio').should('be.visible');

    cy.get('a[aria-label="FamiliaConecta, elegir perfil"]').click();
    cy.contains('button', 'Antonio').click();
    cy.contains('Biblioteca de ejemplo').closest('article').within(() => {
      cy.contains('button', 'Sí, puedo ayudar').click();
    });
    cy.contains('Has aceptado esta solicitud de ejemplo').should('be.visible');

    cy.get('a[aria-label="FamiliaConecta, elegir perfil"]').click();
    cy.contains('button', 'Carmen').click();
    cy.contains('¿Te piden ayuda?').closest('section').should('not.contain', 'Biblioteca de ejemplo');
    cy.contains('summary', 'Ver respuestas y avisos anteriores').click();
    cy.contains('Cubierta por otra persona').should('be.visible');
  });
});
