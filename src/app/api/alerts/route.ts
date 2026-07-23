import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionOrThrow();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [recentNegative, vipNegative] = await Promise.all([
      db.feedback.findMany({
        where: {
          workspaceId: user.workspaceId,
          sentiment: "NEG",
          createdAt: { gte: oneHourAgo },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.feedback.findMany({
        where: {
          workspaceId: user.workspaceId,
          sentiment: "NEG",
          createdAt: { gte: twentyFourHoursAgo },
          customerLabel: {
            contains: "Pro",
            mode: "insensitive",
          },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
    ]);

    const activeAlerts = [];

    if (recentNegative.length >= 3) {
      activeAlerts.push({
        id: "alert-neg-spike",
        type: "CRITICAL_SPIKE",
        title: "🔴 Critical Negative Complaint Spike",
        message: `${recentNegative.length} negative complaints detected in the last hour. Immediate triage recommended.`,
        severity: "CRITICAL",
        count: recentNegative.length,
        sample: recentNegative[0]?.content,
        timestamp: recentNegative[0]?.createdAt,
      });
    }

    if (vipNegative.length > 0) {
      activeAlerts.push({
        id: "alert-vip-risk",
        type: "VIP_ESCALATION",
        title: "⚡ VIP Account Retention Threat",
        message: `@${vipNegative[0].customerLabel || "Pro User"} submitted negative feedback: "${vipNegative[0].content.slice(0, 70)}..."`,
        severity: "HIGH",
        count: vipNegative.length,
        sample: vipNegative[0].content,
        customerLabel: vipNegative[0].customerLabel,
        timestamp: vipNegative[0].createdAt,
      });
    }

    return NextResponse.json({
      activeAlerts,
      totalActive: activeAlerts.length,
      evaluatedAt: now.toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to evaluate alerts" },
      { status: error.statusCode || 500 }
    );
  }
}
