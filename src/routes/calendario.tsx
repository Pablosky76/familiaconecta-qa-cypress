import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Info, RotateCcw } from "lucide-react";

import { GRANDPARENT_PROFILES, PARENT_PROFILES } from "@/app/profile";
import { RequireProfile } from "@/components/app/RequireProfile";
import { PageHeader } from "@/components/app/Section";
import { STATUS_META, StatusBadge } from "@/components/app/status";
import { WeekView } from "@/components/calendar/WeekView";
import { StatusCounts } from "@/components/home/ParentHome";
import { buttonVariants } from "@/components/ui/button";
import { familySnapshotQuery } from "@/data";
import { countByStatus, type TaskStatus } from "@/domain/care";
import { addDays, formatWeekRange, isISODate, weekStart } from "@/domain/dates";

export const Route = createFileRoute("/calendario")({
  validateSearch: (search: Record<string, unknown>): { semana?: string } => {
    const s = search["semana"];
    return typeof s === "string" && isISODate(s) ? { semana: weekStart(s) } : {};
  },
  head: () => ({
    meta: [
      { title: "Calendario semanal · FamiliaConecta (demo)" },
      { name: "description", content: "Turnos, horarios escolares, disponibilidad y tareas de cuidado de la semana." },
      { property: "og:title", content: "Calendario semanal · FamiliaConecta (demo)" },
      { property: "og:description", content: "Vista semanal de la planificación familiar con datos ficticios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(familySnapshotQuery),
  component: CalendarioPage,
});

const LEGEND: TaskStatus[] = ["sin_asignar", "pendiente", "confirmada", "requiere_atencion"];

function CalendarioPage() {
  const { data } = useSuspenseQuery(familySnapshotQuery);
  const { semana } = Route.useSearch();
  const start = semana ?? weekStart(data.clock.today);
  const prev = addDays(start, -7);
  const next = addDays(start, 7);
  const isDemoWeek = start === data.clock.demoWeekStart;
  const end = addDays(start, 6);
  const weekTasks = data.careTasks.filter((t) => t.date >= start && t.date <= end);

  return (
    <RequireProfile allow={[...PARENT_PROFILES, ...GRANDPARENT_PROFILES]} audience="la familia (madre, padre, abuela o abuelo)">
      {(profile) => (
        <div className="space-y-6">
          <PageHeader title="Calendario semanal" subtitle={formatWeekRange(start)}>
            {GRANDPARENT_PROFILES.includes(profile) && (
              <p className="text-muted-foreground">Vista de consulta: la planificación la gestionan los progenitores.</p>
            )}
          </PageHeader>

          <nav aria-label="Cambiar de semana" className="flex flex-wrap gap-2">
            <Link to="/calendario" search={{ semana: prev }} className={buttonVariants({ variant: "outline" })}>
              <ChevronLeft aria-hidden="true" />
              Semana anterior
            </Link>
            {!isDemoWeek && (
              <Link to="/calendario" search={{}} className={buttonVariants({ variant: "secondary" })}>
                <RotateCcw aria-hidden="true" />
                Volver a la semana de demo
              </Link>
            )}
            <Link to="/calendario" search={{ semana: next }} className={buttonVariants({ variant: "outline" })}>
              Semana siguiente
              <ChevronRight aria-hidden="true" />
            </Link>
          </nav>

          <details className="rounded-xl border bg-card p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-bold">Leyenda de estados</summary>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {LEGEND.map((s) => (
                <li key={s} className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={s} />
                  <span className="text-muted-foreground">{STATUS_META[s].description}</span>
                </li>
              ))}
            </ul>
          </details>

          {isDemoWeek ? (
            <div className="space-y-2">
              <p className="font-bold">Tareas de esta semana</p>
              <StatusCounts counts={countByStatus(weekTasks, data.careRequests)} />
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-dashed bg-muted p-4">
              <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                Esta semana muestra los turnos recurrentes, excepciones, horarios escolares y eventos. Las tareas de
                cuidado de ejemplo solo existen en la semana de demostración (16–22 de noviembre); la detección
                automática de necesidades llegará en una fase posterior.
              </span>
            </p>
          )}

          <WeekView snap={data} start={start} />
        </div>
      )}
    </RequireProfile>
  );
}
