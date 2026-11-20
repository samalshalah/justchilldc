"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X, Loader2, RotateCw } from "lucide-react";
import { PRODUCT_IMAGE_ACCEPT } from "@/lib/optimize-upload";
import { uploadAdminImage } from "@/lib/upload-image";

interface Props {
  value: string;
  onChange: (newPath: string) => void;
  fileNameBase?: string;
  folder?: string;
  entityId?: string | number | null;
  onUploadingChange?: (uploading: boolean) => void;
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

export function AdminImageUploader({
  value,
  onChange,
  fileNameBase,
  folder,
  entityId,
  onUploadingChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [retryFile, setRetryFile] = useState<File | null>(null);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const notify = useRef(onUploadingChange);
  notify.current = onUploadingChange;
  useEffect(() => () => {
    controller.current?.abort();
    if (busy.current) { busy.current = false; notify.current?.(false); }
  }, []);

  const handleFile = async (file: File) => {
    if (busy.current) return;
    busy.current = true;
    controller.current = new AbortController();
    setError(null);
    setWarning(null);
    setRetryFile(null);
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const result = await uploadAdminImage(file, {
        fileNameBase, folder, entityId, signal: controller.current.signal, onUploaded: onChange,
      });
      if (!controller.current.signal.aborted) setWarning(result.warning);
    } catch (err) {
      if (!controller.current.signal.aborted) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setRetryFile(file);
      }
    } finally {
      if (busy.current) {
        busy.current = false;
        setUploading(false);
        notify.current?.(false);
      }
    }
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (file) void handleFile(file);
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
                  accept={folder === "products" ? PRODUCT_IMAGE_ACCEPT : "image/*,.heic,.heif"}
                  onChange={onInput}
                  disabled={uploading}
                />
              </label>
              <button
                type="button"
                disabled={uploading}
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
            accept={folder === "products" ? PRODUCT_IMAGE_ACCEPT : "image/*,.heic,.heif"}
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
      {value && uploading && <Loader2 className="mt-2 h-5 w-5 animate-spin text-zinc-400" aria-label="Uploading image" />}
      {warning && <p role="status" className="text-xs text-amber-600 mt-2">{warning}</p>}
      {error && <p role="alert" className="text-xs text-red-400 mt-2">{error}</p>}
      {retryFile && !uploading && (
        <button type="button" onClick={() => void handleFile(retryFile)}
          className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-400 px-3 text-sm">
          <RotateCw className="h-4 w-4" /> Retry upload
        </button>
      )}
    </div>
  );
}
