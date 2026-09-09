const STYLES = {
  PENDING: "bg-amber-light text-amber",
  MANAGER_APPROVED: "bg-signal-light text-signal",
  MANAGER_REJECTED: "bg-coral-light text-coral",
  APPROVED: "bg-good-light text-good",
  REJECTED: "bg-coral-light text-coral",
  DELIVERED: "bg-ink text-white",
  RECEIVED: "bg-amber-light text-amber",
  PACKED: "bg-signal-light text-signal",
  SHIPPED: "bg-signal-light text-signal",
  COMPLETED: "bg-good-light text-good",
};

const LABELS = {
  PENDING: "Pending",
  MANAGER_APPROVED: "Manager approved",
  MANAGER_REJECTED: "Manager rejected",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DELIVERED: "Delivered",
  RECEIVED: "Received",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
};

export default function StatusPill({ status }) {
  const style = STYLES[status] ?? "bg-slate/10 text-slate";
  const label = LABELS[status] ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium font-mono-num ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
