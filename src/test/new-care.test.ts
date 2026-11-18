import { describe, it, expect } from "vitest";
import { createMockRepository } from "@/data/mock/mockRepository";
import { createCareRequest, type CareInput } from "@/domain/new-care";
import { deriveTaskStatus } from "@/domain/care";
const sample:CareInput={childId:"c-lucia",date:"2026-11-18",start:"18:00",end:"19:00",kind:"cuidar",location:"Casa ficticia"};
describe("pedir ayuda en la demo",()=>{
 it("propone a ambos abuelos y solo confirma después de una respuesta",async()=>{
  const repo=createMockRepository();
  const result=await repo.createCareRequest("m-laura",sample); expect(result.ok).toBe(true);
  if(!result.ok) return;
  expect(result.recipientNames).toEqual(["Carmen","Antonio"]);
  const snap=await repo.getSnapshot(), task=snap.careTasks.find(t=>t.location===sample.location)!;
  const requests=snap.careRequests.filter(r=>r.taskId===task.id);
  expect(requests).toHaveLength(2); expect(requests[0]?.batchId).toBe(requests[1]?.batchId);
  expect(deriveTaskStatus(task,snap.careRequests)).toBe("pendiente");
  expect((await repo.respondToRequest(requests[0]!.id,requests[0]!.recipientId,"aceptar")).ok).toBe(true);
  const after=await repo.getSnapshot(); expect(deriveTaskStatus(after.careTasks.find(t=>t.id===task.id)!,after.careRequests)).toBe("confirmada");
  expect((await repo.respondToRequest(requests[1]!.id,requests[1]!.recipientId,"aceptar")).ok).toBe(false);
 });
 it("impide creación por abuelos, intervalos inválidos y duplicados",async()=>{
  const repo=createMockRepository(), original=await repo.getSnapshot();
  expect((await repo.createCareRequest("m-carmen",sample)).ok).toBe(false);
  expect((await repo.createCareRequest("m-laura",{...sample,end:"17:00"})).ok).toBe(false);
  const result=createCareRequest(original,"m-laura",sample,new Date().toISOString());
  expect(result.result.ok).toBe(true);
  expect(createCareRequest(result.state,"m-laura",sample,new Date().toISOString()).result.ok).toBe(false);
 });
 it("conserva la necesidad sin confirmarla si no hay disponibilidad",async()=>{
  const repo=createMockRepository(); const result=await repo.createCareRequest("m-laura",{...sample,date:"2026-11-22",start:"10:00",end:"11:00"});
  expect(result.ok).toBe(true); if(!result.ok)return; expect(result.recipientNames).toEqual([]);
  const snap=await repo.getSnapshot(), task=snap.careTasks.find(t=>t.date==="2026-11-22" && t.childIds.includes("c-lucia"))!;
  expect(deriveTaskStatus(task,snap.careRequests)).toBe("sin_asignar");
 });
});
