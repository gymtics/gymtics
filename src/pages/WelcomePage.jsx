import React from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
    const navigate = useNavigate();

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
                    YOU AND YOUR GOALS
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
                        <a
                            href="/gymtics.apk"
                            download
                            className="btn-outline"
                            style={{
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '10px 20px',
                                color: 'var(--text-muted)',
                                borderColor: 'var(--glass-border)',
                                fontSize: '0.9rem'
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>📱</span> Android
                        </a>

                        <button
                            className="btn-outline"
                            onClick={() => alert("iPhone does not allow downloading apps from websites (unlike Android). We are currently submitting to the Apple App Store. Please check back soon!")}
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
                            <span style={{ fontSize: '1.1rem' }}>🍎</span> iOS
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
