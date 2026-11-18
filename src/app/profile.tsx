import { familyRepository } from "@/data";
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { MemberRole } from "@/domain/types";

/**
 * Selector de perfil de la DEMO. No es autenticación: no hay credenciales,
 * sesiones ni control de acceso real. Solo cambia la vista mostrada.
 */
export type ProfileId = MemberRole;

export const PROFILE_MEMBER: Record<ProfileId, string> = {
  madre: "m-laura",
  padre: "m-javier",
  abuela: "m-carmen",
  abuelo: "m-antonio",
  admin: "m-admin",
};

export const PARENT_PROFILES: ProfileId[] = ["madre", "padre"];
export const GRANDPARENT_PROFILES: ProfileId[] = ["abuela", "abuelo"];

const STORAGE_KEY = "familiaconecta-demo-perfil";
const ALL: ProfileId[] = ["madre", "padre", "abuela", "abuelo", "admin"];

interface ProfileContextValue {
  profile: ProfileId | null;
  memberId: string | null;
  ready: boolean;
  setProfile: (p: ProfileId) => void;
  resetDemo: () => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [profile, setProfileState] = useState<ProfileId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && (ALL as string[]).includes(stored)) setProfileState(stored as ProfileId);
    } catch {
      /* almacenamiento no disponible: la demo funciona sin recordar el perfil */
    }
    setReady(true);
  }, []);

  const setProfile = useCallback((p: ProfileId) => {
    setProfileState(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* ignorado */
    }
  }, []);

  const resetDemo = useCallback(() => {
    familyRepository.reset();
    setProfileState(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignorado */
    }
    void queryClient.resetQueries();
  }, [queryClient]);

  const value = useMemo<ProfileContextValue>(
    () => ({ profile, memberId: profile ? PROFILE_MEMBER[profile] : null, ready, setProfile, resetDemo }),
    [profile, ready, setProfile, resetDemo],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile debe usarse dentro de ProfileProvider");
  return ctx;
}
