import { canConfigureTravel, conflictingCareTasks } from "@/domain/travel";
import { createCareRequest } from "@/domain/new-care";
import { respondToRequest } from "@/domain/responses";
import { applyPlanningChange } from "@/domain/planning";
import type { FamilyRepository, FamilySnapshot } from "../repository";
import * as fx from "./fixtures";

/** Repositorio en memoria: devuelve una copia de los datos ficticios. Nada se guarda. */
export function createMockRepository(): FamilyRepository {
  const initial = (): FamilySnapshot => structuredClone({
        family: fx.family,
        members: fx.members,
        children: fx.children,
        workShifts: fx.workShifts,
        schoolSchedules: fx.schoolSchedules,
        availability: fx.availability,
        events: fx.events,
        careNeeds: fx.careNeeds,
        careTasks: fx.careTasks,
        careRequests: fx.careRequests,
        notifications: fx.notifications,
        auditEntries: fx.auditEntries,
        clock: {
          today: fx.DEMO_TODAY,
          nowMinutes: fx.DEMO_NOW,
          simulated: true,
          demoWeekStart: fx.DEMO_WEEK_START,
        },
      });
  let snapshot = initial();
  return {
    kind: "mock",
    async getSnapshot() { return structuredClone(snapshot); },
    async applyChange(change, memberId) {
      const actor = snapshot.members.find((m) => m.id === memberId);
      const result = applyPlanningChange(snapshot, change, actor, {
        at: new Date().toISOString(),
        newId: (prefix) => `${prefix}-${crypto.randomUUID()}`,
      });
      snapshot = result.state;
      return result.outcome;
    },
    async respondToRequest(requestId, memberId, decision) {
      const result = respondToRequest(snapshot, requestId, memberId, decision, new Date().toISOString());
      snapshot = result.state;
      return result.result;
    },
    async createCareRequest(memberId, input) {
      const result = createCareRequest(snapshot, memberId, input, new Date().toISOString());
      snapshot = result.state;
      return result.result;
    },
    async setTravelBuffer(memberId, minutes) {
      const actor = snapshot.members.find(m=>m.id===memberId);
      if (!canConfigureTravel(actor)) return {ok:false,message:"Solo los padres pueden modificar este ajuste de prueba."};
      if (!Number.isInteger(minutes) || minutes<0 || minutes>180) return {ok:false,message:"Introduce un número entero entre 0 y 180 minutos."};
      const next=structuredClone(snapshot); next.family.travelBufferMinutes=minutes;
      let flagged=0;
      for (const task of next.careTasks) {
        if(!task.confirmation || !task.assigneeId) continue;
        const conflicts=conflictingCareTasks(next.careTasks,task.assigneeId,task.date,task.range,task.location,minutes,task.id);
        if(conflicts.length && !task.review){task.review={reason:"El margen entre cuidados cambió. Comprueba el desplazamiento; se conserva la confirmación anterior.",flaggedAt:new Date().toISOString()};flagged++;}
      }
      next.auditEntries.push({id:`audit-${crypto.randomUUID()}`,at:new Date().toISOString(),actorId:memberId,action:"desplazamiento.actualizar",entity:"Family",entityId:next.family.id,summary:`Margen de prueba actualizado a ${minutes} minutos`});
      snapshot=next;
      return {ok:true,message:`Margen guardado en la demo.${flagged ? ` ${flagged} tarea(s) requieren revisión; sus confirmaciones se conservan.` : ""}`};
    },
    reset() { snapshot = initial(); },
  };
}
