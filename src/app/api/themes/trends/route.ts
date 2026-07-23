import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getSessionOrThrow();
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get("dateRange") || "7d";

    const now = new Date();

    // Determine period lengths
    const days = dateRange === "90d" ? 90 : dateRange === "30d" ? 30 : 7;

    const currentStart = new Date();
    currentStart.setDate(now.getDate() - days);

    const previousStart = new Date();
    previousStart.setDate(now.getDate() - days * 2);

    // Fetch themes in workspace
    const themes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        feedback: {
          include: {
            feedback: true,
          },
        },
      },
    });

    const trends = themes.map((theme) => {
      const currentFeedbacks = theme.feedback.filter(
        (tf) => tf.feedback.createdAt >= currentStart && tf.feedback.createdAt <= now
      );

      const previousFeedbacks = theme.feedback.filter(
        (tf) => tf.feedback.createdAt >= previousStart && tf.feedback.createdAt < currentStart
      );

      const currentCount = currentFeedbacks.length;
      const previousCount = previousFeedbacks.length;

      const volumeDiff = currentCount - previousCount;
      const pctGrowth = previousCount > 0 ? volumeDiff / previousCount : currentCount > 0 ? 1.0 : 0;
      const isSpiking = currentCount >= 3 && (previousCount === 0 || pctGrowth >= 0.5);

      // Generate daily sparkline
      const sparklineMap: Record<string, number> = {};
      const tempDate = new Date(currentStart);
      while (tempDate <= now) {
        const dateKey = tempDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        sparklineMap[dateKey] = 0;
        tempDate.setDate(tempDate.getDate() + 1);
      }

      currentFeedbacks.forEach((tf) => {
        const dateKey = new Date(tf.feedback.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (sparklineMap[dateKey] !== undefined) {
          sparklineMap[dateKey]++;
        }
      });

      const sparkline = Object.entries(sparklineMap).map(([date, count]) => ({ date, count }));

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        color: theme.color,
        currentVolume: currentCount,
        previousVolume: previousCount,
        growthRate: pctGrowth * 100,
        isSpiking,
        sparkline,
      };
    });

    trends.sort((a, b) => b.currentVolume - a.currentVolume);

    return NextResponse.json(trends);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred calculating theme trends" },
      { status: error.statusCode || 500 }
    );
  }
}
