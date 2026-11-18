// Reglas de la demo ejecutadas en el navegador por Cypress. No son pruebas de seguridad real.
let loadModule;
let createMockRepository;
let conflictingCareTasks;
let createCareRequest;
let respondToRequest;
beforeEach(() => {
  cy.visit('/');
  cy.window().then((win) => {
    loadModule = win.Function('path', 'return import(path)');
    return Promise.all([loadModule('/src/data/mock/mockRepository.ts'), loadModule('/src/domain/travel.ts'), loadModule('/src/domain/new-care.ts'), loadModule('/src/domain/responses.ts')]).then((modules) => {
      ({ createMockRepository } = modules[0]);
      ({ conflictingCareTasks } = modules[1]);
      ({ createCareRequest } = modules[2]);
      ({ respondToRequest } = modules[3]);
    });
  });
});

describe("margen entre cuidados", () => {
    it("[REG-25] distingue solapamiento, margen insuficiente y el límite exacto", async () => {
        const s = await createMockRepository().getSnapshot();
        const task = s.careTasks.find(t => t.assigneeId === "m-antonio" && t.confirmation);
        const check = (start, end, place, margin = 20) => conflictingCareTasks([task], "m-antonio", task.date, { start, end }, place, margin).length;
        expect(check(task.range.end - 1, task.range.end + 5, task.location)).to.equal(1);
        expect(check(task.range.end + 19, task.range.end + 30, "Otro centro")).to.equal(1);
        expect(check(task.range.end + 20, task.range.end + 30, "Otro centro")).to.equal(0);
        expect(check(task.range.end, task.range.end + 10, task.location.toUpperCase())).to.equal(0);
        expect(check(task.range.start - 10, task.range.start - 1, "Otro centro")).to.equal(1);
    });
    it("[REG-26] valida el margen al proponer y otra vez al aceptar", async () => {
        const s = await createMockRepository().getSnapshot();
        const prior = s.careTasks.find(t => t.assigneeId === "m-antonio" && t.confirmation);
        const input = { childId: "c-mateo", date: prior.date, start: "18:35", end: "18:45", kind: "cuidar", location: "Otro lugar" };
        const created = createCareRequest(s, "m-laura", input, new Date().toISOString());
        expect(created.result.ok).to.equal(true);
        if (!created.result.ok)
            return;
        expect(created.result.recipientNames).not.to.include("Antonio");
        const withSmallerMargin = structuredClone(s);
        withSmallerMargin.family.travelBufferMinutes = 10;
        const pending = createCareRequest(withSmallerMargin, "m-laura", input, new Date().toISOString());
        expect(pending.result.ok).to.equal(true);
        if (!pending.result.ok)
            return;
        expect(pending.result.recipientNames).to.include("Antonio");
        pending.state.family.travelBufferMinutes = 20;
        const req = pending.state.careRequests.find(r => r.recipientId === "m-antonio" && r.taskId !== prior.id && r.status === "pendiente" && pending.state.careTasks.some(t => t.id === r.taskId && t.location === "Otro lugar"));
        expect(respondToRequest(pending.state, req.id, "m-antonio", "aceptar", new Date().toISOString()).result.ok).to.equal(false);
    });
    it("[REG-27] avisa si un margen nuevo afecta cuidados confirmados sin borrar las confirmaciones", async () => {
        const repo = createMockRepository();
        const before = await repo.getSnapshot();
        expect((await repo.setTravelBuffer("m-laura", 30)).ok).to.equal(true);
        const after = await repo.getSnapshot();
        const newlyFlagged = after.careTasks.filter(t => t.review && !before.careTasks.find(x => x.id === t.id)?.review);
        expect(newlyFlagged.length).to.be.greaterThan(0);
        for (const task of newlyFlagged)
            expect(task.confirmation).to.deep.equal(before.careTasks.find(t => t.id === task.id)?.confirmation);
    });
    it("[REG-28] solo los padres pueden ajustar el margen de la demo", async () => {
        const repo = createMockRepository();
        expect((await repo.setTravelBuffer("m-carmen", 30)).ok).to.equal(false);
        expect((await repo.setTravelBuffer("m-laura", -1)).ok).to.equal(false);
        expect((await repo.setTravelBuffer("m-laura", 30)).ok).to.equal(true);
        expect((await repo.getSnapshot()).family.travelBufferMinutes).to.equal(30);
        repo.reset();
        expect((await repo.getSnapshot()).family.travelBufferMinutes).to.equal(20);
    });
});
