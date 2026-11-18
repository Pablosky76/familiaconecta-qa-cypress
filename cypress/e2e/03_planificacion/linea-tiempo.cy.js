describe('03 · Línea de tiempo familiar', () => {
  beforeEach(() => {
    cy.elegirPerfil('Laura');
  });

  it('[PLA-03] muestra una línea por niño e identifica que la información es prevista', () => {
    cy.contains('h2', '¿Con quién está cada niño?').closest('section').within(() => {
      cy.contains('Información prevista, no ubicación en tiempo real').should('be.visible');
      cy.get('article').should('have.length', 2);
      cy.contains('summary', 'Ver horas y detalles de cada niño').click();
      cy.get('ol[aria-label^="Plan del día de "]').should('have.length', 2).each(($plan) => {
        cy.wrap($plan).find('li').should('have.length.greaterThan', 0);
      });
    });
  });

  it('[PLA-04] permite consultar otro día y regresar al día de la demo', () => {
    cy.contains('h2', '¿Con quién está cada niño?').closest('section').within(() => {
      cy.get('input[type="date"]').invoke('val').then((today) => {
        cy.contains('button', 'Día siguiente').click();
        cy.get('input[type="date"]').should('not.have.value', today);
        cy.contains('button', 'Hoy de la demo').click();
        cy.get('input[type="date"]').should('have.value', today);
      });
    });
  });
});
