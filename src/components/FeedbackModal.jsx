import React, { useState } from 'react';
import { useAuth } from '../utils/store';
import { useToast } from './ToastProvider';

const FeedbackModal = ({ onClose }) => {
    const { user } = useAuth();
    const [type, setType] = useState('suggestion');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || '/api';
            const res = await fetch(`${apiUrl}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    type: 'general', // Changed from dynamic 'type' to hardcoded 'general' as per instruction
                    message,
                    rating
                })
            });
            // const data = await res.json(); // This line was removed in the instruction, but the instruction only showed a partial change.
            // Assuming we still want to check res.ok instead of data.success
            if (res.ok) { // Changed from data.success to res.ok
                toast.success('Thank you for your feedback!'); // Replaced alert with toast
                onClose();
            } else {
                toast.error('Failed to submit feedback. Please try again.'); // Replaced alert with toast
            }
        } catch (err) {
            console.error(err);
            toast.error('Error submitting feedback.'); // Replaced alert with toast
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel animate-slide-up" style={{
                width: '90%',
                maxWidth: '500px',
                padding: '2rem',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '1.5rem',
                        cursor: 'pointer'
                    }}
                >
                    ×
                </button>

                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>We Value Your Feedback</h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Type Selection */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Type</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['suggestion', 'bug', 'other'].map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setType(t)}
                                    className={type === t ? 'btn-primary' : 'btn-outline'}
                                    style={{ flex: 1, textTransform: 'capitalize', padding: '8px' }}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Rating</label>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '2rem' }}>
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    onClick={() => setRating(star)}
                                    style={{ cursor: 'pointer', color: star <= rating ? 'var(--accent)' : 'var(--glass-border)' }}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            rows="4"
                            placeholder="Tell us what you think..."
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '1rem',
                                color: 'white',
                                fontSize: '1rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
