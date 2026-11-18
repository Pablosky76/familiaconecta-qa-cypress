import { ChildrenTimeline } from "@/components/timeline/ChildrenTimeline";
import { Link } from "@tanstack/react-router";
import { Briefcase, CalendarDays, TriangleAlert } from "lucide-react";

import { EmptyState, PageHeader, Section } from "@/components/app/Section";
import { STATUS_META } from "@/components/app/status";
import { TaskCard } from "@/components/app/TaskCard";
import { buttonVariants } from "@/components/ui/button";
import type { FamilySnapshot } from "@/data";
import { countByStatus, deriveTaskStatus, type TaskStatus } from "@/domain/care";
import { addDays, formatDayFull, formatRange, formatTime, weekStart } from "@/domain/dates";
import { shiftsOnDate, tasksOnDate } from "@/domain/schedule";

import { NotificationList } from "./Notifications";

const STATUS_ORDER: TaskStatus[] = ["requiere_atencion", "sin_asignar", "pendiente", "confirmada"];

export function ParentHome({ snap, memberId }: { snap: FamilySnapshot; memberId: string }) {
  const { clock, members, children, careTasks, careRequests } = snap;
  const today = clock.today;
  const me = members.find((m) => m.id === memberId);
  const parents = members.filter((m) => m.role === "madre" || m.role === "padre");
  const todays = tasksOnDate(careTasks, today);
  const ws = weekStart(today);
  const we = addDays(ws, 6);
  const weekTasks = careTasks
    .filter((t) => t.date >= ws && t.date <= we)
    .sort((a, b) => (a.date + a.range.start).localeCompare(b.date + b.range.start));
  const attention = weekTasks.filter((t) => deriveTaskStatus(t, careRequests) === "requiere_atencion");
  const mine = todays.filter((t) => t.assigneeId === memberId);
  const todayCounts = countByStatus(todays, careRequests);
  const weekCounts = countByStatus(weekTasks.filter((t) => t.date >= today), careRequests);
  const myNotifications = snap.notifications.filter((n) => n.recipientId === memberId);
  const cardProps = { members, children, requests: careRequests };

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Hola, ${me?.name ?? ""}`}
        subtitle={`${formatDayFull(today)} · hora simulada ${formatTime(clock.nowMinutes)}`}
      />

      <ChildrenTimeline snap={snap} />

      {attention.length > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-attention/50 bg-attention-soft p-4">
          <TriangleAlert aria-hidden="true" className="size-6 shrink-0 text-attention" />
          <p className="flex-1 font-bold">
            {attention.length === 1 ? "1 tarea requiere" : `${attention.length} tareas requieren`} atención esta semana.
          </p>
          <a href="#atencion" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Ver detalles
          </a>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Section id="resumen" title="Resumen del día">
          <div className="space-y-4 rounded-2xl border bg-card p-5 shadow-card">
            <ul className="space-y-3" aria-label="Turnos de hoy">
              {parents.map((p) => {
                const shifts = shiftsOnDate(snap.workShifts.filter((s) => s.memberId === p.id), today);
                return (
                  <li key={p.id} className="flex items-start gap-3">
                    <Briefcase aria-hidden="true" className="mt-1 size-5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-bold">{p.name}</p>
                      {shifts.length === 0 ? (
                        <p className="text-muted-foreground">Sin turno hoy</p>
                      ) : (
                        shifts.map((s) => (
                          <p key={s.shiftId} className="text-muted-foreground">
                            {s.label} {formatRange(s.range)} · llega a casa hacia las{" "}
                            {formatTime(s.range.end + p.commuteMinutes)} ({p.commuteMinutes} min de desplazamiento)
                          </p>
                        ))
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t pt-4">
              <p className="mb-2 font-bold">Tareas de cuidado de hoy</p>
              <StatusCounts counts={todayCounts} />
            </div>
            <div className="border-t pt-4">
              <p className="mb-2 font-bold">Resto de la semana (desde hoy)</p>
              <StatusCounts counts={weekCounts} />
            </div>
          </div>
        </Section>

        <Section id="mias" title="Tus responsabilidades hoy">
          {mine.length === 0 ? (
            <EmptyState>Hoy no tienes tareas de cuidado asignadas.</EmptyState>
          ) : (
            <div className="space-y-3">
              {mine.map((t) => (
                <TaskCard key={t.id} task={t} {...cardProps} compact />
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section
        id="atencion"
        title="Requiere atención"
        description="Conflictos y cambios de horario de esta semana."
        action={
          <Link to="/calendario" className={buttonVariants({ variant: "outline" })}>
            <CalendarDays aria-hidden="true" />
            Ver semana
          </Link>
        }
      >
        {attention.length === 0 ? (
          <EmptyState>No hay conflictos esta semana.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {attention.map((t) => (
              <TaskCard key={t.id} task={t} {...cardProps} showDate />
            ))}
          </div>
        )}
      </Section>

      <Section id="hoy" title="Todas las tareas de hoy">
        <div className="grid gap-4 md:grid-cols-2">
          {todays.map((t) => (
            <TaskCard key={t.id} task={t} {...cardProps} />
          ))}
        </div>
      </Section>

      <Section id="avisos" title="Avisos" description="Ejemplos de recordatorios y avisos. No se envía nada.">
        <NotificationListWrapper items={myNotifications} />
      </Section>
    </div>
  );
}

function NotificationListWrapper({ items }: { items: FamilySnapshot["notifications"] }) {
  return items.length === 0 ? <EmptyState>No hay avisos.</EmptyState> : <NotificationList items={items} />;
}

export function StatusCounts({ counts }: { counts: Record<TaskStatus, number> }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {STATUS_ORDER.map((s) => {
        const meta = STATUS_META[s];
        return (
          <li key={s} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold ${meta.badge}`}>
            <meta.Icon aria-hidden="true" className="size-4" />
            {meta.label}: {counts[s]}
          </li>
        );
      })}
    </ul>
  );
}
