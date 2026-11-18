import { deriveTaskStatus, type TaskStatus } from "./care";
import { overlaps, weekdayOf } from "./dates";
import type {
  Availability,
  CareRequest,
  CareTask,
  Child,
  FamilyEvent,
  FamilyMember,
  ISODate,
  SchoolException,
  SchoolSchedule,
  TimeRange,
  WorkShift,
} from "./types";

export interface ResolvedShift {
  shiftId: string;
  memberId: string;
  label: string;
  range: TimeRange;
  /** Motivo si ese día aplica una excepción. */
  exceptionReason: string | null;
}

/** Turnos de un día aplicando recurrencia, vigencia y excepciones. */
export function shiftsOnDate(shifts: WorkShift[], date: ISODate): ResolvedShift[] {
  const wd = weekdayOf(date);
  const out: ResolvedShift[] = [];
  for (const s of shifts) {
    const { weekdays, validFrom, validTo } = s.recurrence;
    if (!weekdays.includes(wd)) continue;
    if (date < validFrom || (validTo !== null && date > validTo)) continue;
    const ex = s.exceptions.find((e) => e.date === date);
    if (ex && ex.range === null) continue;
    out.push({
      shiftId: s.id,
      memberId: s.memberId,
      label: s.label,
      range: ex?.range ?? s.range,
      exceptionReason: ex?.reason ?? null,
    });
  }
  return out.sort((a, b) => a.range.start - b.range.start);
}

export interface ResolvedSession {
  childId: string;
  label: string;
  range: TimeRange;
  /** Motivo si ese día aplica una excepción escolar. */
  exceptionReason: string | null;
}

export function closingEventFor(
  events: FamilyEvent[],
  childId: string,
  date: ISODate,
): FamilyEvent | undefined {
  return events.find((e) => e.date === date && e.closesCenters && e.childIds.includes(childId));
}

export function schoolExceptionFor(
  schedules: SchoolSchedule[],
  childId: string,
  date: ISODate,
): SchoolException | undefined {
  return schedules
    .filter((s) => s.childId === childId)
    .flatMap((s) => s.exceptions)
    .find((e) => e.date === date);
}

/**
 * Horario escolar de un día; vacío si es fin de semana, el centro cierra
 * o una excepción escolar indica que no hay clase. Una excepción con horario sustituye al habitual.
 */
export function sessionsOnDate(
  schedules: SchoolSchedule[],
  events: FamilyEvent[],
  childId: string,
  date: ISODate,
): ResolvedSession[] {
  if (closingEventFor(events, childId, date)) return [];
  const ex = schoolExceptionFor(schedules, childId, date);
  if (ex) return ex.range ? [{ childId, label: ex.reason, range: ex.range, exceptionReason: ex.reason }] : [];
  const wd = weekdayOf(date);
  return schedules
    .filter((s) => s.childId === childId)
    .flatMap((s) => s.sessions.filter((x) => x.weekday === wd))
    .map((x) => ({ childId, label: x.label, range: x.range, exceptionReason: null }))
    .sort((a, b) => a.range.start - b.range.start);
}

export interface ResolvedAvailability {
  memberId: string;
  range: TimeRange | null;
  available: boolean;
  note: string;
  isException: boolean;
}

/** Disponibilidad de un miembro en una fecha; una excepción sustituye a la recurrente. */
export function availabilityOnDate(
  availability: Availability[],
  memberId: string,
  date: ISODate,
): ResolvedAvailability | null {
  const ex = availability.find(
    (a) => a.memberId === memberId && a.kind === "excepcion" && a.date === date,
  );
  if (ex) {
    return { memberId, range: ex.range, available: ex.available, note: ex.note, isException: true };
  }
  const wd = weekdayOf(date);
  const rec = availability.find(
    (a) => a.memberId === memberId && a.kind === "recurrente" && a.weekday === wd,
  );
  if (!rec) return null;
  return { memberId, range: rec.range, available: rec.available, note: rec.note, isException: false };
}

/** Franja ocupada de un progenitor: turno ampliado con el desplazamiento configurado. */
export function busyRanges(member: FamilyMember, shifts: WorkShift[], date: ISODate): TimeRange[] {
  return shiftsOnDate(
    shifts.filter((s) => s.memberId === member.id),
    date,
  ).map((s) => ({
    start: s.range.start - member.commuteMinutes,
    end: s.range.end + member.commuteMinutes,
  }));
}

export function freeParentsDuring(
  parents: FamilyMember[],
  shifts: WorkShift[],
  date: ISODate,
  r: TimeRange,
): FamilyMember[] {
  return parents.filter((p) => !busyRanges(p, shifts, date).some((b) => overlaps(b, r)));
}

export function tasksOnDate(tasks: CareTask[], date: ISODate): CareTask[] {
  return tasks.filter((t) => t.date === date).sort((a, b) => a.range.start - b.range.start);
}

/* ---------- Situación prevista de un niño (planificación, NO ubicación real) ---------- */

export type PlanSegmentKind = "centro" | "tarea" | "familia" | "sin_planificar" | "cerrado";

export interface PlanSegment {
  range: TimeRange;
  kind: PlanSegmentKind;
  label: string;
  taskId: string | null;
  status: TaskStatus | null;
}

export const PLAN_DAY: TimeRange = { start: 7 * 60 + 30, end: 21 * 60 };

export interface PlanInput {
  child: Child;
  date: ISODate;
  members: FamilyMember[];
  schedules: SchoolSchedule[];
  shifts: WorkShift[];
  events: FamilyEvent[];
  tasks: CareTask[];
  requests: CareRequest[];
}

/**
 * Construye la situación prevista de un niño para un día a partir de su horario
 * escolar, las tareas de cuidado y los turnos de los progenitores.
 * Es una vista de planificación: nunca representa dónde está el niño ahora mismo.
 */
export function childDayPlan(input: PlanInput): PlanSegment[] {
  const { child, date, members, schedules, shifts, events, tasks, requests } = input;
  const blocks: PlanSegment[] = [];
  const closing = closingEventFor(events, child.id, date);

  for (const s of sessionsOnDate(schedules, events, child.id, date)) {
    blocks.push({
      range: s.range,
      kind: "centro",
      label: `En ${child.center.name}`,
      taskId: null,
      status: null,
    });
  }

  for (const t of tasks) {
    if (t.date !== date || !t.childIds.includes(child.id)) continue;
    const status = deriveTaskStatus(t, requests);
    const who = members.find((m) => m.id === t.assigneeId);
    const covered = status === "confirmada";
    blocks.push({
      range: t.range,
      kind: "tarea",
      label: covered && who ? `Con ${who.name}` : "Sin cobertura confirmada",
      taskId: t.id,
      status,
    });
  }

  blocks.sort((a, b) => a.range.start - b.range.start);

  const parents = members.filter((m) => m.role === "madre" || m.role === "padre");
  const out: PlanSegment[] = [];
  let cursor = PLAN_DAY.start;

  const fillGap = (start: number, end: number) => {
    if (end - start < 5) return;
    const gap = { start, end };
    const free = freeParentsDuring(parents, shifts, date, gap);
    if (free.length > 0) {
      out.push({
        range: gap,
        kind: closing ? "cerrado" : "familia",
        label: closing
          ? `${closing.title} · sin asignación confirmada`
          : `Posiblemente disponible: ${free.map((p) => p.name).join(" o ")} · sin asignación confirmada`,
        taskId: null,
        status: null,
      });
    } else {
      out.push({ range: gap, kind: "sin_planificar", label: "Sin planificación registrada", taskId: null, status: null });
    }
  };

  for (const b of blocks) {
    if (b.range.start > cursor) fillGap(cursor, b.range.start);
    out.push(b);
    cursor = Math.max(cursor, b.range.end);
  }
  if (cursor < PLAN_DAY.end) fillGap(cursor, PLAN_DAY.end);
  return out;
}

export function segmentAt(segments: PlanSegment[], minute: number): PlanSegment | undefined {
  // Prefer the latest-starting segment covering the minute (tasks override the centre block).
  return [...segments].reverse().find((s) => s.range.start <= minute && s.range.end > minute);
}
