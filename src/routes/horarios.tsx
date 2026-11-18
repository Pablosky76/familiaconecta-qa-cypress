import { AdditionalPlanning } from "@/components/planning/AdditionalPlanning";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useProfile, PARENT_PROFILES } from "@/app/profile";
import { RequireProfile } from "@/components/app/RequireProfile";
import { familyRepository, familySnapshotQuery } from "@/data";
import type { PlanningChange } from "@/domain/planning";
import type { Weekday, WorkShift } from "@/domain/types";
import { formatRange } from "@/domain/dates";

export const Route = createFileRoute("/horarios")({
  loader: ({ context }) => context.queryClient.ensureQueryData(familySnapshotQuery),
  head: () => ({ meta: [{ title: "Horarios · FamiliaConecta (demo)" }] }),
  component: Horarios,
});

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const time = (n: number) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
const control = "min-h-11 w-full rounded-lg border bg-background px-3 py-2";
const button = "min-h-11 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground";

function Horarios() {
  const { data } = useSuspenseQuery(familySnapshotQuery);
  const { memberId } = useProfile();
  const client = useQueryClient();
  const [editing, setEditing] = useState<WorkShift | "new" | null>(null);
  const [message, setMessage] = useState("");
  const [travelInput, setTravelInput] = useState(String(data.family.travelBufferMinutes));
  const [travelMessage, setTravelMessage] = useState("");
  async function saveTravel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!memberId) return;
    if (travelInput.trim() === "") { setTravelMessage("Indica los minutos."); return; }
    const result = await familyRepository.setTravelBuffer(memberId, Number(travelInput));
    setTravelMessage(result.message);
    if (result.ok) await client.invalidateQueries({ queryKey: ["family-snapshot"] });
  }
  async function apply(change: PlanningChange) {
    if (!memberId) return false;
    const result = await familyRepository.applyChange(change, memberId);
    if (!result.ok) { setMessage([result.message, ...Object.values(result.errors)].join(" ")); return false; }
    await client.invalidateQueries({ queryKey: ["family-snapshot"] });
    setMessage(`${result.summary}. ${result.flaggedTaskIds.length ? `${result.flaggedTaskIds.length} tarea(s) requieren revisión; se conserva su confirmación.` : ""}`);
    setEditing(null);
    return true;
  }
  return <RequireProfile allow={PARENT_PROFILES} audience="los progenitores">{() => <div className="space-y-6">
    <h1 className="text-3xl font-bold">Turnos y horarios</h1>
    <p className="rounded-xl border bg-card p-4">DEMO: usa solo datos ficticios. Los cambios se mantienen en esta pestaña y se pierden al recargar o reiniciar. El perfil no es una cuenta ni protege los datos.</p>
    <p role="status" aria-live="polite">{message}</p>
    <section className="space-y-4 rounded-xl border bg-card p-5"><h2 className="text-xl font-bold">Turnos laborales</h2>
      <p>Cada progenitor puede editar sus propios turnos en esta simulación.</p>
      {data.workShifts.map(s => <article key={s.id} className="rounded-lg border p-4"><p className="font-bold">{s.label} · {data.members.find(m => m.id === s.memberId)?.name}</p><p>{formatRange(s.range)} · {s.recurrence.weekdays.map(d => days[d-1]).join(", ")}</p>{s.memberId === memberId && <button className="min-h-11 underline" onClick={() => {setMessage("");setEditing(s);}}>Editar turno</button>}</article>)}
      <button className={button} onClick={() => {setMessage("");setEditing("new");}}>Añadir mi turno</button>
      {editing && <ShiftForm key={editing === "new" ? "new" : editing.id} shift={editing === "new" ? undefined : editing} onCancel={() => setEditing(null)} onSave={(input) => apply({type:"shift.save", shiftId: editing === "new" ? null : editing.id, memberId: memberId!, input})} />}
    </section>
    <details className="rounded-xl border bg-card p-5"><summary className="min-h-11 cursor-pointer text-xl font-bold">Tiempo entre lugares</summary>
      <p className="mb-3">Margen de prueba entre cuidados en lugares con nombres distintos. Es una cifra común, no calcula rutas ni tráfico; revisad el trayecto real.</p>
      <form onSubmit={saveTravel} className="space-y-3"><label className="block font-semibold">Minutos de margen<input className={control} type="number" min="0" max="180" step="1" value={travelInput} onChange={e=>setTravelInput(e.target.value)}/></label><button className={button} type="submit">Guardar margen de prueba</button><p role="status" aria-live="polite">{travelMessage}</p></form>
    </details>
    <AdditionalPlanning data={data} memberId={memberId!} apply={apply} />
  </div>}</RequireProfile>;
}

function ShiftForm({shift,onCancel,onSave}: {shift: WorkShift | undefined; onCancel:()=>void; onSave:(input: {label:string; weekdays:Weekday[];start:string;end:string;validFrom:string;validTo:string})=>void}) {
  const [label,setLabel]=useState(shift?.label ?? "");
  const [weekdays,setWeekdays]=useState<Weekday[]>(shift?.recurrence.weekdays ?? []);
  const [start,setStart]=useState(shift ? time(shift.range.start) : "08:00");
  const [end,setEnd]=useState(shift ? time(shift.range.end) : "17:00");
  const [validFrom,setFrom]=useState(shift?.recurrence.validFrom ?? "2026-11-16");
  const [validTo,setTo]=useState(shift?.recurrence.validTo ?? "");
  const submit=(e:FormEvent)=>{e.preventDefault();onSave({label,weekdays,start,end,validFrom,validTo});};
  return <form onSubmit={submit} className="space-y-4 rounded-xl border p-4"><h3 className="text-lg font-bold">{shift ? "Editar turno" : "Nuevo turno"}</h3>
    <label className="block">Nombre del turno<input className={control} value={label} onChange={e=>setLabel(e.target.value)} /></label>
    <fieldset><legend className="font-semibold">Días de la semana</legend><div className="flex flex-wrap gap-3">{days.map((d,i)=>{const n=(i+1) as Weekday;return <label key={d} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={weekdays.includes(n)} onChange={e=>setWeekdays(e.target.checked ? [...weekdays,n] : weekdays.filter(x=>x!==n))}/>{d}</label>})}</div></fieldset>
    <div className="grid gap-4 sm:grid-cols-2"><label>Inicio<input type="time" className={control} value={start} onChange={e=>setStart(e.target.value)}/></label><label>Fin<input type="time" className={control} value={end} onChange={e=>setEnd(e.target.value)}/></label><label>Válido desde<input type="date" className={control} value={validFrom} onChange={e=>setFrom(e.target.value)}/></label><label>Válido hasta (opcional)<input type="date" className={control} value={validTo} onChange={e=>setTo(e.target.value)}/></label></div>
    <p>Los turnos que pasan de medianoche no están disponibles en esta demo.</p><div className="flex flex-wrap gap-3"><button type="submit" className={button}>Guardar turno</button><button type="button" className="min-h-11 rounded-lg border px-4" onClick={onCancel}>Cancelar</button></div>
  </form>;
}
