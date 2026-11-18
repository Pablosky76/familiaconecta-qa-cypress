/**
 * Validación de los formularios de planificación. Pura: recibe los textos tal como
 * llegan del formulario y devuelve valores del dominio o errores por campo en español.
 * La usan tanto los formularios como el repositorio, para que la regla sea una sola.
 */
import { formatRange, isISODate, toMinutes, weekdayOf, weekdaysPhrase, WEEKDAY_LABEL } from "./dates";
import type {
  Availability,
  EventKind,
  ISODate,
  SchoolException,
  SchoolSession,
  ShiftException,
  TimeRange,
  Weekday,
  WorkShift,
} from "./types";

export type FieldErrors = Record<string, string>;
export type Validated<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

/** Periodo admitido en la demo; evita errores de escritura como el año 0226. */
export const DEMO_MIN_DATE: ISODate = "2026-01-01";
export const DEMO_MAX_DATE: ISODate = "2027-12-31";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const LIMITS = { label: 60, reason: 120, title: 80, sessionLabel: 40, note: 120 } as const;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function checkTime(value: string, label: string, errors: FieldErrors, key: string): number | null {
  const v = value.trim();
  if (!v) {
    errors[key] = `Indica la ${label}.`;
    return null;
  }
  if (!TIME_RE.test(v)) {
    errors[key] = `La ${label} no es válida. Usa el formato HH:MM, por ejemplo 08:30.`;
    return null;
  }
  return toMinutes(v);
}

export function checkRange(
  start: string,
  end: string,
  errors: FieldErrors,
  keys: { start: string; end: string } = { start: "start", end: "end" },
): TimeRange | null {
  const s = checkTime(start, "hora de inicio", errors, keys.start);
  const e = checkTime(end, "hora de fin", errors, keys.end);
  if (s === null || e === null) return null;
  if (e <= s) {
    errors[keys.end] =
      "La hora de fin debe ser posterior a la de inicio. Los horarios que pasan de medianoche no se admiten en la demo.";
    return null;
  }
  return { start: s, end: e };
}

/** `label` en forma «la fecha de inicio». */
export function checkDate(value: string, label: string, errors: FieldErrors, key: string): ISODate | null {
  const v = value.trim();
  if (!v) {
    errors[key] = `Indica ${label}.`;
    return null;
  }
  if (!isISODate(v)) {
    errors[key] = `${capitalize(label)} no es válida. Usa el formato AAAA-MM-DD, por ejemplo 2026-11-19.`;
    return null;
  }
  if (v < DEMO_MIN_DATE || v > DEMO_MAX_DATE) {
    errors[key] = "Elige una fecha entre el 1 de enero de 2026 y el 31 de diciembre de 2027 (periodo de la demo).";
    return null;
  }
  return v;
}

function checkText(
  value: string,
  label: string,
  max: number,
  errors: FieldErrors,
  key: string,
  required = true,
): string {
  const v = value.trim();
  if (required && !v) errors[key] = `Indica ${label}.`;
  else if (v.length > max) errors[key] = `${capitalize(label)} no puede superar ${max} caracteres (ahora tiene ${v.length}).`;
  return v;
}

function done<T>(errors: FieldErrors, value: () => T): Validated<T> {
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value: value() };
}

/* ---------------- Turnos laborales ---------------- */

export interface ShiftInput {
  label: string;
  weekdays: Weekday[];
  start: string;
  end: string;
  validFrom: string;
  /** Vacío = sin fecha de fin. */
  validTo: string;
}

export type ShiftValue = Pick<WorkShift, "label" | "range" | "recurrence">;

function periodsOverlap(aFrom: ISODate, aTo: ISODate | null, bFrom: ISODate, bTo: ISODate | null): boolean {
  return aFrom <= (bTo ?? "9999-12-31") && bFrom <= (aTo ?? "9999-12-31");
}

export function validateShift(
  input: ShiftInput,
  ctx: { otherShifts: WorkShift[]; exceptions: ShiftException[] },
): Validated<ShiftValue> {
  const errors: FieldErrors = {};
  const label = checkText(input.label, "el nombre del turno", LIMITS.label, errors, "label");
  const weekdays = [...new Set(input.weekdays)].sort((a, b) => a - b);
  if (weekdays.length === 0) errors["weekdays"] = "Elige al menos un día de la semana.";
  const range = checkRange(input.start, input.end, errors);
  const validFrom = checkDate(input.validFrom, "la fecha de inicio de vigencia", errors, "validFrom");
  const validTo = input.validTo.trim() ? checkDate(input.validTo, "la fecha de fin de vigencia", errors, "validTo") : null;
  if (validFrom && validTo && validTo < validFrom) {
    errors["validTo"] = "La fecha de fin de vigencia no puede ser anterior a la de inicio.";
  }

  if (Object.keys(errors).length === 0 && range && validFrom) {
    for (const other of ctx.otherShifts) {
      const shared = other.recurrence.weekdays.filter((d) => weekdays.includes(d));
      if (shared.length === 0) continue;
      if (!periodsOverlap(validFrom, validTo, other.recurrence.validFrom, other.recurrence.validTo)) continue;
      if (range.start < other.range.end && other.range.start < range.end) {
        errors["start"] = `Se solapa con «${other.label}» (${formatRange(other.range)}) ${weekdaysPhrase(shared)}. Cambia las horas o los días.`;
        break;
      }
    }
    const orphan = ctx.exceptions.find((ex) => {
      const wd = weekdayOf(ex.date);
      return !weekdays.includes(wd) || ex.date < validFrom || (validTo !== null && ex.date > validTo);
    });
    if (orphan) {
      errors["weekdays"] =
        `Este turno tiene una excepción el ${orphan.date} que quedaría fuera de los días o la vigencia elegidos. Elimínala o ajústala primero.`;
    }
  }

  return done(errors, () => ({
    label,
    range: range!,
    recurrence: { weekdays, validFrom: validFrom!, validTo },
  }));
}

/* ---------------- Excepciones de turno ---------------- */

export interface ShiftExceptionInput {
  date: string;
  mode: "cambio" | "libre";
  start: string;
  end: string;
  reason: string;
}

export type ShiftExceptionValue = Pick<ShiftException, "date" | "range" | "reason">;

export function validateShiftException(
  input: ShiftExceptionInput,
  ctx: { shift: WorkShift; exceptionId: string | null },
): Validated<ShiftExceptionValue> {
  const errors: FieldErrors = {};
  const date = checkDate(input.date, "la fecha", errors, "date");
  if (date) {
    const { weekdays, validFrom, validTo } = ctx.shift.recurrence;
    const wd = weekdayOf(date);
    if (!weekdays.includes(wd)) {
      errors["date"] = `«${ctx.shift.label}» no se aplica los ${WEEKDAY_LABEL[wd]}${wd >= 6 ? "s" : ""} (solo ${weekdaysPhrase(weekdays)}). Elige un día en que tengas este turno.`;
    } else if (date < validFrom || (validTo !== null && date > validTo)) {
      errors["date"] = "Esa fecha está fuera de la vigencia del turno.";
    } else if (ctx.shift.exceptions.some((e) => e.date === date && e.id !== ctx.exceptionId)) {
      errors["date"] = "Ya hay una excepción para ese día en este turno. Edítala en lugar de crear otra.";
    }
  }
  const range = input.mode === "cambio" ? checkRange(input.start, input.end, errors) : null;
  const reason = checkText(input.reason, "el motivo", LIMITS.reason, errors, "reason");
  return done(errors, () => ({ date: date!, range, reason }));
}

/* ---------------- Horario escolar habitual ---------------- */

export interface SchoolDayInput {
  weekday: Weekday;
  enabled: boolean;
  start: string;
  end: string;
  label: string;
}

export function validateSchoolWeek(input: { days: SchoolDayInput[] }): Validated<SchoolSession[]> {
  const errors: FieldErrors = {};
  const sessions: SchoolSession[] = [];
  for (const d of input.days) {
    if (!d.enabled) continue;
    const k = `d${d.weekday}`;
    const range = checkRange(d.start, d.end, errors, { start: `${k}.start`, end: `${k}.end` });
    const label = checkText(d.label, "la descripción", LIMITS.sessionLabel, errors, `${k}.label`);
    if (range) sessions.push({ weekday: d.weekday, range, label });
  }
  return done(errors, () => sessions.sort((a, b) => a.weekday - b.weekday));
}

/* ---------------- Excepciones escolares ---------------- */

export interface SchoolExceptionInput {
  date: string;
  mode: "horario" | "sin_clase";
  start: string;
  end: string;
  reason: string;
}

export type SchoolExceptionValue = Pick<SchoolException, "date" | "range" | "reason">;

export function validateSchoolException(
  input: SchoolExceptionInput,
  ctx: { exceptions: SchoolException[]; exceptionId: string | null },
): Validated<SchoolExceptionValue> {
  const errors: FieldErrors = {};
  const date = checkDate(input.date, "la fecha", errors, "date");
  if (date && ctx.exceptions.some((e) => e.date === date && e.id !== ctx.exceptionId)) {
    errors["date"] = "Ya hay una excepción escolar ese día para este niño. Edítala en lugar de crear otra.";
  }
  const range = input.mode === "horario" ? checkRange(input.start, input.end, errors) : null;
  const reason = checkText(input.reason, "el motivo", LIMITS.reason, errors, "reason");
  return done(errors, () => ({ date: date!, range, reason }));
}

/* ---------------- Eventos ---------------- */

export interface EventInput {
  title: string;
  date: string;
  kind: EventKind;
  allDay: boolean;
  start: string;
  end: string;
  childIds: string[];
  closesCenters: boolean;
}

export interface EventValue {
  title: string;
  date: ISODate;
  kind: EventKind;
  range: TimeRange | null;
  childIds: string[];
  closesCenters: boolean;
}

const EVENT_KINDS: EventKind[] = ["festivo", "escolar", "familiar"];

export function validateEvent(input: EventInput, ctx: { childIds: string[] }): Validated<EventValue> {
  const errors: FieldErrors = {};
  const title = checkText(input.title, "el título", LIMITS.title, errors, "title");
  const date = checkDate(input.date, "la fecha", errors, "date");
  if (!EVENT_KINDS.includes(input.kind)) errors["kind"] = "Elige el tipo de evento.";
  const range = input.allDay ? null : checkRange(input.start, input.end, errors);
  const childIds = input.childIds.filter((id) => ctx.childIds.includes(id));
  if (input.closesCenters && childIds.length === 0) {
    errors["closesCenters"] = "Para marcar el centro como cerrado, elige al menos un niño afectado.";
  } else if (input.closesCenters && !input.allDay) {
    errors["closesCenters"] = "Un cierre del centro afecta al día completo: marca «Todo el día».";
  }
  return done(errors, () => ({ title, date: date!, kind: input.kind, range, childIds, closesCenters: input.closesCenters }));
}

/* ---------------- Disponibilidad de los abuelos ---------------- */

export interface AvailabilityInput {
  kind: "recurrente" | "excepcion";
  /** "1".."7" para recurrente. */
  weekday: string;
  date: string;
  available: boolean;
  start: string;
  end: string;
  note: string;
}

export type AvailabilityValue = Pick<Availability, "kind" | "weekday" | "date" | "range" | "available" | "note">;

export function validateAvailability(
  input: AvailabilityInput,
  ctx: { existing: Availability[]; availabilityId: string | null },
): Validated<AvailabilityValue> {
  const errors: FieldErrors = {};
  const others = ctx.existing.filter((a) => a.id !== ctx.availabilityId);
  let weekday: Weekday | null = null;
  let date: ISODate | null = null;

  if (input.kind === "recurrente") {
    const n = Number(input.weekday);
    if (!Number.isInteger(n) || n < 1 || n > 7) errors["weekday"] = "Elige el día de la semana.";
    else {
      weekday = n as Weekday;
      if (others.some((a) => a.kind === "recurrente" && a.weekday === weekday)) {
        errors["weekday"] = `Ya hay disponibilidad habitual para ${weekdaysPhrase([weekday])}. Edítala en lugar de crear otra.`;
      }
    }
  } else if (input.kind === "excepcion") {
    date = checkDate(input.date, "la fecha", errors, "date");
    if (date && others.some((a) => a.kind === "excepcion" && a.date === date)) {
      errors["date"] = "Ya hay una excepción de disponibilidad ese día. Edítala en lugar de crear otra.";
    }
  } else {
    errors["kind"] = "Elige si es habitual o para un día concreto.";
  }

  const range = input.available ? checkRange(input.start, input.end, errors) : null;
  const note = checkText(input.note, "la nota", LIMITS.note, errors, "note", false);
  return done(errors, () => ({ kind: input.kind, weekday, date, range, available: input.available, note }));
}
