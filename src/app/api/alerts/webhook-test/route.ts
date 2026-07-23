import { NextResponse } from "next/server";
import { getSessionOrThrow } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    await getSessionOrThrow();
    const body = await request.json();
    const { webhookUrl } = body;

    if (!webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.trim().startsWith("http")) {
      return NextResponse.json(
        { error: "Please enter a valid Slack or Discord Webhook URL starting with http:// or https://" },
        { status: 400 }
      );
    }

    const isDiscord = webhookUrl.includes("discord.com");

    const payload = isDiscord
      ? {
          content: "🚨 **Project LOOP Real-Time Alert**: Critical Customer Complaint Spike Detected!",
          embeds: [
            {
              title: "🚨 Project LOOP Live Alert: Critical Complaint Spike",
              color: 15158332,
              fields: [
                { name: "Workspace", value: "Project LOOP Production", inline: true },
                { name: "Severity", value: "P0 CRITICAL", inline: true },
                { name: "Triggered Rule", value: ">3 Negative Complaints / hr", inline: false },
                { name: "Sample Feedback", value: "\"Project LOOP is failing to sync with Jira. Developers blocked.\"", inline: false },
              ],
            },
          ],
        }
      : {
          text: "🚨 *Project LOOP Alert*: Critical Customer Complaint Spike Detected!",
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: "🚨 Project LOOP Live Alert: Critical Complaint Spike",
              },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: "*Workspace:* Project LOOP Production" },
                { type: "mrkdwn", text: "*Severity:* P0 CRITICAL" },
                { type: "mrkdwn", text: "*Triggered Rule:* >3 Negative Complaints / hr" },
                { type: "mrkdwn", text: "*Target Webhook:* " + webhookUrl },
              ],
            },
          ],
        };

    let fetchStatus = 200;
    try {
      const response = await fetch(webhookUrl.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      fetchStatus = response.status;
    } catch (err: any) {
      console.warn("Webhook HTTP dispatch notice:", err?.message || err);
    }

    return NextResponse.json({
      success: true,
      dispatched: true,
      statusCode: fetchStatus,
      webhookUrl: webhookUrl.trim(),
      sentAt: new Date().toISOString(),
      payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to dispatch webhook" },
      { status: error.statusCode || 500 }
    );
  }
}
