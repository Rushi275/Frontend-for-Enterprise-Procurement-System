import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Download,
  Landmark,
  RefreshCw,
  Wallet
} from "lucide-react";
import {
  downloadBlob,
  listSupplierPayments
} from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
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

function getPaymentIcon(method) {
  if (method === "UPI") {
    return Wallet;
  }

  if (method === "CARD") {
    return CreditCard;
  }

  return Landmark;
}

export default function SupplierPayments() {
  const { showToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadPayments() {
    setLoading(true);

    try {
      const data = await listSupplierPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const dateA = new Date(a.paymentDate || 0).getTime();
      const dateB = new Date(b.paymentDate || 0).getTime();

      return dateB - dateA;
    });
  }, [payments]);

  const successfulPayments = useMemo(() => {
    return sortedPayments.filter(
      (payment) => payment.status === "SUCCESS"
    );
  }, [sortedPayments]);

  const totalAmount = useMemo(() => {
    return successfulPayments.reduce(
      (total, payment) => total + Number(payment.amount || 0),
      0
    );
  }, [successfulPayments]);

  const latestPayment = successfulPayments[0];

  async function download() {
    try {
      const blob = await downloadBlob(
        "/supplier/payments/download"
      );

      saveBlob(blob, "supplier-payment-history.csv");

      showToast("Payment history downloaded.", "success");
    } catch (err) {
      showToast(apiErrorMessage(err), "error");
    }
  }

  return (
    <div>
      <Topbar
        title="Payment history"
        subtitle="View payments issued to your supplier account."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={loadPayments}
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
              onClick={download}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate">
                    Total payments
                  </p>

                  <p className="font-mono-num text-2xl font-semibold text-ink mt-3">
                    {successfulPayments.length}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    Successful transactions
                  </p>
                </div>

                <div className="h-10 w-10 rounded-lg bg-signal-light text-signal flex items-center justify-center">
                  <Landmark size={18} />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate">
                    Total received
                  </p>

                  <p className="font-mono-num text-2xl font-semibold text-ink mt-3">
                    {formatAmount(totalAmount)}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    Across successful payments
                  </p>
                </div>

                <div className="h-10 w-10 rounded-lg bg-good-light text-good flex items-center justify-center">
                  <Wallet size={18} />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate">
                    Latest payment
                  </p>

                  <p className="font-mono-num text-2xl font-semibold text-ink mt-3">
                    {latestPayment
                      ? formatAmount(latestPayment.amount)
                      : "₹0"}
                  </p>

                  <p className="text-xs text-slate mt-1">
                    {latestPayment
                      ? formatDate(latestPayment.paymentDate)
                      : "No payments yet"}
                  </p>
                </div>

                <div className="h-10 w-10 rounded-lg bg-amber-light text-amber flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-card shadow-card border border-ink/5 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate">
                    Latest transaction
                  </p>

                  <p className="font-mono-num text-sm font-semibold text-ink mt-4 truncate max-w-[180px]">
                    {latestPayment?.transactionId || "—"}
                  </p>

                  <p className="text-xs text-slate mt-2">
                    Transaction reference
                  </p>
                </div>

                <div className="h-10 w-10 rounded-lg bg-good-light text-good flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
              </div>
            </div>
          </div>

          {sortedPayments.length === 0 ? (
            <div className="bg-card rounded-card shadow-card border border-ink/5 p-8">
              <EmptyState
                icon={Landmark}
                title="No payment records"
                body="Payments issued to your supplier account will appear here."
              />
            </div>
          ) : (
            <div className="bg-card rounded-card shadow-card border border-ink/5 overflow-hidden">
              <div className="px-5 py-5 border-b border-ink/5 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-ink">
                    Payment transactions
                  </h2>

                  <p className="text-xs text-slate mt-1">
                    Latest payments appear first.
                  </p>
                </div>

                <span className="text-xs font-medium text-slate">
                  {sortedPayments.length} record
                  {sortedPayments.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
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
                        Transaction
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
                    {sortedPayments.map((payment) => {
                      const PaymentIcon = getPaymentIcon(
                        payment.paymentMethod
                      );

                      const success = payment.status === "SUCCESS";

                      return (
                        <tr
                          key={payment.paymentId}
                          className="border-b border-ink/5 last:border-b-0 hover:bg-ink/[0.015] transition"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-signal-light text-signal flex items-center justify-center">
                                <PaymentIcon size={16} />
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-ink">
                                  Payment #{payment.paymentId}
                                </p>

                                <p className="text-xs text-slate mt-1">
                                  Supplier payment
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono-num text-sm text-ink">
                              #{payment.requestId}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono-num text-sm font-semibold text-ink">
                              {formatAmount(payment.amount)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center rounded-full bg-ink/[0.04] px-2.5 py-1 text-xs font-medium text-ink">
                              {payment.paymentMethod || "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-mono-num text-xs text-slate">
                              {payment.transactionId || "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-ink">
                              {formatDate(payment.paymentDate)}
                            </p>

                            <p className="text-xs text-slate mt-1">
                              {formatDateTime(payment.paymentDate)
                                .split(", ")
                                .slice(1)
                                .join(", ")}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                success
                                  ? "bg-good-light text-good"
                                  : "bg-coral-light text-coral"
                              }`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {payment.status || "Unknown"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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