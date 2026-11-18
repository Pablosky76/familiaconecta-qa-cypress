import { conflictingCareTasks } from "./travel";
import type { FamilySnapshot } from "@/data/repository";
import { availabilityOnDate } from "./schedule";

export type ResponseResult = { ok: true; message: string } | { ok: false; message: string };
/** Simulación local: la exclusividad real requerirá una transacción en el servidor. */
export function respondToRequest(state: FamilySnapshot, requestId: string, actorId: string, decision: "aceptar" | "rechazar", at: string): { state: FamilySnapshot; result: ResponseResult } {
 const request=state.careRequests.find(r=>r.id===requestId);
 const actor=state.members.find(m=>m.id===actorId);
 if(!actor || !(actor.role==="abuelo"||actor.role==="abuela") || !request || request.recipientId!==actorId) return {state,result:{ok:false,message:"Solo puedes responder a tus propias solicitudes."}};
 const task=state.careTasks.find(t=>t.id===request.taskId);
 if(!task || request.status!=="pendiente" || task.confirmation || task.conflict || task.review) return {state,result:{ok:false,message:"Esta solicitud ya no está disponible o requiere revisión."}};
 if (task.date < state.clock.today || (task.date === state.clock.today && task.range.end <= state.clock.nowMinutes)) return {state,result:{ok:false,message:"Esta solicitud ya ha terminado. Consulta con los padres."}};
 if(decision==="aceptar") {
  const availability=availabilityOnDate(state.availability,actorId,task.date);
  if(!availability?.available || !availability.range || availability.range.start>task.range.start || availability.range.end<task.range.end) return {state,result:{ok:false,message:"La disponibilidad registrada no cubre todo el horario. Pide a los padres que revisen la planificación."}};
  const conflicts=conflictingCareTasks(state.careTasks,actorId,task.date,task.range,task.location,state.family.travelBufferMinutes,task.id);
  if(conflicts.length) return {state,result:{ok:false,message:"Hay otro cuidado confirmado demasiado cerca en hora o lugar. Pide a los padres que revisen la planificación y el desplazamiento."}};
 }
 const next=structuredClone(state), updated=next.careRequests.find(r=>r.id===requestId)!, target=next.careTasks.find(t=>t.id===task.id)!;
 updated.status=decision==="aceptar"?"aceptada":"rechazada"; updated.respondedAt=at;
 if(decision==="aceptar") {
  target.assigneeId=actorId; target.confirmation={byMemberId:actorId,at,via:"solicitud_aceptada"};
  for(const r of next.careRequests) if(r.taskId===task.id && r.status==="pendiente") {r.status="superada";r.respondedAt=at;}
 }
 next.auditEntries.push({id:`demo-${crypto.randomUUID()}`,at,actorId,action:`solicitud.${decision}`,entity:"CareRequest",entityId:requestId,summary:`${actor.name} ${decision === "aceptar" ? "aceptó" : "rechazó"} una solicitud (demo)`});
 for(const parent of next.members.filter(m=>m.role==="madre"||m.role==="padre")) next.notifications.push({id:`demo-${crypto.randomUUID()}`,recipientId:parent.id,createdAt:at,kind:decision==="aceptar"?"confirmacion":"rechazo",title:`${actor.name} ${decision==="aceptar"?"ha aceptado":"no puede ayudar"}`,body:"Respuesta de ejemplo; consulta la responsabilidad.",relatedTaskId:task.id,read:false});
 return {state:next,result:{ok:true,message:decision==="aceptar"?"Has aceptado esta solicitud de ejemplo.":"Has rechazado esta solicitud de ejemplo."}};
}
