import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  X,
  Wallet,
  ListChecks,
  Building2,
  Search,
  XCircle,
  ChevronDown,
  TrendingUp,
  ArrowLeft,
  User,
  Package,
  Building,
  Tag,
  Hash,
  IndianRupee,
  CalendarDays,
} from "lucide-react";
import { listRequests, updateRequestStatus } from "../api/requests";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import StatusPill from "../components/StatusPill";
import ApprovalTrail from "../components/ApprovalTrail";
import Topbar from "../components/Topbar";
import { SkeletonRows, EmptyState } from "./Home";

const STATUS_COLORS = {
  PENDING: "#E0A526",
  MANAGER_APPROVED: "#3454D1",
  MANAGER_REJECTED: "#E15554",
  APPROVED: "#1E9E6B",
  REJECTED: "#E15554",
  DELIVERED: "#12172B",
};

const TIMEFRAMES = [
  { key: "7", label: "7D", days: 7 },
  { key: "30", label: "30D", days: 30 },
  { key: "90", label: "90D", days: 90 },
  { key: "all", label: "All time", days: null },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [timeframe, setTimeframe] = useState("all");
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [tableQuery, setTableQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const isManager = user?.role === "MANAGER";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    refresh();
  }, [user?.role, user?.userId]);

  async function refresh() {
    setLoading(true);
    try {
      const all = await listRequests();
      setRequests(
        user?.role === "ADMIN" || user?.role === "MANAGER"
          ? all
          : user?.userId
            ? all.filter((request) => request.user?.userId === user.userId)
            : []
      );
    } catch {
      // ignore — likely backend not running in this preview
    } finally {
      setLoading(false);
    }
  }

  const inRange = useMemo(() => {
    const tf = TIMEFRAMES.find((t) => t.key === timeframe);
    if (!tf?.days) return requests;
    const cutoff = Date.now() - tf.days * 24 * 60 * 60 * 1000;
    return requests.filter((r) => !r.createdDate || new Date(r.createdDate).getTime() >= cutoff);
  }, [requests, timeframe]);

  const totalSpend = useMemo(
    () => inRange.reduce((sum, r) => sum + (r.totalPrice ?? 0), 0),
    [inRange]
  );

  const byStatus = useMemo(() => {
    const counts = {};
    inRange.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    });
    return counts;
  }, [inRange]);

  const byCategory = useMemo(() => {
    const map = {};
    inRange.forEach((r) => {
      const name = r.category?.categoryName ?? "Uncategorized";
      map[name] = (map[name] ?? 0) + (r.totalPrice ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [inRange]);

  const maxCategorySpend = Math.max(1, ...byCategory.map(([, v]) => v));

  // Requests grouped per-day for the last 7 days, for the weekly activity bar chart.
  const weeklyActivity = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toDateString();
      const count = requests.filter(
        (r) => r.createdDate && new Date(r.createdDate).toDateString() === dayKey
      ).length;
      days.push({ label: d.toLocaleDateString("en-IN", { weekday: "short" }), count });
    }
    return days;
  }, [requests]);
  const maxDayCount = Math.max(1, ...weeklyActivity.map((d) => d.count));
  const weeklyAvgPct = Math.round(
    (weeklyActivity.reduce((s, d) => s + d.count, 0) / (weeklyActivity.length * maxDayCount || 1)) * 100
  );

  // Daily spend total for the last 14 days, for the spend trend line chart.
  const spendTrend = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toDateString();
      const total = requests
        .filter((r) => r.createdDate && new Date(r.createdDate).toDateString() === dayKey)
        .reduce((s, r) => s + (r.totalPrice ?? 0), 0);
      days.push({ label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), total });
    }
    return days;
  }, [requests]);
  const maxSpendDay = Math.max(1, ...spendTrend.map((d) => d.total));
  const spendLinePoints = spendTrend
    .map((d, i) => {
      const x = (i / (spendTrend.length - 1)) * 100;
      const y = 40 - (d.total / maxSpendDay) * 36;
      return `${x},${y}`;
    })
    .join(" ");
  const spendAreaPoints = `0,40 ${spendLinePoints} 100,40`;

  // Recent unique requesters, Donezo "team collaboration"-style.
  const recentRequesters = useMemo(() => {
    const seen = new Map();
    [...inRange]
      .sort((a, b) => new Date(b.createdDate ?? 0) - new Date(a.createdDate ?? 0))
      .forEach((r) => {
        const key = r.user?.userId ?? r.user?.name;
        if (key && !seen.has(key)) {
          seen.set(key, r);
        }
      });
    return Array.from(seen.values()).slice(0, 4);
  }, [inRange]);

  const actionable = inRange.filter((r) => r.status === "PENDING");
  const adminActionable = inRange.filter((r) => r.status === "MANAGER_APPROVED");

  const drilldownActive = Boolean(statusFilter || categoryFilter || tableQuery);
  const drilldownResults = useMemo(() => {
    return inRange.filter((r) => {
      const matchesStatus = !statusFilter || r.status === statusFilter;
      const matchesCategory =
        !categoryFilter || (r.category?.categoryName ?? "Uncategorized") === categoryFilter;
      const haystack = `${r.product?.name ?? ""} ${r.user?.name ?? ""}`.toLowerCase();
      const matchesQuery = !tableQuery || haystack.includes(tableQuery.toLowerCase());
      return matchesStatus && matchesCategory && matchesQuery;
    });
  }, [inRange, statusFilter, categoryFilter, tableQuery]);

  function toggleStatus(key) {
    setStatusFilter((prev) => (prev === key ? null : key));
  }

  function toggleCategory(name) {
    setCategoryFilter((prev) => (prev === name ? null : name));
  }

  function clearDrilldown() {
    setStatusFilter(null);
    setCategoryFilter(null);
    setTableQuery("");
  }

  const STATUS_TOAST_LABEL = {
    MANAGER_APPROVED: ["Request approved.", "success"],
    MANAGER_REJECTED: ["Request rejected.", "info"],
    APPROVED: ["Request given final approval.", "success"],
    REJECTED: ["Request rejected.", "info"],
  };

 async function act(id, status) {
  setBusyId(id);

  try {
    await updateRequestStatus(id, status);

    const [message, type] =
      STATUS_TOAST_LABEL[status] ?? ["Status updated.", "success"];

    showToast(message, type);

    if (status === "APPROVED") {
      const approvedRequest = inRange.find(
        (request) => request.requestId === id
      );

      if (approvedRequest) {
        navigate("/payment", {
          state: {
            request: {
              ...approvedRequest,
              status: "APPROVED"
            }
          }
        });
        return;
      }
    }

    await refresh();
  } catch (err) {
    showToast(
      err.response?.data?.message ||
        err.message ||
        "Couldn't update this request. Try again.",
      "error"
    );
  } finally {
    setBusyId(null);
  }
}

  const donutSlices = buildDonutSlices(byStatus, inRange.length);
  const deliveredPct = inRange.length
    ? Math.round(((byStatus.DELIVERED ?? 0) / inRange.length) * 100)
    : 0;

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Spend and approval activity across the organization."
        action={
          <div className="flex gap-1 bg-card border border-ink/10 rounded-lg p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.key}
                onClick={() => setTimeframe(tf.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeframe === tf.key ? "bg-ink text-white" : "text-slate hover:bg-ink/5"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Stat card row — Donezo-style headline numbers with a trend caption */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total requests"
          value={inRange.length}
          caption={`₹${totalSpend.toLocaleString("en-IN", { maximumFractionDigits: 0 })} in value`}
          tone="ink"
        />
        <StatCard
          label="Delivered"
          value={byStatus.DELIVERED ?? 0}
          caption={`${deliveredPct}% completion rate`}
          tone="good"
        />
        <StatCard
          label="In progress"
          value={(byStatus.PENDING ?? 0) + (byStatus.MANAGER_APPROVED ?? 0)}
          caption="Awaiting a decision"
          tone="amber"
        />
        <StatCard
          label="Pending review"
          value={byStatus.PENDING ?? 0}
          caption="Needs manager action"
          tone="signal"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly activity — Donezo "Project Analytics" style bar chart */}
        <div className="lg:col-span-2 bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-slate text-xs font-medium">
              <TrendingUp size={14} /> Weekly activity
            </div>
            <span className="text-xs text-slate-light">Average {weeklyAvgPct}%</span>
          </div>
          <div className="flex items-end justify-between gap-3 h-32">
            {weeklyActivity.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1">
                <div className="w-full bg-ink/5 rounded-md h-24 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-signal rounded-md transition-all"
                    style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: d.count ? "6px" : 0 }}
                  />
                </div>
                <span className="text-[10px] text-slate-light">{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent requesters — Donezo "Team collaboration" style list */}
        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <h2 className="font-display font-semibold text-ink mb-5">Recent requesters</h2>
          {recentRequesters.length === 0 ? (
            <p className="text-xs text-slate-light">No activity in this period.</p>
          ) : (
            <ul className="space-y-4">
              {recentRequesters.map((r) => (
                <li key={r.requestId} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-signal-light text-signal flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(r.user?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink truncate">{r.user?.name ?? "—"}</div>
                    <div className="text-xs text-slate-light truncate">
                      {r.product?.name ?? "Item request"}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Spend trend — 14-day line/area chart */}
      <div className="bg-card rounded-card shadow-card border border-ink/5 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-slate text-xs font-medium">
            <TrendingUp size={14} /> Spend trend (last 14 days)
          </div>
          <span className="text-xs text-slate-light">
            Peak ₹{Math.round(maxSpendDay).toLocaleString("en-IN")}
          </span>
        </div>
        <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="w-full h-32">
          <polygon points={spendAreaPoints} fill="#378ADD" opacity="0.08" />
          <polyline
            points={spendLinePoints}
            fill="none"
            stroke="#378ADD"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
          {spendTrend.map((d, i) => {
            const x = (i / (spendTrend.length - 1)) * 100;
            const y = 40 - (d.total / maxSpendDay) * 36;
            return (
              <circle key={i} cx={x} cy={y} r="1.4" fill="#378ADD" vectorEffect="non-scaling-stroke">
                <title>
                  {d.label}: ₹{Math.round(d.total).toLocaleString("en-IN")}
                </title>
              </circle>
            );
          })}
        </svg>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-slate-light">{spendTrend[0]?.label}</span>
          <span className="text-[10px] text-slate-light">{spendTrend[spendTrend.length - 1]?.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate text-xs font-medium">
              <ListChecks size={14} /> Status breakdown
            </div>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter(null)}
                className="text-[11px] text-signal hover:underline flex items-center gap-0.5"
              >
                Clear <XCircle size={11} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-5">
            <svg
              viewBox="0 0 100 100"
              className="h-20 w-20 shrink-0"
              role="img"
              aria-label="Status breakdown chart"
            >
              {inRange.length === 0 ? (
                <circle cx="50" cy="50" r="40" fill="none" stroke="#EEF0F6" strokeWidth="16" />
              ) : (
                donutSlices.map((slice) => (
                  <path
                    key={slice.status}
                    d={slice.path}
                    fill={slice.color}
                    className="cursor-pointer transition-opacity"
                    opacity={!statusFilter || statusFilter === slice.status ? 1 : 0.25}
                    onClick={() => toggleStatus(slice.status)}
                  >
                    <title>
                      {slice.status.replace("_", " ").toLowerCase()} — {slice.count} (
                      {slice.pct}%)
                    </title>
                  </path>
                ))
              )}
            </svg>
            <ul className="space-y-1.5 text-xs flex-1">
              {Object.keys(STATUS_COLORS).map((key) =>
                byStatus[key] ? (
                  <li key={key}>
                    <button
                      onClick={() => toggleStatus(key)}
                      className={`w-full flex items-center gap-2 rounded px-1 -mx-1 py-0.5 transition-colors ${
                        statusFilter === key ? "bg-ink/5" : "hover:bg-ink/5"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: STATUS_COLORS[key] }}
                      />
                      <span
                        className={`text-slate ${statusFilter === key ? "font-semibold text-ink" : ""}`}
                      >
                        {key.replace("_", " ").toLowerCase()}
                      </span>
                      <span className="font-mono-num text-ink ml-auto pl-3">{byStatus[key]}</span>
                    </button>
                  </li>
                ) : null
              )}
            </ul>
          </div>
        </div>

        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate text-xs font-medium">
              <Building2 size={14} /> Spend by category
            </div>
            {categoryFilter && (
              <button
                onClick={() => setCategoryFilter(null)}
                className="text-[11px] text-signal hover:underline flex items-center gap-0.5"
              >
                Clear <XCircle size={11} />
              </button>
            )}
          </div>
          <div className="space-y-2.5">
            {byCategory.length === 0 && (
              <p className="text-xs text-slate-light">No category data yet.</p>
            )}
            {byCategory.map(([name, value]) => (
              <button
                key={name}
                onClick={() => toggleCategory(name)}
                title={`₹${value.toLocaleString("en-IN")} · ${Math.round(
                  (value / (totalSpend || 1)) * 100
                )}% of spend`}
                className="block w-full text-left group"
              >
                <div className="flex justify-between text-xs mb-1">
                  <span
                    className={`text-slate ${
                      categoryFilter === name ? "font-semibold text-ink" : "group-hover:text-ink"
                    }`}
                  >
                    {name}
                  </span>
                  <span className="font-mono-num text-ink">
                    ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-ink/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      categoryFilter === name ? "bg-signal-dark" : "bg-signal"
                    }`}
                    style={{
                      width: `${(value / maxCategorySpend) * 100}%`,
                      opacity: !categoryFilter || categoryFilter === name ? 1 : 0.35,
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Completion ring — Donezo "Project Progress" style */}
        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-2 text-slate text-xs font-medium mb-4 self-start">
            <Wallet size={14} /> Completion rate
          </div>
          <svg viewBox="0 0 100 100" className="h-24 w-24 mb-3">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#EEF0F6" strokeWidth="12" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#1E9E6B"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(deliveredPct / 100) * 251.2} 251.2`}
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="55" textAnchor="middle" className="font-display font-semibold" fontSize="20" fill="#12172B">
              {deliveredPct}%
            </text>
          </svg>
          <p className="text-xs text-slate-light">
            {byStatus.DELIVERED ?? 0} of {inRange.length} requests delivered
          </p>
        </div>
      </div>

      {drilldownActive && (
        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6 mb-6">
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <div>
              <h2 className="font-display font-semibold text-ink mb-1">
                {drilldownResults.length} matching request{drilldownResults.length === 1 ? "" : "s"}
              </h2>
              <p className="text-sm text-slate">
                {statusFilter && (
                  <span className="mr-2">Status: {statusFilter.replace("_", " ").toLowerCase()}</span>
                )}
                {categoryFilter && <span>Category: {categoryFilter}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light" />
                <input
                  value={tableQuery}
                  onChange={(e) => setTableQuery(e.target.value)}
                  placeholder="Search item or requester…"
                  className="rounded-lg border border-ink/10 bg-white pl-8 pr-3 py-2 text-xs text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition w-56"
                />
              </div>
              <button
                onClick={clearDrilldown}
                className="text-xs font-medium text-slate hover:text-ink border border-ink/10 rounded-lg px-3 py-2 transition"
              >
                Clear all
              </button>
            </div>
          </div>

          {drilldownResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              body="Try clearing a filter or adjusting your search."
            />
          ) : (
            <div className="divide-y divide-ink/5">
              {drilldownResults.slice(0, 25).map((r) => (
                <div key={r.requestId} className="flex items-center justify-between py-3.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {r.product?.name ?? "Item request"} · Qty {r.numberOfQuantities}
                    </div>
                    <div className="text-xs text-slate-light mt-0.5">
                      {r.user?.name ?? "—"} · ₹{(r.totalPrice ?? 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <StatusPill status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isManager && (
        <ApprovalQueue
          title="Awaiting your review"
          subtitle="Requests raised by your team, pending manager approval. Click one to see its trail."
          items={actionable}
          loading={loading}
          busyId={busyId}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onApprove={(id) => act(id, "MANAGER_APPROVED")}
          onReject={(id) => act(id, "MANAGER_REJECTED")}
        />
      )}

      {isAdmin && (
        <ApprovalQueue
          title="Awaiting final approval"
          subtitle="Requests already cleared by a manager, pending your sign-off. Click one to see its trail."
          items={adminActionable}
          loading={loading}
          busyId={busyId}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onApprove={(id) => act(id, "APPROVED")}
          onReject={(id) => act(id, "REJECTED")}
        />
      )}
    </div>
  );
}

function ApprovalQueue({
  title,
  subtitle,
  items,
  loading,
  busyId,
  expandedId,
  setExpandedId,
  onApprove,
  onReject,
}) {
  const [confirmingRejectId, setConfirmingRejectId] = useState(null);
   const [selectedRequest, setSelectedRequest] = useState(null);

  function handleRejectClick(id) {
    if (confirmingRejectId === id) {
      setConfirmingRejectId(null);
      onReject(id);
    } else {
      setConfirmingRejectId(id);
    }
  }

  return (
  <>
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-6 mb-6 last:mb-0">
      <h2 className="font-display font-semibold text-ink mb-1">
        {title}
      </h2>

      <p className="text-sm text-slate mb-5">
        {subtitle}
      </p>

      {loading ? (
        <SkeletonRows />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nothing pending"
          body="Requests will show up here once they reach this stage."
        />
      ) : (
        <div className="divide-y divide-ink/5">
          {items.map((r) => {
            const isConfirmingReject =
              confirmingRejectId === r.requestId;

            return (
              <div key={r.requestId}>
                <div className="flex items-start justify-between gap-4 py-4">
                  <div
                    className="min-w-0 flex items-start gap-3 cursor-pointer flex-1"
                    onClick={() => setSelectedRequest(r)}
                  >
                    <div className="h-9 w-9 rounded-full bg-signal-light text-signal flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                      {initials(r.user?.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink">
                        {r.product?.name ?? "Item request"}
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-light mt-1">
                        <span>
                          Requester:{" "}
                          <span className="text-slate font-medium">
                            {r.user?.name ?? "—"}
                          </span>
                        </span>

                        <span>
                          User ID:{" "}
                          <span className="font-mono-num text-slate font-medium">
                            #{r.user?.userId ?? "—"}
                          </span>
                        </span>

                        <span>
                          Category:{" "}
                          <span className="text-slate font-medium">
                            {r.category?.categoryName ?? "Uncategorized"}
                          </span>
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-light mt-1">
                        <span>
                          Qty:{" "}
                          <span className="font-mono-num text-slate font-medium">
                            {r.numberOfQuantities}
                          </span>
                        </span>

                        <span>
                          Amount:{" "}
                          <span className="font-mono-num text-ink font-semibold">
                            ₹{(r.totalPrice ?? 0).toLocaleString("en-IN")}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={busyId === r.requestId}
                      onClick={() => handleRejectClick(r.requestId)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-40 ${
                        isConfirmingReject
                          ? "bg-coral text-white"
                          : "bg-coral-light text-coral hover:opacity-80"
                      }`}
                    >
                      <X size={13} />

                      {isConfirmingReject
                        ? "Confirm reject?"
                        : "Reject"}
                    </button>

                    <button
                      disabled={busyId === r.requestId}
                      onClick={() => onApprove(r.requestId)}
                      className="flex items-center gap-1.5 rounded-lg bg-good-light text-good px-3 py-2 text-xs font-medium hover:opacity-80 disabled:opacity-40 transition"
                    >
                      <Check size={13} />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

    <RequestApprovalPanel
      request={selectedRequest}
      onClose={() => setSelectedRequest(null)}
      onApprove={() => {
        onApprove(selectedRequest.requestId);
        setSelectedRequest(null);
      }}
      onReject={() => {
        onReject(selectedRequest.requestId);
        setSelectedRequest(null);
      }}
      busy={
        selectedRequest
          ? busyId === selectedRequest.requestId
          : false
      }
    />
  </>
);
}
function RequestApprovalPanel({ request, onClose, onApprove, onReject, busy }) {
  if (!request) return null;

  const status = request.status;

  return (
    <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto bg-card rounded-2xl shadow-2xl border border-ink/10">
        <div className="sticky top-0 z-10 bg-card border-b border-ink/10 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-slate hover:text-ink transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="text-xs font-mono-num text-slate-light">
            REQUEST #{String(request.requestId).padStart(4, "0")}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-light mb-2">
                Procurement request
              </p>

              <h2 className="font-display text-3xl font-semibold text-ink">
                {request.product?.name ?? "Item request"}
              </h2>

              <p className="text-sm text-slate mt-2">
                Submitted by {request.user?.name ?? "Unknown requester"}
              </p>
            </div>

            <StatusPill status={status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <DetailCard
              icon={User}
              label="Requester"
              value={request.user?.name ?? "—"}
            />

            <DetailCard
              icon={Building}
              label="Department"
              value={request.department?.departmentName ?? "—"}
            />

            <DetailCard
              icon={Tag}
              label="Category"
              value={request.category?.categoryName ?? "—"}
            />

            <DetailCard
              icon={Package}
              label="Product"
              value={request.product?.name ?? "—"}
            />

            <DetailCard
              icon={Hash}
              label="Quantity"
              value={request.numberOfQuantities ?? "—"}
            />

            <DetailCard
              icon={IndianRupee}
              label="Total amount"
              value={`₹${(request.totalPrice ?? 0).toLocaleString("en-IN")}`}
            />
          </div>

          <div className="bg-ink/[0.02] rounded-xl border border-ink/5 p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays size={16} className="text-signal" />

              <h3 className="font-display font-semibold text-ink">
                Approval journey
              </h3>
            </div>

            <ApprovalTrail
              status={request.status}
              updatedDate={request.updatedDate}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-light">
              Created{" "}
              {request.createdDate
                ? new Date(request.createdDate).toLocaleString("en-IN")
                : "—"}
            </div>

            <div className="flex items-center gap-3">
              {status === "PENDING" && (
                <>
                  <button
                    disabled={busy}
                    onClick={onReject}
                    className="flex items-center gap-2 rounded-lg bg-coral-light text-coral px-5 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 transition"
                  >
                    <X size={15} />
                    Reject request
                  </button>

                  <button
                    disabled={busy}
                    onClick={onApprove}
                    className="flex items-center gap-2 rounded-lg bg-good text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition"
                  >
                    <Check size={15} />
                    Approve request
                  </button>
                </>
              )}

              {status === "MANAGER_APPROVED" && (
                <>
                  <button
                    disabled={busy}
                    onClick={onReject}
                    className="flex items-center gap-2 rounded-lg bg-coral-light text-coral px-5 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 transition"
                  >
                    <X size={15} />
                    Reject request
                  </button>

                  <button
                    disabled={busy}
                    onClick={onApprove}
                    className="flex items-center gap-2 rounded-lg bg-good text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition"
                  >
                    <Check size={15} />
                    Give final approval
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-slate-light mb-2">
        <Icon size={14} />
        {label}
      </div>

      <div className="text-sm font-medium text-ink truncate">
        {value}
      </div>
    </div>
  );
}
function StatCard({ label, value, caption, tone }) {
  const dots = {
    ink: "bg-ink",
    good: "bg-good",
    amber: "bg-amber",
    signal: "bg-signal",
  };
  return (
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate">{label}</span>
        <span className={`h-2 w-2 rounded-full ${dots[tone]}`} />
      </div>
      <div className="font-display text-3xl font-semibold text-ink font-mono-num mb-1">{value}</div>
      <p className="text-xs text-slate-light">{caption}</p>
    </div>
  );
}

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function buildDonutSlices(byStatus, total) {
  if (!total) return [];
  const cx = 50;
  const cy = 50;
  const rOuter = 40;
  const rInner = 24;
  let acc = 0;

  return Object.entries(byStatus).map(([status, count]) => {
    const startAngle = (acc / total) * 360;
    acc += count;
    const endAngle = (acc / total) * 360;
    const pct = Math.round((count / total) * 100);
    return {
      status,
      count,
      pct,
      color: STATUS_COLORS[status] ?? "#9298A8",
      path: describeDonutSlice(cx, cy, rOuter, rInner, startAngle, endAngle),
    };
  });
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSlice(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const clampedEnd = endAngle - startAngle >= 359.99 ? startAngle + 359.99 : endAngle;
  const startOuter = polarToCartesian(cx, cy, rOuter, clampedEnd);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, clampedEnd);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;

  return [
    "M", startOuter.x, startOuter.y,
    "A", rOuter, rOuter, 0, largeArc, 0, endOuter.x, endOuter.y,
    "L", endInner.x, endInner.y,
    "A", rInner, rInner, 0, largeArc, 1, startInner.x, startInner.y,
    "Z",
  ].join(" ");
}
