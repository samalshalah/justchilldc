import { createUploadVariants, prepareUploadFile } from "./optimize-upload";

export interface ImageUploadOptions {
  fileNameBase?: string;
  folder?: string;
  entityId?: string | number | null;
  signal?: AbortSignal;
  onUploaded: (path: string) => void;
}

export async function uploadWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (init.signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");
    const controller = new AbortController();
    const abort = () => controller.abort();
    init.signal?.addEventListener("abort", abort, { once: true });
    const timeout = setTimeout(abort, 120_000);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.ok) return response;
      if (response.status === 401) throw new Error("Your admin session expired. Sign in again and retry.");
      if (![408, 429].includes(response.status) && response.status < 500) {
        throw new Error(`Image upload was rejected (HTTP ${response.status}).`);
      }
      lastError = new Error(`Image upload failed (HTTP ${response.status}).`);
    } catch (error) {
      if (init.signal?.aborted) throw error;
      if (error instanceof Error && /session expired|was rejected/.test(error.message)) throw error;
      lastError = error;
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener("abort", abort);
    }
    if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw new Error(lastError instanceof Error && /HTTP/.test(lastError.message)
    ? lastError.message : "Upload interrupted. Check your connection and retry.");
}

export async function uploadAdminImage(file: File, options: ImageUploadOptions) {
  const prepared = await prepareUploadFile(file);
  const token = await uploadWithRetry("/api/admin/upload-url", {
    method: "POST", signal: options.signal,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: prepared.name, contentType: prepared.type,
      nameHint: options.fileNameBase, folder: options.folder, entityId: options.entityId }),
  });
  const { uploadUrl, objectPath } = await token.json() as { uploadUrl: string; objectPath: string };
  await uploadWithRetry(uploadUrl, {
    method: "PUT", signal: options.signal,
    headers: { "Content-Type": prepared.type }, body: prepared,
  });
  if (options.signal?.aborted) throw new DOMException("Upload cancelled", "AbortError");
  options.onUploaded(objectPath);
  if (options.folder !== "products") return { objectPath, warning: null };

  try {
    const variants = await createUploadVariants(prepared);
    for (const variant of variants) {
      const url = `${uploadUrl}${uploadUrl.includes("?") ? "&" : "?"}width=${variant.width}`;
      await uploadWithRetry(url, {
        method: "PUT", signal: options.signal,
        headers: { "Content-Type": "image/webp" }, body: variant.blob,
      });
    }
    return { objectPath, warning: null };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return { objectPath, warning: "Photo uploaded. Using the original where smaller copies are unavailable." };
  }
}
