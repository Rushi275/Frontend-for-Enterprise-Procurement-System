import { useState } from "react";
import { Search, Truck } from "lucide-react";
import { getOrderTracking } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
import StatusPill from "../components/StatusPill";
import { useToast } from "../context/ToastContext";

export default function TrackOrder() {
  const { showToast } = useToast();

  const [requestId, setRequestId] = useState("");
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);

  async function search(e) {
    e.preventDefault();

    if (!requestId) {
      showToast("Please enter a request ID.", "error");
      return;
    }

    setLoading(true);
    setTracking(null);

    try {
      const result = await getOrderTracking(Number(requestId));
      setTracking(result);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Topbar
        title="Track Order"
        subtitle="Check the current fulfilment status of your request."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={search} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              type="number"
              placeholder="Enter Request ID"
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Tracking..." : "Track Order"}
          </button>
        </form>
      </div>

      {tracking && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-3">
              <Truck size={22} className="text-slate-700" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Order Tracking
              </h2>
              <p className="text-sm text-slate-500">
                Request #{tracking.requestId}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Product
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {tracking.productName}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Supplier
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {tracking.supplierName}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Order ID
              </p>
              <p className="mt-1 font-medium text-slate-900">
                #{tracking.orderId}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </p>
              <div className="mt-2">
                <StatusPill status={tracking.status} />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Last Updated
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {tracking.updatedDate
                ? new Date(tracking.updatedDate).toLocaleString()
                : "Not available"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}