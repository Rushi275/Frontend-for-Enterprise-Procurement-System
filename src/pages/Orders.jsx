import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, ArrowRight } from "lucide-react";
import { listRequests } from "../api/requests";
import { useAuth } from "../context/AuthContext";
import StatusPill from "../components/StatusPill";
import Topbar from "../components/Topbar";
import { EmptyState, SkeletonRows } from "./Home";

// A quick-glance list of requests you've raised. For the full approval
// trail and CSV export, see the dedicated Track order page; for browsing
// the catalog and raising a new request, see Products.
export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await listRequests();
        const mine = user?.role === "ADMIN" ? all : user?.userId ? all.filter((r) => r.user?.userId === user.userId) : [];
        setRequests(mine.sort((a, b) => b.requestId - a.requestId));
      } catch {
        // ignore — backend may not be reachable in preview
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.userId]);

  return (
    <div>
      <Topbar
        title={user?.role === "ADMIN" ? "Purchase requests" : "My requests"}
        subtitle={user?.role === "ADMIN" ? "Every request currently recorded in the system." : "Everything you've requested, at a glance."}
        action={
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            Browse products
            <ArrowRight size={15} />
          </button>
        }
      />

      {loading ? (
        <SkeletonRows />
      ) : requests.length === 0 ? (
        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <EmptyState
            icon={ClipboardList}
            title="No orders yet"
            body="Once you raise a request from Products, it'll show up here."
          />
        </div>
      ) : (
        <div className="bg-card rounded-card shadow-card border border-ink/5 divide-y divide-ink/5">
          {requests.map((r) => (
            <button
              key={r.requestId}
              onClick={() => navigate("/track")}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-ink/[0.02] transition"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {r.product?.name ?? "Item request"}
                </div>
                <div className="text-xs text-slate-light mt-0.5 font-mono-num">
                  #{String(r.requestId).padStart(4, "0")} · Qty {r.numberOfQuantities} · ₹
                  {(r.totalPrice ?? 0).toLocaleString("en-IN")}
                </div>
              </div>
              <StatusPill status={r.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
