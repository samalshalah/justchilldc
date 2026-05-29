export function isLocalPreviewMode(): boolean {
  return process.env.LOCAL_PREVIEW_MODE === "1";
}
