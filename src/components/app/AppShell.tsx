import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  FlaskConical,
  House,
  Moon,
  Settings2,
  Sun,
  UserRoundCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { PARENT_PROFILES, useProfile, type ProfileId } from "@/app/profile";
import { useTheme } from "@/app/theme";
import { ROLE_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

type NavPath = "/" | "/inicio" | "/calendario" | "/horarios" | "/solicitudes" | "/admin";

interface NavItem {
  to: NavPath;
  label: string;
  Icon: LucideIcon;
  soon?: boolean;
}

function navFor(profile: ProfileId | null): NavItem[] {
  if (profile === null) return [{ to: "/", label: "Elegir perfil", Icon: Users }];
  if (profile === "admin") {
    return [
      { to: "/admin", label: "Administración", Icon: Settings2 },
      { to: "/", label: "Perfiles", Icon: Users },
    ];
  }
  const base: NavItem[] = [
    { to: "/inicio", label: "Inicio", Icon: House },
    { to: "/calendario", label: "Calendario", Icon: CalendarDays },
  ];
  if (PARENT_PROFILES.includes(profile)) {
    base.push({ to: "/horarios", label: "Horarios", Icon: Settings2 });
  }
  if (PARENT_PROFILES.includes(profile)) {
    base.push({ to: "/solicitudes", label: "Pedir ayuda", Icon: ClipboardList });
  }
  return base;
}

const NAMES: Record<ProfileId, string> = {
  madre: "Laura",
  padre: "Javier",
  abuela: "Carmen",
  abuelo: "Antonio",
  admin: "Soporte",
};

export function DemoBadge() {
  return (
    <span className="demo-stripes inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-demo px-3 py-1 text-sm font-bold text-demo-foreground">
      <FlaskConical aria-hidden="true" className="size-4" />
      DEMO · datos ficticios
    </span>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Activar modo claro" : "Activar modo oscuro"}
      className="touch-target grid place-items-center rounded-lg border bg-card text-foreground hover:bg-primary-soft"
    >
      {dark ? <Sun aria-hidden="true" className="size-5" /> : <Moon aria-hidden="true" className="size-5" />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, ready } = useProfile();
  const items = ready ? navFor(profile) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
          <Link to="/" className="touch-target flex items-center gap-2 rounded-lg pr-2" aria-label="FamiliaConecta, elegir perfil">
            <span className="grid size-9 place-items-center rounded-lg bg-primary font-display text-lg font-semibold text-primary-foreground">
              F
            </span>
            <span className="hidden font-display text-xl font-semibold sm:inline">FamiliaConecta</span>
          </Link>
          <DemoBadge />
          <div className="ml-auto flex items-center gap-2">
            {ready && profile && (
              <Link
                to="/"
                className="touch-target inline-flex items-center gap-2 rounded-lg border bg-card px-3 text-sm font-bold hover:bg-primary-soft"
              >
                <UserRoundCog aria-hidden="true" className="size-5" />
                <span className="hidden sm:inline">
                  {NAMES[profile]} · {ROLE_LABEL[profile]}
                </span>
                <span className="sr-only sm:hidden">Perfil {NAMES[profile]}. </span>
                <span className="sr-only">Cambiar perfil</span>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
        <p className="border-t bg-accent px-4 py-1.5 text-center text-sm text-accent-foreground">
          <strong>Prototipo de demostración.</strong> El selector de perfil no es un inicio de sesión ni
          protege nada; la información es ficticia y puede reiniciarse.
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4 sm:px-6">
        {items.length > 0 && (
          <nav aria-label="Navegación principal" className="hidden w-56 shrink-0 py-8 lg:block">
            <ul className="sticky top-28 space-y-1">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink item={item} variant="side" />
                </li>
              ))}
            </ul>
          </nav>
        )}
        <main id="contenido" tabIndex={-1} className="min-w-0 flex-1 py-6 pb-28 outline-none sm:py-8 lg:pb-12">
          {children}
        </main>
      </div>

      {items.length > 0 && (
        <nav
          aria-label="Navegación principal (móvil)"
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 backdrop-blur lg:hidden"
        >
          <ul className="mx-auto flex max-w-xl justify-around px-1 pb-[env(safe-area-inset-bottom)]">
            {items.map((item) => (
              <li key={item.to} className="flex-1">
                <NavLink item={item} variant="bottom" />
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

function NavLink({ item, variant }: { item: NavItem; variant: "side" | "bottom" }) {
  const { Icon } = item;
  return (
    <Link
      to={item.to}
      activeOptions={{ exact: true }}
      className={cn(
        "group rounded-lg font-bold text-muted-foreground hover:bg-primary-soft hover:text-foreground data-[status=active]:bg-primary-soft data-[status=active]:text-foreground",
        variant === "side"
          ? "flex min-h-11 items-center gap-3 px-3"
          : "flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-xs",
      )}
    >
      <Icon aria-hidden="true" className="size-5 shrink-0 group-data-[status=active]:text-primary" />
      <span>{item.label}</span>
      {item.soon && (
        <span
          className={cn(
            "rounded-full bg-muted px-1.5 text-[0.7rem] font-bold text-muted-foreground",
            variant === "side" && "ml-auto",
          )}
        >
          Pronto
        </span>
      )}
    </Link>
  );
}
