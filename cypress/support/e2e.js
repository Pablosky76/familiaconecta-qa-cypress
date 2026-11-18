Cypress.Commands.add('elegirPerfil', (nombre) => {
  cy.visit('/');
  cy.contains('button', nombre).click();
  cy.location('pathname').should('eq', '/inicio');
});
