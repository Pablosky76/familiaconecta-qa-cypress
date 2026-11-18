import { deriveTaskStatus } from "./care";
import { sessionsOnDate } from "./schedule";
import type { FamilySnapshot } from "@/data/repository";

export type TimelineState = "centro" | "confirmada" | "pendiente" | "sin_asignar" | "requiere_atencion" | "sin_datos";
export interface TimelineSegment { start: number; end: number; label: string; state: TimelineState }
/** No infiere cuidado de los turnos o disponibilidad: solo usa asignaciones explícitas y centro. */
export function childTimeline(snap: FamilySnapshot, childId: string, date: string): TimelineSegment[] {
  const child = snap.children.find(c => c.id === childId);
  if (!child) return [];
  const source: TimelineSegment[] = sessionsOnDate(snap.schoolSchedules,snap.events,childId,date).map(s => ({start:s.range.start,end:s.range.end,label:`En ${child.center.name}`,state:"centro"}));
  for (const task of snap.careTasks.filter(t=>t.date===date && t.childIds.includes(childId))) {
    const state = deriveTaskStatus(task,snap.careRequests);
    const name = snap.members.find(m=>m.id===task.assigneeId)?.name;
    const label = state === "confirmada" && name ? `Con ${name}` : state === "requiere_atencion" ? (name && task.confirmation ? `Revisar · confirmación anterior de ${name}` : "Requiere atención") : state === "pendiente" ? "Solicitud pendiente" : "Sin cuidador confirmado";
    source.push({start:task.range.start,end:task.range.end,label,state});
  }
  const points = [...new Set([0,1440,...source.flatMap(s=>[Math.max(0,s.start),Math.min(1440,s.end)])])].filter(n=>n>=0&&n<=1440).sort((a,b)=>a-b);
  const result: TimelineSegment[]=[];
  for(let i=0;i<points.length-1;i++) {
    const start=points[i]!,end=points[i+1]!;
    const active=source.filter(s=>s.start < end && s.end > start);
    let segment: TimelineSegment;
    if(active.length===0) segment={start,end,label:"Sin información registrada",state:"sin_datos"};
    else if(active.length===1) segment={...active[0]!,start,end};
    else {
      const names=[...new Set(active.map(a=>a.label))];
      segment= names.length===1 && active.every(a=>a.state===active[0]!.state) ? {...active[0]!,start,end} : {start,end,label:`Revisar solapamiento: ${names.join(" / ")}`,state:"requiere_atencion"};
    }
    const previous=result.at(-1);
    if(previous && previous.end===start && previous.label===segment.label && previous.state===segment.state) previous.end=end; else result.push(segment);
  }
  return result;
}
