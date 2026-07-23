import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow, enforceRole } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbedding, saveEmbedding } from "@/lib/search";
import * as zod from "zod";

const csvRowSchema = zod.object({
  content: zod.string().min(1, "Feedback content is required"),
  channel: zod.string().min(1, "Channel is required"),
  customerLabel: zod.string().optional(),
});

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(val => val.replace(/^["']|["']$/g, "").trim());
}

function getRandomThemeColor(): string {
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function POST(request: Request) {
  try {
    const user = await getSessionOrThrow();
    // Enforce role: ADMIN and ANALYST can upload CSVs
    enforceRole(user.role, ["ADMIN", "ANALYST"]);

    const text = await request.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain a header row and at least one data row" },
        { status: 400 }
      );
    }

    const headers = parseCSVLine(lines[0]);
    const contentIdx = headers.findIndex(h => h.toLowerCase() === "content");
    const channelIdx = headers.findIndex(h => h.toLowerCase() === "channel");
    const labelIdx = headers.findIndex(h => h.toLowerCase() === "customerlabel" || h.toLowerCase() === "label");

    if (contentIdx === -1 || channelIdx === -1) {
      return NextResponse.json(
        { error: "CSV headers must include 'content' and 'channel' fields" },
        { status: 400 }
      );
    }

    // Get current theme names for Claude guiding
    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { name: true }
    });
    const themeNames = existingThemes.map(t => t.name);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Process rows sequentially to avoid Anthropic rate limiting and memory timeouts
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      try {
        const columns = parseCSVLine(line);
        if (columns.length < 2) {
          failCount++;
          errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }

        const rawRow = {
          content: columns[contentIdx],
          channel: columns[channelIdx],
          customerLabel: labelIdx !== -1 ? columns[labelIdx] : undefined,
        };

        const parsed = csvRowSchema.safeParse(rawRow);

        if (!parsed.success) {
          failCount++;
          errors.push(`Row ${i + 1}: ${parsed.error.issues[0].message}`);
          continue;
        }

        // 1. Classify with Claude
        const classification = await classifyFeedback(parsed.data.content, themeNames);

        // 2. Generate Embedding
        const vector = await generateEmbedding(parsed.data.content);

        // 3. Create Feedback
        const feedback = await db.feedback.create({
          data: {
            content: parsed.data.content,
            channel: parsed.data.channel,
            customerLabel: parsed.data.customerLabel || null,
            sentiment: classification.sentiment,
            sentimentScore: classification.sentimentScore,
            status: "NEW",
            workspaceId: user.workspaceId,
          }
        });

        // 4. Save embedding
        await saveEmbedding(feedback.id, vector);

        // 5. Connect/Create Themes
        for (const themeName of classification.themes) {
          const theme = await db.theme.upsert({
            where: {
              name_workspaceId: {
                name: themeName,
                workspaceId: user.workspaceId,
              }
            },
            update: {},
            create: {
              name: themeName,
              workspaceId: user.workspaceId,
              color: getRandomThemeColor(),
            }
          });

          await db.feedbackTheme.create({
            data: {
              feedbackId: feedback.id,
              themeId: theme.id,
              confidence: 1.0,
            }
          });

          // Feed newly created themes back to guiding list for the next rows
          if (!themeNames.includes(themeName)) {
            themeNames.push(themeName);
          }
        }

        successCount++;
      } catch (err: any) {
        failCount++;
        errors.push(`Row ${i + 1}: Ingestion error - ${err.message}`);
      }
    }

    return NextResponse.json({
      message: "Bulk upload completed",
      successCount,
      failCount,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during CSV upload" },
      { status: error.statusCode || 500 }
    );
  }
}
