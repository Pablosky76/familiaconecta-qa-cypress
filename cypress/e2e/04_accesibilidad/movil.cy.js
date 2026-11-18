describe('04 · Uso en móvil', () => {
  it('[MOV-01] presenta la solicitud y controles legibles en una pantalla pequeña', () => {
    cy.viewport(390, 844);
    cy.elegirPerfil('Antonio');
    cy.contains('h2','¿Te piden ayuda?').should('be.visible');
    cy.contains('button','Sí, puedo ayudar').should('be.visible').and('not.be.disabled');
    cy.contains('button','No puedo').should('be.visible').and('not.be.disabled');
    cy.get('body').then(($body) => expect($body[0].scrollWidth).to.be.at.most($body[0].clientWidth + 1));
  });
});
