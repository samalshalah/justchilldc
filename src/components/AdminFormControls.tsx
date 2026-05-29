"use client";

import { forwardRef } from "react";

export function Field({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </span>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {hint && !error && (
        <p className="text-xs text-slate-500 mt-1">{hint}</p>
      )}
    </label>
  );
}

const inputBase =
  "w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return <input ref={ref} {...props} className={`${inputBase} ${props.className ?? ""}`} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea(props, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={`${inputBase} resize-y ${props.className ?? ""}`}
    />
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select(props, ref) {
  return (
    <select
      ref={ref}
      {...props}
      className={`${inputBase} ${props.className ?? ""}`}
    />
  );
});

export const Checkbox = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label: string }
>(function Checkbox({ label, ...props }, ref) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
      <input
        ref={ref}
        type="checkbox"
        {...props}
        className="w-4 h-4 rounded border-slate-300 bg-white accent-blue-600"
      />
      {label}
    </label>
  );
});
