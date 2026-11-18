import { Info } from "lucide-react";

/** Aclara que la situación mostrada es planificación prevista, no localización. */
export function PlannedNotice() {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-dashed bg-muted p-3 text-[0.95rem] text-muted-foreground">
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
      <span>
        <strong className="text-foreground">Situación prevista según la planificación.</strong> No es
        ubicación en tiempo real: FamiliaConecta no localiza a ninguna persona.
      </span>
    </p>
  );
}
