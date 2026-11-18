/**
 * Datos FICTICIOS para el prototipo. Ninguna persona, centro o dirección es real.
 * Las necesidades y tareas de cuidado de la semana de demostración están escritas a mano:
 * el algoritmo de detección llegará en una fase posterior.
 */
import { range } from "@/domain/dates";
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
  SchoolSchedule,
  WorkShift,
} from "@/domain/types";

export const DEMO_TODAY = "2026-11-17"; // martes
export const DEMO_NOW = 13 * 60; // 13:00 (hora simulada)
export const DEMO_WEEK_START = "2026-11-16";

const FAMILY_ID = "f-garcia-ruiz";

export const family: Family = {
  id: FAMILY_ID,
  name: "Familia García Ruiz",
  timezone: "Europe/Madrid",
  travelBufferMinutes: 20,
  memberIds: ["m-laura", "m-javier", "m-carmen", "m-antonio"],
  childIds: ["c-lucia", "c-mateo"],
};

export const members: FamilyMember[] = [
  { id: "m-laura", familyId: FAMILY_ID, name: "Laura", fullName: "Laura Ruiz", role: "madre", scope: "planificacion", commuteMinutes: 25 },
  { id: "m-javier", familyId: FAMILY_ID, name: "Javier", fullName: "Javier García", role: "padre", scope: "planificacion", commuteMinutes: 20 },
  { id: "m-carmen", familyId: FAMILY_ID, name: "Carmen", fullName: "Carmen López", role: "abuela", scope: "solo_respuestas", commuteMinutes: 15 },
  { id: "m-antonio", familyId: FAMILY_ID, name: "Antonio", fullName: "Antonio García", role: "abuelo", scope: "solo_respuestas", commuteMinutes: 20 },
  { id: "m-admin", familyId: FAMILY_ID, name: "Soporte", fullName: "Administración técnica", role: "admin", scope: "administracion_tecnica", commuteMinutes: 0 },
];

export const children: Child[] = [
  { id: "c-lucia", familyId: FAMILY_ID, name: "Lucía", age: 6, center: { name: "CEIP Los Almendros", kind: "colegio", address: "C/ del Olmo 12 (ficticia)" } },
  { id: "c-mateo", familyId: FAMILY_ID, name: "Mateo", age: 2, center: { name: "Escuela infantil Pequeños Pasos", kind: "guarderia", address: "Av. del Parque 4 (ficticia)" } },
];

export const workShifts: WorkShift[] = [
  {
    id: "ws-laura-manana",
    memberId: "m-laura",
    label: "Turno de mañana",
    recurrence: { weekdays: [1, 3, 5], validFrom: "2026-09-01", validTo: null },
    range: range("07:00", "14:30"),
    exceptions: [],
  },
  {
    id: "ws-laura-tarde",
    memberId: "m-laura",
    label: "Turno de tarde",
    recurrence: { weekdays: [2, 4], validFrom: "2026-09-01", validTo: null },
    range: range("14:00", "21:30"),
    exceptions: [],
  },
  {
    id: "ws-javier",
    memberId: "m-javier",
    label: "Jornada de oficina",
    recurrence: { weekdays: [1, 2, 3, 4, 5], validFrom: "2026-09-01", validTo: null },
    range: range("09:30", "18:00"),
    exceptions: [
      {
        id: "ex-javier-1119",
        date: "2026-11-19",
        range: range("09:30", "20:00"),
        reason: "Reunión con cliente fuera de la oficina",
        registeredAt: "2026-11-16T10:12",
      },
      {
        id: "ex-javier-1224",
        date: "2026-12-24",
        range: null,
        reason: "Día libre",
        registeredAt: "2026-11-02T09:00",
      },
    ],
  },
];

export const schoolSchedules: SchoolSchedule[] = [
  {
    id: "ss-lucia",
    childId: "c-lucia",
    sessions: [
      { weekday: 1, range: range("09:00", "16:00"), label: "Jornada escolar" },
      { weekday: 2, range: range("09:00", "16:00"), label: "Jornada escolar" },
      { weekday: 3, range: range("09:00", "17:00"), label: "Jornada escolar + natación" },
      { weekday: 4, range: range("09:00", "16:00"), label: "Jornada escolar" },
      { weekday: 5, range: range("09:00", "14:00"), label: "Jornada reducida" },
    ],
    exceptions: [
      {
        id: "se-lucia-1222",
        date: "2026-12-22",
        range: range("09:00", "13:00"),
        reason: "Jornada intensiva antes de Navidad",
        registeredAt: "2026-11-10T18:00",
      },
    ],
  },
  {
    id: "ss-mateo",
    childId: "c-mateo",
    sessions: ([1, 2, 3, 4, 5] as const).map((weekday) => ({
      weekday,
      range: range("08:45", "15:30"),
      label: "Escuela infantil",
    })),
    exceptions: [],
  },
];

export const availability: Availability[] = [
  ...([1, 2, 3, 4] as const).map((weekday) => ({
    id: `av-carmen-${weekday}`,
    memberId: "m-carmen",
    kind: "recurrente" as const,
    weekday,
    date: null,
    range: range("10:00", "19:00"),
    available: true,
    note: "Disponible por la mañana y la tarde",
  })),
  {
    id: "av-carmen-5",
    memberId: "m-carmen",
    kind: "recurrente",
    weekday: 5,
    date: null,
    range: range("15:00", "19:00"),
    available: true,
    note: "Viernes por la mañana tiene actividades",
  },
  ...([1, 2, 3, 4, 5] as const).map((weekday) => ({
    id: `av-antonio-${weekday}`,
    memberId: "m-antonio",
    kind: "recurrente" as const,
    weekday,
    date: null,
    range: range("11:00", "19:30"),
    available: true,
    note: "Disponible de mediodía a tarde",
  })),
  {
    id: "av-antonio-1120",
    memberId: "m-antonio",
    kind: "excepcion",
    weekday: null,
    date: "2026-11-20",
    range: null,
    available: false,
    note: "Cita médica",
  },
];

export const events: FamilyEvent[] = [
  { id: "ev-tutoria", familyId: FAMILY_ID, date: "2026-11-18", range: range("17:30", "18:00"), title: "Tutoría de Lucía", kind: "escolar", childIds: ["c-lucia"], closesCenters: false },
  { id: "ev-puente", familyId: FAMILY_ID, date: "2026-12-07", range: null, title: "Día no lectivo", kind: "festivo", childIds: ["c-lucia", "c-mateo"], closesCenters: true },
  { id: "ev-inmaculada", familyId: FAMILY_ID, date: "2026-12-08", range: null, title: "Festivo: Inmaculada Concepción", kind: "festivo", childIds: ["c-lucia", "c-mateo"], closesCenters: true },
];

/* ---------------- Semana de demostración: 16–20 nov 2026 ---------------- */

const weekdaysDemo = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20"];

const parentTask = (
  id: string,
  date: string,
  kind: CareTask["kind"],
  childId: string,
  from: string,
  to: string,
  location: string,
  assigneeId: string,
): CareTask => ({
  id,
  needId: `cn-${id}`,
  date,
  kind,
  childIds: [childId],
  range: range(from, to),
  location,
  assigneeId,
  confirmation: { byMemberId: assigneeId, at: "2026-11-13T20:00", via: "planificacion_progenitor" },
  review: null,
  conflict: null,
});

const MATEO_CENTER = "Escuela infantil Pequeños Pasos";
const LUCIA_CENTER = "CEIP Los Almendros";

const dropOffs: CareTask[] = weekdaysDemo.flatMap((d) => [
  parentTask(`llevar-mateo-${d}`, d, "llevar", "c-mateo", "08:30", "08:45", MATEO_CENTER, "m-javier"),
  parentTask(`llevar-lucia-${d}`, d, "llevar", "c-lucia", "08:50", "09:00", LUCIA_CENTER, "m-javier"),
]);

export const careTasks: CareTask[] = [
  ...dropOffs,
  // Lunes 16: Laura sale a las 14:30 (+25 min) y recoge a ambos.
  parentTask("t-1116-mateo", "2026-11-16", "recoger", "c-mateo", "15:30", "15:45", MATEO_CENTER, "m-laura"),
  parentTask("t-1116-lucia", "2026-11-16", "recoger", "c-lucia", "16:00", "16:15", LUCIA_CENTER, "m-laura"),
  // Martes 17 (hoy): ambos progenitores trabajan por la tarde. Dos recogidas en centros distintos = dos tareas.
  {
    id: "t-1117-mateo",
    needId: "cn-1117-tarde",
    date: "2026-11-17",
    kind: "recoger",
    childIds: ["c-mateo"],
    range: range("15:30", "18:20"),
    location: MATEO_CENTER,
    assigneeId: "m-carmen",
    confirmation: { byMemberId: "m-carmen", at: "2026-11-14T19:05", via: "solicitud_aceptada" },
    review: null,
    conflict: null,
  },
  {
    id: "t-1117-lucia",
    needId: "cn-1117-tarde",
    date: "2026-11-17",
    kind: "recoger",
    childIds: ["c-lucia"],
    range: range("16:00", "18:20"),
    location: LUCIA_CENTER,
    assigneeId: "m-antonio",
    confirmation: { byMemberId: "m-antonio", at: "2026-11-14T20:10", via: "solicitud_aceptada" },
    review: null,
    conflict: null,
  },
  // Miércoles 18: Laura recoge a Mateo y, tras la natación, a Lucía.
  parentTask("t-1118-mateo", "2026-11-18", "recoger", "c-mateo", "15:30", "15:45", MATEO_CENTER, "m-laura"),
  parentTask("t-1118-lucia", "2026-11-18", "recoger", "c-lucia", "17:00", "17:15", LUCIA_CENTER, "m-laura"),
  // Jueves 19: cambio de horario de Javier (hasta 20:00).
  {
    id: "t-1119-mateo",
    needId: "cn-1119-tarde",
    date: "2026-11-19",
    kind: "recoger",
    childIds: ["c-mateo"],
    range: range("15:30", "18:20"),
    location: MATEO_CENTER,
    assigneeId: "m-carmen",
    confirmation: { byMemberId: "m-carmen", at: "2026-11-15T09:30", via: "solicitud_aceptada" },
    review: {
      reason:
        "Javier registró un cambio de horario el jueves (hasta las 20:00). Se conserva la confirmación de Carmen hasta las 18:20, pero la cobertura posterior debe revisarse.",
      flaggedAt: "2026-11-16T10:12",
    },
    conflict: null,
  },
  {
    id: "t-1119-lucia",
    needId: "cn-1119-tarde",
    date: "2026-11-19",
    kind: "recoger",
    childIds: ["c-lucia"],
    range: range("16:00", "18:20"),
    location: LUCIA_CENTER,
    assigneeId: null,
    confirmation: null,
    review: null,
    conflict: null,
  },
  {
    id: "t-1119-casa",
    needId: "cn-1119-noche",
    date: "2026-11-19",
    kind: "cuidar",
    childIds: ["c-mateo", "c-lucia"],
    range: range("18:20", "20:20"),
    location: "Casa familiar",
    assigneeId: null,
    confirmation: null,
    review: null,
    conflict: null,
  },
  // Viernes 20: conflicto — Lucía sale a las 14:00 y nadie está disponible.
  {
    id: "t-1120-lucia",
    needId: "cn-1120-mediodia",
    date: "2026-11-20",
    kind: "recoger",
    childIds: ["c-lucia"],
    range: range("14:00", "14:55"),
    location: LUCIA_CENTER,
    assigneeId: null,
    confirmation: null,
    review: null,
    conflict: {
      reason:
        "A las 14:00 nadie está disponible: Laura termina a las 14:30 (+25 min de desplazamiento), Antonio tiene una cita médica y rechazó la solicitud, y Carmen está disponible desde las 15:00.",
    },
  },
  parentTask("t-1120-mateo", "2026-11-20", "recoger", "c-mateo", "15:30", "15:45", MATEO_CENTER, "m-laura"),
];

export const careNeeds: CareNeed[] = (() => {
  const byId = new Map<string, CareNeed>();
  for (const t of careTasks) {
    const prev = byId.get(t.needId);
    if (prev) {
      prev.childIds = Array.from(new Set([...prev.childIds, ...t.childIds]));
      prev.range = { start: Math.min(prev.range.start, t.range.start), end: Math.max(prev.range.end, t.range.end) };
    } else {
      byId.set(t.needId, {
        id: t.needId,
        date: t.date,
        childIds: [...t.childIds],
        range: { ...t.range },
        reason: t.kind === "llevar" ? "Entrada al centro" : "Salida del centro con progenitores trabajando",
        source: "datos_demo",
      });
    }
  }
  return [...byId.values()];
})();

export const careRequests: CareRequest[] = [
  { id: "r-1", taskId: "t-1117-mateo", batchId: "b-1", recipientId: "m-carmen", sentAt: "2026-11-14T18:00", status: "aceptada", respondedAt: "2026-11-14T19:05", note: null },
  { id: "r-2", taskId: "t-1117-mateo", batchId: "b-1", recipientId: "m-antonio", sentAt: "2026-11-14T18:00", status: "superada", respondedAt: null, note: "Carmen aceptó primero" },
  { id: "r-3", taskId: "t-1117-lucia", batchId: "b-2", recipientId: "m-antonio", sentAt: "2026-11-14T18:00", status: "aceptada", respondedAt: "2026-11-14T20:10", note: null },
  { id: "r-4", taskId: "t-1117-lucia", batchId: "b-2", recipientId: "m-carmen", sentAt: "2026-11-14T18:00", status: "superada", respondedAt: null, note: "Antonio aceptó primero" },
  { id: "r-5", taskId: "t-1119-mateo", batchId: "b-3", recipientId: "m-carmen", sentAt: "2026-11-14T18:05", status: "aceptada", respondedAt: "2026-11-15T09:30", note: null },
  { id: "r-6", taskId: "t-1119-mateo", batchId: "b-3", recipientId: "m-antonio", sentAt: "2026-11-14T18:05", status: "superada", respondedAt: null, note: "Carmen aceptó primero" },
  { id: "r-7", taskId: "t-1119-lucia", batchId: "b-4", recipientId: "m-carmen", sentAt: "2026-11-16T18:00", status: "pendiente", respondedAt: null, note: null },
  { id: "r-8", taskId: "t-1119-lucia", batchId: "b-4", recipientId: "m-antonio", sentAt: "2026-11-16T18:00", status: "pendiente", respondedAt: null, note: null },
  { id: "r-9", taskId: "t-1120-lucia", batchId: "b-5", recipientId: "m-antonio", sentAt: "2026-11-15T11:00", status: "rechazada", respondedAt: "2026-11-15T12:40", note: "Tengo cita médica" },
];

export const notifications: AppNotification[] = [
  ...["m-laura", "m-javier"].flatMap((rid) => [
    { id: `n-cambio-${rid}`, recipientId: rid, createdAt: "2026-11-16T10:12", kind: "cambio" as const, title: "Revisión necesaria el jueves 19", body: "El cambio de horario de Javier afecta a la tarde del jueves. Las confirmaciones anteriores se conservan.", relatedTaskId: "t-1119-mateo", read: false },
    { id: `n-rechazo-${rid}`, recipientId: rid, createdAt: "2026-11-15T12:40", kind: "rechazo" as const, title: "Antonio no puede el viernes 20", body: "Rechazó recoger a Lucía a las 14:00 (cita médica). La recogida sigue sin cubrir.", relatedTaskId: "t-1120-lucia", read: false },
    { id: `n-conf-${rid}`, recipientId: rid, createdAt: "2026-11-14T20:10", kind: "confirmacion" as const, title: "Martes 17 cubierto", body: "Carmen recoge a Mateo y Antonio recoge a Lucía.", relatedTaskId: "t-1117-lucia", read: true },
  ]),
  ...["m-carmen", "m-antonio"].map((rid) => ({
    id: `n-sol-${rid}`, recipientId: rid, createdAt: "2026-11-16T18:00", kind: "solicitud" as const, title: "Nueva solicitud: jueves 19 a las 16:00", body: "Recoger a Lucía en el CEIP Los Almendros y quedarse con ella hasta las 18:20.", relatedTaskId: "t-1119-lucia", read: false,
  })),
  { id: "n-rev-carmen", recipientId: "m-carmen", createdAt: "2026-11-16T10:12", kind: "cambio", title: "La familia está revisando el jueves 19", body: "Tu confirmación para recoger a Mateo se mantiene. Puede que te contacten por la franja posterior a las 18:20.", relatedTaskId: "t-1119-mateo", read: false },
  { id: "n-rec-carmen", recipientId: "m-carmen", createdAt: "2026-11-17T08:00", kind: "recordatorio", title: "Recordatorio para hoy", body: "Recoger a Mateo a las 15:30 en la Escuela infantil Pequeños Pasos.", relatedTaskId: "t-1117-mateo", read: false },
  { id: "n-rec-antonio", recipientId: "m-antonio", createdAt: "2026-11-17T08:00", kind: "recordatorio", title: "Recordatorio para hoy", body: "Recoger a Lucía a las 16:00 en el CEIP Los Almendros.", relatedTaskId: "t-1117-lucia", read: false },
];

export const auditEntries: AuditEntry[] = [
  { id: "a-1", at: "2026-11-13T20:00", actorId: "m-laura", action: "planificacion.semana", entity: "CareTask", entityId: "semana-2026-11-16", summary: "Laura planificó entradas y recogidas de la semana" },
  { id: "a-2", at: "2026-11-14T18:00", actorId: "m-laura", action: "solicitud.enviar", entity: "CareRequest", entityId: "b-1", summary: "Solicitud simultánea a Carmen y Antonio (martes 17, Mateo)" },
  { id: "a-3", at: "2026-11-14T19:05", actorId: "m-carmen", action: "solicitud.aceptar", entity: "CareRequest", entityId: "r-1", summary: "Carmen aceptó; la solicitud de Antonio quedó superada" },
  { id: "a-4", at: "2026-11-15T12:40", actorId: "m-antonio", action: "solicitud.rechazar", entity: "CareRequest", entityId: "r-9", summary: "Antonio rechazó la recogida del viernes 20" },
  { id: "a-5", at: "2026-11-16T10:12", actorId: "m-javier", action: "turno.excepcion", entity: "WorkShift", entityId: "ex-javier-1119", summary: "Javier registró una excepción de horario el jueves 19" },
  { id: "a-6", at: "2026-11-16T10:12", actorId: "sistema", action: "cobertura.revisar", entity: "CareTask", entityId: "t-1119-mateo", summary: "Tarea marcada para revisión; confirmación de Carmen conservada" },
  { id: "a-7", at: "2026-11-16T18:00", actorId: "m-javier", action: "solicitud.enviar", entity: "CareRequest", entityId: "b-4", summary: "Solicitud simultánea a Carmen y Antonio (jueves 19, Lucía)" },
];
