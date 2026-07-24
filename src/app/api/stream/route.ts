import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbedding, saveEmbedding } from "@/lib/search";

export const dynamic = "force-dynamic";

const CHANNELS = ["Zomato", "Swiggy", "Uber", "Twitter", "Amazon", "Flipkart", "App Store", "Support Ticket", "Slack"];

const ADJECTIVES = ["horrible", "frustrating", "unacceptable", "excellent", "superb", "disappointing", "sluggish", "flawless", "confusing", "outstanding"];
const TOPICS = [
  "delivery tracking map", 
  "payment gateway checkout", 
  "iOS v18.4 app update", 
  "customer support refund request", 
  "driver cancellation penalty", 
  "item packaging quality", 
  "subscription auto-renewal", 
  "login authentication loop",
  "search bar autocomplete speed",
  "dark mode contrast readability"
];

const COMPLAINT_TEMPLATES = [
  (adj: string, topic: string, code: string) => `My order #${code} experienced ${adj} delays on ${topic}. Support agent was unhelpful and closed ticket prematurely.`,
  (adj: string, topic: string, code: string) => `Experienced ${adj} performance issues with ${topic} after updating. Issue ID #${code}. Urgent resolution needed.`,
  (adj: string, topic: string, code: string) => `The ${topic} is absolutely ${adj}. My account #${code} was charged twice without invoice confirmation.`,
  (adj: string, topic: string, code: string) => `Huge shoutout to engineering team for fixing ${topic}! Outstanding release (Ref #${code}). Service feels ${adj} and smooth now.`,
  (adj: string, topic: string, code: string) => `Order #${code} arrived with ${adj} damage to outer packaging during ${topic}. Escalated for immediate refund.`,
  (adj: string, topic: string, code: string) => `Driver canceled order #${code} halfway through delivery on ${topic}. Extremely ${adj} experience for premium members.`,
  (adj: string, topic: string, code: string) => `The new interface update for ${topic} feels ${adj}. Searching through feedback records takes under 2 seconds now. Ref #${code}.`
];

const NAME_PREFIXES = ["Rohan", "Priya", "Amit", "Rahul", "Sneha", "Vikram", "Ananya", "Karan", "Divya", "Siddharth", "Neha", "Arjun"];
const HANDLES = ["VIP", "Pro", "User", "Dev", "Lead", "Prime", "Gold", "Plus", "Tech", "Exec"];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET(request: Request) {
  return handleStream(request);
}

export async function POST(request: Request) {
  return handleStream(request);
}

async function handleStream(request: Request) {
  try {
    // 1. Get primary or target workspace
    const workspace = await db.workspace.findFirst();
    if (!workspace) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    // 2. Generate unique non-repeating review content
    const adj = getRandomItem(ADJECTIVES);
    const topic = getRandomItem(TOPICS);
    const code = `${getRandomNumber(1000, 9999)}-${getRandomNumber(10, 99)}`;
    const template = getRandomItem(COMPLAINT_TEMPLATES);
    const content = template(adj, topic, code);

    // 3. Ensure no duplicate content exists in DB
    const existing = await db.feedback.findFirst({
      where: { 
        workspaceId: workspace.id,
        content: content 
      }
    });

    if (existing) {
      return NextResponse.json({ message: "Duplicate generated, skipped cycle" });
    }

    // 4. Generate dynamic customer details
    const channel = getRandomItem(CHANNELS);
    const name = getRandomItem(NAME_PREFIXES);
    const handle = getRandomItem(HANDLES);
    const customerLabel = `${name} ${getRandomItem(["Sharma", "Verma", "Patel", "Reddy", "Gupta", "Mehta"])} (@${channel}${handle}_${getRandomNumber(10, 99)})`;

    // 5. Fetch workspace theme names for AI classification
    const existingThemes = await db.theme.findMany({
      where: { workspaceId: workspace.id },
      select: { name: true }
    });
    const themeNames = existingThemes.map(t => t.name);

    // 6. Run AI classification
    const classification = await classifyFeedback(content, themeNames);

    // 7. Save feedback entry to PostgreSQL
    const feedback = await db.feedback.create({
      data: {
        content,
        channel,
        sourceRef: `REF-${code}`,
        customerLabel,
        sentiment: classification.sentiment,
        sentimentScore: classification.sentimentScore,
        status: "NEW",
        workspaceId: workspace.id,
      }
    });

    // 8. Connect themes
    for (const themeName of classification.themes) {
      let theme = await db.theme.findUnique({
        where: { name_workspaceId: { name: themeName, workspaceId: workspace.id } }
      });
      if (!theme) {
        theme = await db.theme.create({
          data: {
            name: themeName,
            color: "#6366f1",
            workspaceId: workspace.id
          }
        });
      }

      await db.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: theme.id,
          confidence: 1.0
        }
      });
    }

    // 9. Generate and save vector embedding for Ask LOOP (RAG)
    try {
      const vector = await generateEmbedding(content);
      await saveEmbedding(feedback.id, vector);
    } catch (e) {
      console.warn("Embedding generation skipped in stream:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Automated live feedback stream item generated & ingested",
      item: {
        id: feedback.id,
        content: feedback.content,
        channel: feedback.channel,
        customerLabel: feedback.customerLabel,
        sentiment: feedback.sentiment,
        createdAt: feedback.createdAt
      }
    });
  } catch (error: any) {
    console.error("Error in automated live stream:", error);
    return NextResponse.json({ error: error.message || "Failed to stream live feedback" }, { status: 500 });
  }
}
