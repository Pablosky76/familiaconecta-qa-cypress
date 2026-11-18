import { Baby, Backpack, CircleHelp, House, School, UserCheck } from "lucide-react";

import { formatRange, formatTime } from "@/domain/dates";
import { segmentAt, type PlanSegment, type PlanSegmentKind } from "@/domain/schedule";
import type { Child } from "@/domain/types";
import { cn } from "@/lib/utils";

import { STATUS_META, StatusBadge } from "./status";

const KIND_ICON: Record<PlanSegmentKind, typeof School> = {
  centro: School,
  tarea: UserCheck,
  familia: House,
  cerrado: House,
  sin_planificar: CircleHelp,
};

interface Props {
  child: Child;
  segments: PlanSegment[];
  nowMinutes: number;
}

export function ChildPlanCard({ child, segments, nowMinutes }: Props) {
  const now = segmentAt(segments, nowMinutes);
  const ChildIcon = child.center.kind === "guarderia" ? Baby : Backpack;

  return (
    <article className="rounded-2xl border bg-card p-5 shadow-card" aria-labelledby={`plan-${child.id}`}>
      <header className="flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <ChildIcon aria-hidden="true" className="size-6" />
        </span>
        <div>
          <h3 id={`plan-${child.id}`} className="text-xl font-semibold">
            {child.name} <span className="font-sans text-base font-normal text-muted-foreground">· {child.age} años</span>
          </h3>
          <p className="text-muted-foreground">{child.center.name}</p>
        </div>
      </header>

      <div className="mt-4 rounded-xl bg-primary-soft p-3">
        <p className="text-sm font-bold uppercase tracking-wide text-secondary-foreground">
          Previsto a las {formatTime(nowMinutes)} (hora simulada)
        </p>
        <p className="mt-1 text-lg font-bold">{now?.label ?? "Sin planificación registrada"}</p>
      </div>

      <ol className="mt-4 space-y-2" aria-label={`Plan previsto de ${child.name} para el día`}>
        {segments.map((s, i) => {
          const Icon = KIND_ICON[s.kind];
          const isNow = s === now;
          const warn = s.kind === "sin_planificar" || (s.status !== null && s.status !== "confirmada");
          return (
            <li
              key={`${s.range.start}-${i}`}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2",
                isNow && "border-primary ring-2 ring-primary/30",
                warn && s.status && STATUS_META[s.status].edge,
                warn && "border-l-4",
              )}
            >
              <span className="w-28 shrink-0 font-bold tabular-nums">{formatRange(s.range)}</span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span>{s.label}</span>
                {isNow && <span className="sr-only">(franja actual prevista)</span>}
              </span>
              {s.status && s.status !== "confirmada" && <StatusBadge status={s.status} />}
            </li>
          );
        })}
      </ol>
    </article>
  );
}
