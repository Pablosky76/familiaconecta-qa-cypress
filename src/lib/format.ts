import type { CareTask, CareTaskKind, Child, FamilyMember, MemberRole } from "@/domain/types";

export const ROLE_LABEL: Record<MemberRole, string> = {
  madre: "Madre",
  padre: "Padre",
  abuela: "Abuela",
  abuelo: "Abuelo",
  admin: "Administración técnica",
};

const KIND_VERB: Record<CareTaskKind, string> = {
  llevar: "Llevar",
  recoger: "Recoger",
  cuidar: "Cuidar",
};

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

export function childNames(ids: string[], children: Child[]): string {
  return joinNames(ids.map((id) => children.find((c) => c.id === id)?.name ?? "—"));
}

export function taskTitle(task: CareTask, children: Child[]): string {
  return `${KIND_VERB[task.kind]} a ${childNames(task.childIds, children)}`;
}

export function memberLabel(m: FamilyMember | undefined): string {
  if (!m) return "—";
  return m.role === "admin" ? m.fullName : `${m.name} (${ROLE_LABEL[m.role].toLowerCase()})`;
}
