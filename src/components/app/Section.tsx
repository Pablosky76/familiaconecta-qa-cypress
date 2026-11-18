import type { ReactNode } from "react";

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Section({ id, title, description, action, children }: SectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-2xl font-semibold">
            {title}
          </h2>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="space-y-2">
      <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
      {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
      {children}
    </header>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed bg-muted/60 p-4 text-muted-foreground">{children}</p>;
}
