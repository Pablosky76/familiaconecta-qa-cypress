describe('07 · Acceso a rutas de la demo', () => {
  it('[RUT-01] abre el selector de perfiles', () => {
    cy.visit('/');
    cy.contains('h1', '¿Con qué perfil quieres ver la demo?').should('be.visible');
  });
  it('[RUT-02] abre el inicio de padres', () => {
    cy.elegirPerfil('Laura');
    cy.visit('/inicio');
    cy.contains('h1', 'Hola, Laura').should('be.visible');
  });
  it('[RUT-03] abre el calendario de padres', () => {
    cy.elegirPerfil('Laura');
    cy.visit('/calendario');
    cy.contains('h1', 'Calendario semanal').should('be.visible');
  });
  it('[RUT-04] abre los horarios de padres', () => {
    cy.elegirPerfil('Laura');
    cy.visit('/horarios');
    cy.contains('h1', 'Turnos y horarios').should('be.visible');
  });
  it('[RUT-05] abre la creación de solicitudes de padres', () => {
    cy.elegirPerfil('Laura');
    cy.visit('/solicitudes');
    cy.contains('h1', 'Pedir ayuda').should('be.visible');
  });
  it('[RUT-06] abre la vista de administración simulada', () => {
    cy.visit('/');
    cy.contains('button', 'Administración técnica').click();
    cy.location('pathname').should('eq', '/admin');
    cy.contains('h1', 'Administración técnica').should('be.visible');
  });
});
