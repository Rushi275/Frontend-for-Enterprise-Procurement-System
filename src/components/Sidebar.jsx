import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Home,
  ClipboardList,
  CreditCard,
  LogOut,
  Package,
  X,
  Settings,
  Landmark
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  {
    to: "/home",
    label: "Home",
    icon: Home,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN"]
  },
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    roles: ["EMPLOYEE", "MANAGER", "ADMIN"]
  },
  {
    to: "/products",
    label: "Products",
    icon: Package,
    roles: ["EMPLOYEE", "MANAGER"]
  },
  {
    to: "/orders",
    label: "My requests",
    icon: ClipboardList,
    roles: ["EMPLOYEE", "MANAGER"]
  },
  {
    to: "/orders",
    label: "All requests",
    icon: ClipboardList,
    roles: ["ADMIN"]
  },
  {
    to: "/payment",
    label: "Payment",
    icon: CreditCard,
    roles: ["ADMIN"]
  },
  {
    to: "/management",
    label: "Management",
    icon: Settings,
    roles: ["ADMIN"]
  },
  {
    to: "/supplier-orders",
    label: "Supplier orders",
    icon: ClipboardList,
    roles: ["SUPPLIER"]
  },
  {
    to: "/supplier-products",
    label: "My products",
    icon: Package,
    roles: ["SUPPLIER"]
  },
  {
    to: "/supplier-payments",
    label: "Payment history",
    icon: Landmark,
    roles: ["SUPPLIER"]
  }
];

export default function Sidebar({
  mobileOpen = false,
  onCloseMobile
}) {
  const { user, logout } = useAuth();

  const visibleNavItems = NAV_ITEMS.filter(
    (item) =>
      !item.roles ||
      item.roles.includes(user?.role)
  );

  const content = (
    <>
      <div className="px-6 py-6 border-b border-ink-border/60 flex items-center justify-between">
        <div>
          <div className="font-display font-semibold text-lg tracking-tight text-white">
            Procure<span className="text-signal">.</span>
          </div>

          <div className="text-xs text-white/40 mt-0.5">
            Enterprise Procurement
          </div>
        </div>

        <button
          onClick={onCloseMobile}
          className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/5 hover:text-white transition"
          aria-label="Close navigation menu"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {visibleNavItems.map(
          ({ to, label, icon: Icon }) => (
            <NavLink
              key={`${to}-${label}`}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-signal text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          )
        )}
      </nav>

      <div className="px-3 py-4 border-t border-ink-border/60">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-signal/20 text-signal flex items-center justify-center text-sm font-semibold font-display">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>

          <div className="min-w-0">
            <div className="text-sm text-white truncate">
              {user?.name ?? user?.email}
            </div>

            <div className="text-[11px] text-white/40">
              {user?.role}
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 shrink-0 bg-ink text-white/90 flex-col h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm animate-[toastIn_0.15s_ease-out]"
            onClick={onCloseMobile}
          />

          <aside className="relative w-64 max-w-[80vw] bg-ink text-white/90 flex flex-col h-full shadow-card">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}