describe('05 · Calendario familiar', () => {
  beforeEach(() => {
    cy.elegirPerfil('Antonio');
    cy.contains('a', 'Ver el calendario familiar').click();
  });

  it('[CAL-01] explica los estados con texto y no solo con colores', () => {
    cy.contains('h1', 'Calendario semanal').should('be.visible');
    cy.contains('Vista de consulta').should('be.visible');
    cy.contains('summary', 'Leyenda de estados').click();
    cy.contains('Nadie se ha hecho cargo todavía.').should('be.visible');
    cy.contains('Solicitud enviada sin respuesta. Aún no es cobertura.').should('be.visible');
    cy.contains('Una persona ha confirmado que se encarga.').should('be.visible');
  });

  it('[CAL-02] permite cambiar de semana y volver a la semana de ejemplo', () => {
    cy.contains('a', 'Semana siguiente').click();
    cy.contains('la detección automática de necesidades llegará en una fase posterior').should('be.visible');
    cy.contains('a', 'Volver a la semana de demo').click();
    cy.contains('Tareas de esta semana').should('be.visible');
  });
});
