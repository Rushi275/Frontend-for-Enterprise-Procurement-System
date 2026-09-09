import { useState } from "react";
import { Search, Truck } from "lucide-react";
import { getOrderTracking } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
import { useToast } from "../context/ToastContext";

export default function TrackOrder() {
  const { showToast } = useToast(); const [orderId, setOrderId] = useState(""); const [tracking, setTracking] = useState(null); const [loading, setLoading] = useState(false);
  async function search(e) { e.preventDefault(); setLoading(true); setTracking(null); try { setTracking(await getOrderTracking(Number(orderId))); } catch (err) { showToast(apiErrorMessage(err, "We couldn't find an order you can track."), "error"); } finally { setLoading(false); } }
  return <div><Topbar title="Track order" subtitle="Check the current fulfilment state for an order assigned to you."/><div className="bg-card rounded-card shadow-card border border-ink/5 p-6 max-w-2xl"><form onSubmit={search} className="flex gap-3"><input required min="1" type="number" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter order ID" className="flex-1 rounded-lg border border-ink/10 px-3 py-2.5 text-sm outline-none focus:border-signal"/><button disabled={loading} className="bg-signal text-white rounded-lg px-4 text-sm font-medium flex items-center gap-2"><Search size={15}/>{loading ? "Checking…" : "Track"}</button></form>{tracking ? <div className="mt-6 pt-6 border-t border-ink/5 grid sm:grid-cols-2 gap-5"><div><p className="text-xs text-slate">Product</p><p className="text-sm font-medium text-ink mt-1">{tracking.productName}</p></div><div><p className="text-xs text-slate">Supplier</p><p className="text-sm font-medium text-ink mt-1">{tracking.supplierName}</p></div><div><p className="text-xs text-slate">Current status</p><p className="text-sm font-medium text-ink mt-1">{tracking.status}</p></div><div><p className="text-xs text-slate">Last updated</p><p className="text-sm font-medium text-ink mt-1">{tracking.updatedDate ? new Date(tracking.updatedDate).toLocaleString() : "—"}</p></div></div> : <div className="mt-6 text-sm text-slate flex gap-3"><Truck className="text-signal" size={18}/><p>Order tracking begins after an approved request is paid and converted into an order.</p></div>}</div></div>;
}
