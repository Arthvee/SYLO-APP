import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const performVerification = async () => {
      try {
        await verifyEmail(token);
        if (isMounted) setStatus('success');
      } catch (err) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err.response?.data?.message || 'Verification link expired or invalid');
        }
      }
    };

    if (token) {
      performVerification();
    } else {
      setStatus('error');
      setErrorMessage('Missing verification token');
    }

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail]);

  return (
    <div className="text-center py-4">
      {status === 'verifying' && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant font-medium">Verifying your email address...</p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed mb-4">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Account Activated!</h3>
          <p className="text-xs text-on-surface-variant mb-6">
            Your email has been verified successfully. You can now sign in to your workspace.
          </p>
          <Link
            to="/login"
            className="inline-flex rounded-xl bg-primary-container px-6 py-2.5 text-xs font-semibold text-on-primary hover:bg-primary transition-colors"
          >
            Sign In to Workspace
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-on-error-container mb-4">
            <span className="material-symbols-outlined text-2xl">cancel</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-2">Verification Failed</h3>
          <p className="text-xs text-error mb-6">{errorMessage}</p>
          <Link
            to="/login"
            className="inline-flex rounded-xl bg-surface-container-low px-6 py-2.5 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors border border-surface-container"
          >
            Go to Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
