import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-page">
            <header className="landing-header">
                <div className="container">
                    <div className="logo">SYLO</div>
                    <nav className="landing-nav">
                        <Link to="/login">Login</Link>
                        <Link to="/register" className="btn btn-primary">Get Started</Link>
                    </nav>
                </div>
            </header>

            <main className="landing-main">
                <section className="hero">
                    <div className="container">
                        <h1>One Team. One Direction.</h1>
                        <p className="subtitle">
                            Collaborate on projects, manage tasks, and track progress with SYLO
                        </p>
                        <div className="hero-buttons">
                            <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
                            <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
                        </div>
                    </div>
                </section>

                <section className="features">
                    <div className="container">
                        <h2>Why Choose SYLO?</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <h3>Easy Collaboration</h3>
                                <p>Add team members by username and start collaborating instantly</p>
                            </div>
                            <div className="feature-card">
                                <h3>Project Management</h3>
                                <p>Create projects, track progress, and manage deadlines efficiently</p>
                            </div>
                            <div className="feature-card">
                                <h3>Task Assignment</h3>
                                <p>Assign multiple team members to tasks and track completion status</p>
                            </div>
                            <div className="feature-card">
                                <h3>Real-time Updates</h3>
                                <p>Get instant notifications about project changes and deadlines</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <p>&copy; 2026 SYLO. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
