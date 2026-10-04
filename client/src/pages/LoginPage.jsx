import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function LoginPage() {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const isExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) {
      showToast('Please enter both username/email and password', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ login: loginInput, password });
      showToast('Signed in successfully', 'success');
      navigate(redirectUrl, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-on-surface mb-2">Welcome Back</h2>
      <p className="text-xs text-on-surface-variant mb-6">
        Sign in to your Sylo account to continue
      </p>

      {isExpired && (
        <div className="mb-4 rounded-xl bg-error-container p-3 text-xs text-on-error-container">
          Your session expired. Please sign in again.
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Username or Email
          </label>
          <input
            type="text"
            required
            value={loginInput}
            onChange={(e) => setLoginInput(e.target.value)}
            placeholder="alexvance or alex@sylo.io"
            className="w-full rounded-xl border border-surface-container bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-on-surface">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-surface-container bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary-container py-3 text-sm font-semibold text-on-primary hover:bg-primary transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-on-surface-variant">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-primary hover:underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}
