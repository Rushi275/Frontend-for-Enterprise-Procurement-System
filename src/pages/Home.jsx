import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlusCircle,
  Truck,
  Bell,
  ArrowUpRight,
  ClipboardList,
  Package,
  CheckCircle2,
  Clock3,
  XCircle,
  Users,
  CreditCard,
  Settings2,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Search,
  Boxes,
  UserCheck,
} from "lucide-react";
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
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const role = user?.role ?? "EMPLOYEE";

  const loadHome = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const all = await listRequests();

      const visibleRequests =
        role === "ADMIN" || role === "MANAGER"
          ? all
          : user?.userId
            ? all.filter((r) => r.user?.userId === user.userId)
            : [];

      setRequests(visibleRequests);

      if (user?.userId && role !== "ADMIN") {
        const notifs = await listNotifications(user.userId);
        setNotifications(
          [...notifs]
            .sort(
              (a, b) =>
                new Date(b.createdDate || 0) -
                new Date(a.createdDate || 0)
            )
            .slice(0, 6)
        );
      } else {
        setNotifications([]);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, [user?.userId, role]);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 17
        ? "Good afternoon"
        : "Good evening";

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return requests;

    return requests.filter((r) => {
      const product = r.product?.name?.toLowerCase() ?? "";
      const requestId = String(r.requestId ?? "");
      const status = r.status?.toLowerCase() ?? "";

      return (
        product.includes(query) ||
        requestId.includes(query) ||
        status.includes(query)
      );
    });
  }, [requests, search]);

  if (role === "MANAGER") {
    return (
      <ManagerHome
        user={user}
        firstName={firstName}
        greeting={greeting}
        requests={requests}
        filteredRequests={filteredRequests}
        notifications={notifications}
        loading={loading}
        refreshing={refreshing}
        search={search}
        setSearch={setSearch}
        refresh={() => loadHome(true)}
        navigate={navigate}
      />
    );
  }

  if (role === "ADMIN") {
    return (
      <AdminHome
        user={user}
        firstName={firstName}
        greeting={greeting}
        requests={requests}
        filteredRequests={filteredRequests}
        loading={loading}
        refreshing={refreshing}
        search={search}
        setSearch={setSearch}
        refresh={() => loadHome(true)}
        navigate={navigate}
      />
    );
  }

  return (
    <EmployeeHome
      user={user}
      firstName={firstName}
      greeting={greeting}
      requests={requests}
      filteredRequests={filteredRequests}
      notifications={notifications}
      loading={loading}
      refreshing={refreshing}
      search={search}
      setSearch={setSearch}
      refresh={() => loadHome(true)}
      navigate={navigate}
    />
  );
}

function EmployeeHome({
  firstName,
  greeting,
  requests,
  filteredRequests,
  notifications,
  loading,
  refreshing,
  search,
  setSearch,
  refresh,
  navigate,
}) {
  const pending = requests.filter(
    (r) =>
      r.status === "PENDING" ||
      r.status === "MANAGER_APPROVED"
  ).length;

  const approved = requests.filter(
    (r) => r.status === "APPROVED"
  ).length;

  const delivered = requests.filter(
    (r) => r.status === "DELIVERED"
  ).length;

  return (
    <div className="space-y-6">
      <Topbar
        title={`${greeting}, ${firstName}`}
        subtitle="Your procurement workspace."
        action={
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Raise a request
          </button>
        }
      />

      <section className="relative overflow-hidden rounded-card bg-ink text-white p-6 sm:p-7">
        <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-signal/20 blur-2xl" />
        <div className="absolute -bottom-20 right-32 h-40 w-40 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative max-w-2xl">
          <div className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
            <Boxes size={14} />
            Procurement workspace
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-semibold">
            What do you need today?
          </h2>

          <p className="text-sm text-white/65 mt-2 max-w-lg">
            Browse available products, raise a request, and keep track of
            everything you've purchased.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-ink px-4 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              <PlusCircle size={16} />
              Browse products
            </button>

            <button
              onClick={() => navigate("/orders")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 text-white px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <ClipboardList size={16} />
              View my requests
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Clock3}
          label="In progress"
          value={pending}
          tone="amber"
        />

        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={approved}
          tone="good"
        />

        <StatCard
          icon={Truck}
          label="Delivered"
          value={delivered}
          tone="ink"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={PlusCircle}
          title="Raise a request"
          body="Find a product and start procurement."
          onClick={() => navigate("/products")}
        />

        <QuickAction
          icon={ClipboardList}
          title="My requests"
          body="Review your complete request history."
          onClick={() => navigate("/orders")}
        />

        <QuickAction
          icon={BarChart3}
          title="View analytics"
          body="See your procurement activity and trends."
          onClick={() => navigate("/dashboard")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentRequests
          title="Recent requests"
          subtitle="Your latest procurement activity"
          requests={filteredRequests}
          loading={loading}
          search={search}
          setSearch={setSearch}
          navigate={navigate}
          emptyTitle="No requests yet"
          emptyBody="Raise your first purchase request to see it tracked here."
        />

        <Notifications
          notifications={notifications}
          navigate={navigate}
        />
      </div>

      <RefreshBar
        refreshing={refreshing}
        refresh={refresh}
      />
    </div>
  );
}

function ManagerHome({
  firstName,
  greeting,
  requests,
  filteredRequests,
  notifications,
  loading,
  refreshing,
  search,
  setSearch,
  refresh,
  navigate,
}) {
  const pendingApproval = requests.filter(
    (r) => r.status === "PENDING"
  );

  const approved = requests.filter(
    (r) => r.status === "MANAGER_APPROVED"
  ).length;

  const rejected = requests.filter(
    (r) =>
      r.status === "MANAGER_REJECTED" ||
      r.status === "REJECTED"
  ).length;

  const departmentRequests = requests.length;

  return (
    <div className="space-y-6">
      <Topbar
        title={`${greeting}, ${firstName}`}
        subtitle="Review requests and keep your department moving."
        action={
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 border border-ink/10 bg-card hover:bg-ink/5 text-ink text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            <BarChart3 size={16} />
            View dashboard
          </button>
        }
      />

      <section className="relative overflow-hidden rounded-card bg-ink text-white p-6 sm:p-7">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-signal/20 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
              <UserCheck size={14} />
              Manager action center
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-semibold">
              {pendingApproval.length === 0
                ? "You're all caught up."
                : `${pendingApproval.length} request${
                    pendingApproval.length === 1 ? "" : "s"
                  } need your attention.`}
            </h2>

            <p className="text-sm text-white/65 mt-2 max-w-xl">
              Review employee procurement requests before they move to
              the admin approval stage.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-white text-ink px-4 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors"
          >
            Review approvals
            <ArrowUpRight size={15} />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Clock3}
          label="Awaiting approval"
          value={pendingApproval.length}
          tone="amber"
        />

        <StatCard
          icon={CheckCircle2}
          label="Manager approved"
          value={approved}
          tone="good"
        />

        <StatCard
          icon={XCircle}
          label="Rejected"
          value={rejected}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickAction
          icon={UserCheck}
          title="Review approvals"
          body="Open the dashboard approval queue."
          badge={
            pendingApproval.length > 0
              ? `${pendingApproval.length} pending`
              : null
          }
          onClick={() => navigate("/dashboard")}
        />

        <QuickAction
          icon={ClipboardList}
          title="All requests"
          body={`View ${departmentRequests} department requests.`}
          onClick={() => navigate("/orders")}
        />

        <QuickAction
          icon={Package}
          title="Browse products"
          body="Review the products available to employees."
          onClick={() => navigate("/products")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ApprovalPreview
          requests={pendingApproval}
          loading={loading}
          navigate={navigate}
        />

        <Notifications
          notifications={notifications}
          navigate={navigate}
        />
      </div>

      <RecentRequests
        title="Recent procurement activity"
        subtitle="Latest requests across your department"
        requests={filteredRequests}
        loading={loading}
        search={search}
        setSearch={setSearch}
        navigate={navigate}
        compact
        emptyTitle="No procurement activity"
        emptyBody="Requests from your department will appear here."
      />

      <RefreshBar
        refreshing={refreshing}
        refresh={refresh}
      />
    </div>
  );
}

function AdminHome({
  firstName,
  greeting,
  requests,
  filteredRequests,
  loading,
  refreshing,
  search,
  setSearch,
  refresh,
  navigate,
}) {
  const pendingManager = requests.filter(
    (r) => r.status === "MANAGER_APPROVED"
  ).length;

  const pending = requests.filter(
    (r) => r.status === "PENDING"
  ).length;

  const approved = requests.filter(
    (r) => r.status === "APPROVED"
  ).length;

  const delivered = requests.filter(
    (r) => r.status === "DELIVERED"
  ).length;

  return (
    <div className="space-y-6">
      <Topbar
        title={`${greeting}, ${firstName}`}
        subtitle="Procurement operations command center."
        action={
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors shadow-sm"
          >
            <BarChart3 size={16} />
            Open analytics
          </button>
        }
      />

      <section className="relative overflow-hidden rounded-card bg-ink text-white p-6 sm:p-7">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-signal/20 blur-3xl" />
        <div className="absolute -bottom-24 right-44 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-wider mb-3">
            <ShieldCheck size={14} />
            Admin control center
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold">
                Procurement operations at a glance.
              </h2>

              <p className="text-sm text-white/65 mt-2 max-w-xl">
                Manage requests, suppliers, products and payments from
                one place.
              </p>
            </div>

            {pendingManager > 0 && (
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 rounded-lg bg-white text-ink px-4 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors"
              >
                {pendingManager} approval
                {pendingManager === 1 ? "" : "s"} waiting
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock3}
          label="Pending"
          value={pending}
          tone="amber"
        />

        <StatCard
          icon={UserCheck}
          label="Admin approval"
          value={pendingManager}
          tone="blue"
        />

        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={approved}
          tone="good"
        />

        <StatCard
          icon={Truck}
          label="Delivered"
          value={delivered}
          tone="ink"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminAction
          icon={ClipboardList}
          title="Requests"
          body="Review procurement requests."
          onClick={() => navigate("/orders")}
        />

        <AdminAction
          icon={Users}
          title="Suppliers"
          body="Manage supplier relationships."
          onClick={() => navigate("/management")}
        />

        <AdminAction
          icon={Package}
          title="Products"
          body="Manage the product catalogue."
          onClick={() => navigate("/management")}
        />

        <AdminAction
          icon={CreditCard}
          title="Payments"
          body="Review procurement payments."
          onClick={() => navigate("/payment")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentRequests
          title="Recent requests"
          subtitle="Latest procurement activity"
          requests={filteredRequests}
          loading={loading}
          search={search}
          setSearch={setSearch}
          navigate={navigate}
          compact
          emptyTitle="No requests yet"
          emptyBody="Procurement requests will appear here."
        />

        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-ink">
                Admin tools
              </h2>
              <p className="text-xs text-slate mt-1">
                Frequently used system controls
              </p>
            </div>

            <Settings2 size={17} className="text-slate-light" />
          </div>

          <div className="space-y-2">
            <ToolRow
              icon={BarChart3}
              title="Procurement analytics"
              onClick={() => navigate("/dashboard")}
            />

            <ToolRow
              icon={ClipboardList}
              title="All requests"
              onClick={() => navigate("/orders")}
            />

            <ToolRow
              icon={CreditCard}
              title="Payment management"
              onClick={() => navigate("/payment")}
            />

            <ToolRow
              icon={Settings2}
              title="System management"
              onClick={() => navigate("/management")}
            />
          </div>
        </div>
      </div>

      <RefreshBar
        refreshing={refreshing}
        refresh={refresh}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    amber: {
      icon: "bg-amber-light text-amber",
      dot: "bg-amber",
    },
    good: {
      icon: "bg-good-light text-good",
      dot: "bg-good",
    },
    red: {
      icon: "bg-red-50 text-red-500",
      dot: "bg-red-500",
    },
    blue: {
      icon: "bg-signal-light text-signal",
      dot: "bg-signal",
    },
    ink: {
      icon: "bg-ink text-white",
      dot: "bg-ink",
    },
  };

  const current = tones[tone] || tones.blue;

  return (
    <div className="group bg-card rounded-card shadow-card border border-ink/5 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center ${current.icon}`}
        >
          <Icon size={17} />
        </div>

        <span
          className={`h-2 w-2 rounded-full mt-2 ${current.dot}`}
        />
      </div>

      <div className="mt-5">
        <div className="text-xs font-medium text-slate">
          {label}
        </div>

        <div className="font-display text-3xl font-semibold text-ink mt-1">
          {value}
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  body,
  badge,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card rounded-card shadow-card border border-ink/5 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="h-10 w-10 rounded-lg bg-signal-light text-signal flex items-center justify-center">
          <Icon size={18} />
        </div>

        <ArrowUpRight
          size={16}
          className="text-slate-light group-hover:text-signal transition-colors"
        />
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">
            {title}
          </h3>

          {badge && (
            <span className="text-[10px] font-medium rounded-full bg-amber-light text-amber px-2 py-0.5">
              {badge}
            </span>
          )}
        </div>

        <p className="text-xs text-slate mt-1 leading-5">
          {body}
        </p>
      </div>
    </button>
  );
}

function AdminAction({
  icon: Icon,
  title,
  body,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-card rounded-card shadow-card border border-ink/5 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-signal-light text-signal flex items-center justify-center">
          <Icon size={17} />
        </div>

        <ArrowUpRight
          size={15}
          className="text-slate-light group-hover:text-signal transition-colors"
        />
      </div>

      <h3 className="text-sm font-semibold text-ink mt-4">
        {title}
      </h3>

      <p className="text-xs text-slate mt-1">
        {body}
      </p>
    </button>
  );
}

function ApprovalPreview({
  requests,
  loading,
  navigate,
}) {
  return (
    <div className="lg:col-span-2 bg-card rounded-card shadow-card border border-ink/5 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold text-ink">
            Requests awaiting approval
          </h2>

          <p className="text-xs text-slate mt-1">
            Your department's pending decisions
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-xs font-medium text-signal hover:underline flex items-center gap-1"
        >
          Review all
          <ArrowUpRight size={13} />
        </button>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/10 py-10 text-center">
          <div className="h-10 w-10 rounded-full bg-good-light text-good flex items-center justify-center mx-auto">
            <CheckCircle2 size={18} />
          </div>

          <h3 className="text-sm font-semibold text-ink mt-3">
            No approvals waiting
          </h3>

          <p className="text-xs text-slate mt-1">
            New employee requests will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ink/5">
          {requests.slice(0, 5).map((request) => (
            <button
              key={request.requestId}
              onClick={() => navigate("/dashboard")}
              className="w-full flex items-center justify-between gap-4 py-4 text-left hover:bg-ink/[0.02] transition-colors rounded-lg"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-ink truncate">
                    {request.product?.name ?? "Item request"}
                  </div>

                  <span className="text-[10px] text-slate-light font-mono-num">
                    #{String(request.requestId).padStart(4, "0")}
                  </span>
                </div>

                <div className="text-xs text-slate mt-1">
                  {request.user?.name ?? "Employee"} · Qty{" "}
                  {request.numberOfQuantities}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={request.status} />
                <ChevronRight
                  size={15}
                  className="text-slate-light"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentRequests({
  title,
  subtitle,
  requests,
  loading,
  search,
  setSearch,
  navigate,
  compact = false,
  emptyTitle,
  emptyBody,
}) {
  const sorted = [...requests]
    .sort(
      (a, b) =>
        new Date(b.createdDate || 0) -
        new Date(a.createdDate || 0)
    )
    .slice(0, compact ? 5 : 6);

  return (
    <div
      className={`${
        compact ? "lg:col-span-2" : "lg:col-span-2"
      } bg-card rounded-card shadow-card border border-ink/5 p-6`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display font-semibold text-ink">
            {title}
          </h2>

          {subtitle && (
            <p className="text-xs text-slate mt-1">
              {subtitle}
            </p>
          )}
        </div>

        <button
          onClick={() => navigate("/orders")}
          className="text-xs font-medium text-signal hover:underline flex items-center gap-1 shrink-0"
        >
          View all
          <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recent requests..."
          className="w-full h-9 rounded-lg border border-ink/10 bg-paper pl-9 pr-3 text-xs text-ink outline-none focus:border-signal/40 focus:ring-2 focus:ring-signal/10"
        />
      </div>

      {loading ? (
        <SkeletonRows />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={emptyTitle}
          body={emptyBody}
          cta="Browse requests"
          onClick={() => navigate("/orders")}
        />
      ) : (
        <div className="divide-y divide-ink/5">
          {sorted.map((request) => (
            <button
              key={request.requestId}
              onClick={() => navigate("/orders")}
              className="w-full flex items-center justify-between gap-4 py-3.5 text-left hover:bg-ink/[0.02] transition-colors rounded-lg"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {request.product?.name ?? "Item request"}
                </div>

                <div className="text-xs text-slate mt-0.5 font-mono-num">
                  #{String(request.requestId).padStart(4, "0")} · Qty{" "}
                  {request.numberOfQuantities}
                  {request.user?.name && (
                    <>
                      {" "}
                      · {request.user.name}
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusPill status={request.status} />
                <ChevronRight
                  size={14}
                  className="text-slate-light"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications({ notifications }) {
  return (
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-display font-semibold text-ink">
            Notifications
          </h2>

          <p className="text-xs text-slate mt-1">
            Latest updates
          </p>
        </div>

        <Bell size={16} className="text-slate-light" />
      </div>

      {notifications.length === 0 ? (
        <div className="py-8">
          <div className="h-10 w-10 rounded-full bg-signal-light text-signal flex items-center justify-center mb-3">
            <Bell size={17} />
          </div>

          <p className="text-sm font-medium text-ink">
            You're all caught up.
          </p>

          <p className="text-xs text-slate mt-1">
            New procurement updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {notifications.map((notification) => (
            <li
              key={notification.notificationId}
              className={`relative pl-4 py-3 ${
                notification.isRead
                  ? "opacity-75"
                  : ""
              }`}
            >
              {!notification.isRead && (
                <span className="absolute left-0 top-4 h-1.5 w-1.5 rounded-full bg-signal" />
              )}

              <p
                className={
                  notification.isRead
                    ? "text-xs text-slate leading-5"
                    : "text-xs text-ink font-medium leading-5"
                }
              >
                {notification.message}
              </p>

              <p className="text-[10px] text-slate-light font-mono-num mt-1">
                {notification.createdDate
                  ? new Date(
                      notification.createdDate
                    ).toLocaleString()
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ToolRow({ icon: Icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-ink/[0.03] transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-signal-light text-signal flex items-center justify-center">
          <Icon size={15} />
        </div>

        <span className="text-sm font-medium text-ink">
          {title}
        </span>
      </div>

      <ChevronRight
        size={15}
        className="text-slate-light"
      />
    </button>
  );
}

function RefreshBar({ refreshing, refresh }) {
  return (
    <div className="flex justify-end">
      <button
        onClick={refresh}
        disabled={refreshing}
        className="inline-flex items-center gap-2 text-xs font-medium text-slate hover:text-signal transition-colors disabled:opacity-50"
      >
        <RefreshCw
          size={13}
          className={refreshing ? "animate-spin" : ""}
        />
        {refreshing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
  onClick,
}) {
  return (
    <div className="text-center py-10">
      <div className="h-11 w-11 rounded-full bg-signal-light text-signal flex items-center justify-center mx-auto mb-4">
        <Icon size={19} />
      </div>

      <h3 className="text-sm font-semibold text-ink">
        {title}
      </h3>

      <p className="text-sm text-slate mt-1 max-w-xs mx-auto">
        {body}
      </p>

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
        <div
          key={i}
          className="h-12 rounded-lg bg-ink/5 animate-pulse"
        />
      ))}
    </div>
  );
}