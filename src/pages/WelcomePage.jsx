import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/store';

const WelcomePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    return (
        <div className="full-screen flex-center" style={{
            background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
        }}>
            <div className="container" style={{ textAlign: 'center', zIndex: 2 }}>
                <img src="/logo.png" alt="Gymtics Logo" className="animate-fade-in" style={{ width: '120px', height: '120px', marginBottom: '1rem', borderRadius: '50%', border: '2px solid var(--primary)' }} />
                <h1 className="animate-slide-up" style={{ marginBottom: '0.5rem' }}>
                    WELCOME TO <span className="text-gradient">GYMTICS</span>
                </h1>
                <h2 className="animate-slide-up" style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'var(--primary)',
                    marginBottom: '2rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    animationDelay: '0.1s'
                }}>
                    ME AND MY GOALS
                </h2>
                <p className="animate-slide-up" style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-muted)',
                    marginBottom: '3rem',
                    animationDelay: '0.2s'
                }}>
                    Track your workouts, nutrition, and daily goals in one premium space.
                </p>

                <div className="animate-slide-up" style={{ animationDelay: '0.4s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <button
                        className="btn-primary"
                        onClick={() => navigate('/auth')}
                        style={{ padding: '16px 48px', fontSize: '1.2rem', width: '100%', maxWidth: '300px' }}
                    >
                        Get Started (Web)
                    </button>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            className="btn-outline"
                            onClick={() => alert("Coming soon to the Google Play Store")}
                            style={{
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '10px 20px',
                                color: 'var(--text-muted)',
                                borderColor: 'var(--glass-border)',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>📱</span> Android
                        </button>

                        <button
                            className="btn-outline"
                            onClick={() => alert("Coming soon to the Apple App Store")}
                            style={{
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '10px 20px',
                                color: 'var(--text-muted)',
                                borderColor: 'var(--glass-border)',
                                background: 'transparent',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <svg viewBox="0 0 384 512" style={{ width: '1.1rem', height: '1.1rem', fill: 'currentColor' }}>
                                <path d="M170.4 220.1c-15.3 0-33.6-7.3-51.7-7.3-26.7 0-54.8 14.8-71.6 44.8-30.8 53.6-8.2 133.3 21.8 177.3 15 21.6 32.7 45.7 57.7 44.7 22.8-.9 31.6-15 59.8-15 27.6 0 35.8 15 59.8 14.5 24.6-.5 40.5-22.3 55.4-44.7 17.3-25.2 24.1-49.8 24.5-51-.5-.5-47.3-18.1-47.3-71 0-44.5 36.2-65.7 38-66.8-21.1-30.8-54-34.3-65.4-34.6-28.7-.7-56.3 17.1-70.9 17.1zm-8.8-49.8c12.3-15.1 20.6-36.1 18.3-57.1-17.8.8-39.5 11.9-52.3 26.9-11.5 13.3-21.5 34.9-18.8 55.7 19.8 1.5 40.2-9.9 52.8-25.5z" />
                            </svg> iOS
                        </button>
                    </div>
                </div>
            </div>

            {/* Decorative Elements */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '150px',
                background: 'linear-gradient(to top, var(--bg-dark), transparent)'
            }} />
        </div>
    );
};

export default WelcomePage;
