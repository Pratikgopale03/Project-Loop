import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionOrThrow, enforceRole } from "@/lib/auth";
import bcrypt from "bcrypt";
import * as zod from "zod";

const createMemberSchema = zod.object({
  name: zod.string().min(2, "Name must be at least 2 characters"),
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
  role: zod.enum(["ADMIN", "ANALYST", "VIEWER"]),
});

export async function GET() {
  try {
    const user = await getSessionOrThrow();
    // All members can view the team roster
    enforceRole(user.role, ["ADMIN", "ANALYST", "VIEWER"]);

    const members = await db.user.findMany({
      where: { workspaceId: user.workspaceId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred fetching members" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionOrThrow();
    // Only ADMINs can add members to their workspace
    enforceRole(user.role, ["ADMIN"]);

    const body = await request.json();
    const parsed = createMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const newMember = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        workspaceId: user.workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred adding team member" },
      { status: error.statusCode || 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionOrThrow();
    // Only ADMINs can remove workspace members
    enforceRole(user.role, ["ADMIN"]);

    const body = await request.json();
    const { memberId } = body;

    if (!memberId || typeof memberId !== "string") {
      return NextResponse.json(
        { error: "Missing member ID to remove" },
        { status: 400 }
      );
    }

    if (memberId === user.id) {
      return NextResponse.json(
        { error: "You cannot remove your own active user account" },
        { status: 400 }
      );
    }

    await db.user.delete({
      where: {
        id: memberId,
        workspaceId: user.workspaceId,
      },
    });

    return NextResponse.json({ success: true, deletedId: memberId });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred removing workspace member" },
      { status: error.statusCode || 500 }
    );
  }
}
