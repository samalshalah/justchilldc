interface Hyperdrive {
  connectionString: string;
}

interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: {
    contentType?: string;
  };
  size: number;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
}

interface CloudflareEnv {
  HYPERDRIVE?: Hyperdrive;
  MEDIA_BUCKET?: R2Bucket;
  NEXT_INC_CACHE_R2_BUCKET?: R2Bucket;
  NEXT_PUBLIC_SITE_URL?: string;
  ADMIN_PASSWORD?: string;
}
