import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow, enforceRole } from "@/lib/auth";
import * as zod from "zod";

const updateFeedbackSchema = zod.object({
  status: zod.enum(["NEW", "REVIEWED", "ACTIONED"]).optional(),
  sentiment: zod.enum(["POS", "NEU", "NEG"]).optional(),
  sentimentScore: zod.number().min(-1).max(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionOrThrow();
    // Enforce role: ADMIN or ANALYST can update feedback status
    enforceRole(user.role, ["ADMIN", "ANALYST"]);

    const body = await request.json();
    const parsed = updateFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { id } = params;

    // Verify feedback exists and belongs to the workspace
    const feedback = await db.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 });
    }

    if (feedback.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.feedback.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: error.statusCode || 500 }
    );
  }
}
