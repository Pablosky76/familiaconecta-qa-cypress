import { describe, it, expect } from "vitest";
import { createMockRepository } from "@/data/mock/mockRepository";
import { childTimeline } from "@/domain/timeline";

describe("línea de cuidados", () => {
 it("cubre el día y no supone que un progenitor libre esté a cargo", async()=>{
  const snap=await createMockRepository().getSnapshot();
  const child=snap.children[0]!;
  const line=childTimeline(snap,child.id,"2026-11-22");
  expect(line).toEqual([{start:0,end:1440,label:"Sin información registrada",state:"sin_datos"}]);
 });
 it("muestra solicitudes pendientes sin asignar cuidador y preserva avisos de revisión",async()=>{
  const snap=await createMockRepository().getSnapshot();
  const pending=snap.careTasks.find(t=>snap.careRequests.some(r=>r.taskId===t.id && r.status==="pendiente") && !t.confirmation)!;
  const line=childTimeline(snap,pending.childIds[0]!,pending.date);
  expect(line.some(s=>s.state==="pendiente" && s.label==="Solicitud pendiente")).toBe(true);
  const reviewed=snap.careTasks.find(t=>t.review && t.confirmation)!;
  expect(childTimeline(snap,reviewed.childIds[0]!,reviewed.date).some(s=>s.state==="requiere_atencion")).toBe(true);
 });
 it("advierte si dos planes incompatibles se solapan",async()=>{
  const snap=await createMockRepository().getSnapshot();
  const task=snap.careTasks.find(t=>t.confirmation)!;
  snap.careTasks.push({...structuredClone(task),id:"duplicate",assigneeId:"m-carmen",confirmation:{...task.confirmation!,byMemberId:"m-carmen"}});
  expect(childTimeline(snap,task.childIds[0]!,task.date).some(s=>s.label.startsWith("Revisar solapamiento"))).toBe(true);
 });
});
