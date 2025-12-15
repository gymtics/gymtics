import React, { useRef, useState } from 'react';
import { useAuth, useData } from '../utils/store';
import { useNavigate } from 'react-router-dom';

import Calendar from '../components/Calendar';
import DonationModal from '../components/DonationModal';
import FeedbackModal from '../components/FeedbackModal';
import { format } from 'date-fns';
import { useToast } from '../components/ToastProvider';

import CropModal from '../components/CropModal';

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
    const [imageToCrop, setImageToCrop] = useState(null); // State for cropper
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

    // Called when user selects a file from input
    const onFileSelect = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            // Basic validation
            if (!file.type.startsWith('image/')) {
                toast.error("Please select an image file.");
                return;
            }

            // Convert to Base64 to show in Cropper
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageToCrop(reader.result);
                // Clear input so same file can be selected again if needed
                e.target.value = null;
            });
            reader.readAsDataURL(file);
        }
    };

    // Called when user clicks "Set Profile Picture" in Cropper
    const onCropConfirm = async (croppedImageBase64) => {
        try {
            setIsProcessing(true);
            setImageToCrop(null); // Close modal

            // Upload the cropped base64 string
            // updateAvatar expects { avatar: dataUrl } logic usually, or just the string if simplified
            // Checking logic: updateAvatar calls API with { userId, avatar }
            await updateAvatar(croppedImageBase64);
            toast.success("Profile picture updated!");

        } catch (error) {
            console.error("Avatar Update Failed:", error);
            toast.error("Failed to update profile picture.");
        } finally {
            setIsProcessing(false);
        }
    };

    const onCropCancel = () => {
        setImageToCrop(null);
        setIsProcessing(false);
    };

    // ORIGINAL handleAvatarUpload REMOVED/REPLACED by onFileSelect + onCropConfirm flow
    // Reuse resize logic if needed, but Cropper returns resized canvas usually.


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

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*,.heic,.heif"
                            onChange={onFileSelect}
                        />

                        {/* Cropper Modal */}
                        {imageToCrop && (
                            <CropModal
                                imageSrc={imageToCrop}
                                onCancel={onCropCancel}
                                onCropComplete={onCropConfirm}
                            />
                        )}
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
