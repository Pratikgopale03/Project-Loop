import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionOrThrow();
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") || "ALL";
    const dateRange = searchParams.get("dateRange") || "7d";

    const now = new Date();
    let startDate = new Date();
    if (dateRange === "30d") {
      startDate.setDate(now.getDate() - 30);
    } else if (dateRange === "90d") {
      startDate.setDate(now.getDate() - 90);
    } else {
      startDate.setDate(now.getDate() - 7); // Default 7d
    }

    const whereClause: any = {
      workspaceId: user.workspaceId,
      createdAt: {
        gte: startDate,
      },
    };

    if (channel && channel !== "ALL") {
      whereClause.channel = channel;
    }

    const [total, positive, negative, pending, items, themes] = await Promise.all([
      db.feedback.count({ where: whereClause }),
      db.feedback.count({ where: { ...whereClause, sentiment: "POS" } }),
      db.feedback.count({ where: { ...whereClause, sentiment: "NEG" } }),
      db.feedback.count({ where: { ...whereClause, status: "NEW" } }),
      db.feedback.findMany({
        where: whereClause,
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.theme.findMany({
        where: { workspaceId: user.workspaceId },
        include: {
          _count: {
            select: { feedback: true }
          }
        },
        take: 5,
      })
    ]);

    // Format Volume Over Time
    const volumeMap: Record<string, number> = {};
    const temp = new Date(startDate);
    while (temp <= now) {
      const label = temp.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      volumeMap[label] = 0;
      temp.setDate(temp.getDate() + 1);
    }

    items.forEach((item) => {
      const label = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (volumeMap[label] !== undefined) {
        volumeMap[label]++;
      }
    });

    const volumeData = Object.entries(volumeMap).map(([date, count]) => ({
      date,
      count,
    }));

    // Format Sentiment Breakdown
    const posPct = total > 0 ? Math.round((positive / total) * 100) : 0;
    const negPct = total > 0 ? Math.round((negative / total) * 100) : 0;
    const neuPct = total > 0 ? Math.round(((total - positive - negative) / total) * 100) : 0;

    const sentimentData = [
      { name: "Positive", value: posPct, color: "#10b981" },
      { name: "Neutral", value: neuPct, color: "#64748b" },
      { name: "Negative", value: negPct, color: "#f43f5e" },
    ];

    // Format Theme Data
    const themeColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
    let themeData = themes.map((t, idx) => ({
      name: t.name,
      count: t._count.feedback,
      color: themeColors[idx % themeColors.length],
    }));

    if (themeData.length === 0) {
      themeData = [
        { name: "Unclassified", count: total, color: "#64748b" }
      ];
    }

    return NextResponse.json({
      stats: {
        total,
        positiveRatio: posPct,
        negativeRatio: negPct,
        pendingTriage: pending,
      },
      volumeData,
      sentimentData,
      themeData,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred fetching dashboard analytics" },
      { status: error.statusCode || 500 }
    );
  }
}
