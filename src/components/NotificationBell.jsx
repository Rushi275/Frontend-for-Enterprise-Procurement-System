import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listNotifications, markNotificationRead } from "../api/lookups";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (!user?.userId) return;
    let active = true;
    async function load() {
      try {
        const notifs = await listNotifications(user.userId);
        if (active) setNotifications(notifs);
      } catch {
        // ignore — backend may be unreachable
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user?.userId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkRead(id) {
    setNotifications((prev) => prev.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
    try {
      await markNotificationRead(id);
    } catch {
      // optimistic update stands even if the network call fails silently
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative h-9 w-9 rounded-lg flex items-center justify-center text-slate hover:bg-ink/5 transition"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-coral text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-card shadow-card border border-ink/10 z-50 animate-[toastIn_0.15s_ease-out]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
            <h3 className="text-sm font-semibold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[11px] text-slate-light">{unreadCount} unread</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 rounded-lg bg-ink/5 animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-slate-light text-center py-8">You're all caught up.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {notifications.map((n) => (
                  <li
                    key={n.notificationId}
                    className={`px-4 py-3 text-sm flex items-start gap-2.5 ${
                      !n.isRead ? "bg-signal-light/30" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={n.isRead ? "text-slate" : "text-ink font-medium"}>
                        {n.message}
                      </p>
                      <p className="text-[11px] text-slate-light font-mono-num mt-0.5">
                        {n.createdDate ? new Date(n.createdDate).toLocaleString() : ""}
                      </p>
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.notificationId)}
                        className="shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-slate-light hover:bg-good-light hover:text-good transition"
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
