import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './EmailPages.css';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { forgotPassword, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const result = await forgotPassword(email);
            setSuccess(result.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email');
        }
    };

    return (
        <div className="email-page">
            <div className="email-container">
                <div className="email-card">
                    <h2>Forgot Password?</h2>
                    <p className="email-subtitle">
                        Enter your email and we'll send you a password reset link
                    </p>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </form>

                    <div className="text-center mt-3">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
