import type { CareInput, NewCareResult } from "@/domain/new-care";
import type { ResponseResult } from "@/domain/responses";
import type { PlanningChange, ChangeOutcome } from "@/domain/planning";
import type {
  AppNotification,
  AuditEntry,
  Availability,
  CareNeed,
  CareRequest,
  CareTask,
  Child,
  Family,
  FamilyEvent,
  FamilyMember,
  ISODate,
  Minutes,
  SchoolSchedule,
  WorkShift,
} from "@/domain/types";

/** Todo lo que la interfaz necesita leer en este bloque, en una sola instantánea. */
export interface FamilySnapshot {
  family: Family;
  members: FamilyMember[];
  children: Child[];
  workShifts: WorkShift[];
  schoolSchedules: SchoolSchedule[];
  availability: Availability[];
  events: FamilyEvent[];
  careNeeds: CareNeed[];
  careTasks: CareTask[];
  careRequests: CareRequest[];
  notifications: AppNotification[];
  auditEntries: AuditEntry[];
  /** Reloj de referencia. En la demo es fijo y simulado. */
  clock: { today: ISODate; nowMinutes: Minutes; simulated: boolean; demoWeekStart: ISODate };
}

/**
 * Contrato de acceso a datos. La implementación ficticia se sustituirá más adelante
 * por una real sin tocar el dominio ni la interfaz.
 */
export interface FamilyRepository {
  readonly kind: "mock" | "remote";
  getSnapshot(): Promise<FamilySnapshot>;
  applyChange(change: PlanningChange, memberId: string): Promise<ChangeOutcome>;
  respondToRequest(requestId: string, memberId: string, decision: "aceptar" | "rechazar"): Promise<ResponseResult>;
  createCareRequest(memberId: string, input: CareInput): Promise<NewCareResult>;
  setTravelBuffer(memberId: string, minutes: number): Promise<{ok:boolean; message:string}>;
  reset(): void;
}
