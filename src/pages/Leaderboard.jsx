import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/store';

// Use environment variable for API URL (Mobile support), fallback to production if missing
const API_URL = import.meta.env.VITE_API_URL || 'https://gymtics.onrender.com/api';

const Leaderboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [leaders, setLeaders] = useState([]);
    const [userRank, setUserRank] = useState(null); // New state for user's specific rank
    const [loading, setLoading] = useState(true);
    const tableRef = React.useRef(null);
    const [footerStyle, setFooterStyle] = useState({});

    // Sync Footer width/pos with Table
    React.useLayoutEffect(() => {
        const updateStyle = () => {
            if (tableRef.current) {
                const rect = tableRef.current.getBoundingClientRect();
                setFooterStyle({
                    width: `${rect.width}px`,
                    left: `${rect.left}px`,
                    transform: 'none', // Remove center transform
                    bottom: '80px'
                });
            }
        };

        updateStyle();
        window.addEventListener('resize', updateStyle);
        return () => window.removeEventListener('resize', updateStyle);
    }, [leaders, loading]); // Update when content changes might affect layout

    useEffect(() => {
        if (user) {
            fetchLeaderboard();
        }
    }, [user]);

    const [error, setError] = useState(null);

    const fetchLeaderboard = async () => {
        try {
            // Pass userId to get specific rank if outside top 100
            const res = await fetch(`${API_URL}/leaderboard?userId=${user?.id}`);
            const data = await res.json();
            if (data.success) {
                setLeaders(data.leaderboard);
                setUserRank(data.userRank);
            } else {
                console.error('API Error:', data.error);
                setError(data.error || 'Failed to load data');
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Network Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '140px', paddingTop: '2rem' }}>
            {/* Header */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '3rem' }}>
                <button
                    onClick={() => navigate('/analytics')}
                    className="btn-outline"
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: 'auto',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.85rem',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text-muted)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    ← Back
                </button>
                <h1 className="text-gradient" style={{ margin: 0, textAlign: 'center', fontSize: '2rem', letterSpacing: '-0.5px' }}>
                    Leaderboard
                </h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Loading champions...</div>
            ) : (
                <>
                    <div ref={tableRef} className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 1fr',
                            padding: '15px',
                            background: 'rgba(255,255,255,0.05)',
                            borderBottom: '1px solid var(--glass-border)',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)'
                        }}>
                            <span>#</span>
                            <span>Athlete</span>
                            <span style={{ textAlign: 'center' }}>Gym</span>
                            <span style={{ textAlign: 'center' }}>Wkt</span>
                            <span style={{ textAlign: 'center' }}>Diet</span>
                            <span style={{ textAlign: 'right' }}>Total</span>
                        </div>

                        {leaders.map((leader, index) => (
                            <div key={leader.id} style={{
                                display: 'grid',
                                gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 1fr',
                                padding: '15px',
                                borderBottom: '1px solid rgba(255,255,255,0.02)',
                                alignItems: 'center',
                                background: leader.id === user?.id ? 'rgba(255, 215, 0, 0.1)' : 'transparent'
                            }}>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'white'
                                }}>
                                    {index + 1}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: '#333',
                                        backgroundImage: leader.avatar ? `url(${leader.avatar})` : 'none',
                                        backgroundSize: 'cover',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        flexShrink: 0
                                    }}>
                                        {!leader.avatar && leader.username[0].toUpperCase()}
                                    </div>
                                    <span style={{
                                        fontWeight: leader.id === user?.id ? 'bold' : 'normal',
                                        color: leader.id === user?.id ? 'var(--primary)' : 'white',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {leader.username}
                                    </span>
                                </div>
                                <span style={{ textAlign: 'center', color: '#4ade80' }}>+{leader.gymScore}</span>
                                <span style={{ textAlign: 'center', color: '#60a5fa' }}>+{leader.workoutScore}</span>
                                <span style={{ textAlign: 'center', color: '#facc15' }}>+{leader.dietScore}</span>
                                <span style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>{leader.totalScore}</span>
                            </div>
                        ))}

                        {leaders.length === 0 && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                {error ? (
                                    <span style={{ color: '#ff4444' }}>Error: {error}</span>
                                ) : (
                                    'No data yet. Be the first to verify consistency!'
                                )}
                            </div>
                        )}
                    </div>

                    {/* Fixed User Position Footer */}
                    {userRank && (
                        <div style={{
                            position: 'fixed',
                            ...footerStyle,
                            background: '#1a1a1a',
                            border: '1px solid var(--primary)',
                            borderRadius: '12px',
                            padding: '0',
                            boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '50px 2fr 1fr 1fr 1fr 1fr',
                                padding: '15px',
                                alignItems: 'center',
                                background: 'rgba(255, 215, 0, 0.1)'
                            }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                    #{userRank.rank}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: '#333',
                                        backgroundImage: userRank.avatar ? `url(${userRank.avatar})` : 'none',
                                        backgroundSize: 'cover',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        flexShrink: 0
                                    }}>
                                        {!userRank.avatar && userRank.username[0].toUpperCase()}
                                    </div>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: 'var(--primary)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        You
                                    </span>
                                </div>
                                <span style={{ textAlign: 'center', color: '#4ade80' }}>+{userRank.gymScore}</span>
                                <span style={{ textAlign: 'center', color: '#60a5fa' }}>+{userRank.workoutScore}</span>
                                <span style={{ textAlign: 'center', color: '#facc15' }}>+{userRank.dietScore}</span>
                                <span style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>{userRank.totalScore}</span>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Leaderboard;

