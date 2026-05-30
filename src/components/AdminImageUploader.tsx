"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (newPath: string) => void;
}

function imageSrc(value: string): string {
  if (
    value.startsWith("/images/") ||
    value.startsWith("/api/storage/") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }
  return `/api/storage${value}`;
}

export function AdminImageUploader({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      // Get signed PUT URL from server
      const tokenRes = await fetch("/api/admin/upload-url", { method: "POST" });
      if (!tokenRes.ok) {
        const j = await tokenRes.json().catch(() => ({}));
        throw new Error(j.error || "Could not get upload URL");
      }
      const { uploadUrl, objectPath } = await tokenRes.json();

      // PUT the file directly to GCS
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Upload failed (HTTP ${putRes.status})`);

      onChange(objectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {value ? (
        <div className="flex items-start gap-3">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-white border border-zinc-200">
            <img
              src={imageSrc(value)}
              alt="preview"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-400 break-all max-w-[300px]">
              {value}
            </p>
            <div className="flex gap-2">
              <label className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm cursor-pointer transition-colors">
                Replace
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onInput}
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                onClick={() => onChange("")}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="block w-full border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-600 hover:bg-zinc-900/50 transition-colors">
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={onInput}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-6 h-6 mx-auto text-zinc-400 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 mx-auto text-zinc-500" />
          )}
          <p className="text-sm text-zinc-400 mt-2">
            {uploading ? "Uploading..." : "Click to upload an image"}
          </p>
        </label>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
