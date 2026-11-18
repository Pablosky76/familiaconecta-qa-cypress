import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Construction, DatabaseBackup, ScrollText, Settings2, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { RequireProfile } from "@/components/app/RequireProfile";
import { PageHeader } from "@/components/app/Section";
import { familySnapshotQuery } from "@/data";
import { formatDateTime } from "@/domain/dates";
import { memberLabel, ROLE_LABEL } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administración técnica (vista futura) · FamiliaConecta" },
      { name: "description", content: "Vista previa de la futura administración: configuración, auditoría y copias." },
      { property: "og:title", content: "Administración técnica (vista futura) · FamiliaConecta" },
      { property: "og:description", content: "Vista previa no funcional de la administración técnica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(familySnapshotQuery),
  component: AdminPage,
});

const ROLE_PERMS = [
  { role: "Madre y padre", perms: "Gestionan sus turnos, excepciones, agendas escolares y responsabilidades." },
  { role: "Abuela y abuelo", perms: "Consultan y aceptan o rechazan sus propias solicitudes. No editan la planificación." },
  { role: "Administración técnica", perms: "Configuración, auditoría y copias. Sin acceso a decisiones familiares." },
];

function Panel({ icon, title, soon, children }: { icon: ReactNode; title: string; soon?: boolean; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-card" aria-label={title}>
      <div className="flex flex-wrap items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
        {soon && (
          <span className="rounded-full bg-pending-soft px-2.5 py-0.5 text-sm font-bold text-pending">Próximamente</span>
        )}
      </div>
      {children}
    </section>
  );
}

function AdminPage() {
  const { data } = useSuspenseQuery(familySnapshotQuery);
  const family = data.members.filter((m) => m.role !== "admin");

  return (
    <RequireProfile allow={["admin"]} audience="la administración técnica">
      {() => (
        <div className="space-y-6">
          <div className="demo-stripes flex items-start gap-3 rounded-2xl bg-demo p-4 text-demo-foreground">
            <Construction aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
            <p>
              <strong>Vista futura · solo lectura.</strong> Muestra qué incluirá la administración técnica. Nada de esta
              pantalla funciona ni ofrece seguridad real: no hay permisos aplicados, copias ni auditoría verdadera.
            </p>
          </div>

          <PageHeader title="Administración técnica" subtitle="Separada de la planificación familiar." />

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel icon={<ShieldCheck aria-hidden="true" className="size-5 text-primary" />} title="Funciones previstas por rol">
              <dl className="space-y-3">
                {ROLE_PERMS.map((r) => (
                  <div key={r.role}>
                    <dt className="font-bold">{r.role}</dt>
                    <dd className="text-muted-foreground">{r.perms}</dd>
                  </div>
                ))}
              </dl>
            </Panel>

            <Panel icon={<Settings2 aria-hidden="true" className="size-5 text-primary" />} title="Desplazamientos configurados">
              <table className="w-full text-left">
                <caption className="sr-only">Minutos de desplazamiento por persona (datos ficticios)</caption>
                <thead className="text-sm text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-1 font-bold">Persona</th>
                    <th scope="col" className="py-1 font-bold">Rol</th>
                    <th scope="col" className="py-1 text-right font-bold">Minutos</th>
                  </tr>
                </thead>
                <tbody>
                  {family.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="py-2">{m.fullName}</td>
                      <td className="py-2 text-muted-foreground">{ROLE_LABEL[m.role]}</td>
                      <td className="py-2 text-right tabular-nums">{m.commuteMinutes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm text-muted-foreground">Editar estos valores llegará en una fase posterior.</p>
            </Panel>
          </div>

          <Panel icon={<ScrollText aria-hidden="true" className="size-5 text-primary" />} title="Registro de auditoría (ejemplo ficticio)">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left">
                <caption className="sr-only">Entradas de auditoría de ejemplo</caption>
                <thead className="text-sm text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-1 pr-3 font-bold">Fecha</th>
                    <th scope="col" className="py-1 pr-3 font-bold">Quién</th>
                    <th scope="col" className="py-1 pr-3 font-bold">Acción</th>
                    <th scope="col" className="py-1 font-bold">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {data.auditEntries.map((a) => (
                    <tr key={a.id} className="border-t align-top">
                      <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{formatDateTime(a.at)}</td>
                      <td className="py-2 pr-3">
                        {a.actorId === "sistema" ? "Sistema" : memberLabel(data.members.find((m) => m.id === a.actorId))}
                      </td>
                      <td className="py-2 pr-3 font-mono text-sm">{a.action}</td>
                      <td className="py-2">{a.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel icon={<DatabaseBackup aria-hidden="true" className="size-5 text-primary" />} title="Copias de seguridad" soon>
              <p className="text-muted-foreground">
                Copias periódicas restaurables de la planificación familiar. En este prototipo no se guarda nada, así que
                no hay copias.
              </p>
            </Panel>
            <Panel icon={<Settings2 aria-hidden="true" className="size-5 text-primary" />} title="Recordatorios" soon>
              <p className="text-muted-foreground">
                Configuración de cuándo y cómo se avisa a cada persona. Los avisos que ves en la demo son ejemplos.
              </p>
            </Panel>
          </div>
        </div>
      )}
    </RequireProfile>
  );
}
