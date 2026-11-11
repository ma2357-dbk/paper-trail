import { prisma } from "@/lib/db";

/** Serves the stored scan. Same-origin only; no caching because the file can be replaced. */
export async function GET(_request: Request, context: RouteContext<"/api/documents/[id]/file">) {
  const { id } = await context.params;
  const document = await prisma.document.findUnique({
    where: { id },
    select: { data: true, mimeType: true, fileName: true },
  });
  if (!document?.data || !document.mimeType) {
    return new Response("Not found", { status: 404 });
  }
  const safeName = encodeURIComponent(document.fileName ?? "document");
  return new Response(new Uint8Array(document.data), {
    headers: {
      "content-type": document.mimeType,
      "content-disposition": `inline; filename*=UTF-8''${safeName}`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
