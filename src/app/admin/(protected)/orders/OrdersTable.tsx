"use client";

import { useState, useTransition } from "react";
import { setOrderStatus } from "@/lib/admin-mutations-client";
import type { Order, OrderItem } from "@/lib/data";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-900/30 text-amber-300 border-amber-800",
  ready: "bg-blue-900/30 text-blue-300 border-blue-800",
  completed: "bg-emerald-900/30 text-emerald-300 border-emerald-800",
  cancelled: "bg-red-900/30 text-red-300 border-red-800",
};

interface Props {
  orders: (Order & { items: OrderItem[] })[];
}

export function OrdersTable({ orders }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Record<number, string>>({});

  const updateStatus = (
    id: number,
    status: "pending" | "ready" | "completed" | "cancelled"
  ) => {
    setOptimistic((s) => ({ ...s, [id]: status }));
    startTransition(async () => {
      try {
        await setOrderStatus(id, status);
      } catch {
        setOptimistic((s) => {
          const c = { ...s };
          delete c[id];
          return c;
        });
      }
    });
  };

  if (orders.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-400">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((o) => {
        const status = optimistic[o.id] ?? o.status;
        return (
          <div
            key={o.id}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                setExpanded((e) => (e === o.id ? null : o.id))
              }
              className="w-full flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono text-amber-500">{o.confirmationCode}</p>
                <p className="text-sm text-zinc-400 truncate">
                  {o.customerName} · {o.customerPhone}
                </p>
              </div>
              <div className="hidden md:block text-sm text-zinc-500 whitespace-nowrap" suppressHydrationWarning>
                {new Date(o.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/New_York",
                })}
              </div>
              <div className="hidden md:block text-sm text-zinc-300 whitespace-nowrap">
                {o.preferredPickupTime}
              </div>
              <div className="font-bold text-amber-500 whitespace-nowrap">
                ${o.totalPrice}
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs border whitespace-nowrap ${
                  STATUS_COLORS[status] ?? STATUS_COLORS.pending
                }`}
              >
                {status}
              </span>
            </button>
            {expanded === o.id && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300 mb-2">
                      Items
                    </h3>
                    <ul className="space-y-1 text-sm">
                      {o.items.map((it) => (
                        <li key={it.id} className="flex justify-between">
                          <span>
                            {it.quantity} × {it.productName}
                          </span>
                          <span className="text-zinc-400">
                            ${it.pricePerItem * it.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-300 mb-2">
                      Customer
                    </h3>
                    <p className="text-sm text-zinc-400 break-all">
                      {o.customerEmail}
                    </p>
                    <p className="text-sm text-zinc-400">{o.customerPhone}</p>
                    {o.notes && (
                      <p className="text-sm text-zinc-400 mt-2 italic">
                        &ldquo;{o.notes}&rdquo;
                      </p>
                    )}
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1.5">
                        Status
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {(
                          ["pending", "ready", "completed", "cancelled"] as const
                        ).map((s) => (
                          <button
                            key={s}
                            type="button"
                            disabled={pending}
                            onClick={() => updateStatus(o.id, s)}
                            className={`px-2.5 py-1 rounded text-xs border transition-colors disabled:opacity-50 ${
                              status === s
                                ? STATUS_COLORS[s]
                                : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
