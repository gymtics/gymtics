import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/store';

const AuthPages = () => {
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();
    const { login, register, sendOtp, verifyOtp } = useAuth();

    // Registration Steps: 'details' -> 'method' -> 'otp'
    const [regStep, setRegStep] = useState('details');
    const [otpMethod, setOtpMethod] = useState('email'); // Default to email
    const [isForgot, setIsForgot] = useState(false); // New state for Forgot Password

    // Timer State
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });
    const [error, setError] = useState('');

    // Timer Logic
    useEffect(() => {
        let interval;
        if (regStep === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [regStep, timer]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const res = await login(formData.email, formData.password);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setError(res.error || 'Invalid credentials');
        }
    };

    const handleRegisterDetailsSubmit = (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setRegStep('otp'); // Skip method selection, go straight to OTP
        handleMethodSelect('email'); // Auto-trigger email OTP
        setError('');
    };

    const handleMethodSelect = async (method) => {
        setOtpMethod(method);
        setRegStep('otp');
        setTimer(30);
        setCanResend(false);

        const identifier = method === 'sms' ? formData.phone : formData.email;
        // Pass type='register' or 'reset'
        const type = isForgot ? 'reset' : 'register';
        const res = await sendOtp(method, identifier, type);
        if (!res.success) {
            setError(res.error || 'Failed to send OTP');
        }
    };

    const handleResendOtp = async () => {
        setTimer(30);
        setCanResend(false);
        setError('');

        const identifier = otpMethod === 'sms' ? formData.phone : formData.email;
        const type = isForgot ? 'reset' : 'register';
        const res = await sendOtp(otpMethod, identifier, type);
        if (!res.success) {
            setError(res.error || 'Failed to resend OTP');
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        const identifier = otpMethod === 'sms' ? formData.phone : formData.email;

        if (isForgot) {
            // Reset Password Flow
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const res = await fetch(`${apiUrl}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: identifier,
                        otp: formData.otp,
                        newPassword: formData.password
                    })
                });
                const data = await res.json();
                if (data.success) {
                    alert('Password reset successfully! Please login.');
                    resetFlow();
                } else {
                    setError(data.error || 'Failed to reset password');
                }
            } catch (err) {
                setError('Server error');
            }
        } else {
            // Register Flow
            // Verify OTP first
            const verifyRes = await verifyOtp(identifier, formData.otp);

            if (verifyRes.success) {
                // If verified, register the user
                const regRes = await register(formData.username, formData.email, formData.phone, formData.password);
                if (regRes.success) {
                    navigate('/dashboard');
                } else {
                    setError(regRes.error || 'Registration failed');
                }
            } else {
                setError(verifyRes.error || 'Invalid OTP');
            }
        }
    };

    const resetFlow = () => {
        setIsLogin(!isLogin);
        setIsForgot(false);
        setRegStep('details');
        setError('');
        setFormData({
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            otp: ''
        });
    };

    return (
        <div className="full-screen flex-center" style={{
            background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url('/login_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
        }}>
            <div className="glass-panel animate-fade-in auth-card">
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {isLogin ? 'Welcome Back' :
                        isForgot ? 'Reset Password' :
                            regStep === 'details' ? 'Join the Club' :
                                regStep === 'method' ? 'Verify Identity' : 'Enter Code'}
                </h2>

                {/* LOGIN FORM */}
                {isLogin && (
                    <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="form-group">
                            <input
                                type="text"
                                name="email"
                                placeholder="Username or Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {error && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Login</button>
                        <button
                            type="button"
                            onClick={() => { setIsLogin(false); setIsForgot(true); setRegStep('details'); }}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Forgot Password?
                        </button>
                    </form>
                )}

                {/* FORGOT PASSWORD FLOW */}
                {isForgot && !isLogin && (
                    <>
                        {regStep === 'details' && (
                            <form onSubmit={(e) => { e.preventDefault(); handleMethodSelect('email'); }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {error && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                                <button type="submit" className="btn-primary">Send Reset Code</button>
                                <button
                                    type="button"
                                    onClick={resetFlow}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </form>
                        )}
                        {regStep === 'otp' && (
                            <form onSubmit={handleOtpSubmit} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Enter code sent to {formData.email}
                                </p>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="otp"
                                        placeholder="Enter OTP"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        required
                                        style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="New Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Confirm New Password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Resend OTP
                                        </button>
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Resend code in {timer}s
                                        </p>
                                    )}
                                </div>

                                {error && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}

                                <button type="submit" className="btn-primary">Reset Password</button>
                            </form>
                        )}
                    </>
                )}

                {/* REGISTER FLOW */}
                {!isLogin && !isForgot && (
                    <>
                        {/* Step 1: Details */}
                        {regStep === 'details' && (
                            <form onSubmit={handleRegisterDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Phone removed for register, kept in state if needed but hidden */}
                                <div className="form-group">
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Re-enter Password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                {error && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
                                <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Next</button>
                            </form>
                        )}

                        {/* Step 2: Method Selection REMOVED - Auto Email */}

                        {/* Step 3: OTP Input */}
                        {regStep === 'otp' && (
                            <form onSubmit={handleOtpSubmit} className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                    Enter the code sent to your {otpMethod === 'sms' ? 'phone' : 'email'}.
                                </p>
                                <div className="form-group">
                                    <input
                                        type="text"
                                        name="otp"
                                        placeholder="Enter OTP"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        required
                                        style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem' }}
                                    />
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                    {canResend ? (
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Resend OTP
                                        </button>
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            Resend code in {timer}s
                                        </p>
                                    )}
                                </div>

                                {error && <p style={{ color: 'var(--accent)', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}

                                <button type="submit" className="btn-primary">Verify & Register</button>
                                <button
                                    type="button"
                                    onClick={() => setRegStep('details')}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', alignSelf: 'center' }}
                                >
                                    Back
                                </button>
                            </form>
                        )}
                    </>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={resetFlow}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--primary)',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem'
                            }}
                        >
                            {isLogin ? 'Register' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>

        </div>
    );
};

export default AuthPages;
