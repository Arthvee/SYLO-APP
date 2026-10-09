import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../utils/axiosClient';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    // Check if user is already logged in on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setAuthLoading(false);
    }, []);

    const registerUser = async (data) => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/register', data);
            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const loginUser = async (email, password) => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/login', { email, password });
            const { token, user } = response.data;

            setToken(token);
            setUser(user);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const verifyEmail = async (token, email) => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/verify-email', { token, email });
            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/forgot-password', { email });
            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (token, email, password, confirmPassword) => {
        setLoading(true);
        try {
            const response = await axiosClient.post('/auth/reset-password', {
                token,
                email,
                password,
                confirmPassword
            });
            return response.data;
        } finally {
            setLoading(false);
        }
    };

    const logoutUser = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const value = {
        user,
        token,
        loading,
        authLoading,
        registerUser,
        loginUser,
        verifyEmail,
        forgotPassword,
        resetPassword,
        logoutUser,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
