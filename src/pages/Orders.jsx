import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ArrowRight,
  X,
  Check,
  Circle,
  Package,
  CreditCard,
  UserCheck,
  ShieldCheck,
  Truck,
  Clock3
} from "lucide-react";
import { listRequests } from "../api/requests";
import { getOrderTracking } from "../api/resources";
import { useAuth } from "../context/AuthContext";
import StatusPill from "../components/StatusPill";
import Topbar from "../components/Topbar";
import { EmptyState, SkeletonRows } from "./Home";
import { useToast } from "../context/ToastContext";
import { apiErrorMessage } from "../api/client";

const timeline = [
  {
    key: "PENDING",
    label: "Request Submitted",
    description: "Purchase request submitted successfully.",
    icon: ClipboardList
  },
  {
    key: "MANAGER_APPROVED",
    label: "Manager Approved",
    description: "Request approved by the manager.",
    icon: UserCheck
  },
  {
    key: "APPROVED",
    label: "Admin Approved",
    description: "Request received final approval.",
    icon: ShieldCheck
  },
  {
    key: "PAID",
    label: "Payment Completed",
    description: "Payment has been successfully completed.",
    icon: CreditCard
  },
  {
    key: "RECEIVED",
    label: "Order Received",
    description: "Supplier has received the order.",
    icon: Package
  },
  {
    key: "PACKED",
    label: "Order Packed",
    description: "Supplier has packed the order.",
    icon: Package
  },
  {
    key: "SHIPPED",
    label: "Order Shipped",
    description: "Order has been shipped by the supplier.",
    icon: Truck
  },
  {
    key: "DELIVERED",
    label: "Order Delivered",
    description: "Order has been delivered successfully.",
    icon: Check
  }
];

const stageIndex = {
  PENDING: 0,
  MANAGER_APPROVED: 1,
  APPROVED: 2,
  PAID: 3,
  RECEIVED: 4,
  PACKED: 5,
  SHIPPED: 6,
  DELIVERED: 7
};

function getCurrentStage(requestStatus, orderStatus) {
  if (orderStatus === "DELIVERED" || requestStatus === "DELIVERED") {
    return "DELIVERED";
  }

  if (orderStatus === "SHIPPED") {
    return "SHIPPED";
  }

  if (orderStatus === "PACKED") {
    return "PACKED";
  }

  if (orderStatus === "RECEIVED") {
    return "RECEIVED";
  }

  if (requestStatus === "APPROVED") {
    return "APPROVED";
  }

  if (requestStatus === "MANAGER_APPROVED") {
    return "MANAGER_APPROVED";
  }

  return "PENDING";
}

function getProgress(requestStatus, orderStatus) {
  const currentStage = getCurrentStage(requestStatus, orderStatus);
  const index = stageIndex[currentStage];

  return {
    currentStage,
    currentIndex: index,
    completedCount: index + 1,
    percentage: Math.round(((index + 1) / timeline.length) * 100)
  };
}

function TrackingModal({ request, tracking, loading, onClose }) {
  const requestStatus = tracking?.requestStatus ?? request.status;
  const orderStatus = tracking?.status;

  const {
    currentStage,
    currentIndex,
    completedCount,
    percentage
  } = getProgress(requestStatus, orderStatus);

  const isRejected =
    requestStatus === "REJECTED" ||
    requestStatus === "MANAGER_REJECTED";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-ink/5 bg-card px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-signal/10">
                <Truck size={21} className="text-signal" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-ink">
                  Order Tracking
                </h2>

                <p className="mt-0.5 text-xs text-slate-light font-mono-num">
                  Request #{String(request.requestId).padStart(4, "0")}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 rounded-xl p-2 text-slate-light transition hover:bg-ink/5 hover:text-ink"
              aria-label="Close tracking"
            >
              <X size={21} />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-ink">
                {request.product?.name ?? "Item request"}
              </h3>

              <p className="mt-1 text-xs text-slate-light">
                Qty {request.numberOfQuantities ?? "—"}
                {" · "}
                ₹{(request.totalPrice ?? 0).toLocaleString("en-IN")}
              </p>
            </div>

            {!loading && (
              <StatusPill status={isRejected ? requestStatus : currentStage} />
            )}
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-6 sm:px-7">
          {loading ? (
            <div className="flex min-h-80 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-light">
                <Clock3 size={17} />
                Loading tracking...
              </div>
            </div>
          ) : isRejected ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <X size={18} className="text-red-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Request {requestStatus === "REJECTED" ? "Rejected" : "Rejected by Manager"}
                  </p>

                  <p className="mt-1 text-xs text-red-700">
                    This request did not proceed to order fulfilment.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-7 rounded-2xl border border-ink/5 bg-ink/[0.02] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-light">
                      Fulfilment progress
                    </p>

                    <p className="mt-1 text-sm font-semibold text-ink">
                      {completedCount} of {timeline.length} stages completed
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-ink">
                      {percentage}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
                  <div
                    className="h-full rounded-full bg-signal transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div className="mb-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-ink/[0.03] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-light">
                    Product
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {tracking?.productName ??
                      request.product?.name ??
                      "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-ink/[0.03] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-light">
                    Supplier
                  </p>

                  <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {tracking?.supplierName ?? "Not assigned"}
                  </p>
                </div>

                <div className="rounded-2xl bg-ink/[0.03] p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-light">
                    Order ID
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink">
                    {tracking?.orderId
                      ? `#${tracking.orderId}`
                      : "Not created"}
                  </p>
                </div>
              </div>

              <div>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">
                    Request Journey
                  </h3>

                  <span className="text-xs text-slate-light">
                    {currentStage.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="relative">
                  {timeline.map((item, index) => {
                    const Icon = item.icon;
                    const completed = index < currentIndex;
                    const current = index === currentIndex;
                    const future = index > currentIndex;

                    return (
                      <div
                        key={item.key}
                        className="relative flex gap-4 pb-7 last:pb-0"
                      >
                        {index < timeline.length - 1 && (
                          <div
                            className={`absolute left-[18px] top-10 h-[calc(100%-18px)] w-px ${
                              index < currentIndex
                                ? "bg-signal"
                                : "bg-ink/10"
                            }`}
                          />
                        )}

                        <div
                          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            current
                              ? "border-signal bg-signal text-white shadow-lg shadow-signal/25"
                              : completed
                              ? "border-signal bg-signal/10 text-signal"
                              : "border-ink/10 bg-card text-slate-light"
                          }`}
                        >
                          {completed || current ? (
                            current ? (
                              <Icon size={16} />
                            ) : (
                              <Check size={16} />
                            )
                          ) : (
                            <Circle size={9} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={`text-sm font-semibold ${
                                future ? "text-slate-light" : "text-ink"
                              }`}
                            >
                              {item.label}
                            </p>

                            {current && (
                              <span className="rounded-full bg-signal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-signal">
                                Current
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-1 text-xs ${
                              future
                                ? "text-slate-light/70"
                                : "text-slate-light"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {tracking?.updatedDate && (
                <div className="mt-2 flex items-center gap-2 border-t border-ink/5 pt-5 text-xs text-slate-light">
                  <Clock3 size={14} />
                  Last updated{" "}
                  {new Date(tracking.updatedDate).toLocaleString("en-IN")}
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-ink/5 bg-card px-6 py-4 sm:px-7">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-ink/10 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-ink/[0.03]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const all = await listRequests();

        const mine =
          user?.role === "ADMIN"
            ? all
            : user?.userId
            ? all.filter(
                (r) => r.user?.userId === user.userId
              )
            : [];

        setRequests(
          mine.sort((a, b) => b.requestId - a.requestId)
        );
      } catch {
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.userId]);

  async function openTracking(request) {
    setSelectedRequest(request);
    setTracking(null);
    setTrackingLoading(true);

    try {
      const result = await getOrderTracking(request.requestId);
      setTracking(result);
    } catch (err) {
      if (
        request.status === "PENDING" ||
        request.status === "MANAGER_APPROVED" ||
        request.status === "MANAGER_REJECTED" ||
        request.status === "REJECTED"
      ) {
        setTracking({
          requestId: request.requestId,
          productName: request.product?.name,
          requestStatus: request.status,
          status: null
        });
      } else {
        showToast(apiErrorMessage(err), "error");
      }
    } finally {
      setTrackingLoading(false);
    }
  }

  function closeTracking() {
    setSelectedRequest(null);
    setTracking(null);
  }

  return (
    <div>
      <Topbar
        title={user?.role === "ADMIN" ? "Purchase requests" : "My requests"}
        subtitle={
          user?.role === "ADMIN"
            ? "Every request currently recorded in the system."
            : "Everything you've requested, at a glance."
        }
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
              onClick={() => openTracking(r)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-ink/[0.02] transition"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {r.product?.name ?? "Item request"}
                </div>

                <div className="text-xs text-slate-light mt-0.5 font-mono-num">
                  #{String(r.requestId).padStart(4, "0")} · Qty{" "}
                  {r.numberOfQuantities} · ₹
                  {(r.totalPrice ?? 0).toLocaleString("en-IN")}
                </div>
              </div>

              <StatusPill status={r.status} />
            </button>
          ))}
        </div>
      )}

      {selectedRequest && (
        <TrackingModal
          request={selectedRequest}
          tracking={tracking}
          loading={trackingLoading}
          onClose={closeTracking}
        />
      )}
    </div>
  );
}