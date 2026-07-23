import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow, enforceRole } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const user = await getSessionOrThrow();
    enforceRole(user.role, ["ADMIN", "ANALYST"]);

    const body = await request.json().catch(() => ({}));
    const { id, clearActioned } = body;

    if (clearActioned) {
      // Bulk delete all ACTIONED items in workspace
      const result = await db.feedback.deleteMany({
        where: {
          workspaceId: user.workspaceId,
          status: "ACTIONED",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Cleared ${result.count} actioned feedback entries`,
        count: result.count,
      });
    }

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing feedback ID to delete" }, { status: 400 });
    }

    // Delete single feedback item
    await db.feedback.delete({
      where: {
        id,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete feedback" },
      { status: error.statusCode || 500 }
    );
  }
}
