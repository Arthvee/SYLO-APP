import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './EmailPages.css';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const { resetPassword, loading } = useAuth();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const token = searchParams.get('token');
    const email = searchParams.get('email');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!token || !email) {
            setError('Invalid reset link');
            return;
        }

        try {
            const result = await resetPassword(token, email, formData.password, formData.confirmPassword);
            setSuccess(result.message);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password');
        }
    };

    return (
        <div className="email-page">
            <div className="email-container">
                <div className="email-card">
                    <h2>Reset Password</h2>
                    <p className="email-subtitle">Enter your new password</p>

                    {error && <div className="alert alert-error">{error}</div>}
                    {success && <div className="alert alert-success">{success}</div>}

                    {token && email ? (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    ) : (
                        <p className="text-muted">Invalid reset link</p>
                    )}

                    <div className="text-center mt-3">
                        <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
