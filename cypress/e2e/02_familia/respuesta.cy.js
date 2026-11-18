describe('02 · Respuesta de los abuelos', () => {
  it('[SOL-01] una solicitud pendiente se puede aceptar en la demo', () => {
    cy.elegirPerfil('Antonio');
    cy.contains('Pendiente de respuesta').should('be.visible');
    cy.contains('button', 'Sí, puedo ayudar').first().click();
    cy.contains('Has aceptado esta solicitud de ejemplo').should('be.visible');
    cy.contains('Tus próximos cuidados').parent().should('contain', 'Confirmada');
  });
  it('[SOL-02] permite rechazar sin confirmar el cuidado', () => {
    cy.elegirPerfil('Antonio');
    cy.contains('button', 'No puedo').first().click();
    cy.contains('Has rechazado esta solicitud de ejemplo').should('be.visible');
    cy.contains('No tienes solicitudes pendientes').should('be.visible');
  });
  it('[SOL-03] recupera los datos de ejemplo al recargar tras una respuesta', () => {
    cy.elegirPerfil('Antonio');
    cy.contains('button', 'Sí, puedo ayudar').first().click();
    cy.contains('Has aceptado esta solicitud de ejemplo').should('be.visible');
    cy.reload();
    cy.contains('Pendiente de respuesta').should('be.visible');
    cy.contains('button', 'Sí, puedo ayudar').should('be.visible');
  });
});
