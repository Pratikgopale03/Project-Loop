import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { generateRetentionEmail } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    await getSessionOrThrow();
    const body = await request.json();
    const { content, customerLabel, channel } = body;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const draft = await generateRetentionEmail(content, customerLabel, channel);
    return NextResponse.json(draft);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate retention email" },
      { status: error.statusCode || 500 }
    );
  }
}
