import { Clock, MapPin, UserCheck, UserRound, Users } from "lucide-react";

import { deriveTaskStatus, requestsForTask } from "@/domain/care";
import { formatDateTime, formatDayLong, formatRange } from "@/domain/dates";
import type { CareRequest, CareTask, Child, FamilyMember } from "@/domain/types";
import { joinNames, memberLabel, taskTitle } from "@/lib/format";
import { cn } from "@/lib/utils";

import { REQUEST_META, STATUS_META, StatusBadge } from "./status";

interface TaskCardProps {
  task: CareTask;
  members: FamilyMember[];
  children: Child[];
  requests: CareRequest[];
  showDate?: boolean;
  compact?: boolean;
  headingLevel?: "h3" | "h4";
}

export function TaskCard({
  task,
  members,
  children,
  requests,
  showDate = false,
  compact = false,
  headingLevel = "h3",
}: TaskCardProps) {
  const status = deriveTaskStatus(task, requests);
  const meta = STATUS_META[status];
  const taskRequests = requestsForTask(task, requests);
  const pending = taskRequests.filter((r) => r.status === "pendiente");
  const assignee = members.find((m) => m.id === task.assigneeId);
  const Heading = headingLevel;

  return (
    <article
      className={cn(
        "rounded-xl border border-l-[6px] bg-card p-4 text-card-foreground shadow-card",
        meta.edge,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={status} />
        <span className="inline-flex flex-wrap items-center gap-1.5 font-bold tabular-nums">
          <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
          {showDate && <span className="font-normal text-muted-foreground">{formatDayLong(task.date)} ·</span>}
          <span className="whitespace-nowrap">{formatRange(task.range)}</span>
        </span>
      </div>

      <Heading className="mt-3 font-sans text-lg font-bold">{taskTitle(task, children)}</Heading>
      <p className="mt-1 flex items-start gap-1.5 text-muted-foreground">
        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {task.location}
      </p>

      <div className="mt-3 space-y-2 text-[0.95rem]">
        {status === "confirmada" && assignee && (
          <p className="flex items-start gap-1.5">
            <UserCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-confirmed" />
            <span>
              <strong>{memberLabel(assignee)}</strong>
              {task.confirmation?.via === "solicitud_aceptada"
                ? ` aceptó la solicitud (${formatDateTime(task.confirmation.at)}).`
                : " lo tiene en su planificación."}
            </span>
          </p>
        )}

        {status === "pendiente" && (
          <p className="flex items-start gap-1.5">
            <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-pending" />
            <span>
              Solicitud para{" "}
              <strong>{joinNames(pending.map((r) => members.find((m) => m.id === r.recipientId)?.name ?? "—"))}</strong>.
              Sin respuesta: <strong>todavía no está cubierta</strong>.
            </span>
          </p>
        )}

        {status === "sin_asignar" && (
          <p className="flex items-start gap-1.5">
            <UserRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-unassigned" />
            <span>Nadie asignado y sin solicitudes enviadas.</span>
          </p>
        )}

        {status === "requiere_atencion" && (
          <>
            <p className="rounded-lg bg-attention-soft p-3 text-foreground">
              <strong className="text-attention">{task.conflict ? "Conflicto: " : "Revisión: "}</strong>
              {task.conflict?.reason ?? task.review?.reason ?? "Las solicitudes han sido rechazadas; los padres deben revisar quién puede ayudar."}
            </p>
            {task.confirmation && assignee && (
              <p className="flex items-start gap-1.5">
                <UserCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-confirmed" />
                <span>
                  Confirmación anterior conservada: <strong>{memberLabel(assignee)}</strong>.
                </span>
              </p>
            )}
          </>
        )}

        {!compact && taskRequests.length > 0 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-sm text-muted-foreground" aria-label="Respuestas a la solicitud">
            {taskRequests.map((r) => {
              const rm = REQUEST_META[r.status];
              return (
                <li key={r.id} className="inline-flex items-center gap-1">
                  <rm.Icon aria-hidden="true" className="size-3.5" />
                  {members.find((m) => m.id === r.recipientId)?.name}: {rm.label.toLowerCase()}
                  {r.note ? ` (${r.note.toLowerCase()})` : ""}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}
