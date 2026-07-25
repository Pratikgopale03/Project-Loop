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
    <div className="flex flex-col md:flex-row h-screen bg-[#f2f2f7] dark:bg-[#07090e] overflow-hidden text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 print:h-auto print:overflow-visible print:bg-white print:text-slate-900">
      <Sidebar user={user} />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#f2f2f7] dark:bg-[#07090e] relative transition-colors duration-300 print:overflow-visible print:bg-white print:p-0 print:block">
        {/* Apple iOS Mesh Gradient Ambient Lighting Blobs */}
        <div className="absolute top-[-10%] right-[-5%] w-[650px] h-[650px] bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent rounded-full blur-[120px] pointer-events-none print:hidden" />
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-transparent rounded-full blur-[140px] pointer-events-none print:hidden" />
        <div className="absolute top-[40%] right-[30%] w-[500px] h-[500px] bg-gradient-to-r from-pink-500/10 via-violet-500/10 to-transparent rounded-full blur-[130px] pointer-events-none print:hidden" />
        <div className="flex-1 p-4 sm:p-6 md:p-8 relative z-10 print:p-0">
          {children}
        </div>
      </main>
      <LiveStreamPoller />
    </div>
  );
}
