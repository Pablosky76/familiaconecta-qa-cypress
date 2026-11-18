import type { CareTask, FamilyMember, TimeRange } from "./types";

/** Margen único y manual de la demo; no calcula rutas ni tráfico. */
export function conflictingCareTasks(tasks:CareTask[], memberId:string, date:string, range:TimeRange, location:string, bufferMinutes:number, excludeId?:string):CareTask[] {
 const place=(s:string)=>s.trim().replace(/\s+/g," ").toLocaleLowerCase("es");
 return tasks.filter(t=>{
  if(t.id===excludeId || t.date!==date || t.assigneeId!==memberId || !t.confirmation) return false;
  if(t.range.start<range.end && range.start<t.range.end) return true;
  if(place(t.location)===place(location)) return false;
  const gap=t.range.end<=range.start ? range.start-t.range.end : t.range.start-range.end;
  return gap<bufferMinutes;
 });
}
export function canConfigureTravel(actor:FamilyMember|undefined):boolean{return actor?.role==="madre"||actor?.role==="padre";}
