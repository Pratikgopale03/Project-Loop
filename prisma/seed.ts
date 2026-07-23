import { PrismaClient, Sentiment, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

const prisma = new PrismaClient();

// List of realistic feedback templates to generate 125 items
const FEEDBACK_TEMPLATES = [
  {
    content: "The dashboard is taking forever to load. It takes almost 10 seconds to render the charts. Please fix this, it is blocking our weekly reporting.",
    channel: "Support Ticket",
    customerLabel: "Acme Corp",
    sentiment: Sentiment.NEG,
    sentimentScore: -0.8,
    theme: "Performance",
  },
  {
    content: "I absolutely love the clean layout of Project LOOP! Surviving Dovetail was hard, but this is a breath of fresh air. UI is stunning.",
    channel: "App Store Review",
    customerLabel: "Individual User",
    sentiment: Sentiment.POS,
    sentimentScore: 0.9,
    theme: "UI Design",
  },
  {
    content: "We need an export to PDF function for the Voice of Customer reports. Right now I have to screenshot the charts to share them with my VP.",
    channel: "NPS Survey",
    customerLabel: "Globex Inc",
    sentiment: Sentiment.NEU,
    sentimentScore: 0.1,
    theme: "AI Capabilities",
  },
  {
    content: "Acme Corp mentioned they would close a $50k expansion if we had SOC 2 compliance. They asked when we expect the audit to complete.",
    channel: "Sales Call Notes",
    customerLabel: "Acme Corp",
    sentiment: Sentiment.NEU,
    sentimentScore: 0.0,
    theme: "Security",
  },
  {
    content: "Project LOOP is failing to sync with our Slack channels. Getting a lot of 504 Gateway Timeout errors when loading integration page.",
    channel: "Twitter Mention",
    customerLabel: "Initech",
    sentiment: Sentiment.NEG,
    sentimentScore: -0.7,
    theme: "Integrations",
  },
  {
    content: "The new grounded Q&A tool (Ask LOOP) is incredible! It accurately cited the exact feedback items where users complained about onboarding.",
    channel: "Email",
    customerLabel: "Soylent Corp",
    sentiment: Sentiment.POS,
    sentimentScore: 0.95,
    theme: "AI Capabilities",
  },
  {
    content: "Can we get custom color codes for themes? The default colors are a bit too similar and hard to distinguish on the trends dashboard.",
    channel: "NPS Survey",
    customerLabel: "Umbrella Corp",
    sentiment: Sentiment.NEU,
    sentimentScore: 0.2,
    theme: "UI Design",
  },
  {
    content: "The billing section throws an unexpected server error when trying to update the corporate credit card. Very frustrating.",
    channel: "Support Ticket",
    customerLabel: "Hooli",
    sentiment: Sentiment.NEG,
    sentimentScore: -0.9,
    theme: "Billing",
  },
  {
    content: "Session timeout is too aggressive. It logs me out every 15 minutes, which interrupts my feedback analysis. Can we customize this?",
    channel: "Support Ticket",
    customerLabel: "Veer Group",
    sentiment: Sentiment.NEG,
    sentimentScore: -0.5,
    theme: "Security",
  },
  {
    content: "The API rate limits are undocumented. We are getting 429 errors when pushing feedback from our internal CRM. Please provide documentation.",
    channel: "Email",
    customerLabel: "Stark Industries",
    sentiment: Sentiment.NEG,
    sentimentScore: -0.6,
    theme: "Integrations",
  },
  {
    content: "Extremely fast search response times. Even with 10,000 feedback rows, the full-text search returns matches in under 50ms.",
    channel: "App Store Review",
    customerLabel: "Pro Member",
    sentiment: Sentiment.POS,
    sentimentScore: 0.85,
    theme: "Performance",
  },
  {
    content: "We need role permissions configured so Viewers cannot see customer names or contact info for privacy compliance. GDPR requirement.",
    channel: "Sales Call Notes",
    customerLabel: "Wayne Ent",
    sentiment: Sentiment.NEU,
    sentimentScore: 0.0,
    theme: "Security",
  },
  {
    content: "Pricing is transparent and fair. Upgraded our team of analysts to the enterprise workspace without any hassle.",
    channel: "NPS Survey",
    customerLabel: "Cyberdyne",
    sentiment: Sentiment.POS,
    sentimentScore: 0.8,
    theme: "Billing",
  },
  {
    content: "The AI summary got the core customer pain point completely wrong. It tagged a performance issue as billing. Need better classification.",
    channel: "Twitter Mention",
    customerLabel: "Tyrell Corp",
    sentiment: Sentiment.NEG,
    sentimentScore: -0.4,
    theme: "AI Capabilities",
  },
  {
    content: "The CSV parser is robust. Handled quotes, line breaks, and trailing commas without throwing errors. Super convenient.",
    channel: "Email",
    customerLabel: "Virtucon",
    sentiment: Sentiment.POS,
    sentimentScore: 0.75,
    theme: "Integrations",
  },
];

async function main() {
  console.log("Starting database seed script...");

  // 1. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Demo Workspace",
    },
  });
  console.log(`Created Workspace: ${workspace.name} (${workspace.id})`);

  // 2. Create Users with documented credentials (password: Password123)
  const passwordHash = bcrypt.hashSync("Password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@loop.com",
      passwordHash,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: "Analyst User",
      email: "analyst@loop.com",
      passwordHash,
      role: "ANALYST",
      workspaceId: workspace.id,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: "Viewer User",
      email: "viewer@loop.com",
      passwordHash,
      role: "VIEWER",
      workspaceId: workspace.id,
    },
  });

  console.log("Seeded Users:");
  console.log(`- ADMIN: email: admin@loop.com | password: Password123`);
  console.log(`- ANALYST: email: analyst@loop.com | password: Password123`);
  console.log(`- VIEWER: email: viewer@loop.com | password: Password123`);

  // 3. Create Themes
  const themesList = [
    { name: "Performance", description: "Feedback regarding system speed, latency, dashboard load times.", color: "#3b82f6" },
    { name: "UI Design", description: "User interface visuals, dark mode, typography, sidebar navigation.", color: "#8b5cf6" },
    { name: "Integrations", description: "Slack sync, CRM connections, API limits, webhook requests.", color: "#ec4899" },
    { name: "Billing", description: "Subscriptions, card processing errors, invoicing, price transparency.", color: "#f59e0b" },
    { name: "Security", description: "SOC 2 audits, session timeouts, role permissions, GDPR details.", color: "#10b981" },
    { name: "AI Capabilities", description: "Ask LOOP Q&A accuracy, summary generation, report brief builders.", color: "#ef4444" },
  ];

  const dbThemes: Record<string, any> = {};
  for (const t of themesList) {
    const theme = await prisma.theme.create({
      data: {
        name: t.name,
        description: t.description,
        color: t.color,
        workspaceId: workspace.id,
      },
    });
    dbThemes[t.name] = theme;
  }
  console.log(`Seeded ${themesList.length} themes.`);

  // 4. Initialize Local Embedding Pipeline (WASM)
  console.log("Loading WASM Embedding pipeline...");
  const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  // 5. Generate 125 realistic feedback items spanning the past 14 days
  console.log("Generating 125 feedback items with embeddings and theme associations...");
  
  const now = new Date();

  for (let i = 0; i < 125; i++) {
    // Round-robin selection of templates to keep it diverse
    const template = FEEDBACK_TEMPLATES[i % FEEDBACK_TEMPLATES.length];

    // Deduce random offset to distribute dates over past 14 days
    const itemDate = new Date();
    itemDate.setDate(now.getDate() - (i % 14));
    // Add random hour/minute offset
    itemDate.setHours(i % 24, (i * 7) % 60, 0, 0);

    // Modify content slightly to look unique
    const indexSuffix = ` [Ref #${1000 + i}]`;
    const uniqueContent = template.content.replace(/\.$/, "") + indexSuffix;

    const feedback = await prisma.feedback.create({
      data: {
        content: uniqueContent,
        channel: template.channel,
        customerLabel: template.customerLabel,
        sentiment: template.sentiment,
        sentimentScore: template.sentimentScore,
        status: i % 7 === 0 ? FeedbackStatus.ACTIONED : i % 5 === 0 ? FeedbackStatus.REVIEWED : FeedbackStatus.NEW,
        workspaceId: workspace.id,
        createdAt: itemDate,
      },
    });

    // Generate local vector embedding
    const output = await extractor(uniqueContent, { pooling: "mean", normalize: true });
    const vector = Array.from(output.data) as number[];
    const vectorStr = `[${vector.join(",")}]`;

    // Save vector embedding using raw SQL insert
    const embeddingId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Embedding" (id, "feedbackId", vector) VALUES ($1, $2, $3::vector)`,
      embeddingId,
      feedback.id,
      vectorStr
    );

    // Associate theme
    const themeObj = dbThemes[template.theme];
    if (themeObj) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: themeObj.id,
          confidence: 1.0,
        },
      });
    }
  }

  console.log("Database seeded successfully with 125 feedback items and embeddings!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
