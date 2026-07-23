import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow, enforceRole } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbedding, saveEmbedding } from "@/lib/search";
import * as zod from "zod";

const createFeedbackSchema = zod.object({
  content: zod.string().min(1, "Feedback content is required"),
  channel: zod.string().min(1, "Channel is required"),
  sourceRef: zod.string().optional(),
  customerLabel: zod.string().optional(),
});

function getRandomThemeColor(): string {
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function POST(request: Request) {
  try {
    const user = await getSessionOrThrow();
    // Enforce role: ADMIN or ANALYST can create feedback
    enforceRole(user.role, ["ADMIN", "ANALYST"]);

    const body = await request.json();
    const parsed = createFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, channel, sourceRef, customerLabel } = parsed.data;

    // AI1: Fetch existing themes to guide Claude classification
    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { name: true }
    });
    const themeNames = existingThemes.map((t) => t.name);

    // Run Auto-classification
    const classification = await classifyFeedback(content, themeNames);

    // Generate Text Embedding Vector
    const vector = await generateEmbedding(content);

    // Insert Feedback record with AI metrics
    const feedback = await db.feedback.create({
      data: {
        content,
        channel,
        sourceRef: sourceRef || null,
        customerLabel: customerLabel || null,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        status: "NEW",
        workspaceId: user.workspaceId,
      },
    });

    // Save pgvector Embedding
    await saveEmbedding(feedback.id, vector);

    // Upsert themes and link relations
    for (const themeName of classification.themes) {
      const theme = await db.theme.upsert({
        where: {
          name_workspaceId: {
            name: themeName,
            workspaceId: user.workspaceId,
          },
        },
        update: {},
        create: {
          name: themeName,
          workspaceId: user.workspaceId,
          color: getRandomThemeColor(),
        },
      });

      await db.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
          confidence: 1.0,
        },
      });
    }

    // Return the enriched feedback record
    const enrichedFeedback = await db.feedback.findUnique({
      where: { id: feedback.id },
      include: {
        themes: {
          include: {
            theme: true,
          },
        },
      },
    });

    return NextResponse.json(enrichedFeedback, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await getSessionOrThrow();
    // Enforce role: ADMIN, ANALYST, and VIEWER can list feedback
    enforceRole(user.role, ["ADMIN", "ANALYST", "VIEWER"]);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const channel = searchParams.get("channel") || undefined;
    const sentiment = searchParams.get("sentiment") || undefined;
    const status = searchParams.get("status") || undefined;
    const query = searchParams.get("query") || undefined;
    const themeId = searchParams.get("themeId") || undefined;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      workspaceId: user.workspaceId,
    };

    if (channel && channel !== "ALL") {
      whereClause.channel = channel;
    }
    if (sentiment && sentiment !== "ALL") {
      whereClause.sentiment = sentiment;
    }
    if (status && status !== "ALL") {
      whereClause.status = status;
    }
    if (themeId) {
      whereClause.themes = {
        some: {
          themeId: themeId,
        },
      };
    }
    if (query) {
      whereClause.content = {
        contains: query,
        mode: "insensitive",
      };
    }

    const [total, items] = await db.$transaction([
      db.feedback.count({ where: whereClause }),
      db.feedback.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          themes: {
            include: {
              theme: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: error.statusCode || 500 }
    );
  }
}
