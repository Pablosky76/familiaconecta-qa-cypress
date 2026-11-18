import {
  CircleCheck,
  CircleDashed,
  CircleSlash,
  CircleX,
  Hourglass,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import type { TaskStatus } from "@/domain/care";
import type { CareRequestStatus } from "@/domain/types";
import { cn } from "@/lib/utils";

interface StatusMeta {
  label: string;
  description: string;
  Icon: LucideIcon;
  badge: string;
  edge: string;
}

export const STATUS_META: Record<TaskStatus, StatusMeta> = {
  sin_asignar: {
    label: "Sin asignar",
    description: "Nadie se ha hecho cargo todavía.",
    Icon: CircleDashed,
    badge: "bg-unassigned-soft text-unassigned border-unassigned/40",
    edge: "border-l-unassigned",
  },
  pendiente: {
    label: "Pendiente",
    description: "Solicitud enviada sin respuesta. Aún no es cobertura.",
    Icon: Hourglass,
    badge: "bg-pending-soft text-pending border-pending/40",
    edge: "border-l-pending",
  },
  confirmada: {
    label: "Confirmada",
    description: "Una persona ha confirmado que se encarga.",
    Icon: CircleCheck,
    badge: "bg-confirmed-soft text-confirmed border-confirmed/40",
    edge: "border-l-confirmed",
  },
  requiere_atencion: {
    label: "Requiere atención",
    description: "Hay un conflicto o un cambio que revisar.",
    Icon: TriangleAlert,
    badge: "bg-attention-soft text-attention border-attention/40",
    edge: "border-l-attention",
  },
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold",
        meta.badge,
        className,
      )}
    >
      <meta.Icon aria-hidden="true" className="size-4 shrink-0" />
      {meta.label}
    </span>
  );
}

export const REQUEST_META: Record<CareRequestStatus, { label: string; Icon: LucideIcon; badge: string }> = {
  pendiente: { label: "Pendiente de respuesta", Icon: Hourglass, badge: STATUS_META.pendiente.badge },
  aceptada: { label: "Aceptada", Icon: CircleCheck, badge: STATUS_META.confirmada.badge },
  rechazada: { label: "Rechazada", Icon: CircleX, badge: STATUS_META.sin_asignar.badge },
  superada: { label: "Cubierta por otra persona", Icon: CircleSlash, badge: STATUS_META.sin_asignar.badge },
};

export function RequestBadge({ status }: { status: CareRequestStatus }) {
  const meta = REQUEST_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-bold", meta.badge)}>
      <meta.Icon aria-hidden="true" className="size-4 shrink-0" />
      {meta.label}
    </span>
  );
}
