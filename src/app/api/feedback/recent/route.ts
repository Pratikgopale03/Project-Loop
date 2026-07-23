import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionOrThrow();

    const items = await db.feedback.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        content: true,
        channel: true,
        sentiment: true,
        createdAt: true,
        customerLabel: true,
      },
    });

    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch recent feedback" },
      { status: error.statusCode || 500 }
    );
  }
}
