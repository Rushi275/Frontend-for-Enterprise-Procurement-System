import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Clock3,
  Download,
  Package,
  PackageCheck,
  Truck,
  X
} from "lucide-react";
import {
  downloadBlob,
  listSupplierOrders,
  updateSupplierOrderStatus
} from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
import StatusPill from "../components/StatusPill";
import { EmptyState, SkeletonRows } from "./Home";
import { useToast } from "../context/ToastContext";

const nextStatus = {
  RECEIVED: "PACKED",
  PACKED: "SHIPPED",
  SHIPPED: "DELIVERED",
  DELIVERED: "COMPLETED"
};

const statusLabels = {
  RECEIVED: "Received",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed"
};

const statusIcons = {
  RECEIVED: Clock3,
  PACKED: Package,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  COMPLETED: CircleCheck
};

const statusMessages = {
  RECEIVED: {
    title: "Ready to start fulfilment?",
    description:
      "Confirming this update will move the order into the packing stage.",
    action: "Confirm & Pack"
  },
  PACKED: {
    title: "Ready to ship this order?",
    description:
      "Confirm that the order has been packed and is ready to move into shipping.",
    action: "Confirm & Ship"
  },
  SHIPPED: {
    title: "Mark this order as delivered?",
    description:
      "Only confirm this when the order has reached the customer delivery stage.",
    action: "Confirm Delivery"
  },
  DELIVERED: {
    title: "Complete this order?",
    description:
      "This is the final fulfilment milestone. The order will move to Order History.",
    action: "Complete Order"
  }
};

const statusSteps = [
  "RECEIVED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED"
];

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

function getProgress(status) {
  const index = statusSteps.indexOf(status);

  if (index === -1) return 0;

  return (index / (statusSteps.length - 1)) * 100;
}

export default function SupplierOrders() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  async function load() {
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
    load();
  }, []);

  const activeOrders = useMemo(() => {
    return orders
      .filter((order) => order.status !== "COMPLETED")
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

  function openConfirmation(order) {
    setSelectedOrder(order);
  }

  function closeConfirmation() {
    if (busy === null) {
      setSelectedOrder(null);
    }
  }

  async function confirmStatusUpdate() {
    if (!selectedOrder) {
      return;
    }

    const order = selectedOrder;
    const newStatus = nextStatus[order.status];

    if (!newStatus) {
      return;
    }

    setBusy(order.orderId);

    try {
      const changed = await updateSupplierOrderStatus(
        order.orderId,
        newStatus
      );

      if (changed.status === "COMPLETED") {
        setOrders((rows) =>
          rows.filter((row) => row.orderId !== changed.orderId)
        );
      } else {
        setOrders((rows) =>
          rows.map((row) =>
            row.orderId === changed.orderId ? changed : row
          )
        );
      }

      showToast(
        `Order marked ${statusLabels[changed.status].toLowerCase()}.`,
        "success"
      );

      setSelectedOrder(null);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  }

  async function exportOrders() {
    try {
      const blob = await downloadBlob("/supplier/orders/download");
      saveBlob(blob, "supplier-orders.csv");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  }

  return (
    <div>
      <Topbar
        title="Supplier orders"
        subtitle="Fulfil assigned orders and update each supported delivery milestone."
        action={
          <button
            onClick={exportOrders}
            className="border border-ink/10 bg-card rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-ink/[0.03] transition"
          >
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      {loading ? (
        <SkeletonRows />
      ) : activeOrders.length === 0 ? (
        <div className="bg-card rounded-card shadow-card border border-ink/5 p-8">
          <EmptyState
            icon={PackageCheck}
            title="No active supplier orders"
            body="New paid orders assigned to your supplier account will appear here."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {activeOrders.map((order) => {
            const next = nextStatus[order.status];

            return (
              <div
                key={order.orderId}
                className="bg-card rounded-card shadow-card border border-ink/5 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-signal-light text-signal flex items-center justify-center">
                        <PackageCheck size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {order.productName}
                        </p>

                        <p className="text-xs text-slate mt-1">
                          Order #{order.orderId} · Request #{order.requestId}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs text-slate">
                      <span>Quantity: {order.quantity}</span>

                      <span className="font-mono-num">
                        {formatAmount(order.amount)}
                      </span>

                      <span>
                        Updated{" "}
                        {formatDate(
                          order.updatedDate || order.createdDate
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:shrink-0">
                    <StatusPill status={order.status} />

                    {next && (
                      <button
                        disabled={busy === order.orderId}
                        onClick={() => openConfirmation(order)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-signal text-white px-4 py-2.5 text-xs font-medium hover:opacity-90 transition disabled:opacity-50"
                      >
                        Update to {statusLabels[next]}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeConfirmation();
            }
          }}
        >
          <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-ink/10 overflow-hidden">
            <div className="relative px-6 pt-6 pb-5 border-b border-ink/5">
              <button
                onClick={closeConfirmation}
                disabled={busy !== null}
                className="absolute right-5 top-5 h-9 w-9 rounded-lg flex items-center justify-center text-slate hover:bg-ink/5 hover:text-ink transition disabled:opacity-50"
                aria-label="Close confirmation"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 pr-10">
                <div className="h-11 w-11 rounded-xl bg-signal-light text-signal flex items-center justify-center">
                  <PackageCheck size={20} />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-signal">
                    Fulfilment update
                  </p>

                  <h2 className="font-display text-xl font-semibold text-ink mt-1">
                    Update order #{selectedOrder.orderId}
                  </h2>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="bg-paper rounded-xl border border-ink/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {selectedOrder.productName}
                    </p>

                    <p className="text-xs text-slate mt-1">
                      Request #{selectedOrder.requestId} · Quantity{" "}
                      {selectedOrder.quantity}
                    </p>
                  </div>

                  <span className="font-mono-num text-sm font-semibold text-ink">
                    {formatAmount(selectedOrder.amount)}
                  </span>
                </div>
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate">
                    Fulfilment progress
                  </p>

                  <p className="text-xs font-medium text-signal">
                    {statusLabels[selectedOrder.status]}
                  </p>
                </div>

                <div className="relative px-1">
                  <div className="absolute left-5 right-5 top-4 h-1 rounded-full bg-ink/10" />

                  <div
                    className="absolute left-5 top-4 h-1 rounded-full bg-signal transition-all duration-500"
                    style={{
                      width: `calc(${getProgress(
                        selectedOrder.status
                      )}% - 10px)`
                    }}
                  />

                  <div className="relative flex justify-between">
                    {statusSteps.map((status) => {
                      const Icon = statusIcons[status];
                      const currentIndex = statusSteps.indexOf(
                        selectedOrder.status
                      );
                      const stepIndex = statusSteps.indexOf(status);
                      const completed = stepIndex <= currentIndex;
                      const upcoming =
                        status === nextStatus[selectedOrder.status];

                      return (
                        <div
                          key={status}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                              completed
                                ? "bg-signal border-signal text-white"
                                : upcoming
                                  ? "bg-card border-signal text-signal shadow-lg shadow-signal/20"
                                  : "bg-card border-ink/10 text-slate"
                            }`}
                          >
                            {completed && stepIndex < currentIndex ? (
                              <Check size={15} strokeWidth={2.5} />
                            ) : (
                              <Icon size={15} />
                            )}
                          </div>

                          <span
                            className={`text-[9px] sm:text-[10px] font-medium text-center ${
                              completed || upcoming
                                ? "text-ink"
                                : "text-slate"
                            }`}
                          >
                            {statusLabels[status]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-signal/15 bg-signal-light/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-full bg-signal text-white flex items-center justify-center">
                    {(() => {
                      const Icon = statusIcons[
                        nextStatus[selectedOrder.status]
                      ];

                      return <Icon size={17} />;
                    })()}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-ink">
                      {statusMessages[selectedOrder.status]?.title}
                    </h3>

                    <p className="text-xs text-slate leading-5 mt-1">
                      {statusMessages[selectedOrder.status]?.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mt-5 px-1">
                <div>
                  <span className="text-slate">Current status</span>
                  <div className="mt-1">
                    <StatusPill status={selectedOrder.status} />
                  </div>
                </div>

                <ArrowRight size={18} className="text-slate mt-5" />

                <div className="text-right">
                  <span className="text-slate">New status</span>
                  <div className="mt-1">
                    <StatusPill
                      status={nextStatus[selectedOrder.status]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 bg-paper/60 border-t border-ink/5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={closeConfirmation}
                disabled={busy !== null}
                className="rounded-lg border border-ink/10 bg-card px-5 py-2.5 text-sm font-medium text-ink hover:bg-ink/[0.03] transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmStatusUpdate}
                disabled={busy !== null}
                className="rounded-lg bg-signal text-white px-5 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy !== null ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    {statusMessages[selectedOrder.status]?.action}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}