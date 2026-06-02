/**
 * GET /api/download?url=...&filename=...
 *
 * Proxies a gallery image so the browser downloads it as an attachment.
 *
 * SECURITY: the `url` is attacker-controllable, so this endpoint must NOT fetch
 * arbitrary URLs (that would be an SSRF vector — internal services, cloud
 * metadata endpoints, etc.). We only allow HTTPS URLs whose host is one of our
 * known image hosts (kept in sync with `next.config.js` remotePatterns).
 */
import { NextRequest, NextResponse } from "next/server";

// Hostnames (or parent domains) we're willing to proxy images from.
const ALLOWED_HOST_SUFFIXES = [
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "googleusercontent.com", // covers lh3.googleusercontent.com, etc.
  "avatars.githubusercontent.com",
];

/** True only for https URLs hosted on an allowlisted domain. */
function isAllowedUrl(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") ?? "photo.jpg";

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Upstream ${response.status}`);
    const blob = await response.blob();
    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
