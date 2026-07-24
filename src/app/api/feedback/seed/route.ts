import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow, enforceRole } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbedding, saveEmbedding } from "@/lib/search";

const DYNAMIC_FEEDBACK_POOL = [
  {
    content: "Shopify team reported billing page crashes during checkout flow when switching currencies. Urgent escalation for account retention.",
    channel: "Support Ticket",
    customerLabel: "Shopify Enterprise",
  },
  {
    content: "Stripe integration is timing out randomly on webhooks. Needs 504 error handler or exponential backoff in webhook pipeline.",
    channel: "Email",
    customerLabel: "Stripe API Lead",
  },
  {
    content: "We need bulk export of report narratives to CSV/Excel. Current manual copy-paste takes our product managers 3 hours every week.",
    channel: "NPS Survey",
    customerLabel: "Vercel Analytics",
  },
  {
    content: "Linear team loves the real-time feedback pulse ticker! The glowing NEW badges make it super easy to track fresh customer logs.",
    channel: "Twitter Mention",
    customerLabel: "Linear Product Lead",
  },
  {
    content: "During executive call, Retool VP mentioned they will double seat count to 150 licenses if SOC 2 audit report is delivered this month.",
    channel: "Sales Call Notes",
    customerLabel: "Retool Key Prospect",
  },
  {
    content: "Datadog team noticed high memory usage on the insights dashboard when rendering 5,000+ feedback points simultaneously.",
    channel: "Support Ticket",
    customerLabel: "Datadog Eng Lead",
  },
  {
    content: "Figma design team requested dark mode color contrast tweaks for high-contrast accessibility standards compliance.",
    channel: "App Store Review",
    customerLabel: "Figma Pro Member",
  },
  {
    content: "Notion customer success team wants automated Slack webhooks when NPS survey score drops below 6.0.",
    channel: "NPS Survey",
    customerLabel: "Notion CS Team",
  },
  {
    content: "Ramp finance team asked for invoice consolidation across sub-workspaces to streamline monthly billing.",
    channel: "Sales Call Notes",
    customerLabel: "Ramp Enterprise",
  },
  {
    content: "Hubspot team reported SSO login loop when authenticating via Okta SAML v2. Urgent fix required.",
    channel: "Support Ticket",
    customerLabel: "Hubspot Security Lead",
  },
  {
    content: "Amplitude product manager complimented the AI Action Spec generator! Saved their team 4 hours of sprint planning doc writing.",
    channel: "Twitter Mention",
    customerLabel: "Amplitude PM",
  },
  {
    content: "Intercom team requested webhook retries when endpoint returns 503 Service Unavailable status code.",
    channel: "Email",
    customerLabel: "Intercom Integration Lead",
  },
  {
    content: "Twilio team noticed sentiment classification misidentified technical term 'failover test' as negative customer complaint.",
    channel: "App Store Review",
    customerLabel: "Twilio Developer",
  },
  {
    content: "Snowflake data team needs REST API access to export raw feedback embeddings directly to their data warehouse.",
    channel: "Sales Call Notes",
    customerLabel: "Snowflake Enterprise",
  },
  {
    content: "Zomato delivery was delayed by 45 minutes and food arrived cold. Support refused refund.",
    channel: "Zomato",
    customerLabel: "Rohan Sharma (@ZomatoVIP)",
  },
  {
    content: "Twitter app timeline is lagging on Android 15. Scrolling freezes every 5 seconds.",
    channel: "Twitter",
    customerLabel: "Alex Rivera (@TwitterDev)",
  },
  {
    content: "Uber driver canceled after 20 mins wait in heavy traffic. Charged cancellation fee unfairly.",
    channel: "Uber",
    customerLabel: "Priya Sharma (@UberUser)",
  },
  {
    content: "Swiggy Instamart order missing 3 grocery items and customer care line is unreachable.",
    channel: "Swiggy",
    customerLabel: "Amit Patel (@SwiggyGold)",
  },
  {
    content: "Amazon Prime package delivered with open seal and damaged box contents.",
    channel: "Amazon",
    customerLabel: "Rahul Verma (@AmazonPrime)",
  },
  {
    content: "Flipkart order replacement request stuck in pending state for 4 days.",
    channel: "Flipkart",
    customerLabel: "Sneha Reddy (@FlipkartPlus)",
  },
];

function getRandomThemeColor(): string {
  const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#06b6d4"];
  return colors[Math.floor(Math.random() * colors.length)];
}

export async function POST() {
  try {
    const user = await getSessionOrThrow();
    enforceRole(user.role, ["ADMIN", "ANALYST"]);

    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user.workspaceId },
      select: { name: true },
    });
    const themeNames = existingThemes.map((t) => t.name);

    // Shuffle pool and select 5 unique items each sync trigger
    const shuffled = [...DYNAMIC_FEEDBACK_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);

    const seededItems = [];

    for (let i = 0; i < selected.length; i++) {
      const item = selected[i];
      // 1. Run AI classification
      const classification = await classifyFeedback(item.content, themeNames);

      // 2. Generate vector embedding
      const vector = await generateEmbedding(item.content);

      // Randomize timestamp within the last 30 minutes for fresh timeline
      const recentTime = new Date(Date.now() - i * 4 * 60 * 1000 - Math.floor(Math.random() * 60000));

      // 3. Create feedback record
      const feedback = await db.feedback.create({
        data: {
          content: item.content,
          channel: item.channel,
          customerLabel: item.customerLabel || null,
          sentiment: classification.sentiment,
          sentimentScore: classification.sentimentScore,
          status: "NEW",
          workspaceId: user.workspaceId,
          createdAt: recentTime,
        },
      });

      // 4. Save embedding
      await saveEmbedding(feedback.id, vector);

      // 5. Connect themes
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

      seededItems.push(feedback);
    }

    return NextResponse.json({
      success: true,
      count: seededItems.length,
      items: seededItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to seed feedback" },
      { status: error.statusCode || 500 }
    );
  }
}
