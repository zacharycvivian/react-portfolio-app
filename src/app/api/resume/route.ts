import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/../auth";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = path.join(
    process.cwd(),
    "protected",
    "zcvivian_Resume.pdf"
  );

  try {
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="zcvivian_Resume.pdf"',
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Failed to serve resume:", error);
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
