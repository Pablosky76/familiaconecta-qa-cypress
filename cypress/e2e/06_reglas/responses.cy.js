// Reglas de la demo ejecutadas en el navegador por Cypress. No son pruebas de seguridad real.
let loadModule;
let createMockRepository;
beforeEach(() => {
  cy.visit('/');
  cy.window().then((win) => {
    loadModule = win.Function('path', 'return import(path)');
    return Promise.all([loadModule('/src/data/mock/mockRepository.ts')]).then((modules) => {
      ({ createMockRepository } = modules[0]);
    });
  });
});

describe("respuestas de ejemplo", () => {
    it("[REG-19] acepta una sola vez y cierra las demás solicitudes de la tarea", async () => {
        const repo = createMockRepository();
        const data = await repo.getSnapshot();
        const req = data.careRequests.find(r => r.status === "pendiente" && r.recipientId === "m-antonio");
        const result = await repo.respondToRequest(req.id, "m-antonio", "aceptar");
        expect(result.ok).to.equal(true);
        const after = await repo.getSnapshot();
        const task = after.careTasks.find(t => t.id === req.taskId);
        expect(task.assigneeId).to.equal("m-antonio");
        expect(after.careRequests.filter(r => r.taskId === task.id && r.status === "aceptada")).to.have.length(1);
        const other = after.careRequests.find(r => r.taskId === task.id && r.recipientId !== "m-antonio");
        expect(other.status).to.equal("superada");
        expect((await repo.respondToRequest(other.id, other.recipientId, "aceptar")).ok).to.equal(false);
    });
    it("[REG-20] rechaza responder por otra persona y no permite compromisos simultáneos", async () => {
        const repo = createMockRepository();
        const data = await repo.getSnapshot();
        const r = data.careRequests.find(x => x.status === "pendiente" && x.recipientId === "m-carmen");
        expect((await repo.respondToRequest(r.id, "m-antonio", "rechazar")).ok).to.equal(false);
        expect((await repo.respondToRequest(r.id, "m-carmen", "aceptar")).ok).to.equal(false);
        expect((await repo.respondToRequest(r.id, "m-carmen", "rechazar")).ok).to.equal(true);
        expect((await repo.getSnapshot()).careRequests.find(x => x.id === r.id)?.status).to.equal("rechazada");
    });
});
it("[REG-21] no acepta solicitudes ya terminadas", async () => {
    const repo = createMockRepository();
    const snap = await repo.getSnapshot();
    const req = snap.careRequests.find(r => r.status === "pendiente" && r.recipientId === "m-antonio");
    const { respondToRequest } = await loadModule("/src/domain/responses.ts");
    snap.clock.today = "2026-11-20";
    expect(respondToRequest(snap, req.id, "m-antonio", "aceptar", new Date().toISOString()).result.ok).to.equal(false);
});
