import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import {
  clearAuthError,
  loginUser,
} from "../store/slices/authSlice";
import { iconProps } from "../lib/icons";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, status, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || "/admin/categories";

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  if (token) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (result.meta.requestStatus === "fulfilled") {
      navigate(from, { replace: true });
    }
  };

  const loading = status === "loading";

  return (
    <div className="grain-overlay relative flex min-h-screen items-center justify-center bg-cream-100 px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgb(181 196 154 / 0.25), transparent 55%), radial-gradient(ellipse 60% 45% at 90% 100%, rgb(196 163 90 / 0.15), transparent 50%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <img
            src="/anp_logo.webp"
            alt="Nimma Ashwini"
            className="mx-auto h-24 w-auto object-contain"
          />
          <p className="section-label mt-6 mb-2">Admin Panel</p>
          <h1 className="font-display text-display-sm text-brown-900">
            Welcome back
          </h1>
          <p className="mt-2 text-body-sm text-brown-500">
            Sign in to manage categories and products
          </p>
        </div>

        <div className="card border border-cream-300 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="focus-ring w-full rounded-md border border-cream-300 bg-white px-3.5 py-2.5 text-body-sm text-brown-900 placeholder:text-brown-400 transition-colors focus:border-olive-500"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-caption font-semibold tracking-[0.14em] text-olive-800 uppercase"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="focus-ring w-full rounded-md border border-cream-300 bg-white py-2.5 pr-11 pl-3.5 text-body-sm text-brown-900 placeholder:text-brown-400 transition-colors focus:border-olive-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="focus-ring absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1.5 text-brown-500 transition-colors hover:text-olive-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff {...iconProps(20)} />
                  ) : (
                    <Eye {...iconProps(20)} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-terracotta-400/40 bg-terracotta-500/10 px-3 py-2 text-body-sm text-terracotta-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-[0.72rem] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-brown-400">
          Admin access only · Nimma Ashwini
        </p>
      </div>
    </div>
  );
}
