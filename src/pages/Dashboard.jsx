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
  TrendingUp,
  ArrowLeft,
  User,
  Package,
  Building,
  Tag,
  Hash,
  IndianRupee,
  CalendarDays,
  RefreshCw,
  ArrowUpRight,
  Clock3,
  Activity,
  ChevronRight,
  Sparkles,
  CircleDollarSign,
  BarChart3,
  Target,
  Zap,
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

const STATUS_LABELS = {
  PENDING: "Pending",
  MANAGER_APPROVED: "Manager approved",
  MANAGER_REJECTED: "Manager rejected",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DELIVERED: "Delivered",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [timeframe, setTimeframe] = useState("all");
  const [statusFilter, setStatusFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [tableQuery, setTableQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [activeChartPoint, setActiveChartPoint] = useState(null);

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
            ? all.filter(
                (request) =>
                  request.user?.userId === user.userId
              )
            : []
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  const inRange = useMemo(() => {
    const tf = TIMEFRAMES.find((item) => item.key === timeframe);

    if (!tf?.days) {
      return requests;
    }

    const cutoff =
      Date.now() - tf.days * 24 * 60 * 60 * 1000;

    return requests.filter(
      (request) =>
        !request.createdDate ||
        new Date(request.createdDate).getTime() >= cutoff
    );
  }, [requests, timeframe]);

  const totalSpend = useMemo(
    () =>
      inRange.reduce(
        (sum, request) =>
          sum + (request.totalPrice ?? 0),
        0
      ),
    [inRange]
  );

  const byStatus = useMemo(() => {
    const counts = {};

    inRange.forEach((request) => {
      counts[request.status] =
        (counts[request.status] ?? 0) + 1;
    });

    return counts;
  }, [inRange]);

  const byCategory = useMemo(() => {
    const map = {};

    inRange.forEach((request) => {
      const name =
        request.category?.categoryName ??
        "Uncategorized";

      map[name] =
        (map[name] ?? 0) +
        (request.totalPrice ?? 0);
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [inRange]);

  const maxCategorySpend = Math.max(
    1,
    ...byCategory.map(([, value]) => value)
  );

  const weeklyActivity = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayKey = date.toDateString();

      const dayRequests = requests.filter(
        (request) =>
          request.createdDate &&
          new Date(
            request.createdDate
          ).toDateString() === dayKey
      );

      days.push({
        label: date.toLocaleDateString(
          "en-IN",
          { weekday: "short" }
        ),
        shortDate: date.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
          }
        ),
        count: dayRequests.length,
        spend: dayRequests.reduce(
          (sum, request) =>
            sum + (request.totalPrice ?? 0),
          0
        ),
      });
    }

    return days;
  }, [requests]);

  const maxDayCount = Math.max(
    1,
    ...weeklyActivity.map((day) => day.count)
  );

  const spendTrend = useMemo(() => {
    const days = [];

    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayKey = date.toDateString();

      const dayRequests = requests.filter(
        (request) =>
          request.createdDate &&
          new Date(
            request.createdDate
          ).toDateString() === dayKey
      );

      const total = dayRequests.reduce(
        (sum, request) =>
          sum + (request.totalPrice ?? 0),
        0
      );

      days.push({
        label: date.toLocaleDateString(
          "en-IN",
          {
            day: "numeric",
            month: "short",
          }
        ),
        total,
        count: dayRequests.length,
      });
    }

    return days;
  }, [requests]);

  const maxSpendDay = Math.max(
    1,
    ...spendTrend.map((day) => day.total)
  );

  const spendLinePoints = spendTrend
    .map((day, index) => {
      const x =
        spendTrend.length === 1
          ? 50
          : (index /
              (spendTrend.length - 1)) *
            100;

      const y =
        40 -
        (day.total / maxSpendDay) * 36;

      return `${x},${y}`;
    })
    .join(" ");

  const spendAreaPoints =
    `0,40 ${spendLinePoints} 100,40`;

  const recentRequesters = useMemo(() => {
    const seen = new Map();

    [...inRange]
      .sort(
        (a, b) =>
          new Date(b.createdDate ?? 0) -
          new Date(a.createdDate ?? 0)
      )
      .forEach((request) => {
        const key =
          request.user?.userId ??
          request.user?.name;

        if (key && !seen.has(key)) {
          seen.set(key, request);
        }
      });

    return Array.from(seen.values()).slice(0, 5);
  }, [inRange]);

  const recentActivity = useMemo(() => {
    return [...inRange]
      .sort(
        (a, b) =>
          new Date(b.updatedDate ?? b.createdDate ?? 0) -
          new Date(a.updatedDate ?? a.createdDate ?? 0)
      )
      .slice(0, 6);
  }, [inRange]);

  const actionable = inRange.filter(
    (request) => request.status === "PENDING"
  );

  const adminActionable = inRange.filter(
    (request) =>
      request.status === "MANAGER_APPROVED"
  );

  const approvedCount = byStatus.APPROVED ?? 0;
  const deliveredCount = byStatus.DELIVERED ?? 0;
  const rejectedCount =
    (byStatus.REJECTED ?? 0) +
    (byStatus.MANAGER_REJECTED ?? 0);

  const completedBase =
    approvedCount +
    deliveredCount +
    rejectedCount;

  const approvalEfficiency =
    inRange.length > 0
      ? Math.round(
          ((approvedCount +
            deliveredCount) /
            inRange.length) *
            100
        )
      : 0;

  const fulfilmentRate =
    inRange.length > 0
      ? Math.round(
          (deliveredCount /
            inRange.length) *
            100
        )
      : 0;

  const procurementHealth =
    inRange.length > 0
      ? Math.min(
          100,
          Math.round(
            approvalEfficiency * 0.45 +
              fulfilmentRate * 0.55
          )
        )
      : 0;

  const deliveredPct =
    inRange.length > 0
      ? Math.round(
          (deliveredCount /
            inRange.length) *
            100
        )
      : 0;

  const weeklyTotal = weeklyActivity.reduce(
    (sum, day) => sum + day.count,
    0
  );

  const weeklyAverage = weeklyActivity.length
    ? (
        weeklyTotal /
        weeklyActivity.length
      ).toFixed(1)
    : "0.0";

  const weeklySpend = weeklyActivity.reduce(
    (sum, day) => sum + day.spend,
    0
  );

  const drilldownActive = Boolean(
    statusFilter ||
      categoryFilter ||
      tableQuery
  );

  const drilldownResults = useMemo(() => {
    return inRange.filter((request) => {
      const matchesStatus =
        !statusFilter ||
        request.status === statusFilter;

      const matchesCategory =
        !categoryFilter ||
        (request.category?.categoryName ??
          "Uncategorized") === categoryFilter;

      const haystack =
        `${request.product?.name ?? ""} ${
          request.user?.name ?? ""
        } ${
          request.category?.categoryName ?? ""
        }`.toLowerCase();

      const matchesQuery =
        !tableQuery ||
        haystack.includes(
          tableQuery.toLowerCase()
        );

      return (
        matchesStatus &&
        matchesCategory &&
        matchesQuery
      );
    });
  }, [
    inRange,
    statusFilter,
    categoryFilter,
    tableQuery,
  ]);

  function toggleStatus(key) {
    setStatusFilter((prev) =>
      prev === key ? null : key
    );
  }

  function toggleCategory(name) {
    setCategoryFilter((prev) =>
      prev === name ? null : name
    );
  }

  function clearDrilldown() {
    setStatusFilter(null);
    setCategoryFilter(null);
    setTableQuery("");
  }

  const STATUS_TOAST_LABEL = {
    MANAGER_APPROVED: [
      "Request approved.",
      "success",
    ],
    MANAGER_REJECTED: [
      "Request rejected.",
      "info",
    ],
    APPROVED: [
      "Request given final approval.",
      "success",
    ],
    REJECTED: [
      "Request rejected.",
      "info",
    ],
  };

  async function act(id, status) {
    setBusyId(id);

    try {
      await updateRequestStatus(id, status);

      const [message, type] =
        STATUS_TOAST_LABEL[status] ??
        ["Status updated.", "success"];

      showToast(message, type);

      if (status === "APPROVED") {
        const approvedRequest =
          inRange.find(
            (request) =>
              request.requestId === id
          );

        if (approvedRequest) {
          navigate("/payment", {
            state: {
              request: {
                ...approvedRequest,
                status: "APPROVED",
              },
            },
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

  function handleWeeklyBarClick(day) {
    if (!day.count) {
      return;
    }

    const matchingDate = weeklyActivity.find(
      (item) => item.shortDate === day.shortDate
    );

    if (matchingDate) {
      setTableQuery("");
    }
  }

  return (
    <div className="pb-10">
      <Topbar
        title="Dashboard"
        subtitle="Your procurement command center."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-ink/10 bg-card px-3 py-2 text-xs font-medium text-slate hover:text-ink hover:bg-ink/[0.025] transition disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <div className="flex gap-1 bg-card border border-ink/10 rounded-lg p-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.key}
                  onClick={() =>
                    setTimeframe(tf.key)
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    timeframe === tf.key
                      ? "bg-ink text-white shadow-sm"
                      : "text-slate hover:bg-ink/5"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-2xl bg-ink text-white p-6 md:p-7 mb-6 shadow-card">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute right-20 -bottom-24 h-48 w-48 rounded-full bg-signal/10 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/55 text-xs mb-3">
              <Sparkles size={13} />
              PROCUREMENT OVERVIEW
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">
              Good to see you,{" "}
              {user?.name?.split(" ")[0] ||
                "there"}.
            </h2>

            <p className="text-sm text-white/60 mt-2 max-w-xl">
              Monitor requests, spending and approval
              activity from one place.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                clearDrilldown();
                navigate("/orders");
              }}
              className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2.5 text-xs font-medium transition"
            >
              <Package size={14} />
              View orders
              <ArrowUpRight size={13} />
            </button>

            <button
              onClick={() => {
                clearDrilldown();
                navigate("/products");
              }}
              className="hidden sm:flex items-center gap-2 rounded-xl bg-white text-ink hover:bg-white/90 px-4 py-2.5 text-xs font-semibold transition"
            >
              Browse products
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <InteractiveStatCard
          label="Total requests"
          value={inRange.length}
          caption={`₹${totalSpend.toLocaleString(
            "en-IN",
            { maximumFractionDigits: 0 }
          )} total value`}
          icon={ListChecks}
          tone="ink"
          active={!statusFilter && !categoryFilter}
          onClick={() => {
            clearDrilldown();
          }}
        />

        <InteractiveStatCard
          label="Delivered"
          value={deliveredCount}
          caption={`${deliveredPct}% completion rate`}
          icon={Check}
          tone="good"
          active={statusFilter === "DELIVERED"}
          onClick={() =>
            toggleStatus("DELIVERED")
          }
        />

        <InteractiveStatCard
          label="In progress"
          value={
            (byStatus.PENDING ?? 0) +
            (byStatus.MANAGER_APPROVED ?? 0)
          }
          caption="Requests moving through approval"
          icon={Activity}
          tone="amber"
          active={
            statusFilter === "PENDING" ||
            statusFilter === "MANAGER_APPROVED"
          }
          onClick={() => {
            if (
              statusFilter === "PENDING" ||
              statusFilter ===
                "MANAGER_APPROVED"
            ) {
              setStatusFilter(null);
            } else {
              setStatusFilter("PENDING");
            }
          }}
        />

        <InteractiveStatCard
          label="Pending review"
          value={byStatus.PENDING ?? 0}
          caption={
            isManager
              ? "Needs your action"
              : "Awaiting manager action"
          }
          icon={Clock3}
          tone="signal"
          active={statusFilter === "PENDING"}
          onClick={() =>
            toggleStatus("PENDING")
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-slate text-xs font-medium">
                <BarChart3 size={14} />
                Weekly activity
              </div>

              <p className="text-xs text-slate-light mt-1">
                Requests created over the last 7 days
              </p>
            </div>

            <div className="text-right">
              <p className="font-mono-num text-lg font-semibold text-ink">
                {weeklyTotal}
              </p>

              <p className="text-[10px] text-slate-light">
                {weeklySpend > 0
                  ? `₹${Math.round(
                      weeklySpend
                    ).toLocaleString(
                      "en-IN"
                    )} activity value`
                  : "No spend recorded"}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3 h-44">
            {weeklyActivity.map(
              (day, index) => {
                const percentage =
                  maxDayCount > 0
                    ? (day.count /
                        maxDayCount) *
                      100
                    : 0;

                const isHighest =
                  day.count ===
                    maxDayCount &&
                  day.count > 0;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      handleWeeklyBarClick(
                        day
                      )
                    }
                    className="flex-1 h-full flex flex-col items-center justify-end gap-2 group outline-none"
                    title={`${day.shortDate}: ${day.count} request${
                      day.count === 1
                        ? ""
                        : "s"
                    }`}
                  >
                    <div className="text-[10px] font-mono-num text-slate opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                      {day.count}
                    </div>

                    <div className="w-full h-32 rounded-xl bg-ink/[0.035] flex items-end overflow-hidden">
                      <div
                        className={`w-full rounded-xl transition-all duration-500 ${
                          isHighest
                            ? "bg-signal"
                            : "bg-signal/55 group-hover:bg-signal"
                        }`}
                        style={{
                          height: day.count
                            ? `${Math.max(
                                percentage,
                                8
                              )}%`
                            : "3px",
                        }}
                      />
                    </div>

                    <span className="text-[10px] font-medium text-slate group-hover:text-ink transition">
                      {day.label}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-ink/5 flex items-center justify-between">
            <span className="text-xs text-slate-light">
              Daily average
            </span>

            <span className="font-mono-num text-xs font-semibold text-ink">
              {weeklyAverage} requests
            </span>
          </div>
        </div>

        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-ink">
                Recent requesters
              </h2>

              <p className="text-xs text-slate-light mt-1">
                Latest procurement activity
              </p>
            </div>

            <User
              size={16}
              className="text-slate-light"
            />
          </div>

          {recentRequesters.length === 0 ? (
            <p className="text-xs text-slate-light">
              No activity in this period.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentRequesters.map(
                (request) => (
                  <li
                    key={request.requestId}
                    className="flex items-center gap-3 rounded-xl p-2 -mx-2 hover:bg-ink/[0.025] transition"
                  >
                    <div className="h-9 w-9 rounded-full bg-signal-light text-signal flex items-center justify-center text-xs font-semibold shrink-0">
                      {initials(
                        request.user?.name
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink truncate">
                        {request.user?.name ??
                          "—"}
                      </div>

                      <div className="text-xs text-slate-light truncate">
                        {request.product?.name ??
                          "Item request"}
                      </div>
                    </div>

                    <StatusPill
                      status={request.status}
                    />
                  </li>
                )
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-card rounded-card shadow-card border border-ink/5 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-slate text-xs font-medium">
              <TrendingUp size={14} />
              Spend intelligence
            </div>

            <p className="text-xs text-slate-light mt-1">
              Daily procurement spend over the last 14 days
            </p>
          </div>

          <div className="flex items-center gap-5">
            {activeChartPoint && (
              <div className="text-right">
                <p className="text-[10px] text-slate-light">
                  {activeChartPoint.label}
                </p>
                <p className="font-mono-num text-sm font-semibold text-ink">
                  ₹
                  {Math.round(
                    activeChartPoint.total
                  ).toLocaleString(
                    "en-IN"
                  )}
                </p>
              </div>
            )}

            <div className="text-right">
              <p className="font-mono-num text-sm font-semibold text-ink">
                ₹
                {Math.round(
                  maxSpendDay
                ).toLocaleString(
                  "en-IN"
                )}
              </p>

              <p className="text-[10px] text-slate-light">
                Peak
              </p>
            </div>
          </div>
        </div>

        <div className="relative h-40">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3].map(
              (line) => (
                <div
                  key={line}
                  className="border-t border-dashed border-ink/5"
                />
              )
            )}
          </div>

          <svg
            viewBox="0 0 100 44"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full overflow-visible"
          >
            <defs>
              <linearGradient
                id="dashboardSpendGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="#378ADD"
                  stopOpacity="0.20"
                />
                <stop
                  offset="100%"
                  stopColor="#378ADD"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            <polygon
              points={spendAreaPoints}
              fill="url(#dashboardSpendGradient)"
            />

            <polyline
              points={spendLinePoints}
              fill="none"
              stroke="#378ADD"
              strokeWidth="1.4"
              vectorEffect="non-scaling-stroke"
            />

            {spendTrend.map(
              (day, index) => {
                const x =
                  spendTrend.length ===
                  1
                    ? 50
                    : (index /
                        (spendTrend.length -
                          1)) *
                      100;

                const y =
                  40 -
                  (day.total /
                    maxSpendDay) *
                    36;

                const active =
                  activeChartPoint?.label ===
                  day.label;

                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r={
                        active
                          ? "2.5"
                          : "1.5"
                      }
                      fill="#378ADD"
                      vectorEffect="non-scaling-stroke"
                      className="transition-all"
                    />

                    <rect
                      x={x - 2.5}
                      y="0"
                      width="5"
                      height="44"
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() =>
                        setActiveChartPoint(
                          day
                        )
                      }
                    />
                  </g>
                );
              }
            )}
          </svg>
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-slate-light">
            {spendTrend[0]?.label}
          </span>

          <span className="text-[10px] text-slate-light">
            {spendTrend[
              spendTrend.length - 1
            ]?.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <StatusOverview
          byStatus={byStatus}
          total={inRange.length}
          statusFilter={statusFilter}
          toggleStatus={toggleStatus}
        />

        <CategoryOverview
          byCategory={byCategory}
          totalSpend={totalSpend}
          maxCategorySpend={
            maxCategorySpend
          }
          categoryFilter={
            categoryFilter
          }
          toggleCategory={
            toggleCategory
          }
        />

        <ProcurementHealth
          score={procurementHealth}
          delivered={deliveredCount}
          total={inRange.length}
          approvalEfficiency={
            approvalEfficiency
          }
          fulfilmentRate={
            fulfilmentRate
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 text-slate text-xs font-medium">
                <Activity size={14} />
                Recent activity
              </div>

              <p className="text-xs text-slate-light mt-1">
                Latest changes across your procurement requests
              </p>
            </div>

            <span className="text-[10px] rounded-full bg-ink/[0.04] px-2.5 py-1 text-slate">
              Live data
            </span>
          </div>

          {recentActivity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              body="Activity will appear here as requests move through the workflow."
            />
          ) : (
            <div className="space-y-1">
              {recentActivity.map(
                (request) => (
                  <ActivityRow
                    key={request.requestId}
                    request={request}
                    onClick={() => {
                      setStatusFilter(
                        request.status
                      );
                      setCategoryFilter(null);
                      setTableQuery("");
                    }}
                  />
                )
              )}
            </div>
          )}
        </div>

        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center gap-2 text-slate text-xs font-medium mb-1">
            <Zap size={14} />
            Procurement snapshot
          </div>

          <p className="text-xs text-slate-light mb-5">
            A quick view of where things stand.
          </p>

          <div className="space-y-3">
            <SnapshotRow
              label="Awaiting manager"
              value={
                byStatus.PENDING ?? 0
              }
              icon={Clock3}
              onClick={() =>
                toggleStatus("PENDING")
              }
            />

            <SnapshotRow
              label="Manager approved"
              value={
                byStatus.MANAGER_APPROVED ??
                0
              }
              icon={Check}
              onClick={() =>
                toggleStatus(
                  "MANAGER_APPROVED"
                )
              }
            />

            <SnapshotRow
              label="Final approved"
              value={
                byStatus.APPROVED ?? 0
              }
              icon={Target}
              onClick={() =>
                toggleStatus("APPROVED")
              }
            />

            <SnapshotRow
              label="Delivered"
              value={deliveredCount}
              icon={Package}
              onClick={() =>
                toggleStatus("DELIVERED")
              }
            />

            <SnapshotRow
              label="Rejected"
              value={rejectedCount}
              icon={X}
              onClick={() =>
                toggleStatus("REJECTED")
              }
            />
          </div>

          <div className="mt-5 pt-5 border-t border-ink/5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-light">
                Total procurement value
              </span>

              <span className="font-mono-num text-sm font-semibold text-ink">
                ₹
                {Math.round(
                  totalSpend
                ).toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {drilldownActive && (
        <DrilldownPanel
          results={drilldownResults}
          statusFilter={statusFilter}
          categoryFilter={categoryFilter}
          tableQuery={tableQuery}
          setTableQuery={setTableQuery}
          clearDrilldown={
            clearDrilldown
          }
        />
      )}

      {isManager && (
        <ApprovalQueue
          title="Awaiting your review"
          subtitle="Requests raised by your team, pending manager approval."
          items={actionable}
          loading={loading}
          busyId={busyId}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onApprove={(id) =>
            act(
              id,
              "MANAGER_APPROVED"
            )
          }
          onReject={(id) =>
            act(
              id,
              "MANAGER_REJECTED"
            )
          }
        />
      )}

      {isAdmin && (
        <ApprovalQueue
          title="Awaiting final approval"
          subtitle="Requests already cleared by a manager, pending your sign-off."
          items={adminActionable}
          loading={loading}
          busyId={busyId}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          onApprove={(id) =>
            act(id, "APPROVED")
          }
          onReject={(id) =>
            act(id, "REJECTED")
          }
        />
      )}
    </div>
  );
}

function InteractiveStatCard({
  label,
  value,
  caption,
  icon: Icon,
  tone,
  active,
  onClick,
}) {
  const tones = {
    ink: {
      icon: "bg-ink text-white",
      accent: "bg-ink",
    },
    good: {
      icon: "bg-good-light text-good",
      accent: "bg-good",
    },
    amber: {
      icon: "bg-amber-light text-amber",
      accent: "bg-amber",
    },
    signal: {
      icon: "bg-signal-light text-signal",
      accent: "bg-signal",
    },
  };

  const current =
    tones[tone] ?? tones.ink;

  return (
    <button
      onClick={onClick}
      className={`group text-left relative overflow-hidden bg-card rounded-card shadow-card border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        active
          ? "border-signal/40 ring-2 ring-signal/10"
          : "border-ink/5"
      }`}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${current.accent}`}
      />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate">
            {label}
          </span>

          <div className="font-display text-3xl font-semibold text-ink font-mono-num mt-2">
            {value}
          </div>

          <p className="text-xs text-slate-light mt-1">
            {caption}
          </p>
        </div>

        <div
          className={`h-9 w-9 rounded-xl flex items-center justify-center ${current.icon} transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={16} />
        </div>
      </div>

      <div className="flex items-center gap-1 text-[10px] text-slate-light mt-4 group-hover:text-ink transition">
        Explore
        <ArrowUpRight
          size={11}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </div>
    </button>
  );
}

function StatusOverview({
  byStatus,
  total,
  statusFilter,
  toggleStatus,
}) {
  const entries = Object.entries(
    STATUS_COLORS
  ).filter(
    ([status]) => (byStatus[status] ?? 0) > 0
  );

  return (
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-slate text-xs font-medium">
            <ListChecks size={14} />
            Request pipeline
          </div>

          <p className="text-xs text-slate-light mt-1">
            Click a stage to inspect it
          </p>
        </div>

        {statusFilter && (
          <button
            onClick={() =>
              toggleStatus(null)
            }
            className="text-[11px] text-signal hover:underline flex items-center gap-1"
          >
            Clear
            <XCircle size={11} />
          </button>
        )}
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink/5 mb-5">
        {entries.map(
          ([status, color]) => {
            const count =
              byStatus[status] ?? 0;

            const percentage =
              total > 0
                ? (count / total) *
                  100
                : 0;

            return (
              <button
                key={status}
                onClick={() =>
                  toggleStatus(status)
                }
                title={`${STATUS_LABELS[status]} · ${count}`}
                className="h-full transition-all hover:opacity-80"
                style={{
                  width: `${percentage}%`,
                  background: color,
                  opacity:
                    !statusFilter ||
                    statusFilter ===
                      status
                      ? 1
                      : 0.25,
                }}
              />
            );
          }
        )}
      </div>

      <div className="space-y-2">
        {entries.map(
          ([status, color]) => {
            const count =
              byStatus[status] ?? 0;

            const percentage =
              total > 0
                ? Math.round(
                    (count / total) *
                      100
                  )
                : 0;

            const selected =
              statusFilter === status;

            return (
              <button
                key={status}
                onClick={() =>
                  toggleStatus(status)
                }
                className={`w-full rounded-xl p-3 text-left transition ${
                  selected
                    ? "bg-ink/[0.05]"
                    : "hover:bg-ink/[0.025]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: color,
                      }}
                    />

                    <span
                      className={`text-xs ${
                        selected
                          ? "font-semibold text-ink"
                          : "text-slate"
                      }`}
                    >
                      {STATUS_LABELS[
                        status
                      ] ?? status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-light font-mono-num">
                      {percentage}%
                    </span>

                    <span className="font-mono-num text-sm font-semibold text-ink">
                      {count}
                    </span>
                  </div>
                </div>

                <div className="mt-2 h-1 rounded-full bg-ink/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      background: color,
                    }}
                  />
                </div>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}

function CategoryOverview({
  byCategory,
  totalSpend,
  maxCategorySpend,
  categoryFilter,
  toggleCategory,
}) {
  return (
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-slate text-xs font-medium">
            <Building2 size={14} />
            Spend by category
          </div>

          <p className="text-xs text-slate-light mt-1">
            Where procurement budget is going
          </p>
        </div>

        {categoryFilter && (
          <button
            onClick={() =>
              toggleCategory(
                categoryFilter
              )
            }
            className="text-[11px] text-signal hover:underline flex items-center gap-1"
          >
            Clear
            <XCircle size={11} />
          </button>
        )}
      </div>

      {byCategory.length === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-xs text-slate-light">
            No category data yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {byCategory.map(
            ([name, value], index) => {
              const percentage =
                totalSpend > 0
                  ? Math.round(
                      (value /
                        totalSpend) *
                        100
                    )
                  : 0;

              const selected =
                categoryFilter === name;

              return (
                <button
                  key={name}
                  onClick={() =>
                    toggleCategory(name)
                  }
                  className="w-full text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-semibold transition ${
                          selected
                            ? "bg-signal text-white"
                            : "bg-signal-light text-signal"
                        }`}
                      >
                        {index + 1}
                      </span>

                      <span
                        className={`text-xs truncate ${
                          selected
                            ? "font-semibold text-ink"
                            : "text-slate group-hover:text-ink"
                        }`}
                      >
                        {name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-light font-mono-num">
                        {percentage}%
                      </span>

                      <span className="text-xs font-mono-num font-semibold text-ink">
                        ₹
                        {value.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selected
                          ? "bg-signal-dark"
                          : "bg-signal group-hover:bg-signal-dark"
                      }`}
                      style={{
                        width: `${Math.max(
                          (value /
                            maxCategorySpend) *
                            100,
                          3
                        )}%`,
                        opacity:
                          !categoryFilter ||
                          selected
                            ? 1
                            : 0.3,
                      }}
                    />
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}

function ProcurementHealth({
  score,
  delivered,
  total,
  approvalEfficiency,
  fulfilmentRate,
}) {
  const circumference =
    2 * Math.PI * 40;

  const dash =
    (score / 100) *
    circumference;

  return (
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 text-slate text-xs font-medium">
            <Target size={14} />
            Procurement health
          </div>

          <p className="text-xs text-slate-light mt-1">
            Overall workflow performance
          </p>
        </div>

        <CircleDollarSign
          size={16}
          className="text-good"
        />
      </div>

      <div className="flex items-center justify-center py-3">
        <div className="relative">
          <svg
            viewBox="0 0 100 100"
            className="h-32 w-32"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#EEF0F6"
              strokeWidth="9"
            />

            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#1E9E6B"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 50 50)"
              className="transition-all duration-700"
            />

            <text
              x="50"
              y="47"
              textAnchor="middle"
              className="font-display font-semibold"
              fontSize="19"
              fill="#12172B"
            >
              {score}
            </text>

            <text
              x="50"
              y="61"
              textAnchor="middle"
              fontSize="8"
              fill="#9298A8"
            >
              HEALTH SCORE
            </text>
          </svg>
        </div>
      </div>

      <div className="space-y-3 mt-2">
        <HealthRow
          label="Approval efficiency"
          value={approvalEfficiency}
        />

        <HealthRow
          label="Fulfilment rate"
          value={fulfilmentRate}
        />

        <HealthRow
          label="Delivered"
          value={
            total > 0
              ? Math.round(
                  (delivered /
                    total) *
                    100
                )
              : 0
          }
        />
      </div>
    </div>
  );
}

function HealthRow({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-slate">
          {label}
        </span>

        <span className="text-[11px] font-mono-num font-semibold text-ink">
          {value}%
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-ink/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-good transition-all duration-700"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}

function ActivityRow({ request, onClick }) {
  const date =
    request.updatedDate ??
    request.createdDate;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl p-3 text-left hover:bg-ink/[0.025] transition group"
    >
      <div className="h-9 w-9 rounded-xl bg-signal-light text-signal flex items-center justify-center shrink-0">
        <Activity size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink truncate">
            {request.product?.name ??
              "Item request"}
          </span>

          <StatusPill
            status={request.status}
          />
        </div>

        <div className="text-xs text-slate-light mt-1 truncate">
          {request.user?.name ??
            "Unknown requester"}{" "}
          · Qty{" "}
          {request.numberOfQuantities ??
            "—"}
          {" · "}
          ₹
          {(request.totalPrice ?? 0).toLocaleString(
            "en-IN"
          )}
        </div>
      </div>

      <div className="hidden sm:block text-right shrink-0">
        <div className="text-[10px] text-slate-light">
          {date
            ? new Date(
                date
              ).toLocaleDateString(
                "en-IN",
                {
                  day: "numeric",
                  month: "short",
                }
              )
            : "—"}
        </div>

        <ChevronRight
          size={14}
          className="ml-auto mt-1 text-slate-light opacity-0 group-hover:opacity-100 transition"
        />
      </div>
    </button>
  );
}

function SnapshotRow({
  label,
  value,
  icon: Icon,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-ink/[0.025] transition group"
    >
      <div className="h-8 w-8 rounded-lg bg-ink/[0.035] flex items-center justify-center text-slate group-hover:bg-signal-light group-hover:text-signal transition">
        <Icon size={14} />
      </div>

      <span className="text-xs text-slate flex-1 text-left">
        {label}
      </span>

      <span className="font-mono-num text-sm font-semibold text-ink">
        {value}
      </span>

      <ChevronRight
        size={13}
        className="text-slate-light opacity-0 group-hover:opacity-100 transition"
      />
    </button>
  );
}

function DrilldownPanel({
  results,
  statusFilter,
  categoryFilter,
  tableQuery,
  setTableQuery,
  clearDrilldown,
}) {
  return (
    <div className="bg-card rounded-card shadow-card border border-signal/20 p-6 mb-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <Search
              size={15}
              className="text-signal"
            />

            <h2 className="font-display font-semibold text-ink">
              {results.length} matching request
              {results.length === 1
                ? ""
                : "s"}
            </h2>
          </div>

          <p className="text-xs text-slate mt-1">
            {statusFilter && (
              <span className="mr-3">
                Status:{" "}
                {STATUS_LABELS[
                  statusFilter
                ] ??
                  statusFilter}
              </span>
            )}

            {categoryFilter && (
              <span className="mr-3">
                Category:{" "}
                {categoryFilter}
              </span>
            )}

            {!statusFilter &&
              !categoryFilter &&
              !tableQuery &&
              "Dashboard drilldown"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light"
            />

            <input
              value={tableQuery}
              onChange={(event) =>
                setTableQuery(
                  event.target.value
                )
              }
              placeholder="Search item, requester or category..."
              className="rounded-lg border border-ink/10 bg-white pl-8 pr-3 py-2 text-xs text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition w-64"
            />
          </div>

          <button
            onClick={clearDrilldown}
            className="text-xs font-medium text-slate hover:text-ink border border-ink/10 rounded-lg px-3 py-2 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          body="Try clearing a filter or adjusting your search."
        />
      ) : (
        <div className="divide-y divide-ink/5">
          {results
            .slice(0, 25)
            .map((request) => (
              <div
                key={request.requestId}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink truncate">
                    {request.product?.name ??
                      "Item request"}{" "}
                    · Qty{" "}
                    {
                      request.numberOfQuantities
                    }
                  </div>

                  <div className="text-xs text-slate-light mt-0.5">
                    {request.user?.name ??
                      "—"}{" "}
                    ·{" "}
                    {request.category
                      ?.categoryName ??
                      "Uncategorized"}{" "}
                    · ₹
                    {(
                      request.totalPrice ??
                      0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </div>
                </div>

                <StatusPill
                  status={request.status}
                />
              </div>
            ))}
        </div>
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
  const [
    confirmingRejectId,
    setConfirmingRejectId,
  ] = useState(null);

  const [
    selectedRequest,
    setSelectedRequest,
  ] = useState(null);

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
      <div className="bg-card rounded-card shadow-card border border-ink/5 p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-light text-amber flex items-center justify-center">
                <Clock3 size={15} />
              </div>

              <div>
                <h2 className="font-display font-semibold text-ink">
                  {title}
                </h2>

                <p className="text-xs text-slate-light mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>

          {!loading && (
            <span className="rounded-full bg-amber-light text-amber px-2.5 py-1 text-[10px] font-semibold">
              {items.length} pending
            </span>
          )}
        </div>

        {loading ? (
          <SkeletonRows />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nothing pending"
            body="Requests will show up here once they reach this stage."
          />
        ) : (
          <div className="space-y-2">
            {items.map((request) => {
              const isConfirmingReject =
                confirmingRejectId ===
                request.requestId;

              const isExpanded =
                expandedId ===
                request.requestId;

              return (
                <div
                  key={request.requestId}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? "border-signal/25 bg-signal/[0.02]"
                      : "border-ink/5 hover:border-ink/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 p-4">
                    <button
                      className="min-w-0 flex items-start gap-3 text-left flex-1"
                      onClick={() => {
                        setExpandedId(
                          isExpanded
                            ? null
                            : request.requestId
                        );
                        setSelectedRequest(
                          request
                        );
                      }}
                    >
                      <div className="h-10 w-10 rounded-xl bg-signal-light text-signal flex items-center justify-center text-xs font-semibold shrink-0">
                        {initials(
                          request.user?.name
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink truncate">
                            {request.product
                              ?.name ??
                              "Item request"}
                          </span>

                          <ChevronRight
                            size={13}
                            className={`text-slate-light transition-transform ${
                              isExpanded
                                ? "rotate-90"
                                : ""
                            }`}
                          />
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-light mt-1.5">
                          <span>
                            {
                              request.user
                                ?.name
                            }
                          </span>

                          <span>
                            Qty{" "}
                            {
                              request.numberOfQuantities
                            }
                          </span>

                          <span>
                            ₹
                            {(
                              request.totalPrice ??
                              0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={
                          busyId ===
                          request.requestId
                        }
                        onClick={() =>
                          handleRejectClick(
                            request.requestId
                          )
                        }
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-40 ${
                          isConfirmingReject
                            ? "bg-coral text-white"
                            : "bg-coral-light text-coral hover:opacity-80"
                        }`}
                      >
                        <X size={13} />

                        {isConfirmingReject
                          ? "Confirm?"
                          : "Reject"}
                      </button>

                      <button
                        disabled={
                          busyId ===
                          request.requestId
                        }
                        onClick={() =>
                          onApprove(
                            request.requestId
                          )
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-good-light text-good px-3 py-2 text-xs font-medium hover:opacity-80 disabled:opacity-40 transition"
                      >
                        <Check size={13} />
                        Approve
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl bg-white border border-ink/5 p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <MiniDetail
                            label="Requester"
                            value={
                              request.user
                                ?.name ??
                              "—"
                            }
                          />

                          <MiniDetail
                            label="Category"
                            value={
                              request.category
                                ?.categoryName ??
                              "Uncategorized"
                            }
                          />

                          <MiniDetail
                            label="Quantity"
                            value={
                              request.numberOfQuantities ??
                              "—"
                            }
                          />

                          <MiniDetail
                            label="Amount"
                            value={`₹${(
                              request.totalPrice ??
                              0
                            ).toLocaleString(
                              "en-IN"
                            )}`}
                          />
                        </div>

                        <button
                          onClick={() =>
                            setSelectedRequest(
                              request
                            )
                          }
                          className="mt-4 flex items-center gap-1.5 text-xs font-medium text-signal hover:underline"
                        >
                          Open full request
                          <ArrowUpRight
                            size={12}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <RequestApprovalPanel
        request={selectedRequest}
        onClose={() =>
          setSelectedRequest(null)
        }
        onApprove={() => {
          onApprove(
            selectedRequest.requestId
          );
          setSelectedRequest(null);
        }}
        onReject={() => {
          onReject(
            selectedRequest.requestId
          );
          setSelectedRequest(null);
        }}
        busy={
          selectedRequest
            ? busyId ===
              selectedRequest.requestId
            : false
        }
      />
    </>
  );
}

function MiniDetail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-slate-light mb-1">
        {label}
      </p>

      <p className="text-xs font-medium text-ink truncate">
        {value}
      </p>
    </div>
  );
}

function RequestApprovalPanel({
  request,
  onClose,
  onApprove,
  onReject,
  busy,
}) {
  if (!request) {
    return null;
  }

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
            REQUEST #
            {String(
              request.requestId
            ).padStart(4, "0")}
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-light mb-2">
                Procurement request
              </p>

              <h2 className="font-display text-3xl font-semibold text-ink">
                {request.product?.name ??
                  "Item request"}
              </h2>

              <p className="text-sm text-slate mt-2">
                Submitted by{" "}
                {request.user?.name ??
                  "Unknown requester"}
              </p>
            </div>

            <StatusPill status={status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <DetailCard
              icon={User}
              label="Requester"
              value={
                request.user?.name ?? "—"
              }
            />

            <DetailCard
              icon={Building}
              label="Department"
              value={
                request.department
                  ?.departmentName ?? "—"
              }
            />

            <DetailCard
              icon={Tag}
              label="Category"
              value={
                request.category
                  ?.categoryName ?? "—"
              }
            />

            <DetailCard
              icon={Package}
              label="Product"
              value={
                request.product?.name ??
                "—"
              }
            />

            <DetailCard
              icon={Hash}
              label="Quantity"
              value={
                request.numberOfQuantities ??
                "—"
              }
            />

            <DetailCard
              icon={IndianRupee}
              label="Total amount"
              value={`₹${(
                request.totalPrice ??
                0
              ).toLocaleString(
                "en-IN"
              )}`}
            />
          </div>

          <div className="bg-ink/[0.02] rounded-xl border border-ink/5 p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays
                size={16}
                className="text-signal"
              />

              <h3 className="font-display font-semibold text-ink">
                Approval journey
              </h3>
            </div>

            <ApprovalTrail
              status={request.status}
              updatedDate={
                request.updatedDate
              }
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-light">
              Created{" "}
              {request.createdDate
                ? new Date(
                    request.createdDate
                  ).toLocaleString(
                    "en-IN"
                  )
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

              {status ===
                "MANAGER_APPROVED" && (
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

function DetailCard({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4 hover:border-signal/20 transition">
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

function initials(name) {
  if (!name) {
    return "?";
  }

  const parts = name
    .trim()
    .split(/\s+/);

  return (
    (parts[0]?.[0] ?? "") +
    (parts[1]?.[0] ?? "")
  ).toUpperCase();
}