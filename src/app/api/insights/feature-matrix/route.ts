import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionOrThrow();

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

    // If no themes exist yet, fallback to grouping by channel
    if (themes.length === 0) {
      const feedbacks = await db.feedback.findMany({
        where: { workspaceId: user.workspaceId },
      });

      const channelMap: Record<string, { total: number; pos: number; neu: number; neg: number }> = {};
      feedbacks.forEach((f) => {
        const name = f.channel;
        if (!channelMap[name]) channelMap[name] = { total: 0, pos: 0, neu: 0, neg: 0 };
        channelMap[name].total++;
        if (f.sentiment === "POS") channelMap[name].pos++;
        else if (f.sentiment === "NEG") channelMap[name].neg++;
        else channelMap[name].neu++;
      });

      const matrix = Object.entries(channelMap).map(([area, stats]) => {
        const posPct = Math.round((stats.pos / stats.total) * 100);
        const negPct = Math.round((stats.neg / stats.total) * 100);
        const neuPct = 100 - posPct - negPct;
        const csat = Number((1.0 + (stats.pos * 4 + stats.neu * 2) / stats.total).toFixed(1));
        let grade = "B";
        if (posPct >= 70) grade = "A+";
        else if (posPct >= 50) grade = "B";
        else if (negPct >= 40) grade = "F";
        else grade = "C";

        return {
          featureArea: area,
          total: stats.total,
          posPct,
          neuPct,
          negPct,
          csat,
          grade,
        };
      });

      return NextResponse.json(matrix);
    }

    const matrix = themes.map((t) => {
      const items = t.feedback.map((tf) => tf.feedback);
      const total = items.length;
      let pos = 0;
      let neu = 0;
      let neg = 0;

      items.forEach((f) => {
        if (f.sentiment === "POS") pos++;
        else if (f.sentiment === "NEG") neg++;
        else neu++;
      });

      const posPct = total > 0 ? Math.round((pos / total) * 100) : 0;
      const negPct = total > 0 ? Math.round((neg / total) * 100) : 0;
      const neuPct = total > 0 ? 100 - posPct - negPct : 0;
      const csat = total > 0 ? Number((1.0 + (pos * 4 + neu * 2) / total).toFixed(1)) : 3.0;

      let grade = "B";
      if (posPct >= 70) grade = "A+";
      else if (posPct >= 50) grade = "B";
      else if (negPct >= 40) grade = "F";
      else grade = "C";

      return {
        featureArea: t.name,
        total,
        posPct,
        neuPct,
        negPct,
        csat,
        grade,
      };
    });

    matrix.sort((a, b) => b.total - a.total);

    return NextResponse.json(matrix);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch feature matrix" },
      { status: error.statusCode || 500 }
    );
  }
}
