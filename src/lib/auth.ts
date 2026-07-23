import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";


export async function getSessionOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.workspaceId) {
    const err = new Error("Unauthorized");
    (err as any).statusCode = 401;
    throw err;
  }
  return session.user;
}

export function enforceRole(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    const err = new Error("Forbidden");
    (err as any).statusCode = 403;
    throw err;
  }
}
