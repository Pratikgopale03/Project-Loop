import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbedding, saveEmbedding } from "@/lib/search";

export const dynamic = "force-dynamic";

function getRandomThemeColor(): string {
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      const rawText = await request.text().catch(() => "");
      if (rawText) {
        try {
          body = JSON.parse(rawText);
        } catch {
          body = { content: rawText };
        }
      }
    }

    // Extract text content dynamically from various webhook payload formats (Zapier, Make, Twitter, Zomato)
    const content = body.content || body.text || body.message || body.description || body.comment || body.review;
    const channel = body.channel || body.source || body.platform || "Live Webhook";
    const customerLabel = body.customerLabel || body.author || body.user || body.username || body.name || body.customer || "Live Customer";
    const sourceRef = body.sourceRef || body.id || body.tweet_id || body.link || null;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content field is required in payload (e.g., content, text, message, or review)" },
        { status: 400 }
      );
    }

    // Target specific workspace if workspaceId passed in body, header, or query, else default to primary active workspace
    const { searchParams } = new URL(request.url);
    const requestedWorkspaceId = body.workspaceId || request.headers.get("x-workspace-id") || searchParams.get("workspaceId");

    let workspace = null;
    if (requestedWorkspaceId) {
      workspace = await db.workspace.findUnique({ where: { id: requestedWorkspaceId } });
    }
    if (!workspace) {
      workspace = await db.workspace.findFirst();
    }

    if (!workspace) {
      return NextResponse.json({ error: "No active workspace found" }, { status: 404 });
    }

    // Fetch existing themes for context
    const existingThemes = (
      await db.theme.findMany({
        where: { workspaceId: workspace.id },
        select: { name: true },
      })
    ).map((t) => t.name);

    // 1. AI Sentiment & Theme Classification
    const classification = await classifyFeedback(content, existingThemes);

    // 2. Generate Vector Embedding
    const vector = await generateEmbedding(content);

    // 3. Save Feedback to Database
    const feedback = await db.feedback.create({
      data: {
        content: content.trim(),
        channel: String(channel).trim(),
        sourceRef: sourceRef ? String(sourceRef) : null,
        customerLabel: String(customerLabel).trim(),
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        status: "NEW",
        workspaceId: workspace.id,
      },
    });

    // 4. Save pgvector Embedding
    await saveEmbedding(feedback.id, vector);

    // 5. Upsert & Link Themes
    for (const themeName of classification.themes) {
      const theme = await db.theme.upsert({
        where: {
          name_workspaceId: {
            name: themeName,
            workspaceId: workspace.id,
          },
        },
        update: {},
        create: {
          name: themeName,
          workspaceId: workspace.id,
          color: getRandomThemeColor(),
        },
      });

      await db.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: "Live feedback successfully ingested via Webhook",
      feedbackId: feedback.id,
      sentiment: classification.sentiment,
      themes: classification.themes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process incoming webhook" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/incoming",
    supportedPayloadFields: ["content", "text", "message", "review", "channel", "source", "customerLabel", "author"],
    instructions: "Send POST JSON requests to this URL from Zapier, Make.com, Twitter bots, Zomato webhooks, or cURL scripts.",
  });
}
