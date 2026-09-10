import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  Truck,
  Wallet
} from "lucide-react";
import {
  listSupplierOrders,
  listSupplierPayments
} from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
import StatusPill from "../components/StatusPill";
import { EmptyState, SkeletonRows } from "./Home";
import { useToast } from "../context/ToastContext";

const ACTIVE_STATUSES = [
  "RECEIVED",
  "PACKED",
  "SHIPPED",
  "DELIVERED"
];

const STATUS_CONFIG = [
  {
    status: "RECEIVED",
    label: "Received",
    icon: Package,
    className: "bg-amber-light text-amber"
  },
  {
    status: "PACKED",
    label: "Packed",
    icon: Package,
    className: "bg-signal-light text-signal"
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    icon: Truck,
    className: "bg-signal-light text-signal"
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    icon: CheckCircle2,
    className: "bg-good-light text-good"
  }
];

function formatAmount(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  iconClassName
}) {
  return (
    <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate">
            {label}
          </p>
          <p className="font-display text-3xl font-semibold text-ink mt-2">
            {value}
          </p>
          <p className="text-xs text-slate mt-1">
            {detail}
          </p>
        </div>

        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconClassName}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

export default function SupplierDashboard() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard(showLoader = true) {
    if (showLoader) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [orderData, paymentData] = await Promise.all([
        listSupplierOrders(),
        listSupplierPayments()
      ]);

      setOrders(Array.isArray(orderData) ? orderData : []);
      setPayments(Array.isArray(paymentData) ? paymentData : []);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((order) =>
      ACTIVE_STATUSES.includes(order.status)
    );

    const received = orders.filter(
      (order) => order.status === "RECEIVED"
    ).length;

    const inTransit = orders.filter(
      (order) =>
        order.status === "PACKED" ||
        order.status === "SHIPPED"
    ).length;

    const completed = orders.filter(
      (order) => order.status === "COMPLETED"
    ).length;

    return {
      active: activeOrders.length,
      received,
      inTransit,
      completed
    };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders
      .filter((order) => ACTIVE_STATUSES.includes(order.status))
      .sort((a, b) => {
        const dateA = new Date(
          a.updatedDate || a.createdDate || 0
        ).getTime();

        const dateB = new Date(
          b.updatedDate || b.createdDate || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 6);
  }, [orders]);

  const recentPayments = useMemo(() => {
    return [...payments]
      .sort((a, b) => {
        const dateA = new Date(a.paymentDate || 0).getTime();
        const dateB = new Date(b.paymentDate || 0).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [payments]);

  const statusCounts = useMemo(() => {
    return STATUS_CONFIG.map(({ status }) => ({
      status,
      count: orders.filter(
        (order) => order.status === status
      ).length
    }));
  }, [orders]);

  const maxStatusCount = Math.max(
    ...statusCounts.map((item) => item.count),
    1
  );

  if (loading) {
    return (
      <div>
        <Topbar
          title="Supplier dashboard"
          subtitle="Track your orders, fulfilment progress, and payments."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-card rounded-card shadow-card border border-ink/5 p-5 animate-pulse"
            >
              <div className="h-3 w-24 bg-slate/10 rounded" />
              <div className="h-8 w-16 bg-slate/10 rounded mt-4" />
              <div className="h-3 w-28 bg-slate/10 rounded mt-2" />
            </div>
          ))}
        </div>

        <SkeletonRows />
      </div>
    );
  }

  return (
    <div>
      <Topbar
        title="Supplier dashboard"
        subtitle="Track your orders, fulfilment progress, and payments."
        action={
          <button
            onClick={() => loadDashboard(false)}
            disabled={refreshing}
            className="border border-ink/10 bg-card rounded-lg px-3 py-2 text-sm font-medium text-ink flex items-center gap-2 hover:bg-ink/[0.03] transition disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        }
      />

      <div className="bg-ink rounded-card shadow-card p-6 md:p-8 mb-6 overflow-hidden relative">
        <div className="relative z-10 max-w-2xl">
          <p className="text-signal text-xs font-semibold uppercase tracking-[0.18em]">
            Supplier workspace
          </p>

          <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mt-2">
            Keep every order moving.
          </h2>

          <p className="text-white/55 text-sm md:text-base mt-2 max-w-xl">
            Monitor fulfilment milestones, keep delivery progress up to date,
            and stay on top of incoming payments.
          </p>
        </div>

        <div className="absolute right-6 bottom-5 hidden md:flex h-20 w-20 rounded-2xl bg-white/5 border border-white/10 items-center justify-center">
          <Truck size={36} className="text-signal" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Package}
          label="Active orders"
          value={stats.active}
          detail="Orders currently in fulfilment"
          iconClassName="bg-signal-light text-signal"
        />

        <StatCard
          icon={Clock3}
          label="Received"
          value={stats.received}
          detail="Awaiting packing"
          iconClassName="bg-amber-light text-amber"
        />

        <StatCard
          icon={Truck}
          label="In transit"
          value={stats.inTransit}
          detail="Packed or shipped"
          iconClassName="bg-signal-light text-signal"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.completed}
          detail="Successfully delivered"
          iconClassName="bg-good-light text-good"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)] gap-6">
        <section className="bg-card rounded-card shadow-card border border-ink/5 overflow-hidden">
          <div className="px-5 py-5 border-b border-ink/5 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold text-ink">
                Recent orders
              </h3>
              <p className="text-xs text-slate mt-1">
                Active orders sorted by latest activity.
              </p>
            </div>

            <a
              href="/supplier-orders"
              className="text-xs font-medium text-signal flex items-center gap-1 hover:underline"
            >
              View all
              <ArrowRight size={14} />
            </a>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Package}
                title="No active orders"
                body="Paid orders assigned to your supplier account will appear here."
              />
            </div>
          ) : (
            <div className="divide-y divide-ink/5">
              {recentOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="px-5 py-4 hover:bg-ink/[0.015] transition"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink truncate">
                          {order.productName}
                        </p>
                        <span className="text-[11px] text-slate shrink-0">
                          #{order.orderId}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs text-slate">
                          Request #{order.requestId}
                        </span>
                        <span className="text-xs text-slate">
                          Qty {order.quantity}
                        </span>
                        <span className="font-mono-num text-xs text-slate">
                          {formatAmount(order.amount)}
                        </span>
                      </div>
                    </div>

                    <StatusPill status={order.status} />
                  </div>

                  <div className="flex items-center justify-between gap-3 mt-3">
                    <span className="text-[11px] text-slate">
                      Updated {formatDateTime(order.updatedDate || order.createdDate)}
                    </span>

                    <a
                      href="/supplier-orders"
                      className="text-xs font-medium text-signal hover:underline"
                    >
                      Update
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-card rounded-card shadow-card border border-ink/5 p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display font-semibold text-ink">
                Order status overview
              </h3>
              <p className="text-xs text-slate mt-1">
                Current fulfilment distribution.
              </p>
            </div>

            <div className="h-9 w-9 rounded-lg bg-signal-light text-signal flex items-center justify-center">
              <Package size={17} />
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {statusCounts.map(({ status, count }) => {
              const config = STATUS_CONFIG.find(
                (item) => item.status === status
              );

              const Icon = config.icon;
              const width =
                count === 0
                  ? 0
                  : Math.max(
                      (count / maxStatusCount) * 100,
                      8
                    );

              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center ${config.className}`}
                      >
                        <Icon size={14} />
                      </div>

                      <span className="text-sm font-medium text-ink">
                        {config.label}
                      </span>
                    </div>

                    <span className="font-mono-num text-sm font-semibold text-ink">
                      {count}
                    </span>
                  </div>

                  <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-signal rounded-full transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-card rounded-card shadow-card border border-ink/5 mt-6 overflow-hidden">
        <div className="px-5 py-5 border-b border-ink/5 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-semibold text-ink">
              Recent payments
            </h3>
            <p className="text-xs text-slate mt-1">
              Latest payment transactions for your supplier account.
            </p>
          </div>

          <a
            href="/supplier-payments"
            className="text-xs font-medium text-signal flex items-center gap-1 hover:underline"
          >
            Payment history
            <ArrowRight size={14} />
          </a>
        </div>

        {recentPayments.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Wallet}
              title="No payments yet"
              body="Payment records will appear here once payments are issued."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead>
                <tr className="border-b border-ink/5">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                    Payment
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                    Request
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                    Amount
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                    Method
                  </th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                    Date
                  </th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentPayments.map((payment) => (
                  <tr
                    key={payment.paymentId}
                    className="border-b border-ink/5 last:border-b-0"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono-num text-sm font-medium text-ink">
                        #{payment.paymentId}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-ink">
                        #{payment.requestId}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono-num text-sm font-semibold text-ink">
                        {formatAmount(payment.amount)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-slate">
                        {payment.paymentMethod || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-slate">
                        {formatDate(payment.paymentDate)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <StatusPill status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}