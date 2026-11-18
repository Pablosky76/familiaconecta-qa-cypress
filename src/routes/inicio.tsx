import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { GRANDPARENT_PROFILES, PARENT_PROFILES, PROFILE_MEMBER } from "@/app/profile";
import { RequireProfile } from "@/components/app/RequireProfile";
import { GrandparentHome } from "@/components/home/GrandparentHome";
import { ParentHome } from "@/components/home/ParentHome";
import { familySnapshotQuery } from "@/data";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Inicio · FamiliaConecta (demo)" },
      { name: "description", content: "Resumen del día: situación prevista de los niños, responsabilidades y conflictos." },
      { property: "og:title", content: "Inicio · FamiliaConecta (demo)" },
      { property: "og:description", content: "Resumen diario de cuidados con datos ficticios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(familySnapshotQuery),
  component: InicioPage,
});

function InicioPage() {
  const { data } = useSuspenseQuery(familySnapshotQuery);
  return (
    <RequireProfile allow={[...PARENT_PROFILES, ...GRANDPARENT_PROFILES]} audience="madre, padre, abuela o abuelo">
      {(profile) =>
        PARENT_PROFILES.includes(profile) ? (
          <ParentHome snap={data} memberId={PROFILE_MEMBER[profile]} />
        ) : (
          <GrandparentHome snap={data} memberId={PROFILE_MEMBER[profile]} />
        )
      }
    </RequireProfile>
  );
}
