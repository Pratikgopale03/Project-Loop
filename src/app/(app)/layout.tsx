import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import Sidebar from "@/components/Sidebar";
import LiveStreamPoller from "@/components/LiveStreamPoller";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // We pass user object down to Sidebar
  const user = {
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    workspaceId: session.user.workspaceId,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 print:h-auto print:overflow-visible print:bg-white print:text-slate-900">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300 print:overflow-visible print:bg-white print:p-0 print:block">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-pulse print:hidden" />
        <div className="flex-1 p-4 sm:p-6 md:p-8 relative z-10 print:p-0">
          {children}
        </div>
      </main>
      <LiveStreamPoller />
    </div>
  );
}
