import { Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

export default function Layout() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-5 sm:px-10 py-3 border-b border-ink/5 bg-paper/80 backdrop-blur sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden h-9 w-9 rounded-lg flex items-center justify-center text-slate hover:bg-ink/5 transition"
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div className="hidden lg:block" />
          {user?.role !== "ADMIN" && <NotificationBell />}
        </div>
        <main className="flex-1 px-5 sm:px-10 py-6 sm:py-8 max-w-6xl w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
