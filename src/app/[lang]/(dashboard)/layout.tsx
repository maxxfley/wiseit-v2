import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";

/** Layout del panel: el shell es estático; la sesión se lee dentro de <Suspense> (en el sidebar). */
export default function DashboardLayout({ children }: LayoutProps<"/[lang]">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <DashboardSidebar />
      <main className="min-w-0 flex-1 px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}
