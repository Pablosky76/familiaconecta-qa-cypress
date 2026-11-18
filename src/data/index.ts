import { queryOptions } from "@tanstack/react-query";

import { createMockRepository } from "./mock/mockRepository";
import type { FamilyRepository } from "./repository";

export type { FamilySnapshot, FamilyRepository } from "./repository";

/** Punto único de sustitución: cambia esta línea por un repositorio real más adelante. */
export const familyRepository: FamilyRepository = createMockRepository();

export const familySnapshotQuery = queryOptions({
  queryKey: ["family-snapshot"],
  queryFn: () => familyRepository.getSnapshot(),
  staleTime: Infinity,
});
