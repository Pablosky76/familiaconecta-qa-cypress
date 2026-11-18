import { Briefcase, CalendarDays, HeartHandshake, School, Sparkles } from "lucide-react";

import { EmptyState } from "@/components/app/Section";
import { TaskCard } from "@/components/app/TaskCard";
import type { FamilySnapshot } from "@/data";
import { formatDayLong, formatRange, weekDays, weekdayOf } from "@/domain/dates";
import { availabilityOnDate, closingEventFor, sessionsOnDate, shiftsOnDate, tasksOnDate } from "@/domain/schedule";
import type { ISODate } from "@/domain/types";
import { cn } from "@/lib/utils";

interface ScheduleLine {
  key: string;
  Icon: typeof Briefcase;
  who: string;
  text: string;
  time: string | null;
  note: string | null;
  tone: "normal" | "excepcion";
}

function scheduleLines(snap: FamilySnapshot, date: ISODate): ScheduleLine[] {
  const lines: ScheduleLine[] = [];
  const parents = snap.members.filter((m) => m.role === "madre" || m.role === "padre");
  const grandparents = snap.members.filter((m) => m.role === "abuela" || m.role === "abuelo");

  for (const p of parents) {
    for (const s of shiftsOnDate(snap.workShifts.filter((w) => w.memberId === p.id), date)) {
      lines.push({
        key: `${s.shiftId}-${date}`,
        Icon: Briefcase,
        who: p.name,
        text: s.label,
        time: formatRange(s.range),
        note: s.exceptionReason ? `Excepción: ${s.exceptionReason}` : null,
        tone: s.exceptionReason ? "excepcion" : "normal",
      });
    }
    const cancelled = snap.workShifts
      .filter((w) => w.memberId === p.id)
      .flatMap((w) => w.exceptions)
      .find((e) => e.date === date && e.range === null);
    if (cancelled) {
      lines.push({ key: cancelled.id, Icon: Briefcase, who: p.name, text: "Sin turno", time: null, note: `Excepción: ${cancelled.reason}`, tone: "excepcion" });
    }
  }

  for (const c of snap.children) {
    const closing = closingEventFor(snap.events, c.id, date);
    if (closing) {
      lines.push({ key: `${c.id}-${date}-cerrado`, Icon: School, who: c.name, text: "Centro cerrado", time: null, note: closing.title, tone: "excepcion" });
      continue;
    }
    for (const s of sessionsOnDate(snap.schoolSchedules, snap.events, c.id, date)) {
      lines.push({ key: `${c.id}-${date}-${s.range.start}`, Icon: School, who: c.name, text: s.label, time: formatRange(s.range), note: null, tone: "normal" });
    }
  }

  for (const e of snap.events.filter((x) => x.date === date && !x.closesCenters)) {
    lines.push({ key: e.id, Icon: Sparkles, who: "Evento", text: e.title, time: e.range ? formatRange(e.range) : null, note: null, tone: "normal" });
  }

  for (const g of grandparents) {
    const a = availabilityOnDate(snap.availability, g.id, date);
    if (!a) continue;
    lines.push({
      key: `${g.id}-${date}`,
      Icon: HeartHandshake,
      who: g.name,
      text: a.available && a.range ? "Disponible" : "No disponible",
      time: a.available && a.range ? formatRange(a.range) : null,
      note: a.isException ? a.note : null,
      tone: a.isException ? "excepcion" : "normal",
    });
  }
  return lines;
}

export function WeekView({ snap, start }: { snap: FamilySnapshot; start: ISODate }) {
  const days = weekDays(start);
  const cardProps = { members: snap.members, children: snap.children, requests: snap.careRequests };

  return (
    <ol className="space-y-5" aria-label="Días de la semana">
      {days.map((date) => {
        const isToday = date === snap.clock.today;
        const weekend = weekdayOf(date) >= 6;
        const lines = scheduleLines(snap, date);
        const tasks = tasksOnDate(snap.careTasks, date);
        const headingId = `dia-${date}`;
        return (
          <li key={date}>
            <section
              aria-labelledby={headingId}
              className={cn("rounded-2xl border bg-card p-4 shadow-card sm:p-5", isToday && "border-primary ring-2 ring-primary/25")}
            >
              <header className="mb-4 flex flex-wrap items-center gap-2">
                <CalendarDays aria-hidden="true" className="size-5 text-primary" />
                <h2 id={headingId} className="text-xl font-semibold">
                  {formatDayLong(date)}
                </h2>
                {isToday && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm font-bold text-primary-foreground">Hoy (simulado)</span>
                )}
              </header>

              {weekend && lines.length === 0 && tasks.length === 0 ? (
                <p className="text-muted-foreground">Fin de semana: sin turnos, clases ni tareas registradas.</p>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                  <div>
                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wide text-muted-foreground">Horarios</h3>
                    {lines.length === 0 ? (
                      <EmptyState>Sin horarios registrados.</EmptyState>
                    ) : (
                      <ul className="space-y-2">
                        {lines.map((l) => (
                          <li
                            key={l.key}
                            className={cn("flex gap-2.5 rounded-lg border px-3 py-2", l.tone === "excepcion" && "border-dashed border-pending/60 bg-pending-soft")}
                          >
                            <l.Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                            <span className="min-w-0">
                              <strong>{l.who}</strong> · {l.text}
                              {l.time && <span className="whitespace-nowrap font-bold tabular-nums"> · {l.time}</span>}
                              {l.note && <span className="block text-sm font-bold text-pending">{l.note}</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-wide text-muted-foreground">Tareas de cuidado</h3>
                    {tasks.length === 0 ? (
                      <EmptyState>Sin tareas de cuidado registradas para este día.</EmptyState>
                    ) : (
                      <div className="space-y-3">
                        {tasks.map((t) => (
                          <TaskCard key={t.id} task={t} {...cardProps} headingLevel="h4" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </li>
        );
      })}
    </ol>
  );
}
