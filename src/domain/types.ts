/**
 * Domain model for FamiliaConecta. Pure types: no UI, no persistence.
 * Dates are ISO calendar dates ("YYYY-MM-DD") in the family's timezone;
 * times are minutes since local midnight. This avoids timezone drift in the prototype.
 */

export type ISODate = string;
export type ISODateTime = string;
export type Minutes = number;
/** ISO weekday: 1 = lunes … 7 = domingo. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TimeRange {
  start: Minutes;
  end: Minutes;
}

export type MemberRole = "madre" | "padre" | "abuela" | "abuelo" | "admin";

/**
 * Capability scope (future authorization). In this prototype it is descriptive only:
 * the profile selector does NOT enforce anything.
 */
export type PermissionScope =
  | "planificacion" // progenitores: gestionan turnos, agendas y responsabilidades
  | "solo_respuestas" // abuelos: consultan y responden a sus propias solicitudes
  | "administracion_tecnica"; // configuración, auditoría y copias; fuera de la planificación familiar

export interface Family {
  id: string;
  name: string;
  timezone: string;
  travelBufferMinutes: number;
  memberIds: string[];
  childIds: string[];
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  fullName: string;
  role: MemberRole;
  scope: PermissionScope;
  /** Desplazamiento configurable (minutos) entre trabajo/casa y los centros. */
  commuteMinutes: number;
}

export type CenterKind = "guarderia" | "colegio";

export interface Child {
  id: string;
  familyId: string;
  name: string;
  age: number;
  center: { name: string; kind: CenterKind; address: string };
}

export interface ShiftException {
  id: string;
  date: ISODate;
  /** null = turno cancelado ese día. */
  range: TimeRange | null;
  reason: string;
  registeredAt: ISODateTime;
}

export interface WorkShift {
  id: string;
  memberId: string;
  label: string;
  recurrence: { weekdays: Weekday[]; validFrom: ISODate; validTo: ISODate | null };
  range: TimeRange;
  exceptions: ShiftException[];
}

export interface SchoolSession {
  weekday: Weekday;
  range: TimeRange;
  label: string;
}

/** Excepción escolar puntual: otro horario o un día sin clase para un niño. */
export interface SchoolException {
  id: string;
  date: ISODate;
  /** null = ese día no hay clase. */
  range: TimeRange | null;
  reason: string;
  registeredAt: ISODateTime;
}

export interface SchoolSchedule {
  id: string;
  childId: string;
  sessions: SchoolSession[];
  exceptions: SchoolException[];
}

export interface Availability {
  id: string;
  memberId: string;
  kind: "recurrente" | "excepcion";
  /** Recurrente: día de la semana. */
  weekday: Weekday | null;
  /** Excepción: fecha concreta. */
  date: ISODate | null;
  /** null con available=false = no disponible en todo el día. */
  range: TimeRange | null;
  available: boolean;
  note: string;
}

export type EventKind = "festivo" | "escolar" | "familiar";

export interface FamilyEvent {
  id: string;
  familyId: string;
  date: ISODate;
  range: TimeRange | null;
  title: string;
  kind: EventKind;
  childIds: string[];
  /** Si es true, los centros de esos niños están cerrados ese día. */
  closesCenters: boolean;
}

export interface CareNeed {
  id: string;
  date: ISODate;
  childIds: string[];
  range: TimeRange;
  reason: string;
  /** En este bloque las necesidades vienen escritas en los datos ficticios. */
  source: "datos_demo";
}

export type CareTaskKind = "llevar" | "recoger" | "cuidar";

export interface CareTask {
  id: string;
  needId: string;
  date: ISODate;
  kind: CareTaskKind;
  childIds: string[];
  range: TimeRange;
  location: string;
  assigneeId: string | null;
  confirmation: {
    byMemberId: string;
    at: ISODateTime;
    via: "planificacion_progenitor" | "solicitud_aceptada";
  } | null;
  /** Revisión tras un cambio de horarios: la confirmación anterior se conserva. */
  review: { reason: string; flaggedAt: ISODateTime } | null;
  conflict: { reason: string } | null;
}

export type CareRequestStatus = "pendiente" | "aceptada" | "rechazada" | "superada";

export interface CareRequest {
  id: string;
  taskId: string;
  /** Solicitudes enviadas a la vez comparten lote: la primera aceptación válida gana. */
  batchId: string;
  recipientId: string;
  sentAt: ISODateTime;
  status: CareRequestStatus;
  respondedAt: ISODateTime | null;
  note: string | null;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  createdAt: ISODateTime;
  kind: "recordatorio" | "solicitud" | "cambio" | "confirmacion" | "rechazo";
  title: string;
  body: string;
  relatedTaskId: string | null;
  read: boolean;
}

export interface AuditEntry {
  id: string;
  at: ISODateTime;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
}
