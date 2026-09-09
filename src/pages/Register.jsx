import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    designation: "",
    role: "EMPLOYEE",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      setDone(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Couldn't create the account. That email may already be registered."
      );
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper px-6">
        <div className="max-w-sm w-full text-center">
          <div className="h-12 w-12 rounded-full bg-good-light text-good flex items-center justify-center mx-auto mb-5">
            <Check size={22} />
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">
            Account created
          </h1>
          <p className="text-sm text-slate mt-2 mb-7">
            Your account is ready. Sign in to raise your first request.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-signal hover:bg-signal-dark text-white text-sm font-medium rounded-lg py-2.5 transition-colors"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-paper">
      <div className="hidden lg:flex lg:w-[42%] bg-ink text-white flex-col justify-between px-12 py-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 font-display font-semibold text-xl">
            <Boxes className="text-signal" size={22} />
            Procure<span className="text-signal">.</span>
          </div>
        </div>
        <div className="relative">
          <h2 className="font-display text-3xl leading-tight font-semibold max-w-sm">
            Set up your account in under a minute.
          </h2>
          <p className="text-white/50 mt-4 max-w-sm text-sm leading-relaxed">
            Your manager will be looped in automatically once your first
            request is raised.
          </p>
        </div>
        <div className="relative text-xs text-white/30 font-mono-num">
          Enterprise Procurement System
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <div className="lg:hidden flex items-center gap-2 font-display font-semibold text-xl mb-10 text-ink">
            <Boxes className="text-signal" size={22} />
            Procure.
          </div>

          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="text-sm text-slate mt-1.5 mb-8">
            A few details and you're in.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Full name</label>
              <input
                required
                value={form.name}
                onChange={update("name")}
                className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                placeholder="Rushikesh Kulkarni"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Work email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={update("password")}
                className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                placeholder="At least 8 characters"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate mb-1.5">Phone</label>
                <input
                  value={form.phoneNumber}
                  onChange={update("phoneNumber")}
                  className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                  placeholder="98765 43210"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1.5">Role</label>
                <select
                  value={form.role}
                  onChange={update("role")}
                  className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate mb-1.5">Designation</label>
              <input
                value={form.designation}
                onChange={update("designation")}
                className="w-full rounded-lg border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-light focus:border-signal focus:ring-1 focus:ring-signal outline-none transition"
                placeholder="Software Engineer"
              />
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
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="text-sm text-slate text-center mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-signal font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
