import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './EmailPages.css';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const { verifyEmail, loading } = useAuth();
    const [searchParams] = useSearchParams();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const handleVerify = async () => {
        setError('');
        setSuccess('');

        if (!token || !email) {
            setError('Invalid verification link');
            return;
        }

        try {
            const result = await verifyEmail(token, email);
            setSuccess(result.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        }
    };

    return (
        <div className="email-page">
            <div className="email-container">
                <div className="email-card">
                    <h2>Verify Your Email</h2>
                    <p className="email-subtitle">
                        Click the button below to verify your email address
                    </p>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {token && email ? (
                        <>
                            <p>Email: {email}</p>
                            <button onClick={handleVerify} className="btn btn-primary" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </>
                    ) : (
                        <p className="text-muted">Invalid verification link</p>
                    )}

                    <div className="text-center mt-3">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage;
