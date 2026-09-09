import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, className: "bg-good-light text-good border-good/20" },
  error: { icon: XCircle, className: "bg-coral-light text-coral border-coral/20" },
  info: { icon: Info, className: "bg-signal-light text-signal border-signal/20" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
        {toasts.map((t) => {
          const { icon: Icon, className } = STYLES[t.type] ?? STYLES.info;
          return (
            <div
              key={t.id}
              className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 shadow-card bg-white animate-[toastIn_0.2s_ease-out] ${className}`}
            >
              <Icon size={17} className="shrink-0 mt-0.5" />
              <p className="text-sm font-medium flex-1 text-ink">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-light hover:text-ink transition shrink-0"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return ctx;
}
