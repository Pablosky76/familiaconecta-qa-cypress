import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useProfile, type ProfileId } from "@/app/profile";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  allow: ProfileId[];
  audience: string;
  children: (profile: ProfileId) => ReactNode;
}

/**
 * Filtro de VISTA para la demo. No es control de acceso: cualquiera puede elegir cualquier perfil.
 */
export function RequireProfile({ allow, audience, children }: Props) {
  const { profile, ready } = useProfile();

  if (!ready) {
    return (
      <div className="space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Cargando la demo…</span>
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (profile === null || !allow.includes(profile)) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border bg-card p-6 shadow-card">
        <h1 className="text-2xl font-semibold">
          {profile === null ? "Elige un perfil para continuar" : "Esta vista es para otro perfil"}
        </h1>
        <p className="text-muted-foreground">
          Esta pantalla está pensada para {audience}. Elegir perfil solo cambia la vista de la demostración; no
          es un inicio de sesión.
        </p>
        <Link to="/" className={buttonVariants()}>
          Ir al selector de perfil
        </Link>
      </div>
    );
  }

  return <>{children(profile)}</>;
}
