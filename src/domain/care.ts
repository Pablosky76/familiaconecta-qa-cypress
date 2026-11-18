import type { CareRequest, CareTask } from "./types";

/** Estado visible de una tarea de cuidado. */
export type TaskStatus = "sin_asignar" | "pendiente" | "confirmada" | "requiere_atencion";

export function requestsForTask(task: CareTask, requests: CareRequest[]): CareRequest[] {
  return requests.filter((r) => r.taskId === task.id);
}

/**
 * Deriva el estado de una tarea.
 * - Un conflicto o una revisión por cambio de horarios => requiere atención
 *   (la confirmación anterior se conserva en la tarea, no se borra).
 * - Solo una confirmación registrada cuenta como cobertura.
 * - Una solicitud pendiente NUNCA es cobertura confirmada.
 */
export function deriveTaskStatus(task: CareTask, requests: CareRequest[]): TaskStatus {
  if (task.conflict !== null || task.review !== null) return "requiere_atencion";
  if (task.assigneeId !== null && task.confirmation !== null) return "confirmada";
  const responses = requestsForTask(task, requests);
  if (responses.some((r) => r.status === "pendiente")) return "pendiente";
  if (responses.some((r) => r.status === "rechazada")) return "requiere_atencion";
  return "sin_asignar";
}

/** Cobertura confirmada: alguien confirmado y sin conflicto abierto. */
export function hasConfirmedCoverage(task: CareTask): boolean {
  return task.assigneeId !== null && task.confirmation !== null && task.conflict === null && task.review === null;
}

/**
 * Regla de exclusividad para lotes de solicitudes simultáneas:
 * como mucho una solicitud aceptada por lote; el resto queda "superada" o "rechazada".
 * Devuelve true si el lote respeta la regla.
 */
export function batchHasSingleWinner(batch: CareRequest[]): boolean {
  const accepted = batch.filter((r) => r.status === "aceptada").length;
  if (accepted > 1) return false;
  if (accepted === 1) return batch.every((r) => r.status !== "pendiente");
  return !batch.some((r) => r.status === "superada");
}

export function countByStatus(
  tasks: CareTask[],
  requests: CareRequest[],
): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = {
    sin_asignar: 0,
    pendiente: 0,
    confirmada: 0,
    requiere_atencion: 0,
  };
  for (const t of tasks) counts[deriveTaskStatus(t, requests)] += 1;
  return counts;
}
