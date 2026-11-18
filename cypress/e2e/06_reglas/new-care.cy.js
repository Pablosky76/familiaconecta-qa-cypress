// Reglas de la demo ejecutadas en el navegador por Cypress. No son pruebas de seguridad real.
let loadModule;
let createMockRepository;
let createCareRequest;
let deriveTaskStatus;
beforeEach(() => {
  cy.visit('/');
  cy.window().then((win) => {
    loadModule = win.Function('path', 'return import(path)');
    return Promise.all([loadModule('/src/data/mock/mockRepository.ts'), loadModule('/src/domain/new-care.ts'), loadModule('/src/domain/care.ts')]).then((modules) => {
      ({ createMockRepository } = modules[0]);
      ({ createCareRequest } = modules[1]);
      ({ deriveTaskStatus } = modules[2]);
    });
  });
});

const sample = { childId: "c-lucia", date: "2026-11-18", start: "18:00", end: "19:00", kind: "cuidar", location: "Casa ficticia" };
describe("pedir ayuda en la demo", () => {
    it("[REG-12] propone a ambos abuelos y solo confirma después de una respuesta", async () => {
        const repo = createMockRepository();
        const result = await repo.createCareRequest("m-laura", sample);
        expect(result.ok).to.equal(true);
        if (!result.ok)
            return;
        expect(result.recipientNames).to.deep.equal(["Carmen", "Antonio"]);
        const snap = await repo.getSnapshot(), task = snap.careTasks.find(t => t.location === sample.location);
        const requests = snap.careRequests.filter(r => r.taskId === task.id);
        expect(requests).to.have.length(2);
        expect(requests[0]?.batchId).to.equal(requests[1]?.batchId);
        expect(deriveTaskStatus(task, snap.careRequests)).to.equal("pendiente");
        expect((await repo.respondToRequest(requests[0].id, requests[0].recipientId, "aceptar")).ok).to.equal(true);
        const after = await repo.getSnapshot();
        expect(deriveTaskStatus(after.careTasks.find(t => t.id === task.id), after.careRequests)).to.equal("confirmada");
        expect((await repo.respondToRequest(requests[1].id, requests[1].recipientId, "aceptar")).ok).to.equal(false);
    });
    it("[REG-13] impide creación por abuelos, intervalos inválidos y duplicados", async () => {
        const repo = createMockRepository(), original = await repo.getSnapshot();
        expect((await repo.createCareRequest("m-carmen", sample)).ok).to.equal(false);
        expect((await repo.createCareRequest("m-laura", { ...sample, end: "17:00" })).ok).to.equal(false);
        const result = createCareRequest(original, "m-laura", sample, new Date().toISOString());
        expect(result.result.ok).to.equal(true);
        expect(createCareRequest(result.state, "m-laura", sample, new Date().toISOString()).result.ok).to.equal(false);
    });
    it("[REG-14] conserva la necesidad sin confirmarla si no hay disponibilidad", async () => {
        const repo = createMockRepository();
        const result = await repo.createCareRequest("m-laura", { ...sample, date: "2026-11-22", start: "10:00", end: "11:00" });
        expect(result.ok).to.equal(true);
        if (!result.ok)
            return;
        expect(result.recipientNames).to.deep.equal([]);
        const snap = await repo.getSnapshot(), task = snap.careTasks.find(t => t.date === "2026-11-22" && t.childIds.includes("c-lucia"));
        expect(deriveTaskStatus(task, snap.careRequests)).to.equal("sin_asignar");
    });
});
