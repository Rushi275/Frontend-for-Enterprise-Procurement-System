import { Download, Landmark } from "lucide-react";
import { downloadBlob } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import Topbar from "../components/Topbar";
import { useToast } from "../context/ToastContext";

export default function SupplierPayments() {
  const { showToast } = useToast();
  async function download() { try { const blob = await downloadBlob("/supplier/payments/download"); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "supplier-payment-history.csv"; link.click(); URL.revokeObjectURL(url); } catch (err) { showToast(apiErrorMessage(err), "error"); } }
  return <div><Topbar title="Payment history" subtitle="Download payment records issued to your supplier account."/><div className="bg-card rounded-card shadow-card border border-ink/5 p-8 text-center"><div className="h-12 w-12 mx-auto bg-signal-light text-signal rounded-full flex items-center justify-center"><Landmark size={20}/></div><h2 className="font-display font-semibold text-ink mt-4">Supplier payment export</h2><p className="text-sm text-slate mt-2 max-w-md mx-auto">The backend provides your payment history as a CSV file, including request, amount, payment method, transaction, status, and date.</p><button onClick={download} className="mt-5 bg-signal text-white rounded-lg px-4 py-2.5 text-sm font-medium inline-flex gap-2 items-center"><Download size={15}/> Download payment history</button></div></div>;
}
