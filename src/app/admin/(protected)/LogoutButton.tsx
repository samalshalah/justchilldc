"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const onLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={onLogout}
      className="text-xs font-medium text-slate-500 hover:text-blue-700"
    >
      Sign out
    </button>
  );
}
