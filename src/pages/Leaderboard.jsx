import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Leaderboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch(`${API_URL}/leaderboard`);
            const data = await res.json();
            if (data.success) {
                setLeaders(data.leaderboard);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '80px', paddingTop: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="btn-outline"
                    style={{ padding: '8px 12px', borderRadius: '50%' }}
                >
                    ←
                </button>
                <h1 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>Leaderboard</h1>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Loading champions...</div>
            ) : (
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 2fr 1fr 1fr 1fr',
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
                        <span style={{ textAlign: 'center' }}>Diet</span>
                        <span style={{ textAlign: 'right' }}>Total</span>
                    </div>

                    {leaders.map((leader, index) => (
                        <div key={leader.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '50px 2fr 1fr 1fr 1fr',
                            padding: '15px',
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                            alignItems: 'center',
                            background: leader.id === user?.id ? 'rgba(255, 215, 0, 0.05)' : 'transparent'
                        }}>
                            <span style={{
                                fontWeight: 'bold',
                                color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'white'
                            }}>
                                {index + 1}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                    fontSize: '0.8rem'
                                }}>
                                    {!leader.avatar && leader.username[0].toUpperCase()}
                                </div>
                                <span style={{ fontWeight: leader.id === user?.id ? 'bold' : 'normal', color: leader.id === user?.id ? 'var(--primary)' : 'white' }}>
                                    {leader.username}
                                </span>
                            </div>
                            <span style={{ textAlign: 'center', color: '#4ade80' }}>+{leader.gymScore}</span>
                            <span style={{ textAlign: 'center', color: '#facc15' }}>+{leader.dietScore}</span>
                            <span style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>{leader.totalScore}</span>
                        </div>
                    ))}

                    {leaders.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No data yet. Be the first to verify consistency!
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
