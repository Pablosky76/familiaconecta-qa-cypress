describe('01 · Acceso a la demostración', () => {
  it('[ACC-01] identifica claramente que los perfiles son ficticios', () => {
    cy.visit('/');
    cy.contains('Esto no es un inicio de sesión').should('be.visible');
    cy.contains('DEMO · datos ficticios').should('exist');
    ['Laura','Javier','Carmen','Antonio'].forEach((nombre) => cy.contains('button', nombre).should('be.visible'));
  });
  it('[ACC-02] presenta a los abuelos una navegación sencilla', () => {
    cy.elegirPerfil('Antonio');
    cy.contains('h1', 'Hola, Antonio').should('be.visible');
    cy.contains('h2', '¿Te piden ayuda?').should('be.visible');
    cy.get('nav[aria-label="Navegación principal (móvil)"]').within(() => cy.contains('Horarios').should('not.exist'));
  });
  it('[ACC-03] muestra una explicación si un abuelo abre la vista de padres', () => {
    cy.elegirPerfil('Antonio');
    cy.visit('/solicitudes');
    cy.contains('h1', 'Esta vista es para otro perfil').should('be.visible');
    cy.contains('no es un inicio de sesión').should('be.visible');
    cy.contains('a', 'Ir al selector de perfil').click();
    cy.location('pathname').should('eq', '/');
  });
});
