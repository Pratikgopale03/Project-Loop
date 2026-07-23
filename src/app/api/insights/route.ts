import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";
import { vectorSearch } from "@/lib/search";
import { answerQuestion } from "@/lib/ai";
import * as zod from "zod";

const questionSchema = zod.object({
  question: zod.string().min(5, "Question must be at least 5 characters long"),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionOrThrow();
    
    const body = await request.json();
    const parsed = questionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { question } = parsed.data;

    // 1. Semantic search for top 5 relevant customer feedback logs in this workspace
    const matches = await vectorSearch(user.workspaceId, question, 5);

    // 2. Submit question + context to Claude to compile the grounded answer
    const answer = await answerQuestion(question, matches);

    // Return answer and list of matches (citations)
    return NextResponse.json({
      answer,
      citations: matches.map((m) => ({
        id: m.id,
        content: m.content,
        channel: m.channel,
        customerLabel: m.customerLabel,
        sentiment: m.sentiment,
        createdAt: m.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Ask LOOP Q&A Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred compiling insights" },
      { status: error.statusCode || 500 }
    );
  }
}
