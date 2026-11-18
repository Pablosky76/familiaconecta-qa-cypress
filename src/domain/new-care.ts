import { conflictingCareTasks } from "./travel";
import type { FamilySnapshot } from "@/data/repository";
import type { CareTaskKind } from "./types";
import { availabilityOnDate } from "./schedule";
import { checkDate, checkRange } from "./validation";

export interface CareInput { childId:string; date:string; start:string; end:string; kind:CareTaskKind; location:string }
export type NewCareResult = {ok:true; message:string; recipientNames:string[]} | {ok:false; message:string};
/** Simulación local: no envía mensajes ni sustituye una transacción en servidor. */
export function createCareRequest(state:FamilySnapshot, actorId:string, input:CareInput, at:string):{state:FamilySnapshot;result:NewCareResult} {
 const actor=state.members.find(m=>m.id===actorId);
 if(!actor || (actor.role!=="madre" && actor.role!=="padre")) return {state,result:{ok:false,message:"Solo los padres pueden crear solicitudes en esta demo."}};
 const errors:Record<string,string>={};
 const date=checkDate(input.date,"la fecha",errors,"date"), range=checkRange(input.start,input.end,errors);
 if(!state.children.some(c=>c.id===input.childId)) errors["child"]="Elige un niño.";
 if(!["llevar","recoger","cuidar"].includes(input.kind)) errors["kind"]="Elige qué hay que hacer.";
 if(!input.location.trim() || input.location.trim().length>120) errors["location"]="Indica un lugar de hasta 120 caracteres.";
 if(date && range && (date<state.clock.today || (date===state.clock.today && range.start<=state.clock.nowMinutes))) errors["date"]="Elige una hora posterior al momento actual de la demo.";
 if(date && range && state.careTasks.some(t=>t.date===date && t.childIds.includes(input.childId) && t.range.start<range.end && range.start<t.range.end)) errors["overlap"]="Ya existe una responsabilidad para este niño en ese horario. Revisa el calendario antes de añadir otra.";
 if(Object.keys(errors).length || !date || !range) return {state,result:{ok:false,message:Object.values(errors).join(" ")}};
 const eligible=state.members.filter(m=>{
  if(m.role!=="abuelo" && m.role!=="abuela") return false;
  const a=availabilityOnDate(state.availability,m.id,date);
  return !!a?.available && !!a.range && a.range.start<=range.start && a.range.end>=range.end && conflictingCareTasks(state.careTasks,m.id,date,range,input.location,state.family.travelBufferMinutes).length===0;
 });
 const next=structuredClone(state), needId=`need-${crypto.randomUUID()}`, taskId=`task-${crypto.randomUUID()}`, batchId=`batch-${crypto.randomUUID()}`;
 next.careNeeds.push({id:needId,date,childIds:[input.childId],range,reason:"Ayuda solicitada por un progenitor (demo)",source:"datos_demo"});
 next.careTasks.push({id:taskId,needId,date,kind:input.kind,childIds:[input.childId],range,location:input.location.trim(),assigneeId:null,confirmation:null,review:null,conflict:null});
 for(const m of eligible){
  next.careRequests.push({id:`request-${crypto.randomUUID()}`,taskId,batchId,recipientId:m.id,sentAt:at,status:"pendiente",respondedAt:null,note:null});
  next.notifications.push({id:`notice-${crypto.randomUUID()}`,recipientId:m.id,createdAt:at,kind:"solicitud",title:"Nueva solicitud de ejemplo",body:"La familia necesita ayuda. Abre la solicitud para verla.",relatedTaskId:taskId,read:false});
 }
 next.auditEntries.push({id:`audit-${crypto.randomUUID()}`,at,actorId,action:"solicitud.crear",entity:"CareTask",entityId:taskId,summary:`${actor.name} creó una solicitud ficticia`});
 return {state:next,result:{ok:true,message:eligible.length ? `Solicitud de ejemplo preparada para ${eligible.map(m=>m.name).join(" y ")}. Todavía no está confirmada.` : "Necesidad guardada sin cubrir. Ningún abuelo reúne la disponibilidad y el margen de desplazamiento registrados; revisa la planificación.",recipientNames:eligible.map(m=>m.name)}};
}
