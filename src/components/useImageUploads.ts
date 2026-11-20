"use client";

import { useCallback, useState } from "react";

export function useImageUploads() {
  const [count, setCount] = useState(0);
  const onUploadingChange = useCallback((uploading: boolean) => {
    setCount((current) => Math.max(0, current + (uploading ? 1 : -1)));
  }, []);
  return { imageUploading: count > 0, onUploadingChange };
}
