import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow, enforceRole } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";

function getRandomThemeColor(): string {
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionOrThrow();
    // Enforce role: ADMIN or ANALYST can reclassify feedback
    enforceRole(user.role, ["ADMIN", "ANALYST"]);

    const { id } = params;

    // Verify feedback exists and belongs to the workspace
    const feedback = await db.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    if (feedback.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch workspace themes
    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { name: true }
    });
    const themeNames = existingThemes.map((t) => t.name);

    // Call Claude reclassification
    const classification = await classifyFeedback(feedback.content, themeNames);

    // Run update in transaction
    const updatedFeedback = await db.$transaction(async (tx) => {
      // 1. Delete old theme associations
      await tx.feedbackTheme.deleteMany({
        where: { feedbackId: id },
      });

      // 2. Upsert newly identified themes and create links
      for (const themeName of classification.themes) {
        const theme = await tx.theme.upsert({
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

        await tx.feedbackTheme.create({
          data: {
            feedbackId: id,
            themeId: theme.id,
            confidence: 1.0,
          },
        });
      }

      // 3. Update feedback record
      return await tx.feedback.update({
        where: { id },
        data: {
          sentiment: classification.sentiment,
          sentimentScore: classification.sentimentScore,
        },
        include: {
          themes: {
            include: {
              theme: true,
            },
          },
        },
      });
    });

    return NextResponse.json(updatedFeedback);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during reclassification" },
      { status: error.statusCode || 500 }
    );
  }
}
