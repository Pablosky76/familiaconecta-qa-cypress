/**
 * Cambios de planificación (bloque 2). Pura: recibe el estado y un cambio,
 * devuelve el estado nuevo y el resultado. No guarda nada por sí misma.
 *
 * Permisos SIMULADOS de la demo: se comprueban aquí para que la interfaz sea coherente,
 * pero el selector de perfil no es autenticación y no ofrece seguridad real.
 */
import { availabilityOnDate, busyRanges, sessionsOnDate } from "./schedule";
import { formatDayLong, weekdaysPhrase } from "./dates";
import type {
  Availability,
  AuditEntry,
  CareRequest,
  CareTask,
  Child,
  FamilyEvent,
  FamilyMember,
  ISODateTime,
  SchoolSchedule,
  WorkShift,
} from "./types";
import {
  validateAvailability,
  validateEvent,
  validateSchoolException,
  validateSchoolWeek,
  validateShift,
  validateShiftException,
  type AvailabilityInput,
  type EventInput,
  type FieldErrors,
  type SchoolDayInput,
  type SchoolExceptionInput,
  type ShiftExceptionInput,
  type ShiftInput,
} from "./validation";

export interface PlanningState {
  members: FamilyMember[];
  children: Child[];
  workShifts: WorkShift[];
  schoolSchedules: SchoolSchedule[];
  availability: Availability[];
  events: FamilyEvent[];
  careTasks: CareTask[];
  careRequests: CareRequest[];
  auditEntries: AuditEntry[];
}

export type PlanningChange =
  | { type: "shift.save"; shiftId: string | null; memberId: string; input: ShiftInput }
  | { type: "shift.delete"; shiftId: string }
  | { type: "shiftException.save"; shiftId: string; exceptionId: string | null; input: ShiftExceptionInput }
  | { type: "shiftException.delete"; shiftId: string; exceptionId: string }
  | { type: "schoolWeek.save"; childId: string; input: { days: SchoolDayInput[] } }
  | { type: "schoolException.save"; childId: string; exceptionId: string | null; input: SchoolExceptionInput }
  | { type: "schoolException.delete"; childId: string; exceptionId: string }
  | { type: "event.save"; eventId: string | null; input: EventInput }
  | { type: "event.delete"; eventId: string }
  | { type: "availability.save"; memberId: string; availabilityId: string | null; input: AvailabilityInput }
  | { type: "availability.delete"; availabilityId: string };

export type ChangeOutcome =
  | { ok: true; summary: string; flaggedTaskIds: string[] }
  | { ok: false; kind: "permiso" | "validacion" | "no_encontrado"; message: string; errors: FieldErrors };

export const isParent = (m: FamilyMember | undefined): boolean => m?.role === "madre" || m?.role === "padre";
export const isGrandparent = (m: FamilyMember | undefined): boolean => m?.role === "abuela" || m?.role === "abuelo";

/** Permiso simulado: puede modificar la planificación familiar (agendas, eventos, disponibilidad). */
export function canEditPlanning(actor: FamilyMember | undefined): boolean {
  return actor?.scope === "planificacion";
}

/** Permiso simulado: cada progenitor solo edita sus propios turnos. */
export function canEditShiftsOf(actor: FamilyMember | undefined, memberId: string): boolean {
  return canEditPlanning(actor) && actor?.id === memberId;
}

function shiftOwner(state: PlanningState, change: PlanningChange): string | undefined {
  switch (change.type) {
    case "shift.save":
      return change.shiftId ? state.workShifts.find((s) => s.id === change.shiftId)?.memberId : change.memberId;
    case "shift.delete":
    case "shiftException.save":
    case "shiftException.delete":
      return state.workShifts.find((s) => s.id === change.shiftId)?.memberId;
    default:
      return undefined;
  }
}

/** Devuelve el motivo del rechazo o null si el perfil puede hacer el cambio. */
export function permissionError(state: PlanningState, actor: FamilyMember | undefined, change: PlanningChange): string | null {
  if (!canEditPlanning(actor)) {
    return "Este perfil solo puede consultar. En la demo, la planificación la modifican la madre y el padre (permiso simulado, sin seguridad real).";
  }
  if (change.type.startsWith("shift")) {
    const owner = shiftOwner(state, change);
    if (owner === undefined) return null; // se informará como «no encontrado»
    if (!canEditShiftsOf(actor, owner)) return "Cada progenitor solo puede editar sus propios turnos.";
  }
  if (change.type === "availability.save") {
    const target = state.members.find((m) => m.id === change.memberId);
    if (target && !isGrandparent(target)) return "Aquí solo se registra la disponibilidad de los abuelos.";
  }
  return null;
}

/* ---------------- Revisión de tareas afectadas ---------------- */

/**
 * Regla sencilla y conservadora (NO es detección automática de necesidades):
 * una tarea confirmada se marca para revisión si, en su mismo día, cambia algo de lo que depende:
 * - el horario de quien la tiene asignada (o de ambos progenitores si la cubre un abuelo),
 * - el horario escolar de los niños de la tarea,
 * - la disponibilidad del abuelo asignado,
 * - los eventos que afectan a esos niños.
 */
function taskSignature(s: PlanningState, task: CareTask): string {
  const assignee = s.members.find((m) => m.id === task.assigneeId);
  const people = assignee && isParent(assignee) ? [assignee] : s.members.filter(isParent);
  return JSON.stringify({
    shifts: people.map((p) => busyRanges(p, s.workShifts, task.date)),
    sessions: task.childIds.map((c) => sessionsOnDate(s.schoolSchedules, s.events, c, task.date)),
    availability:
      assignee && isGrandparent(assignee) ? availabilityOnDate(s.availability, assignee.id, task.date) : null,
    events: s.events
      .filter((e) => e.date === task.date && e.childIds.some((c) => task.childIds.includes(c)))
      .map((e) => [e.title, e.range, e.closesCenters])
      .sort(),
  });
}

function flagAffectedTasks(prev: PlanningState, next: PlanningState, summary: string, at: ISODateTime): string[] {
  const flagged: string[] = [];
  for (const t of next.careTasks) {
    // Nunca se crea ni se borra cobertura: solo se señala para revisión.
    if (t.confirmation === null) continue;
    const before = prev.careTasks.find((x) => x.id === t.id);
    if (!before || taskSignature(prev, before) === taskSignature(next, t)) continue;
    const who = next.members.find((m) => m.id === t.confirmation?.byMemberId);
    t.review = {
      reason: `${summary}. Afecta a esta tarea del ${formatDayLong(t.date).toLowerCase()}: se conserva la confirmación de ${who?.name ?? "la persona asignada"}, pero hay que revisar si sigue siendo válida.`,
      flaggedAt: at,
    };
    flagged.push(t.id);
  }
  return flagged;
}

/* ---------------- Reductor ---------------- */

export interface ApplyOptions {
  at: ISODateTime;
  newId: (prefix: string) => string;
}

type StepResult =
  | { ok: true; summary: string; entity: string; entityId: string }
  | { ok: false; kind: "validacion" | "no_encontrado"; message: string; errors: FieldErrors };

const invalid = (errors: FieldErrors): StepResult => ({
  ok: false,
  kind: "validacion",
  message: "Revisa los campos marcados.",
  errors,
});
const notFound = (what: string): StepResult => ({
  ok: false,
  kind: "no_encontrado",
  message: `No se encontró ${what}. Puede que la demo se haya reiniciado.`,
  errors: {},
});

function step(s: PlanningState, change: PlanningChange, actor: FamilyMember, o: ApplyOptions): StepResult {
  const name = actor.name;
  switch (change.type) {
    case "shift.save": {
      const existing = change.shiftId ? s.workShifts.find((w) => w.id === change.shiftId) : undefined;
      if (change.shiftId && !existing) return notFound("el turno");
      const memberId = existing?.memberId ?? change.memberId;
      const v = validateShift(change.input, {
        otherShifts: s.workShifts.filter((w) => w.memberId === memberId && w.id !== change.shiftId),
        exceptions: existing?.exceptions ?? [],
      });
      if (!v.ok) return invalid(v.errors);
      if (existing) {
        Object.assign(existing, v.value);
        return { ok: true, summary: `${name} editó su turno «${existing.label}»`, entity: "WorkShift", entityId: existing.id };
      }
      const id = o.newId("ws");
      s.workShifts.push({ id, memberId, exceptions: [], ...v.value });
      return {
        ok: true,
        summary: `${name} añadió el turno «${v.value.label}» ${weekdaysPhrase(v.value.recurrence.weekdays)}`,
        entity: "WorkShift",
        entityId: id,
      };
    }
    case "shift.delete": {
      const existing = s.workShifts.find((w) => w.id === change.shiftId);
      if (!existing) return notFound("el turno");
      s.workShifts = s.workShifts.filter((w) => w.id !== change.shiftId);
      return { ok: true, summary: `${name} eliminó su turno «${existing.label}»`, entity: "WorkShift", entityId: existing.id };
    }
    case "shiftException.save": {
      const shift = s.workShifts.find((w) => w.id === change.shiftId);
      if (!shift) return notFound("el turno");
      const existing = change.exceptionId ? shift.exceptions.find((e) => e.id === change.exceptionId) : undefined;
      if (change.exceptionId && !existing) return notFound("la excepción");
      const v = validateShiftException(change.input, { shift, exceptionId: change.exceptionId });
      if (!v.ok) return invalid(v.errors);
      const day = formatDayLong(v.value.date).toLowerCase();
      if (existing) Object.assign(existing, v.value, { registeredAt: o.at });
      else shift.exceptions.push({ id: o.newId("ex"), registeredAt: o.at, ...v.value });
      return {
        ok: true,
        summary: `${name} ${existing ? "editó" : "registró"} una excepción de «${shift.label}» el ${day}`,
        entity: "WorkShift",
        entityId: shift.id,
      };
    }
    case "shiftException.delete": {
      const shift = s.workShifts.find((w) => w.id === change.shiftId);
      const ex = shift?.exceptions.find((e) => e.id === change.exceptionId);
      if (!shift || !ex) return notFound("la excepción");
      shift.exceptions = shift.exceptions.filter((e) => e.id !== ex.id);
      return {
        ok: true,
        summary: `${name} eliminó la excepción de «${shift.label}» del ${formatDayLong(ex.date).toLowerCase()}`,
        entity: "WorkShift",
        entityId: shift.id,
      };
    }
    case "schoolWeek.save": {
      const child = s.children.find((c) => c.id === change.childId);
      if (!child) return notFound("el niño");
      const v = validateSchoolWeek(change.input);
      if (!v.ok) return invalid(v.errors);
      let sched = s.schoolSchedules.find((x) => x.childId === child.id);
      if (!sched) {
        sched = { id: o.newId("ss"), childId: child.id, sessions: [], exceptions: [] };
        s.schoolSchedules.push(sched);
      }
      sched.sessions = v.value;
      return { ok: true, summary: `${name} cambió el horario habitual de ${child.name}`, entity: "SchoolSchedule", entityId: sched.id };
    }
    case "schoolException.save": {
      const child = s.children.find((c) => c.id === change.childId);
      if (!child) return notFound("el niño");
      let sched = s.schoolSchedules.find((x) => x.childId === child.id);
      if (!sched) {
        sched = { id: o.newId("ss"), childId: child.id, sessions: [], exceptions: [] };
        s.schoolSchedules.push(sched);
      }
      const existing = change.exceptionId ? sched.exceptions.find((e) => e.id === change.exceptionId) : undefined;
      if (change.exceptionId && !existing) return notFound("la excepción escolar");
      const v = validateSchoolException(change.input, { exceptions: sched.exceptions, exceptionId: change.exceptionId });
      if (!v.ok) return invalid(v.errors);
      if (existing) Object.assign(existing, v.value, { registeredAt: o.at });
      else sched.exceptions.push({ id: o.newId("se"), registeredAt: o.at, ...v.value });
      return {
        ok: true,
        summary: `${name} ${existing ? "editó" : "registró"} una excepción escolar de ${child.name} el ${formatDayLong(v.value.date).toLowerCase()}`,
        entity: "SchoolSchedule",
        entityId: sched.id,
      };
    }
    case "schoolException.delete": {
      const child = s.children.find((c) => c.id === change.childId);
      const sched = s.schoolSchedules.find((x) => x.childId === change.childId);
      const ex = sched?.exceptions.find((e) => e.id === change.exceptionId);
      if (!child || !sched || !ex) return notFound("la excepción escolar");
      sched.exceptions = sched.exceptions.filter((e) => e.id !== ex.id);
      return {
        ok: true,
        summary: `${name} eliminó la excepción escolar de ${child.name} del ${formatDayLong(ex.date).toLowerCase()}`,
        entity: "SchoolSchedule",
        entityId: sched.id,
      };
    }
    case "event.save": {
      const existing = change.eventId ? s.events.find((e) => e.id === change.eventId) : undefined;
      if (change.eventId && !existing) return notFound("el evento");
      const v = validateEvent(change.input, { childIds: s.children.map((c) => c.id) });
      if (!v.ok) return invalid(v.errors);
      if (existing) {
        Object.assign(existing, v.value);
        return { ok: true, summary: `${name} editó el evento «${v.value.title}»`, entity: "FamilyEvent", entityId: existing.id };
      }
      const familyId = s.members[0]?.familyId ?? "";
      const id = o.newId("ev");
      s.events.push({ id, familyId, ...v.value });
      return { ok: true, summary: `${name} añadió el evento «${v.value.title}»`, entity: "FamilyEvent", entityId: id };
    }
    case "event.delete": {
      const existing = s.events.find((e) => e.id === change.eventId);
      if (!existing) return notFound("el evento");
      s.events = s.events.filter((e) => e.id !== existing.id);
      return { ok: true, summary: `${name} eliminó el evento «${existing.title}»`, entity: "FamilyEvent", entityId: existing.id };
    }
    case "availability.save": {
      const target = s.members.find((m) => m.id === change.memberId);
      if (!target) return notFound("la persona");
      const existing = change.availabilityId ? s.availability.find((a) => a.id === change.availabilityId) : undefined;
      if (change.availabilityId && (!existing || existing.memberId !== target.id)) return notFound("la disponibilidad");
      const v = validateAvailability(change.input, {
        existing: s.availability.filter((a) => a.memberId === target.id),
        availabilityId: change.availabilityId,
      });
      if (!v.ok) return invalid(v.errors);
      if (existing) Object.assign(existing, v.value);
      else s.availability.push({ id: o.newId("av"), memberId: target.id, ...v.value });
      return {
        ok: true,
        summary: `${name} ${existing ? "actualizó" : "registró"} la disponibilidad de ${target.name}`,
        entity: "Availability",
        entityId: existing?.id ?? target.id,
      };
    }
    case "availability.delete": {
      const existing = s.availability.find((a) => a.id === change.availabilityId);
      if (!existing) return notFound("la disponibilidad");
      const target = s.members.find((m) => m.id === existing.memberId);
      s.availability = s.availability.filter((a) => a.id !== existing.id);
      return {
        ok: true,
        summary: `${name} eliminó una disponibilidad de ${target?.name ?? "un abuelo"}`,
        entity: "Availability",
        entityId: existing.id,
      };
    }
  }
}

export function applyPlanningChange<S extends PlanningState>(
  state: S,
  change: PlanningChange,
  actor: FamilyMember | undefined,
  opts: ApplyOptions,
): { state: S; outcome: ChangeOutcome } {
  const denied = permissionError(state, actor, change);
  if (denied || !actor) {
    return {
      state,
      outcome: { ok: false, kind: "permiso", message: denied ?? "Elige un perfil para continuar.", errors: {} },
    };
  }
  const next = structuredClone(state);
  const r = step(next, change, actor, opts);
  if (!r.ok) return { state, outcome: r };

  const flaggedTaskIds = flagAffectedTasks(state, next, r.summary, opts.at);
  next.auditEntries.push({
    id: opts.newId("a"),
    at: opts.at,
    actorId: actor.id,
    action: change.type,
    entity: r.entity,
    entityId: r.entityId,
    summary: `${r.summary} (cambio local de la demo)`,
  });
  if (flaggedTaskIds.length > 0) {
    next.auditEntries.push({
      id: opts.newId("a"),
      at: opts.at,
      actorId: "sistema",
      action: "cobertura.revisar",
      entity: "CareTask",
      entityId: flaggedTaskIds.join(","),
      summary: `${flaggedTaskIds.length === 1 ? "1 tarea marcada" : `${flaggedTaskIds.length} tareas marcadas`} para revisión; confirmaciones conservadas`,
    });
  }
  return { state: next, outcome: { ok: true, summary: r.summary, flaggedTaskIds } };
}
