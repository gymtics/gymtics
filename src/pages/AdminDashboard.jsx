import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const AdminDashboard = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
            const res = await fetch(`${apiUrl}/feedback`);
            const data = await res.json();
            if (data.success) {
                setFeedbackList(data.feedback);
            }
        } catch (err) {
            console.error('Failed to fetch feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 0', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Admin Dashboard</h1>
                <button onClick={() => navigate('/dashboard')} className="btn-outline">
                    Back to App
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>User Feedback ({feedbackList.length})</h2>

                {loading ? (
                    <p>Loading feedback...</p>
                ) : feedbackList.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No feedback submitted yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {feedbackList.map((item) => (
                            <div key={item.id} style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div>
                                        <span style={{
                                            background: item.type === 'bug' ? '#ff4444' : 'var(--primary)',
                                            color: item.type === 'bug' ? 'white' : 'black',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            marginRight: '10px'
                                        }}>
                                            {item.type}
                                        </span>
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                                            {item.User?.username || 'Unknown'}
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', marginLeft: '10px', fontSize: '0.9rem' }}>
                                            ({item.User?.email})
                                        </span>
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}
                                    </div>
                                </div>

                                <div style={{ marginBottom: '0.5rem' }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <span key={i} style={{ color: i < item.rating ? 'var(--accent)' : 'var(--glass-border)', fontSize: '1.2rem' }}>★</span>
                                    ))}
                                </div>

                                <p style={{ lineHeight: '1.5', color: 'var(--text-main)' }}>
                                    {item.message}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
