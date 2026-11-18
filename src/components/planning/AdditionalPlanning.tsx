import { useState, type FormEvent } from "react";
import type { FamilySnapshot } from "@/data";
import type { PlanningChange } from "@/domain/planning";
import type { Weekday, EventKind } from "@/domain/types";
import { formatRange } from "@/domain/dates";

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const input = "min-h-11 w-full rounded-lg border bg-background px-3 py-2";
const button = "min-h-11 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground";
const field = (form: FormData, name: string) => String(form.get(name) ?? "");
const tm = (n: number) => `${String(Math.floor(n / 60)).padStart(2,"0")}:${String(n % 60).padStart(2,"0")}`;
type Props = { data: FamilySnapshot; memberId: string; apply: (change: PlanningChange) => Promise<boolean> };
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <details className="rounded-xl border bg-card p-5"><summary className="min-h-11 cursor-pointer text-xl font-bold">{title}</summary><div className="mt-4 space-y-4">{children}</div></details>; }
function Form({ children, submit, title }: {children: React.ReactNode; submit:(f:FormData)=>Promise<boolean>; title:string}) { const [feedback,setFeedback]=useState(""); async function onSubmit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const form=e.currentTarget; setFeedback(""); if(await submit(new FormData(form))) {form.reset(); setFeedback("Guardado en la demo.");} else setFeedback("No se ha guardado. Revisa el mensaje situado al principio de Horarios."); } return <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4"><h3 className="font-bold">{title}</h3>{children}<button className={button}>Guardar</button><p role="status">{feedback}</p></form>; }
function DateField(){return <label className="block">Fecha<input className={input} name="date" type="date" defaultValue="2026-11-19" required/></label>}
function Times(){return <div className="grid gap-3 sm:grid-cols-2"><label>Inicio<input className={input} type="time" name="start" defaultValue="09:00"/></label><label>Fin<input className={input} type="time" name="end" defaultValue="14:00"/></label></div>}
function WeekdaySelect(){return <label className="block">Día de la semana<select className={input} name="weekday">{days.map((d,i)=><option value={i+1} key={d}>{d}</option>)}</select></label>}

export function AdditionalPlanning({ data, memberId, apply }: Props) {
  const [childId,setChildId]=useState(data.children[0]?.id ?? "");
  const childSchedule=data.schoolSchedules.find(s=>s.childId===childId);
  return <div className="space-y-4">
    <Panel title="Excepciones de mis turnos">
      {data.workShifts.filter(s=>s.memberId===memberId).map(s=><div key={s.id} className="space-y-2"><h3 className="font-bold">{s.label}</h3>{s.exceptions.map(ex=><p key={ex.id}>{ex.date} · {ex.range ? formatRange(ex.range) : "Libre"} · {ex.reason}</p>)}
        <Form title="Añadir excepción" submit={async f=>apply({type:"shiftException.save",shiftId:s.id,exceptionId:null,input:{date:field(f,"date"),mode:field(f,"mode") as "cambio"|"libre",start:field(f,"start"),end:field(f,"end"),reason:field(f,"reason")}})}><DateField/><label className="block">Tipo<select className={input} name="mode"><option value="cambio">Cambio de horario</option><option value="libre">Día libre</option></select></label><Times/><label className="block">Motivo<input className={input} name="reason" required/></label></Form>
      </div>)}
    </Panel>
    <Panel title="Horarios de colegio y guardería">
      <label className="block">Niño o niña<select className={input} value={childId} onChange={e=>setChildId(e.target.value)}>{data.children.map(c=><option key={c.id} value={c.id}>{c.name} · {c.center.name}</option>)}</select></label>
      <SchoolWeek key={`${childId}-${JSON.stringify(childSchedule?.sessions)}`} schedule={childSchedule?.sessions ?? []} submit={async days=>apply({type:"schoolWeek.save",childId,input:{days}})}/>
      <h3 className="font-bold">Excepciones registradas</h3>{childSchedule?.exceptions.length ? childSchedule.exceptions.map(ex=><p key={ex.id}>{ex.date} · {ex.range ? formatRange(ex.range) : "Sin clase"} · {ex.reason}</p>) : <p>No hay excepciones.</p>}
      <Form key={childId} title="Añadir excepción escolar" submit={async f=>apply({type:"schoolException.save",childId,exceptionId:null,input:{date:field(f,"date"),mode:field(f,"mode") as "horario"|"sin_clase",start:field(f,"start"),end:field(f,"end"),reason:field(f,"reason")}})}><DateField/><label className="block">Tipo<select name="mode" className={input}><option value="horario">Horario diferente</option><option value="sin_clase">Sin clase</option></select></label><Times/><label className="block">Motivo<input name="reason" className={input} required/></label></Form>
    </Panel>
    <Panel title="Eventos familiares y escolares">
      {data.events.map(e=><p key={e.id}>{e.date} · {e.title} {e.range ? `· ${formatRange(e.range)}` : "· todo el día"}</p>)}
      <Form title="Añadir evento" submit={async f=>apply({type:"event.save",eventId:null,input:{title:field(f,"title"),date:field(f,"date"),kind:field(f,"kind") as EventKind,allDay:f.has("allDay"),start:field(f,"start"),end:field(f,"end"),childIds:f.getAll("childIds").map(String),closesCenters:f.has("closesCenters")}})}><label className="block">Nombre<input className={input} name="title" required/></label><DateField/><label className="block">Tipo<select className={input} name="kind"><option value="familiar">Familiar</option><option value="escolar">Escolar</option><option value="festivo">Festivo</option></select></label><label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="allDay"/> Todo el día</label><Times/><fieldset><legend>Niños afectados</legend>{data.children.map(c=><label className="mr-4 inline-flex min-h-11 items-center gap-2" key={c.id}><input type="checkbox" name="childIds" value={c.id}/>{c.name}</label>)}</fieldset><label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="closesCenters"/> Centro cerrado todo el día</label></Form>
    </Panel>
    <Panel title="Disponibilidad de los abuelos">
      {data.members.filter(m=>m.role==="abuela"||m.role==="abuelo").map(m=><div key={m.id} className="space-y-2"><h3 className="font-bold">{m.name}</h3>{data.availability.filter(a=>a.memberId===m.id).map(a=><p key={a.id}>{a.date ?? (a.weekday ? days[a.weekday-1] : "")} · {a.available && a.range ? formatRange(a.range) : "No disponible"}</p>)}
        <Form title={`Añadir disponibilidad de ${m.name}`} submit={async f=>apply({type:"availability.save",memberId:m.id,availabilityId:null,input:{kind:field(f,"kind") as "recurrente"|"excepcion",weekday:field(f,"weekday"),date:field(f,"date"),available:field(f,"available")==="si",start:field(f,"start"),end:field(f,"end"),note:field(f,"note")}})}><label className="block">Frecuencia<select className={input} name="kind"><option value="recurrente">Cada semana</option><option value="excepcion">Un día concreto</option></select></label><WeekdaySelect/><DateField/><label className="block">Situación<select className={input} name="available"><option value="si">Disponible</option><option value="no">No disponible</option></select></label><Times/><label className="block">Nota opcional<input className={input} name="note"/></label></Form>
      </div>)}
    </Panel>
  </div>;
}

function SchoolWeek({schedule,submit}: {schedule: FamilySnapshot["schoolSchedules"][number]["sessions"];submit:(days:{weekday:Weekday;enabled:boolean;start:string;end:string;label:string}[])=>Promise<boolean>}) {
 const [rows,setRows]=useState(()=>days.map((_,i)=>{const weekday=(i+1) as Weekday;const s=schedule.find(x=>x.weekday===weekday);return {weekday,enabled:!!s,start:s?tm(s.range.start):"09:00",end:s?tm(s.range.end):"16:00",label:s?.label ?? "Horario escolar"};}));
 const [status,setStatus]=useState("");
 return <form className="space-y-3 rounded-lg border p-4" onSubmit={async e=>{e.preventDefault();setStatus(await submit(rows)?"Horario guardado en la demo.":"No se ha guardado; revisa el mensaje al principio de Horarios.")}}><h3 className="font-bold">Horario habitual</h3>{rows.map((r,i)=><fieldset className="rounded-lg border p-3" key={r.weekday}><legend>{days[i]}</legend><label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={r.enabled} onChange={e=>setRows(rows.map(x=>x.weekday===r.weekday?{...x,enabled:e.target.checked}:x))}/> Hay clase</label>{r.enabled && <div className="grid gap-2 sm:grid-cols-3"><label>Inicio<input className={input} type="time" value={r.start} onChange={e=>setRows(rows.map(x=>x.weekday===r.weekday?{...x,start:e.target.value}:x))}/></label><label>Fin<input className={input} type="time" value={r.end} onChange={e=>setRows(rows.map(x=>x.weekday===r.weekday?{...x,end:e.target.value}:x))}/></label><label>Descripción<input className={input} value={r.label} onChange={e=>setRows(rows.map(x=>x.weekday===r.weekday?{...x,label:e.target.value}:x))}/></label></div>}</fieldset>)}<button className={button}>Guardar horario escolar</button><p role="status">{status}</p></form>;
}
