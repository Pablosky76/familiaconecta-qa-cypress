import { useState, type FormEvent } from "react";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useProfile, PARENT_PROFILES } from "@/app/profile";
import { RequireProfile } from "@/components/app/RequireProfile";
import { TaskCard } from "@/components/app/TaskCard";
import { familyRepository, familySnapshotQuery } from "@/data";
import { deriveTaskStatus } from "@/domain/care";
import type { CareTaskKind } from "@/domain/types";

export const Route = createFileRoute("/solicitudes")({
  head: () => ({ meta: [{title:"Pedir ayuda · FamiliaConecta (demo)"}] }),
  loader: ({context}) => context.queryClient.ensureQueryData(familySnapshotQuery),
  component: Solicitudes,
});
const field="min-h-12 w-full rounded-xl border bg-background px-3 py-2";
function Solicitudes(){
 const {data}=useSuspenseQuery(familySnapshotQuery); const {memberId}=useProfile(); const client=useQueryClient();
 const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); if(!memberId || busy) return; const form=e.currentTarget; const f=new FormData(form); setMessage(""); setBusy(true);
  try {const result=await familyRepository.createCareRequest(memberId,{childId:String(f.get("childId")??""),date:String(f.get("date")??""),start:String(f.get("start")??""),end:String(f.get("end")??""),kind:String(f.get("kind")??"") as CareTaskKind,location:String(f.get("location")??"")});setMessage(result.message);if(result.ok) await client.invalidateQueries({queryKey:["family-snapshot"]});}
  catch {setMessage("No se ha podido guardar la solicitud de ejemplo. Inténtalo de nuevo.");} finally {setBusy(false);}
 }
 const visible=data.careTasks.filter(t=>t.date>=data.clock.today && deriveTaskStatus(t,data.careRequests)!=="confirmada").sort((a,b)=>a.date.localeCompare(b.date)||a.range.start-b.range.start);
 return <RequireProfile allow={PARENT_PROFILES} audience="los progenitores">{()=> <div className="mx-auto max-w-3xl space-y-7">
  <header><h1 className="text-3xl font-bold">Pedir ayuda</h1><p className="mt-2 text-lg">Cuéntanos cuándo necesitas ayuda con uno de los niños.</p></header>
  <p className="rounded-xl border bg-card p-4"><strong>Solo una prueba.</strong> Usa datos ficticios. No se envía ningún aviso real y los cambios se pierden al recargar.</p>
  <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5" aria-describedby="care-help">
   <h2 className="text-xl font-bold">Nueva solicitud de ejemplo</h2>
   <label className="block font-semibold">¿Para qué niño?<select name="childId" className={field} required>{data.children.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label className="block font-semibold">¿Qué hay que hacer?<select name="kind" className={field}><option value="recoger">Recoger</option><option value="llevar">Llevar</option><option value="cuidar">Cuidar</option></select></label>
   <label className="block font-semibold">Día<input name="date" type="date" className={field} defaultValue={data.clock.today} required/></label>
   <div className="grid gap-4 sm:grid-cols-2"><label className="block font-semibold">Desde<input name="start" type="time" className={field} defaultValue="16:00" required/></label><label className="block font-semibold">Hasta<input name="end" type="time" className={field} defaultValue="18:00" required/></label></div>
   <label className="block font-semibold">¿Dónde?<input name="location" className={field} maxLength={120} placeholder="Por ejemplo, colegio" required/></label>
   <p id="care-help" className="text-sm text-muted-foreground">Crearemos una solicitud por niño. En esta prueba se propone a los abuelos disponibles y sin otro cuidado que se solape o incumpla el margen configurado. Una solicitud pendiente no es un cuidado confirmado. El margen es orientativo; revisa el trayecto real.</p>
   <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-60">{busy?"Guardando…":"Preparar solicitud de prueba"}</button>
   <p role="status" aria-live="polite" className="font-semibold">{message}</p>
  </form>
  <section className="space-y-3"><h2 className="text-2xl font-bold">Necesitan atención</h2>{visible.length===0?<p>No hay solicitudes pendientes.</p>:visible.map(t=><TaskCard key={t.id} task={t} members={data.members} children={data.children} requests={data.careRequests} showDate/>)}</section>
 </div>}</RequireProfile>;
}
