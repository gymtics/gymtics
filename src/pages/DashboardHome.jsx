import React, { useRef, useState } from 'react';
import { useAuth, useData } from '../utils/store';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import DonationModal from '../components/DonationModal';
import FeedbackModal from '../components/FeedbackModal';
import { format } from 'date-fns';
import { useToast } from '../components/ToastProvider';

const DashboardHome = () => {
    const { user, logout, updateAvatar } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const { history } = useData();
    const [showDonation, setShowDonation] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isProcessing, setIsProcessing] = useState(false);
    const toast = useToast();

    const handleRemoveAvatar = () => {
        updateAvatar(null);
        setShowProfileMenu(false);
    };

    const handleUpdateClick = () => {
        fileInputRef.current.click();
        setShowProfileMenu(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const resizeImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG 70%
                };
                img.onerror = () => {
                    toast.error("Error: Failed to load image data.");
                    resolve(null);
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                toast.error("Error: Failed to read file.");
                resolve(null);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsProcessing(true);
        let fileToProcess = file;

        // Check for HEIC/HEIF
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
            try {
                // Timeout Promise
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("HEIC conversion timed out")), 10000)
                );

                const heic2any = (await import('heic2any')).default;

                // Race between conversion and timeout
                const convertedBlob = await Promise.race([
                    heic2any({
                        blob: file,
                        toType: 'image/jpeg',
                        quality: 0.8
                    }),
                    timeout
                ]);

                // Handle array return (if multiple images in HEIC)
                fileToProcess = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
            } catch (err) {
                console.error("HEIC conversion failed:", err);
                toast.error("Could not convert HEIC image. Please try a standard JPEG/PNG.");
                setIsProcessing(false);
                return;
            }
        }

        try {
            const resizedImage = await resizeImage(fileToProcess);

            if (!resizedImage) {
                toast.error("Failed to process image.");
                setIsProcessing(false);
                return;
            }

            await updateAvatar(resizedImage);
            setIsProcessing(false);
            toast.success("Profile picture updated!");
        } catch (err) {
            console.error("Image processing failed:", err);
            toast.error("Failed to process image: " + err.message);
            setIsProcessing(false);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        const dateStr = format(date, 'yyyy-MM-dd');
        navigate(`/dashboard/${dateStr}`);
    };

    return (
        <div className="container" style={{
            paddingBottom: '4rem',
            minHeight: '100vh',
            background: `linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url('/schedule_creative_bg.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
        }}>
            {/* Header */}
            <header className="mobile-stack" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '2rem 0',
                marginBottom: '2rem'
            }}>
                <div className="flex-center" style={{ gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: '2px solid var(--primary)',
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.5rem' }}>👤</span>
                                </div>
                            )}
                        </div>

                        {showProfileMenu && (
                            <div className="glass-panel animate-fade-in" style={{
                                position: 'absolute',
                                top: '70px',
                                left: 0,
                                minWidth: '150px',
                                padding: '0.5rem',
                                zIndex: 100,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem'
                            }}>
                                <button
                                    onClick={handleUpdateClick}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '8px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                    className="hover-bg"
                                >
                                    Update Image
                                </button>
                                {user?.avatar && (
                                    <button
                                        onClick={handleRemoveAvatar}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--accent)',
                                            padding: '8px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                        className="hover-bg"
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>
                        )}

                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*, .heic, .heif"
                            onChange={handleAvatarUpload}
                        />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>Hello, <span className="text-gradient">{user?.username || 'User'}</span></h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{new Date().toDateString()}</p>
                    </div>
                </div>
                <button className="btn-outline" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '0.9rem', borderColor: '#ff4444', color: '#ff4444' }}>
                    Logout
                </button>
            </header>

            {/* Calendar View */}
            <div className="animate-fade-in">
                <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Your Schedule</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setShowDonation(true)}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#4ade80', color: '#4ade80' }}
                        >
                            Donate
                        </button>
                        <button
                            onClick={() => navigate('/analytics')}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#4ade80', color: '#4ade80' }}
                        >
                            Analytics
                        </button>
                        <button
                            onClick={() => setShowFeedback(true)}
                            className="btn-outline"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                        >
                            Feedback
                        </button>
                    </div>
                </div>
                <Calendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    gymHistory={history}
                />
            </div>
            {showDonation && <DonationModal onClose={() => setShowDonation(false)} />}
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

            {/* Processing Overlay */}
            {isProcessing && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="spinner" style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid rgba(255,255,255,0.3)',
                        borderTop: '4px solid var(--primary)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        marginBottom: '1rem'
                    }}></div>
                    <p style={{ color: 'white', fontSize: '1.1rem' }}>Processing Image...</p>
                </div>
            )}
        </div>
    );
};

export default DashboardHome;
