import { useEffect, useMemo, useState } from "react";
import { Package, Minus, Plus, X, Search, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listProducts } from "../api/products";
import { listCategories, listDepartments } from "../api/lookups";
import { raiseRequest } from "../api/requests";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Topbar from "../components/Topbar";
import { EmptyState, SkeletonRows } from "./Home";

// Dedicated product catalog, grouped by category — separate from the
// "My Orders" summary page, which only shows what you've already raised.
export default function Products() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [p, c, d] = await Promise.all([
          listProducts(),
          listCategories(),
          listDepartments(),
        ]);
        setProducts(p);
        setCategories(c);
        setDepartments(d);
      } catch {
        // backend not reachable in preview — grid just stays empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCategory === "ALL" || p.category?.categoryId === activeCategory;
      const matchesQuery = p.name?.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [products, activeCategory, query]);

  // Group the filtered list by category so each category gets its own
  // labeled section instead of one flat grid.
  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((p) => {
      const key = p.category?.categoryName ?? "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <Topbar
        title="Products"
        subtitle="Browse the full catalog by category and raise a request."
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-light" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-ink/10 bg-white pl-9 pr-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <FilterChip
            label="All categories"
            active={activeCategory === "ALL"}
            onClick={() => setActiveCategory("ALL")}
          />
          {categories.map((c) => (
            <FilterChip
              key={c.categoryId}
              label={c.categoryName}
              active={activeCategory === c.categoryId}
              onClick={() => setActiveCategory(c.categoryId)}
            />
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-card shadow-card border border-ink/5 p-6">
          <EmptyState
            icon={Package}
            title="No products found"
            body="Try a different search term or category filter."
          />
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([categoryName, items]) => (
            <div key={categoryName}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-display font-semibold text-ink text-sm">{categoryName}</h2>
                <span className="text-xs text-slate-light">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((p) => (
                  <div
                    key={p.productId}
                    className="bg-card rounded-card shadow-card border border-ink/5 p-5 flex flex-col"
                  >
                    <div className="h-10 w-10 rounded-lg bg-signal-light text-signal flex items-center justify-center mb-4">
                      <Package size={18} />
                    </div>
                    <h3 className="text-sm font-semibold text-ink">{p.name}</h3>
                    <p className="text-xs text-slate mt-1 line-clamp-2 flex-1">
                      {p.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-mono-num text-sm font-semibold text-ink">
                        ₹{p.pricePerProduct?.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[11px] text-slate-light">{categoryName}</span>
                    </div>
                    <button
                      onClick={() => setSelected(p)}
                      className="mt-4 w-full bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg py-2 transition-colors"
                    >
                      Raise request
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <RequestModal
          product={selected}
          departments={departments}
          user={user}
          onClose={() => setSelected(null)}
          onSuccess={(req) => {
            setSelected(null);
            setConfirmed(req);
            showToast("Request submitted for approval.", "success");
          }}
          onError={(msg) => showToast(msg, "error")}
        />
      )}

      {confirmed && (
        <ConfirmModal
          request={confirmed}
          onClose={() => setConfirmed(null)}
          onTrack={() => {
            setConfirmed(null);
            navigate("/track");
          }}
        />
      )}
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-ink text-white" : "bg-white text-slate border border-ink/10 hover:border-ink/20"
      }`}
    >
      {label}
    </button>
  );
}

function RequestModal({ product, departments, user, onClose, onSuccess, onError }) {
  const [qty, setQty] = useState(1);
  const [departmentId, setDepartmentId] = useState(departments[0]?.departmentId ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const total = (product.pricePerProduct ?? 0) * qty;

  async function submit() {
    if (!departmentId) {
      setError("Select a department for this request.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        user: { userId: user?.userId },
        department: { departmentId },
        category: product.category ? { categoryId: product.category.categoryId } : null,
        product: { productId: product.productId },
        numberOfQuantities: qty,
      };
      const created = await raiseRequest(payload);
      onSuccess(created ?? { ...payload, product, totalPrice: total });
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Couldn't raise the request. Try again.";
      setError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-card shadow-card w-full max-w-sm p-6 animate-[fadeIn_0.15s_ease-out]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-display font-semibold text-ink">Raise request</h3>
            <p className="text-xs text-slate mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-light hover:text-ink transition">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-medium text-slate mb-1.5">Quantity</label>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-lg border border-ink/10 flex items-center justify-center text-ink hover:bg-ink/5 transition"
          >
            <Minus size={14} />
          </button>
          <span className="font-mono-num text-lg font-semibold text-ink w-10 text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="h-9 w-9 rounded-lg border border-ink/10 flex items-center justify-center text-ink hover:bg-ink/5 transition"
          >
            <Plus size={14} />
          </button>
        </div>

        <label className="block text-xs font-medium text-slate mb-1.5">Department</label>
        <select
          value={departmentId}
          onChange={(e) => setDepartmentId(Number(e.target.value))}
          className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink mb-4 focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
        >
          <option value="">Select department</option>
          {departments.map((d) => (
            <option key={d.departmentId} value={d.departmentId}>
              {d.departmentName}
            </option>
          ))}
        </select>

        <div className="flex items-center justify-between bg-paper rounded-lg px-4 py-3 mb-5">
          <span className="text-sm text-slate">Total</span>
          <span className="font-mono-num text-base font-semibold text-ink">
            ₹{total.toLocaleString("en-IN")}
          </span>
        </div>

        {error && (
          <div className="text-sm text-coral bg-coral-light rounded-lg px-3.5 py-2.5 mb-4">
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit for approval"}
        </button>
      </div>
    </div>
  );
}

function ConfirmModal({ request, onClose, onTrack }) {
  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="bg-white rounded-card shadow-card w-full max-w-sm p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-good-light text-good flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={22} />
        </div>
        <h3 className="font-display font-semibold text-ink">Request submitted</h3>
        <p className="text-sm text-slate mt-1.5 mb-6">
          Your request for {request.product?.name} is on its way to your manager for approval.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-ink/10 text-ink text-sm font-medium rounded-lg py-2.5 hover:bg-ink/5 transition"
          >
            Keep browsing
          </button>
          <button
            onClick={onTrack}
            className="flex-1 bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg py-2.5 transition"
          >
            Track it
          </button>
        </div>
      </div>
    </div>
  );
}
