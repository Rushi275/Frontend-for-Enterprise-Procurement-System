import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, Mail, Lock, Eye, EyeOff, UserCog, User as UserIcon, ShieldCheck, Store } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Only EMPLOYEE, MANAGER (backend UserRole enum) and ADMIN (separate /admin/login
// endpoint) are wired up server-side — there's no supplier login endpoint yet.
const ROLES = [
  { value: "EMPLOYEE", label: "Employee", icon: UserIcon },
  { value: "MANAGER", label: "Manager", icon: UserCog },
  { value: "SUPPLIER", label: "Supplier", icon: Store },
  { value: "ADMIN", label: "Admin", icon: ShieldCheck },
];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    loginType: "EMPLOYEE",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const session = await login(form.email, form.password, form.loginType);
      navigate(session.role === "SUPPLIER" ? "/supplier-orders" : "/home");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Couldn't sign you in. Check your details and try again."
      );
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-paper">
      <div className="hidden lg:flex lg:w-[42%] bg-ink text-white flex-col justify-between px-12 py-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl" />
        <div className="absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-signal/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 font-display font-semibold text-xl">
            <Boxes className="text-signal" size={22} />
            Procure<span className="text-signal">.</span>
          </div>
        </div>

        <div className="relative">
          <h2 className="font-display text-3xl leading-tight font-semibold max-w-sm">
            Every request, tracked from raise to delivery.
          </h2>

          <p className="text-white/50 mt-4 max-w-sm text-sm leading-relaxed">
            One place to raise purchase requests, follow them through manager
            and admin approval, and see exactly where your order stands.
          </p>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex -space-x-2">
              {["A", "R", "S", "P"].map((letter, i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-signal/30 border-2 border-ink flex items-center justify-center text-[11px] font-semibold text-white"
                >
                  {letter}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/40">Trusted across teams, every department</p>
          </div>
        </div>

        <div className="relative text-xs text-white/30 font-mono-num">
          Enterprise Procurement System
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 font-display font-semibold text-xl mb-10 text-ink">
            <Boxes className="text-signal" size={22} />
            Procure.
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">
            Welcome back
          </h1>

          <p className="text-sm text-slate mt-1.5 mb-8">
            Sign in with your work email to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate mb-2">
                Login as
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {ROLES.map(({ value, label, icon: Icon }) => {
                  const active = form.loginType === value;
                  return (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setForm({ ...form, loginType: value })}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[11px] font-medium transition-colors ${
                        active
                          ? "border-signal bg-signal-light text-signal-dark"
                          : "border-ink/10 text-slate hover:border-ink/20"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">
                Work email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-light"
                />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-ink/10 bg-white pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate">Password</label>
                <Link to="#" className="text-xs text-signal hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-light"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-ink/10 bg-white pl-10 pr-10 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-light hover:text-slate transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-coral bg-coral-light rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg py-2.5 transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-sm text-slate text-center mt-8">
            New here?{" "}
            <Link
              to="/register"
              className="text-signal font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
