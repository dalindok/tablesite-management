import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  RiRestaurantLine,
  RiMailLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";
import { useState } from "react";

interface FormData {
  email: string;
  password: string;
}

export default function Login() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async ({ email, password }: FormData) => {
    setError("");

    // Step 1: API call only — catch belongs here
    let user;
    try {
      user = await login(email, password);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "Invalid email or password. Please try again.",
      );
      return; // stop here, don't navigate
    }

    // Step 2: Navigate after a successful login — outside try/catch
    if (user.role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (user.role === "owner")
      navigate("/owner/dashboard", { replace: true });
    else navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left illustration */}
      <div className="hidden lg:flex flex-1 bg-sidebar items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary-500 rounded-full" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-primary-400 rounded-full" />
        </div>
        <div className="relative text-center">
          <div className="w-24 h-24 bg-primary-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary-500/30">
            <RiRestaurantLine size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            TableSite Admin
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Manage your restaurants, bookings, and customers — all in one place.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: "Restaurants", value: "500+" },
              { label: "Bookings", value: "10K+" },
              { label: "Customers", value: "25K+" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-primary-400">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <RiRestaurantLine size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              TableSite Admin
            </span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome back
          </h2>
          <p className="text-slate-500 mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <RiMailLine
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`input-field pl-10 ${errors.email ? "input-error" : ""}`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <RiLockLine
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  className={`input-field pl-10 pr-10 ${errors.password ? "input-error" : ""}`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? (
                    <RiEyeOffLine size={18} />
                  ) : (
                    <RiEyeLine size={18} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 justify-center text-base">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            © {new Date().getFullYear()} TableSite. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
