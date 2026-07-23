import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/auth";
import { generateVocReport } from "@/lib/ai";
import * as zod from "zod";

const createReportSchema = zod.object({
  title: zod.string().min(3, "Title must be at least 3 characters long"),
  periodStart: zod.string(),
  periodEnd: zod.string(),
});

export async function GET() {
  try {
    const user = await getSessionOrThrow();

    const reports = await db.report.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        generatedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred fetching reports" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionOrThrow();

    const body = await request.json();
    const parsed = createReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { title, periodStart, periodEnd } = parsed.data;

    // Set startDate to beginning of day (00:00:00.000 UTC)
    const startDate = new Date(periodStart);
    startDate.setUTCHours(0, 0, 0, 0);

    // Set endDate to end of day (23:59:59.999 UTC) so same-day ranges work
    const endDate = new Date(periodEnd);
    endDate.setUTCHours(23, 59, 59, 999);

    // 1. Query pre-computed statistics in database for date range (scoped by workspace)
    const baseWhere = {
      workspaceId: user.workspaceId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [totalCount, positiveCount, negativeCount, rawFeedbacks, themes] = await db.$transaction([
      db.feedback.count({ where: baseWhere }),
      db.feedback.count({ where: { ...baseWhere, sentiment: "POS" } }),
      db.feedback.count({ where: { ...baseWhere, sentiment: "NEG" } }),
      db.feedback.findMany({
        where: baseWhere,
        select: { content: true, sentiment: true },
        take: 30, // scan sample size
      }),
      db.theme.findMany({
        where: { workspaceId: user.workspaceId },
        include: {
          feedback: {
            where: {
              feedback: {
                createdAt: { gte: startDate, lte: endDate }
              }
            }
          }
        }
      })
    ]);

    if (totalCount === 0) {
      return NextResponse.json(
        { error: "No feedback found within the specified date range. Cannot generate report." },
        { status: 400 }
      );
    }

    // Sentiment splits
    const positivePct = Math.round((positiveCount / totalCount) * 100);
    const negativePct = Math.round((negativeCount / totalCount) * 100);

    // Top themes in range
    const topThemes = themes
      .map((t) => ({ name: t.name, count: t.feedback.length }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Representative quotes: pick up to 3 positive and 3 negative comments
    const positiveQuotes = rawFeedbacks
      .filter((f) => f.sentiment === "POS")
      .slice(0, 3)
      .map((f) => f.content);

    const negativeQuotes = rawFeedbacks
      .filter((f) => f.sentiment === "NEG")
      .slice(0, 3)
      .map((f) => f.content);

    const quotes = [...positiveQuotes, ...negativeQuotes];
    if (quotes.length === 0 && rawFeedbacks.length > 0) {
      // fallback to any
      quotes.push(...rawFeedbacks.slice(0, 4).map((f) => f.content));
    }

    // Stats package
    const stats = {
      totalCount,
      positivePct,
      negativePct,
      topThemes,
    };

    // 2. Call Claude report narrative writer
    const narrative = await generateVocReport(title, startDate, endDate, stats, quotes);

    // 3. Save report output inside DB
    const contentJson = JSON.stringify({
      stats,
      quotes,
      narrative,
    });

    const report = await db.report.create({
      data: {
        title,
        periodStart: startDate,
        periodEnd: endDate,
        contentJson,
        workspaceId: user.workspaceId,
        generatedById: user.id,
      },
      include: {
        generatedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    console.error("Report Ingestion Error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred generating report" },
      { status: error.statusCode || 500 }
    );
  }
}
