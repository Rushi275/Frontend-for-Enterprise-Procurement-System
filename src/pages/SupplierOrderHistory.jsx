import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  History,
  Package,
  RefreshCw
} from "lucide-react";
import {
  downloadBlob,
  listSupplierOrders
} from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
import StatusPill from "../components/StatusPill";
import { EmptyState, SkeletonRows } from "./Home";
import { useToast } from "../context/ToastContext";

function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = name;
  link.click();

  URL.revokeObjectURL(url);
}

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

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function SupplierOrderHistory() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    setLoading(true);

    try {
      const data = await listSupplierOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const completedOrders = useMemo(() => {
    return orders
      .filter((order) => order.status === "COMPLETED")
      .sort((a, b) => {
        const dateA = new Date(
          a.updatedDate || a.createdDate || 0
        ).getTime();

        const dateB = new Date(
          b.updatedDate || b.createdDate || 0
        ).getTime();

        return dateB - dateA;
      });
  }, [orders]);

  const totalCompletedValue = useMemo(() => {
    return completedOrders.reduce(
      (total, order) => total + Number(order.amount || 0),
      0
    );
  }, [completedOrders]);

  async function exportHistory() {
    try {
      const blob = await downloadBlob(
        "/supplier/orders/download"
      );

      saveBlob(blob, "supplier-order-history.csv");

      showToast("Order history downloaded.", "success");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  }

  return (
    <div>
      <Topbar
        title="Order history"
        subtitle="Review completed orders fulfilled by your supplier account."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadHistory}
              disabled={loading}
              className="border border-ink/10 bg-card rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-ink/[0.03] transition disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={exportHistory}
              className="bg-signal text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:opacity-90 transition"
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        }
      />

      {loading ? (
        <SkeletonRows />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate">
                    Completed orders
                  </p>

                  <p className="font-mono-num text-2xl font-semibold text-ink mt-3">
                    {completedOrders.length}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    Successfully fulfilled
                  </p>
                </div>

                <div className="h-10 w-10 rounded-lg bg-good-light text-good flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate">
                    Fulfilled value
                  </p>

                  <p className="font-mono-num text-2xl font-semibold text-ink mt-3">
                    {formatAmount(totalCompletedValue)}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    Total completed order value
                  </p>
                </div>

                <div className="h-10 w-10 rounded-lg bg-signal-light text-signal flex items-center justify-center">
                  <Package size={18} />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate">
                    Latest completion
                  </p>

                  <p className="font-mono-num text-lg font-semibold text-ink mt-4">
                    {completedOrders[0]
                      ? `Order #${completedOrders[0].orderId}`
                      : "—"}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    {completedOrders[0]
                      ? formatDate(
                          completedOrders[0].updatedDate ||
                            completedOrders[0].createdDate
                        )
                      : "No completed orders"}
                  </p>
                </div>

                <div className="h-10 w-10 rounded-lg bg-amber-light text-amber flex items-center justify-center">
                  <History size={18} />
                </div>
              </div>
            </div>
          </div>

          {completedOrders.length === 0 ? (
            <div className="bg-card rounded-card shadow-card border border-ink/5 p-8">
              <EmptyState
                icon={History}
                title="No completed orders"
                body="Orders will appear here after they reach the completed status."
              />
            </div>
          ) : (
            <div className="bg-card rounded-card shadow-card border border-ink/5 overflow-hidden">
              <div className="px-5 py-5 border-b border-ink/5">
                <h2 className="font-display font-semibold text-ink">
                  Completed orders
                </h2>

                <p className="text-xs text-slate mt-1">
                  Your most recently completed orders are shown first.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr className="border-b border-ink/5">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                        Order
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                        Product
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                        Quantity
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                        Amount
                      </th>

                      <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate">
                        Completed
                      </th>

                      <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {completedOrders.map((order) => (
                      <tr
                        key={order.orderId}
                        className="border-b border-ink/5 last:border-b-0 hover:bg-ink/[0.015] transition"
                      >
                        <td className="px-5 py-4">
                          <p className="font-mono-num text-sm font-semibold text-ink">
                            #{order.orderId}
                          </p>

                          <p className="text-xs text-slate mt-1">
                            Request #{order.requestId}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-signal-light text-signal flex items-center justify-center">
                              <Package size={16} />
                            </div>

                            <span className="text-sm font-medium text-ink">
                              {order.productName}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-slate">
                            {order.quantity}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-mono-num text-sm font-semibold text-ink">
                            {formatAmount(order.amount)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm text-ink">
                            {formatDate(
                              order.updatedDate ||
                                order.createdDate
                            )}
                          </p>

                          <p className="text-xs text-slate mt-1">
                            {formatDateTime(
                              order.updatedDate ||
                                order.createdDate
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <StatusPill status="COMPLETED" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}