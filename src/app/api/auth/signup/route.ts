import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import * as zod from "zod";

const signUpSchema = zod.object({
  name: zod.string().min(2, "Name must be at least 2 characters"),
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
  workspaceName: zod.string().min(2, "Workspace name must be at least 2 characters"),
  role: zod.enum(["ADMIN", "ANALYST", "VIEWER"]).optional().default("ADMIN"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, workspaceName, role } = parsed.data;

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Workspace and User in a transaction
    const result = await db.$transaction(async (tx: any) => {
      const workspace = await tx.workspace.create({
        data: { name: workspaceName }
      });

      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: role || "ADMIN",
          workspaceId: workspace.id,
        }
      });

      return { user, workspace };
    });

    return NextResponse.json(
      {
        message: "Signup successful",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          workspaceId: result.workspace.id,
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during signup" },
      { status: 500 }
    );
  }
}
