import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { familyRepository } from "@/data";
import { ChildrenTimeline } from "@/components/timeline/ChildrenTimeline";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { TaskCard } from "@/components/app/TaskCard";
import { RequestBadge } from "@/components/app/status";
import type { FamilySnapshot } from "@/data";
import { formatDayFull, formatDayLong, formatRange } from "@/domain/dates";
import { taskTitle } from "@/lib/format";
import { NotificationList } from "./Notifications";

export function GrandparentHome({ snap, memberId }: { snap: FamilySnapshot; memberId: string }) {
  const { clock, members, children, careTasks, careRequests } = snap;
  const client = useQueryClient();
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  async function respond(id: string, decision: "aceptar" | "rechazar") {
    if (working) return;
    setWorking(true);
    try {
      const result = await familyRepository.respondToRequest(id, memberId, decision);
      setMessage(result.message);
      if (result.ok) await client.invalidateQueries({queryKey:["family-snapshot"]});
    } catch {
      setMessage("No se ha podido guardar la respuesta de prueba. Inténtalo de nuevo.");
    } finally { setWorking(false); }
  }
  const me = members.find((m) => m.id === memberId);
  const byTime = (a: { date: string; range: { start: number } }, b: { date: string; range: { start: number } }) => a.date.localeCompare(b.date) || a.range.start - b.range.start;
  const pending = careRequests.filter(r => r.recipientId === memberId && r.status === "pendiente")
    .map(r => ({ request: r, task: careTasks.find(t => t.id === r.taskId) }))
    .filter((item): item is typeof item & {task: NonNullable<typeof item.task>} => !!item.task && (item.task.date > clock.today || (item.task.date === clock.today && item.task.range.end > clock.nowMinutes)))
    .sort((a,b) => byTime(a.task,b.task));
  const upcoming = careTasks.filter(t => t.assigneeId === memberId && t.confirmation !== null && (t.date > clock.today || (t.date === clock.today && t.range.end > clock.nowMinutes))).sort(byTime);
  const others = careRequests.filter(r => r.recipientId === memberId && r.status !== "pendiente");
  return <div className="mx-auto max-w-3xl space-y-8 text-lg leading-relaxed">
    <header className="space-y-2"><p className="text-base font-semibold text-muted-foreground">{formatDayFull(clock.today)} · fecha de ejemplo</p><h1 className="font-display text-3xl font-bold sm:text-4xl">Hola, {me?.name ?? ""}</h1><p>Aquí puedes ver si la familia te necesita y lo que tienes previsto hacer.</p></header>
    <section aria-labelledby="pendientes" className="space-y-4"><div><h2 id="pendientes" className="text-2xl font-bold">¿Te piden ayuda?</h2><p className="text-base text-muted-foreground">Responde si puedes ayudar. Hasta entonces, nadie queda confirmado.</p></div>
      {pending.length === 0 ? <p className="rounded-xl border bg-card p-5">No tienes solicitudes pendientes.</p> : pending.map(({request,task}) => <article key={request.id} className="space-y-3 rounded-xl border-2 border-pending bg-card p-5 shadow-card">
        <p className="font-bold">Pendiente de respuesta</p><h3 className="text-xl font-bold">{taskTitle(task, children)}</h3>
        <p className="flex items-start gap-2"><CalendarDays className="mt-1 size-5 shrink-0" aria-hidden="true"/><span>{formatDayLong(task.date)}</span></p>
        <p className="flex items-start gap-2"><Clock className="mt-1 size-5 shrink-0" aria-hidden="true"/><span>{formatRange(task.range)}</span></p>
        <p className="flex items-start gap-2"><MapPin className="mt-1 size-5 shrink-0" aria-hidden="true"/><span>{task.location}</span></p>
        <p className="rounded-lg bg-pending-soft p-3 text-base"><strong>Ejemplo:</strong> esta solicitud no está confirmada. Las respuestas son solo de prueba y se pierden al recargar.</p><div className="flex flex-wrap gap-3"><button type="button" className="min-h-14 rounded-xl bg-primary px-6 text-lg font-bold text-primary-foreground" disabled={working} onClick={()=>respond(request.id,"aceptar")}>Sí, puedo ayudar</button><button type="button" className="min-h-14 rounded-xl border-2 px-6 text-lg font-bold" disabled={working} onClick={()=>respond(request.id,"rechazar")}>No puedo</button></div>
      </article>)}
      <p role="status" aria-live="polite" className="font-semibold">{message}</p>
    </section>
    <section aria-labelledby="proximas" className="space-y-4"><h2 id="proximas" className="text-2xl font-bold">Tus próximos cuidados</h2>
      {upcoming.length === 0 ? <p className="rounded-xl border bg-card p-5">No tienes cuidados confirmados próximamente.</p> : <div className="grid gap-4">{upcoming.map(task => <TaskCard key={task.id} task={task} members={members} children={children} requests={careRequests} showDate compact />)}</div>}
    </section>
    <details className="rounded-xl border bg-card p-5"><summary className="min-h-11 cursor-pointer font-bold">Ver el día de los niños</summary><div className="mt-4"><ChildrenTimeline snap={snap} /></div></details>
    <Link to="/calendario" search={{}} className="inline-flex min-h-14 items-center gap-3 rounded-xl border-2 bg-card px-5 py-3 text-lg font-bold hover:bg-primary-soft"><CalendarDays aria-hidden="true"/> Ver el calendario familiar</Link>
    <details className="rounded-xl border bg-card p-5"><summary className="min-h-11 cursor-pointer font-bold">Ver respuestas y avisos anteriores</summary><div className="mt-4 space-y-4">
      {others.length === 0 ? <p>No hay respuestas anteriores.</p> : <ul className="space-y-3">{others.map(r => {const task = careTasks.find(t => t.id === r.taskId); return task && <li key={r.id} className="rounded-lg border p-3"><RequestBadge status={r.status}/><p className="font-bold">{taskTitle(task,children)}</p><p>{formatDayLong(task.date)} · {formatRange(task.range)}</p></li>})}</ul>}
      <h3 className="font-bold">Avisos de ejemplo</h3><NotificationList items={snap.notifications.filter(n => n.recipientId === memberId)}/>
    </div></details>
    <p className="text-base text-muted-foreground">Laura y Javier organizan los horarios. Esta pantalla es una demostración con información ficticia.</p>
  </div>;
}
