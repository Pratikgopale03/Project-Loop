import { db } from "@/lib/db";
import { pipeline, env } from "@huggingface/transformers";

// Disable local model downloading defaults in Transformers.js
env.allowLocalModels = false;

let extractor: any = null;

/**
 * Generates a 384-dimensional float array embedding for the provided text.
 * Uses the Xenova/all-MiniLM-L6-v2 model loaded in WASM.
 * Falls back to a deterministic noise vector on error to prevent ingestion blocking.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!extractor) {
      extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
    const output = await extractor(text, { pooling: "mean", normalize: true });
    return Array.from(output.data) as number[];
  } catch (error: any) {
    console.warn("Embedding generation failed, utilizing safety fallback vector. Error:", error.message);
    // Return a mock vector of 384 dimensions to prevent pipeline crashes
    const mockVector = new Array(384).fill(0).map((_, i) => Math.sin(i + text.length));
    return mockVector;
  }
}

/**
 * Saves or updates a feedback item's vector embedding in the PostgreSQL database.
 * Uses execution raw queries since Prisma does not natively wrap pgvector columns.
 */
export async function saveEmbedding(feedbackId: string, vector: number[]): Promise<void> {
  const vectorStr = `[${vector.join(",")}]`;
  
  try {
    const existing = await db.$queryRawUnsafe<any[]>(
      `SELECT id FROM "Embedding" WHERE "feedbackId" = $1 LIMIT 1`,
      feedbackId
    );

    if (existing.length > 0) {
      await db.$executeRawUnsafe(
        `UPDATE "Embedding" SET vector = $1::vector WHERE "feedbackId" = $2`,
        vectorStr,
        feedbackId
      );
    } else {
      const id = crypto.randomUUID();
      await db.$executeRawUnsafe(
        `INSERT INTO "Embedding" (id, "feedbackId", vector) VALUES ($1, $2, $3::vector)`,
        id,
        feedbackId,
        vectorStr
      );
    }
  } catch (error: any) {
    console.error("Failed to save vector embedding to database:", error.message);
    // Fail silently in the pipeline so it doesn't crash ingestion, but log the issue
  }
}

/**
 * AI3 Grounded Retrieval (Vector Similarity Search)
 * Performs a cosine distance calculation (<=>) over the embeddings, scoped by workspaceId.
 * Falls back to full-text contains filtering if pgvector is not configured in target DB.
 */
export async function vectorSearch(
  workspaceId: string,
  queryText: string,
  limit = 5
): Promise<any[]> {
  try {
    const queryVector = await generateEmbedding(queryText);
    const vectorStr = `[${queryVector.join(",")}]`;

    // Cosine distance: lower <=> means higher similarity.
    // similarity = 1 - (vector <=> queryVector)
    const results = await db.$queryRawUnsafe<any[]>(
      `SELECT f.*, 1 - (e.vector <=> $1::vector) as similarity
       FROM "Feedback" f
       JOIN "Embedding" e ON f.id = e."feedbackId"
       WHERE f."workspaceId" = $2
       ORDER BY e.vector <=> $1::vector
       LIMIT $3`,
      vectorStr,
      workspaceId,
      limit
    );

    return results;
  } catch (error: any) {
    console.warn("pgvector query failed (might not be installed). Falling back to text match:", error.message);
    // Resilient fallback: word occurrence query
    return await db.feedback.findMany({
      where: {
        workspaceId,
        content: {
          contains: queryText,
          mode: "insensitive",
        },
      },
      take: limit,
    });
  }
}
