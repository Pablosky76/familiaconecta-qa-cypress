import { describe, expect, it } from "vitest";
import { createMockRepository } from "@/data/mock/mockRepository";
import { conflictingCareTasks } from "@/domain/travel";
import { createCareRequest } from "@/domain/new-care";
import { respondToRequest } from "@/domain/responses";

describe("margen entre cuidados",()=>{
 it("distingue solapamiento, margen insuficiente y el límite exacto",async()=>{
  const s=await createMockRepository().getSnapshot();
  const task=s.careTasks.find(t=>t.assigneeId==="m-antonio" && t.confirmation)!;
  const check=(start:number,end:number,place:string,margin=20)=>conflictingCareTasks([task],"m-antonio",task.date,{start,end},place,margin).length;
  expect(check(task.range.end-1,task.range.end+5,task.location)).toBe(1);
  expect(check(task.range.end+19,task.range.end+30,"Otro centro")).toBe(1);
  expect(check(task.range.end+20,task.range.end+30,"Otro centro")).toBe(0);
  expect(check(task.range.end,task.range.end+10,task.location.toUpperCase())).toBe(0);
  expect(check(task.range.start-10,task.range.start-1,"Otro centro")).toBe(1);
 });
 it("valida el margen al proponer y otra vez al aceptar",async()=>{
  const s=await createMockRepository().getSnapshot();
  const prior=s.careTasks.find(t=>t.assigneeId==="m-antonio" && t.confirmation)!;
  const input={childId:"c-mateo",date:prior.date,start:"18:35",end:"18:45",kind:"cuidar" as const,location:"Otro lugar"};
  const created=createCareRequest(s,"m-laura",input,new Date().toISOString());
  expect(created.result.ok).toBe(true); if(!created.result.ok)return;
  expect(created.result.recipientNames).not.toContain("Antonio");
  const withSmallerMargin=structuredClone(s);withSmallerMargin.family.travelBufferMinutes=10;
  const pending=createCareRequest(withSmallerMargin,"m-laura",input,new Date().toISOString());
  expect(pending.result.ok).toBe(true); if(!pending.result.ok)return;
  expect(pending.result.recipientNames).toContain("Antonio");
  pending.state.family.travelBufferMinutes=20;
  const req=pending.state.careRequests.find(r=>r.recipientId==="m-antonio" && r.taskId!==prior.id && r.status==="pendiente" && pending.state.careTasks.some(t=>t.id===r.taskId && t.location==="Otro lugar"))!;
  expect(respondToRequest(pending.state,req.id,"m-antonio","aceptar",new Date().toISOString()).result.ok).toBe(false);
 });
 it("avisa si un margen nuevo afecta cuidados confirmados sin borrar las confirmaciones",async()=>{
  const repo=createMockRepository(); const before=await repo.getSnapshot();
  expect((await repo.setTravelBuffer("m-laura",30)).ok).toBe(true);
  const after=await repo.getSnapshot();
  const newlyFlagged=after.careTasks.filter(t=>t.review && !before.careTasks.find(x=>x.id===t.id)?.review);
  expect(newlyFlagged.length).toBeGreaterThan(0);
  for(const task of newlyFlagged) expect(task.confirmation).toEqual(before.careTasks.find(t=>t.id===task.id)?.confirmation);
 });
 it("solo los padres pueden ajustar el margen de la demo",async()=>{
  const repo=createMockRepository();
  expect((await repo.setTravelBuffer("m-carmen",30)).ok).toBe(false);
  expect((await repo.setTravelBuffer("m-laura",-1)).ok).toBe(false);
  expect((await repo.setTravelBuffer("m-laura",30)).ok).toBe(true);
  expect((await repo.getSnapshot()).family.travelBufferMinutes).toBe(30);
  repo.reset(); expect((await repo.getSnapshot()).family.travelBufferMinutes).toBe(20);
 });
});
