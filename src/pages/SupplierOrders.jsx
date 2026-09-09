import { useEffect, useState } from "react";
import { Download, PackageCheck } from "lucide-react";
import { downloadBlob, listSupplierOrders, updateSupplierOrderStatus } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
import StatusPill from "../components/StatusPill";
import { EmptyState, SkeletonRows } from "./Home";
import { useToast } from "../context/ToastContext";

const next = { RECEIVED: "PACKED", PACKED: "SHIPPED", SHIPPED: "DELIVERED", DELIVERED: "COMPLETED" };
function saveBlob(blob, name) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
export default function SupplierOrders() {
  const { showToast } = useToast(); const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(null);
  async function load() { setLoading(true); try { setOrders(await listSupplierOrders()); } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);
  async function advance(order) { setBusy(order.orderId); try { const changed = await updateSupplierOrderStatus(order.orderId, next[order.status]); setOrders((rows) => rows.map((row) => row.orderId === changed.orderId ? changed : row)); showToast(`Order marked ${changed.status.toLowerCase()}.`, "success"); } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setBusy(null); } }
  async function exportOrders() { try { saveBlob(await downloadBlob("/supplier/orders/download"), "supplier-orders.csv"); } catch (err) { showToast(apiErrorMessage(err), "error"); } }
  return <div><Topbar title="Supplier orders" subtitle="Fulfil assigned orders and update each supported delivery milestone." action={<button onClick={exportOrders} className="border border-ink/10 rounded-lg px-3 py-2 text-sm flex items-center gap-2"><Download size={15}/> Export CSV</button>} />
    {loading ? <SkeletonRows/> : orders.length === 0 ? <div className="bg-card rounded-card shadow-card border border-ink/5 p-6"><EmptyState icon={PackageCheck} title="No supplier orders yet" body="Paid orders assigned to your supplier account will appear here." /></div> : <div className="space-y-3">{orders.map((order) => <div key={order.orderId} className="bg-card rounded-card shadow-card border border-ink/5 p-5"><div className="flex justify-between gap-4"><div><p className="text-sm font-semibold text-ink">{order.productName}</p><p className="text-xs text-slate mt-1">Order #{order.orderId} · Request #{order.requestId} · Qty {order.quantity}</p><p className="font-mono-num text-xs text-slate mt-1">₹{(order.amount || 0).toLocaleString("en-IN")}</p></div><StatusPill status={order.status}/></div><div className="mt-4 pt-4 border-t border-ink/5 flex gap-3">{next[order.status] && <button disabled={busy === order.orderId} onClick={() => advance(order)} className="text-xs font-medium text-good disabled:opacity-50">{busy === order.orderId ? "Updating…" : `Mark ${next[order.status].toLowerCase()}`}</button>}</div></div>)}</div>}
  </div>;
}
