import { describe, expect, it } from "vitest";

import { createMockRepository } from "@/data/mock/mockRepository";
import { batchHasSingleWinner, deriveTaskStatus, hasConfirmedCoverage } from "@/domain/care";
import { addDays, weekStart } from "@/domain/dates";
import { childDayPlan, shiftsOnDate } from "@/domain/schedule";

const snap = await createMockRepository().getSnapshot();
const task = (id: string) => {
  const t = snap.careTasks.find((x) => x.id === id);
  if (!t) throw new Error(`missing ${id}`);
  return t;
};

describe("estado de las tareas", () => {
  it("una solicitud pendiente no es cobertura confirmada", () => {
    const t = task("t-1119-lucia");
    expect(deriveTaskStatus(t, snap.careRequests)).toBe("pendiente");
    expect(hasConfirmedCoverage(t)).toBe(false);
  });

  it("un cambio de horario marca revisión y conserva la confirmación anterior", () => {
    const t = task("t-1119-mateo");
    expect(deriveTaskStatus(t, snap.careRequests)).toBe("requiere_atencion");
    expect(t.confirmation?.byMemberId).toBe("m-carmen");
  });

  it("los datos de demo incluyen tareas confirmadas, pendientes, sin asignar y un conflicto", () => {
    const statuses = snap.careTasks.map((t) => deriveTaskStatus(t, snap.careRequests));
    expect(statuses).toContain("confirmada");
    expect(statuses).toContain("pendiente");
    expect(statuses).toContain("sin_asignar");
    expect(snap.careTasks.some((t) => t.conflict !== null)).toBe(true);
  });

  it("cada lote de solicitudes simultáneas tiene como mucho un ganador", () => {
    const batches = new Map<string, typeof snap.careRequests>();
    for (const r of snap.careRequests) batches.set(r.batchId, [...(batches.get(r.batchId) ?? []), r]);
    for (const b of batches.values()) expect(batchHasSingleWinner(b)).toBe(true);
    expect(
      batchHasSingleWinner([
        { ...snap.careRequests[0]!, status: "aceptada" },
        { ...snap.careRequests[1]!, status: "aceptada" },
      ]),
    ).toBe(false);
  });

  it("las recogidas de niños distintos en centros distintos son tareas separadas", () => {
    const tue = snap.careTasks.filter((t) => t.date === "2026-11-17" && t.kind === "recoger");
    expect(tue).toHaveLength(2);
    for (const t of tue) expect(t.childIds).toHaveLength(1);
  });
});

describe("fechas y horarios", () => {
  it("la semana empieza en lunes y se navega de 7 en 7 días", () => {
    expect(weekStart("2026-11-19")).toBe("2026-11-16");
    expect(weekStart("2026-11-22")).toBe("2026-11-16");
    expect(addDays("2026-11-16", 7)).toBe("2026-11-23");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("la excepción del jueves sustituye el turno de Javier", () => {
    const shifts = snap.workShifts.filter((s) => s.memberId === "m-javier");
    expect(shiftsOnDate(shifts, "2026-11-19")[0]?.range.end).toBe(20 * 60);
    expect(shiftsOnDate(shifts, "2026-11-18")[0]?.range.end).toBe(18 * 60);
    expect(shiftsOnDate(shifts, "2026-12-24")).toHaveLength(0);
  });

  it("la situación prevista de cada niño es independiente", () => {
    const base = {
      date: "2026-11-17",
      members: snap.members,
      schedules: snap.schoolSchedules,
      shifts: snap.workShifts,
      events: snap.events,
      tasks: snap.careTasks,
      requests: snap.careRequests,
    };
    const lucia = childDayPlan({ ...base, child: snap.children.find((c) => c.id === "c-lucia")! });
    const mateo = childDayPlan({ ...base, child: snap.children.find((c) => c.id === "c-mateo")! });
    expect(lucia.some((s) => s.label === "Con Antonio")).toBe(true);
    expect(mateo.some((s) => s.label === "Con Carmen")).toBe(true);
    expect(mateo.some((s) => s.label === "Con Antonio")).toBe(false);
  });

  it("una franja con solicitud pendiente aparece sin cobertura confirmada", () => {
    const lucia = childDayPlan({
      child: snap.children.find((c) => c.id === "c-lucia")!,
      date: "2026-11-19",
      members: snap.members,
      schedules: snap.schoolSchedules,
      shifts: snap.workShifts,
      events: snap.events,
      tasks: snap.careTasks,
      requests: snap.careRequests,
    });
    const seg = lucia.find((s) => s.taskId === "t-1119-lucia");
    expect(seg?.label).toBe("Sin cobertura confirmada");
  });
});

it("una confirmación pendiente de revisión no cuenta como cobertura confirmada", async () => {
 const snap = await createMockRepository().getSnapshot();
 const task = snap.careTasks.find(t => t.confirmation && t.review)!;
 expect(hasConfirmedCoverage(task)).toBe(false);
});

it("si todos rechazan, la tarea requiere atención", async () => {
 const snap = await createMockRepository().getSnapshot();
 const request = snap.careRequests.find(r => r.status === "pendiente")!;
 const task = snap.careTasks.find(t => t.id === request.taskId)!;
 const rejected = snap.careRequests.map(r => r.taskId === task.id ? { ...r, status: "rechazada" as const } : r);
 expect(deriveTaskStatus(task, rejected)).toBe("requiere_atencion");
});
