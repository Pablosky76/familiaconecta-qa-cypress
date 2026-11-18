import { Bell, BellRing } from "lucide-react";

import { formatDateTime } from "@/domain/dates";
import type { AppNotification } from "@/domain/types";

export function NotificationList({ items }: { items: AppNotification[] }) {
  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n.id} className="flex gap-3 rounded-xl border bg-card p-4">
          {n.read ? (
            <Bell aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          ) : (
            <BellRing aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          )}
          <div className="min-w-0">
            <p className="font-bold">
              {n.title}
              {!n.read && <span className="ml-2 rounded-full bg-primary-soft px-2 text-xs text-secondary-foreground">Nuevo</span>}
            </p>
            <p className="text-muted-foreground">{n.body}</p>
            <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(n.createdAt)} · aviso ficticio</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
