import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';
import { useToast } from '../hooks/useToast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
      showToast('Password reset instructions sent if email exists', 'info');
    } catch (err) {
      showToast(err.response?.data?.message || 'Request failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed mb-4">
          <span className="material-symbols-outlined text-2xl">mail</span>
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2">Check Your Inbox</h3>
        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
          If an account exists for <strong className="text-on-surface">{email}</strong>,
          we have sent a password reset link expiring in 1 hour.
        </p>
        <Link
          to="/login"
          className="inline-flex rounded-xl bg-primary-container px-6 py-2.5 text-xs font-semibold text-on-primary hover:bg-primary transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-on-surface mb-2">Reset Password</h2>
      <p className="text-xs text-on-surface-variant mb-6">
        Enter your registered email address and we will send a password reset link
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@sylo.io"
            className="w-full rounded-xl border border-surface-container bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary-container py-3 text-sm font-semibold text-on-primary hover:bg-primary transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-on-surface-variant">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
