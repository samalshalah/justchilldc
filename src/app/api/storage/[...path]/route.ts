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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  try {
    if (path[0] === "objects") {
      const object = await getEntityObject("/" + path.join("/"));
      return streamObject(object, { isPublic: true, cacheTtlSec: 604800 });
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
