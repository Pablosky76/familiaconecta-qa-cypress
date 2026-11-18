import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

interface Props {
  title: string;
  phase: string;
  items: string[];
}

/** Página informativa para funcionalidades de fases posteriores. No contiene controles que simulen funcionar. */
export function ComingSoon({ title, phase, items }: Props) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <span className="inline-flex items-center gap-2 rounded-full border border-pending/40 bg-pending-soft px-3 py-1 text-sm font-bold text-pending">
        <Construction aria-hidden="true" className="size-4" />
        Próximamente · {phase}
      </span>
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      <p className="text-lg text-muted-foreground">
        Esta sección todavía no está disponible en el prototipo. Cuando llegue, permitirá:
      </p>
      <ul className="list-disc space-y-2 pl-6">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
      <Link to="/calendario" className={buttonVariants({ variant: "outline" })}>
        Ver el calendario semanal
      </Link>
    </div>
  );
}
