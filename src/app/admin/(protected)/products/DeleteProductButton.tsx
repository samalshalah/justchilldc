"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/lib/admin-mutations-client";

export function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const [pending, startTransition] = useTransition();
  const onClick = () => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteProduct(id);
    });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="p-2 rounded-lg text-zinc-400 hover:bg-red-950/40 hover:text-red-400 transition-colors disabled:opacity-50"
      aria-label={`Delete ${name}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
