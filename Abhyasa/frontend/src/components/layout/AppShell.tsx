import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/layout/AppSidebar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}