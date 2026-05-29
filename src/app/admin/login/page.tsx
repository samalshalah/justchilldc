import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-2 text-slate-950">Admin Login</h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter the admin password to continue.
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
