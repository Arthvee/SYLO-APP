import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await register(formData);
      showToast('Account created successfully! You can now sign in.', 'success');
      navigate('/login');
    } catch (err) {
      const responseData = err.response?.data;
      const errorsList = responseData?.errors;

      if (Array.isArray(errorsList) && errorsList.length > 0) {
        const mappedErrors = {};
        errorsList.forEach((e) => {
          if (e.field) mappedErrors[e.field] = e.message;
        });
        setFieldErrors(mappedErrors);

        // Toast the first descriptive validation error message
        showToast(errorsList[0].message || 'Validation failed', 'error');
      } else {
        const msg = responseData?.message || err.message || 'Registration failed';
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed mb-4">
          <span className="material-symbols-outlined text-2xl">check_circle</span>
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2">Account Created!</h3>
        <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
          Your account has been created successfully. You can now sign in to your workspace.
        </p>
        <Link
          to="/login"
          className="inline-flex rounded-xl bg-primary px-6 py-2.5 text-xs font-semibold text-on-primary hover:bg-primary/90 transition-colors"
        >
          Proceed to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-on-surface mb-2">Create Account</h2>
      <p className="text-xs text-on-surface-variant mb-6">
        Sign up to start organizing tasks and collaborating
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Full Name or Company *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Alex Vance"
            className={`w-full rounded-xl border bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 ${
              fieldErrors.name
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-surface-container focus:border-primary focus:ring-primary/20'
            }`}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-[11px] font-medium text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">error</span>
              {fieldErrors.name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Username * (3–20 chars, lowercase, numbers, _ -)
          </label>
          <input
            type="text"
            name="username"
            required
            value={formData.username}
            onChange={handleChange}
            placeholder="alexvance"
            className={`w-full rounded-xl border bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 ${
              fieldErrors.username
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-surface-container focus:border-primary focus:ring-primary/20'
            }`}
          />
          {fieldErrors.username && (
            <p className="mt-1 text-[11px] font-medium text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">error</span>
              {fieldErrors.username}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="alex@sylo.io"
            className={`w-full rounded-xl border bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 ${
              fieldErrors.email
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-surface-container focus:border-primary focus:ring-primary/20'
            }`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-[11px] font-medium text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">error</span>
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-on-surface mb-1.5">
            Password * (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
          </label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`w-full rounded-xl border bg-surface-container-lowest px-3.5 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 ${
              fieldErrors.password
                ? 'border-error focus:border-error focus:ring-error/20'
                : 'border-surface-container focus:border-primary focus:ring-primary/20'
            }`}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-[11px] font-medium text-error flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">error</span>
              {fieldErrors.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary-container py-3 text-sm font-semibold text-on-primary hover:bg-primary transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-xs text-on-surface-variant">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
