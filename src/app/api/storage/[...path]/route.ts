/**
 * /api/storage/[...path] - proxy object storage media to public URLs.
 *
 * Two URL families:
 *   /api/storage/objects/<id>      -> media bucket (admin-uploaded images)
 *   /api/storage/public/<filename> → public search-path lookup
 */

import { NextResponse } from "next/server";
import {
  ObjectNotFoundError,
  getEntityObject,
  findPublicObject,
  streamObject,
} from "@/lib/storage";
import { parseImageVariantWidth } from "@/lib/image-variants";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  try {
    if (path[0] === "objects") {
      const requestedWidth = new URL(req.url).searchParams.get("width");
      const width = parseImageVariantWidth(requestedWidth);
      if (requestedWidth && !width) {
        return NextResponse.json({ error: "Unsupported image width" }, { status: 400 });
      }
      const result = await getEntityObject("/" + path.join("/"), width);
      const response = streamObject(result.object, {
        isPublic: true,
        cacheTtlSec: width && !result.variantWidth ? 60 : 604800,
      });
      response.headers.set("X-Image-Width", result.variantWidth ? String(result.variantWidth) : "original");
      return response;
    }
    if (path[0] === "public") {
      const filename = path.slice(1).join("/");
      if (!filename) {
        return NextResponse.json({ error: "Missing filename" }, { status: 400 });
      }
      const object = await findPublicObject(filename);
      if (!object) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return streamObject(object, { isPublic: true });
    }
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  } catch (err) {
    if (err instanceof ObjectNotFoundError) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("[storage] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Storage error" },
      { status: 500 }
    );
  }
}
