import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { generateActionSpec } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    await getSessionOrThrow();
    const body = await request.json();
    const { content, channel, customerLabel } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const spec = await generateActionSpec(content, channel, customerLabel);
    return NextResponse.json(spec);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate action spec" },
      { status: error.statusCode || 500 }
    );
  }
}
