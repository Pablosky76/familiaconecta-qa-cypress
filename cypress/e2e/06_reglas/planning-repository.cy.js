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

describe("planificación simulada", () => {
    it("[REG-15] guarda un turno, lo recupera y reinicia la demo", async () => {
        const repo = createMockRepository();
        const original = await repo.getSnapshot();
        const result = await repo.applyChange({ type: "shift.save", shiftId: null, memberId: "m-laura", input: { label: "Turno de prueba", weekdays: [6], start: "09:00", end: "12:00", validFrom: "2026-11-16", validTo: "" } }, "m-laura");
        expect(result.ok).to.equal(true);
        expect((await repo.getSnapshot()).workShifts.some(s => s.label === "Turno de prueba")).to.equal(true);
        repo.reset();
        expect((await repo.getSnapshot()).workShifts).to.deep.equal(original.workShifts);
    });
    it("[REG-16] rechaza datos inválidos y un cambio de otro perfil", async () => {
        const repo = createMockRepository();
        const original = await repo.getSnapshot();
        const change = { type: "shift.save", shiftId: null, memberId: "m-laura", input: { label: "Prueba", weekdays: [6], start: "12:00", end: "09:00", validFrom: "2026-11-16", validTo: "" } };
        expect((await repo.applyChange(change, "m-laura")).ok).to.equal(false);
        expect((await repo.applyChange(change, "m-carmen")).ok).to.equal(false);
        expect(await repo.getSnapshot()).to.deep.equal(original);
    });
});
describe("agenda y revisión", () => {
    it("[REG-17] actualiza el horario escolar y conserva las confirmaciones afectadas", async () => {
        const repo = createMockRepository();
        const before = await repo.getSnapshot();
        const child = before.children[0];
        const originalTasks = before.careTasks.filter(t => t.childIds.includes(child.id) && t.confirmation);
        const result = await repo.applyChange({ type: "schoolWeek.save", childId: child.id, input: { days: [{ weekday: 2, enabled: true, start: "09:00", end: "12:00", label: "Colegio" }] } }, "m-laura");
        expect(result.ok).to.equal(true);
        const after = await repo.getSnapshot();
        expect(after.schoolSchedules.find(s => s.childId === child.id)?.sessions[0]?.range.end).to.equal(720);
        expect(originalTasks.length).to.be.greaterThan(0);
        for (const task of originalTasks)
            expect(after.careTasks.find(t => t.id === task.id)?.confirmation).to.deep.equal(task.confirmation);
        expect(after.careTasks.some(t => t.childIds.includes(child.id) && t.review && originalTasks.some(o => o.id === t.id))).to.equal(true);
    });
    it("[REG-18] registra disponibilidad y bloquea cambios por abuelos", async () => {
        const repo = createMockRepository();
        const change = { type: "availability.save", memberId: "m-carmen", availabilityId: null, input: { kind: "excepcion", weekday: "1", date: "2026-11-22", available: false, start: "", end: "", note: "" } };
        expect((await repo.applyChange(change, "m-carmen")).ok).to.equal(false);
        expect((await repo.applyChange(change, "m-laura")).ok).to.equal(true);
        expect((await repo.getSnapshot()).availability.some(a => a.memberId === "m-carmen" && a.date === "2026-11-22" && !a.available)).to.equal(true);
    });
});
