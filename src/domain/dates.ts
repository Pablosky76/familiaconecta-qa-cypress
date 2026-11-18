import type { ISODate, Minutes, TimeRange, Weekday } from "./types";

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function toUTC(date: ISODate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function fromUTC(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function isISODate(value: string): boolean {
  if (!ISO_RE.test(value)) return false;
  return fromUTC(toUTC(value)) === value;
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = toUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

export function weekdayOf(date: ISODate): Weekday {
  const js = toUTC(date).getUTCDay(); // 0 = domingo
  return (js === 0 ? 7 : js) as Weekday;
}

/** Lunes de la semana que contiene la fecha. */
export function weekStart(date: ISODate): ISODate {
  return addDays(date, 1 - weekdayOf(date));
}

export function weekDays(start: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function toMinutes(hhmm: string): Minutes {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function range(start: string, end: string): TimeRange {
  return { start: toMinutes(start), end: toMinutes(end) };
}

export function formatTime(min: Minutes): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatRange(r: TimeRange): string {
  return `${formatTime(r.start)}–${formatTime(r.end)}`;
}

export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end;
}

export function containsRange(outer: TimeRange, inner: TimeRange): boolean {
  return outer.start <= inner.start && outer.end >= inner.end;
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("es-ES", { ...opts, timeZone: "UTC" });

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDayLong(date: ISODate): string {
  return capitalize(fmt({ weekday: "long", day: "numeric", month: "long" }).format(toUTC(date)));
}

export function formatDayFull(date: ISODate): string {
  return capitalize(
    fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(toUTC(date)),
  );
}

export function formatWeekdayShort(date: ISODate): string {
  return capitalize(fmt({ weekday: "short" }).format(toUTC(date)).replace(".", ""));
}

export function formatDayNumber(date: ISODate): string {
  return fmt({ day: "numeric", month: "short" }).format(toUTC(date)).replace(".", "");
}

export function formatWeekRange(start: ISODate): string {
  const end = addDays(start, 6);
  const s = toUTC(start);
  const e = toUTC(end);
  const sameMonth = s.getUTCMonth() === e.getUTCMonth();
  const startTxt = sameMonth
    ? fmt({ day: "numeric" }).format(s)
    : fmt({ day: "numeric", month: "long" }).format(s);
  return `${startTxt} – ${fmt({ day: "numeric", month: "long", year: "numeric" }).format(e)}`;
}

export function formatDateTime(iso: string): string {
  const [date, time] = iso.split("T");
  return `${formatDayNumber(date ?? "")} · ${(time ?? "").slice(0, 5)}`;
}

/** Nombre del día en minúscula (lunes … domingo). */
export const WEEKDAY_LABEL: Record<Weekday, string> = {
  1: "lunes",
  2: "martes",
  3: "miércoles",
  4: "jueves",
  5: "viernes",
  6: "sábado",
  7: "domingo",
};

export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** «los lunes, miércoles y viernes» */
export function weekdaysPhrase(days: Weekday[]): string {
  const names = [...days].sort((a, b) => a - b).map((d) => (d >= 6 ? `${WEEKDAY_LABEL[d]}s` : WEEKDAY_LABEL[d]));
  if (names.length <= 1) return `los ${names[0] ?? ""}`;
  return `los ${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}
