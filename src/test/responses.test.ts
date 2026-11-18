import { describe, expect, it } from "vitest";
import { createMockRepository } from "@/data/mock/mockRepository";

describe("respuestas de ejemplo",()=>{
 it("acepta una sola vez y cierra las demás solicitudes de la tarea",async()=>{
  const repo=createMockRepository(); const data=await repo.getSnapshot();
  const req=data.careRequests.find(r=>r.status==="pendiente" && r.recipientId==="m-antonio")!;
  const result=await repo.respondToRequest(req.id,"m-antonio","aceptar");
  expect(result.ok).toBe(true);
  const after=await repo.getSnapshot();
  const task=after.careTasks.find(t=>t.id===req.taskId)!;
  expect(task.assigneeId).toBe("m-antonio");
  expect(after.careRequests.filter(r=>r.taskId===task.id && r.status==="aceptada")).toHaveLength(1);
  const other=after.careRequests.find(r=>r.taskId===task.id && r.recipientId!=="m-antonio")!;
  expect(other.status).toBe("superada");
  expect((await repo.respondToRequest(other.id,other.recipientId,"aceptar")).ok).toBe(false);
 });
 it("rechaza responder por otra persona y no permite compromisos simultáneos",async()=>{
  const repo=createMockRepository(); const data=await repo.getSnapshot();
  const r=data.careRequests.find(x=>x.status==="pendiente" && x.recipientId==="m-carmen")!;
  expect((await repo.respondToRequest(r.id,"m-antonio","rechazar")).ok).toBe(false);
  expect((await repo.respondToRequest(r.id,"m-carmen","aceptar")).ok).toBe(false);
  expect((await repo.respondToRequest(r.id,"m-carmen","rechazar")).ok).toBe(true);
  expect((await repo.getSnapshot()).careRequests.find(x=>x.id===r.id)?.status).toBe("rechazada");
 });
});

it("no acepta solicitudes ya terminadas",async()=>{
 const repo=createMockRepository(); const snap=await repo.getSnapshot();
 const req=snap.careRequests.find(r=>r.status==="pendiente" && r.recipientId==="m-antonio")!;
 const {respondToRequest}=await import("@/domain/responses");
 snap.clock.today="2026-11-20";
 expect(respondToRequest(snap,req.id,"m-antonio","aceptar",new Date().toISOString()).result.ok).toBe(false);
});
