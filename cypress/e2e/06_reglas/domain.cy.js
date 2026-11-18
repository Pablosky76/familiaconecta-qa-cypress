// Reglas de la demo ejecutadas en el navegador por Cypress. No son pruebas de seguridad real.
let loadModule;
let createMockRepository;
let batchHasSingleWinner, deriveTaskStatus, hasConfirmedCoverage;
let addDays, weekStart;
let childDayPlan, shiftsOnDate;
beforeEach(() => {
  cy.visit('/');
  cy.window().then((win) => {
    loadModule = win.Function('path', 'return import(path)');
    return Promise.all([loadModule('/src/data/mock/mockRepository.ts'), loadModule('/src/domain/care.ts'), loadModule('/src/domain/dates.ts'), loadModule('/src/domain/schedule.ts')]).then((modules) => {
      ({ createMockRepository } = modules[0]);
      ({ batchHasSingleWinner, deriveTaskStatus, hasConfirmedCoverage } = modules[1]);
      ({ addDays, weekStart } = modules[2]);
      ({ childDayPlan, shiftsOnDate } = modules[3]);
    });
  });
  cy.then(() => createMockRepository().getSnapshot().then((data) => { snap = data; }));
});

let snap;
const task = (id) => {
    const t = snap.careTasks.find((x) => x.id === id);
    if (!t)
        throw new Error(`missing ${id}`);
    return t;
};
describe("estado de las tareas", () => {
    it("[REG-01] una solicitud pendiente no es cobertura confirmada", () => {
        const t = task("t-1119-lucia");
        expect(deriveTaskStatus(t, snap.careRequests)).to.equal("pendiente");
        expect(hasConfirmedCoverage(t)).to.equal(false);
    });
    it("[REG-02] un cambio de horario marca revisión y conserva la confirmación anterior", () => {
        const t = task("t-1119-mateo");
        expect(deriveTaskStatus(t, snap.careRequests)).to.equal("requiere_atencion");
        expect(t.confirmation?.byMemberId).to.equal("m-carmen");
    });
    it("[REG-03] los datos de demo incluyen tareas confirmadas, pendientes, sin asignar y un conflicto", () => {
        const statuses = snap.careTasks.map((t) => deriveTaskStatus(t, snap.careRequests));
        expect(statuses).to.include("confirmada");
        expect(statuses).to.include("pendiente");
        expect(statuses).to.include("sin_asignar");
        expect(snap.careTasks.some((t) => t.conflict !== null)).to.equal(true);
    });
    it("[REG-04] cada lote de solicitudes simultáneas tiene como mucho un ganador", () => {
        const batches = new Map();
        for (const r of snap.careRequests)
            batches.set(r.batchId, [...(batches.get(r.batchId) ?? []), r]);
        for (const b of batches.values())
            expect(batchHasSingleWinner(b)).to.equal(true);
        expect(batchHasSingleWinner([
            { ...snap.careRequests[0], status: "aceptada" },
            { ...snap.careRequests[1], status: "aceptada" },
        ])).to.equal(false);
    });
    it("[REG-05] las recogidas de niños distintos en centros distintos son tareas separadas", () => {
        const tue = snap.careTasks.filter((t) => t.date === "2026-11-17" && t.kind === "recoger");
        expect(tue).to.have.length(2);
        for (const t of tue)
            expect(t.childIds).to.have.length(1);
    });
});
describe("fechas y horarios", () => {
    it("[REG-06] la semana empieza en lunes y se navega de 7 en 7 días", () => {
        expect(weekStart("2026-11-19")).to.equal("2026-11-16");
        expect(weekStart("2026-11-22")).to.equal("2026-11-16");
        expect(addDays("2026-11-16", 7)).to.equal("2026-11-23");
        expect(addDays("2026-12-28", 7)).to.equal("2027-01-04");
    });
    it("[REG-07] la excepción del jueves sustituye el turno de Javier", () => {
        const shifts = snap.workShifts.filter((s) => s.memberId === "m-javier");
        expect(shiftsOnDate(shifts, "2026-11-19")[0]?.range.end).to.equal(20 * 60);
        expect(shiftsOnDate(shifts, "2026-11-18")[0]?.range.end).to.equal(18 * 60);
        expect(shiftsOnDate(shifts, "2026-12-24")).to.have.length(0);
    });
    it("[REG-08] la situación prevista de cada niño es independiente", () => {
        const base = {
            date: "2026-11-17",
            members: snap.members,
            schedules: snap.schoolSchedules,
            shifts: snap.workShifts,
            events: snap.events,
            tasks: snap.careTasks,
            requests: snap.careRequests,
        };
        const lucia = childDayPlan({ ...base, child: snap.children.find((c) => c.id === "c-lucia") });
        const mateo = childDayPlan({ ...base, child: snap.children.find((c) => c.id === "c-mateo") });
        expect(lucia.some((s) => s.label === "Con Antonio")).to.equal(true);
        expect(mateo.some((s) => s.label === "Con Carmen")).to.equal(true);
        expect(mateo.some((s) => s.label === "Con Antonio")).to.equal(false);
    });
    it("[REG-09] una franja con solicitud pendiente aparece sin cobertura confirmada", () => {
        const lucia = childDayPlan({
            child: snap.children.find((c) => c.id === "c-lucia"),
            date: "2026-11-19",
            members: snap.members,
            schedules: snap.schoolSchedules,
            shifts: snap.workShifts,
            events: snap.events,
            tasks: snap.careTasks,
            requests: snap.careRequests,
        });
        const seg = lucia.find((s) => s.taskId === "t-1119-lucia");
        expect(seg?.label).to.equal("Sin cobertura confirmada");
    });
});
it("[REG-10] una confirmación pendiente de revisión no cuenta como cobertura confirmada", async () => {
    const snap = await createMockRepository().getSnapshot();
    const task = snap.careTasks.find(t => t.confirmation && t.review);
    expect(hasConfirmedCoverage(task)).to.equal(false);
});
it("[REG-11] si todos rechazan, la tarea requiere atención", async () => {
    const snap = await createMockRepository().getSnapshot();
    const request = snap.careRequests.find(r => r.status === "pendiente");
    const task = snap.careTasks.find(t => t.id === request.taskId);
    const rejected = snap.careRequests.map(r => r.taskId === task.id ? { ...r, status: "rechazada" } : r);
    expect(deriveTaskStatus(task, rejected)).to.equal("requiere_atencion");
});
