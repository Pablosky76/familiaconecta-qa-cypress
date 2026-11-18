import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, RotateCcw, ShieldOff } from "lucide-react";

import { PROFILE_MEMBER, useProfile, type ProfileId } from "@/app/profile";
import { DemoBadge } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { familySnapshotQuery } from "@/data";
import { ROLE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Elegir perfil · FamiliaConecta (demo)" },
      { name: "description", content: "Elige con qué perfil ficticio quieres ver la demostración de FamiliaConecta." },
      { property: "og:title", content: "Elegir perfil · FamiliaConecta (demo)" },
      { property: "og:description", content: "Demostración con datos ficticios: madre, padre, abuela, abuelo o administración técnica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(familySnapshotQuery),
  component: ProfileSelector,
});

const ORDER: ProfileId[] = ["madre", "padre", "abuela", "abuelo", "admin"];

const PURPOSE: Record<ProfileId, string> = {
  madre: "Gestiona sus turnos, las agendas de los niños y las responsabilidades.",
  padre: "Gestiona sus turnos, las agendas de los niños y las responsabilidades.",
  abuela: "Consulta sus responsabilidades y sus propias solicitudes.",
  abuelo: "Consulta sus responsabilidades y sus propias solicitudes.",
  admin: "Configuración, auditoría y copias. Vista futura, separada de la familia.",
};

function ProfileSelector() {
  const { data } = useSuspenseQuery(familySnapshotQuery);
  const { profile, setProfile, resetDemo, ready } = useProfile();
  const navigate = useNavigate();

  const choose = (p: ProfileId) => {
    setProfile(p);
    void navigate({ to: p === "admin" ? "/admin" : "/inicio" });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <DemoBadge />
        <h1 className="text-3xl font-semibold sm:text-4xl">¿Con qué perfil quieres ver la demo?</h1>
        <p className="text-lg text-muted-foreground">{data.family.name} · familia ficticia</p>
      </header>

      <div className="flex items-start gap-3 rounded-2xl border border-attention/40 bg-attention-soft p-4">
        <ShieldOff aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-attention" />
        <div className="space-y-1">
          <p className="font-bold">Esto no es un inicio de sesión.</p>
          <p>
            Elegir un perfil solo cambia lo que ves. No hay contraseñas, cuentas ni seguridad real, y cualquier persona
            puede elegir cualquier perfil. Todos los datos son ficticios y la información puede reiniciarse en cualquier
            momento.
          </p>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Perfiles de la demo">
        {ORDER.map((p) => {
          const m = data.members.find((x) => x.id === PROFILE_MEMBER[p]);
          const selected = ready && profile === p;
          return (
            <li key={p} className={cn(p === "admin" && "sm:col-span-2")}>
              <button
                type="button"
                disabled={!ready}
                onClick={() => choose(p)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-24 w-full items-start gap-4 rounded-2xl border-2 bg-card p-4 text-left shadow-card transition-colors hover:border-primary",
                  selected ? "border-primary bg-primary-soft" : "border-border",
                  p === "admin" && "border-dashed",
                )}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-xl font-semibold text-primary">
                  {m?.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-bold">
                    {p === "admin" ? m?.fullName : m?.name}{" "}
                    <span className="font-normal text-muted-foreground">· {ROLE_LABEL[p]}</span>
                  </span>
                  <span className="block text-muted-foreground">{PURPOSE[p]}</span>
                </span>
                {selected && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                    <Check aria-hidden="true" className="size-4" /> Actual
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button variant="outline" onClick={resetDemo}>
          <RotateCcw aria-hidden="true" />
          Reiniciar demo
        </Button>
        <p className="text-muted-foreground">Quita el perfil elegido y vuelve a cargar los datos ficticios iniciales.</p>
      </div>
    </div>
  );
}
