describe('03 · Planificación y solicitudes', () => {
  beforeEach(() => { cy.elegirPerfil('Laura'); cy.contains('a', 'Pedir ayuda').first().click(); });
  it('[PLA-01] prepara una solicitud para los abuelos disponibles sin confirmarla', () => {
    cy.contains('label', 'Día').find('input').clear().type('2026-11-18');
    cy.contains('label', 'Desde').find('input').clear().type('18:00');
    cy.contains('label', 'Hasta').find('input').clear().type('19:00');
    cy.contains('label', '¿Dónde?').find('input').type('Casa de ejemplo');
    cy.contains('button', 'Preparar solicitud de prueba').click();
    cy.contains('Solicitud de ejemplo preparada para Carmen y Antonio').should('be.visible');
    cy.contains('Casa de ejemplo').closest('article').should('contain', 'Pendiente').and('contain', 'todavía no está cubierta');
  });
  it('[PLA-02] rechaza una hora de fin anterior al inicio', () => {
    cy.contains('label', 'Día').find('input').clear().type('2026-11-18');
    cy.contains('label', 'Desde').find('input').clear().type('18:00');
    cy.contains('label', 'Hasta').find('input').clear().type('17:00');
    cy.contains('label', '¿Dónde?').find('input').type('Casa de ejemplo');
    cy.contains('button', 'Preparar solicitud de prueba').click();
    cy.contains('La hora de fin debe ser posterior').should('be.visible');
  });
  it('[PLA-05] conserva sin cubrir una necesidad cuando ningún abuelo está disponible', () => {
    cy.contains('label', 'Día').find('input').clear().type('2026-11-22');
    cy.contains('label', 'Desde').find('input').clear().type('18:00');
    cy.contains('label', 'Hasta').find('input').clear().type('19:00');
    cy.contains('label', '¿Dónde?').find('input').type('Casa de ejemplo');
    cy.contains('button', 'Preparar solicitud de prueba').click();
    cy.contains('Necesidad guardada sin cubrir').should('be.visible');
    cy.contains('Casa de ejemplo').closest('article').should('contain', 'Sin asignar');
  });
  it('[PLA-06] rechaza una solicitud en una fecha anterior al día de la demo', () => {
    cy.contains('label', 'Día').find('input').clear().type('2026-11-16');
    cy.contains('label', '¿Dónde?').find('input').type('Casa de ejemplo');
    cy.contains('button', 'Preparar solicitud de prueba').click();
    cy.contains('Elige una hora posterior al momento actual de la demo').should('be.visible');
    cy.contains('Casa de ejemplo').should('not.exist');
  });
});
