import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Truck, Bell, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listRequests } from "../api/requests";
import { listNotifications } from "../api/lookups";
import StatusPill from "../components/StatusPill";
import Topbar from "../components/Topbar";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const all = await listRequests();
        const mine = user?.role === "ADMIN"
          ? all
          : user?.userId
            ? all.filter((r) => r.user?.userId === user.userId)
            : [];
        if (active) setRequests(mine);

        if (user?.userId) {
          const notifs = await listNotifications(user.userId);
          if (active) setNotifications(notifs.slice(0, 5));
        }
      } catch {
        // Backend may be offline in dev — fail quietly, page still renders.
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user?.userId]);

  const pending = requests.filter((r) => r.status === "PENDING" || r.status === "MANAGER_APPROVED").length;
  const approved = requests.filter((r) => r.status === "APPROVED").length;
  const delivered = requests.filter((r) => r.status === "DELIVERED").length;

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <Topbar
        title={`${greeting}, ${firstName}`}
        subtitle="Here's where things stand across your requests."
        action={
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            <PlusCircle size={16} />
            Raise a request
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="In progress" value={pending} tone="amber" />
        <StatCard label="Approved, awaiting delivery" value={approved} tone="good" />
        <StatCard label="Delivered" value={delivered} tone="ink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-ink">Recent requests</h2>
            <button
              onClick={() => navigate("/track")}
              className="text-xs font-medium text-signal hover:underline flex items-center gap-1"
            >
              View all <ArrowUpRight size={13} />
            </button>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No requests yet"
              body="Raise your first purchase request to see it tracked here."
              cta="Raise a request"
              onClick={() => navigate("/products")}
            />
          ) : (
            <div className="divide-y divide-ink/5">
              {requests.slice(0, 5).map((r) => (
                <div key={r.requestId} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {r.product?.name ?? "Item request"}
                    </div>
                    <div className="text-xs text-slate mt-0.5 font-mono-num">
                      #{String(r.requestId).padStart(4, "0")} · Qty {r.numberOfQuantities}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-semibold text-ink">Notifications</h2>
            <Bell size={16} className="text-slate-light" />
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-slate-light">You're all caught up.</p>
          ) : (
            <ul className="space-y-4">
              {notifications.map((n) => (
                <li key={n.notificationId} className="text-sm">
                  <p className={n.isRead ? "text-slate" : "text-ink font-medium"}>{n.message}</p>
                  <p className="text-[11px] text-slate-light font-mono-num mt-0.5">
                    {n.createdDate ? new Date(n.createdDate).toLocaleString() : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const tones = {
    amber: "text-amber bg-amber-light",
    good: "text-good bg-good-light",
    ink: "text-white bg-ink",
  };
  return (
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
      <div className="text-xs font-medium text-slate mb-3">{label}</div>
      <div className="flex items-end justify-between">
        <span className="font-display text-3xl font-semibold text-ink">{value}</span>
        <span className={`h-2 w-2 rounded-full ${tones[tone].split(" ")[1]}`} />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, cta, onClick }) {
  return (
    <div className="text-center py-10">
      <div className="h-11 w-11 rounded-full bg-signal-light text-signal flex items-center justify-center mx-auto mb-4">
        <Icon size={19} />
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="text-sm text-slate mt-1 max-w-xs mx-auto">{body}</p>
      {cta && (
        <button
          onClick={onClick}
          className="mt-4 text-sm font-medium text-signal hover:underline"
        >
          {cta} →
        </button>
      )}
    </div>
  );
}

export function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 rounded-lg bg-ink/5 animate-pulse" />
      ))}
    </div>
  );
}
