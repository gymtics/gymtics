import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../utils/store';

const Chatbot = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm your Gymtics Coach. Ask me about diet plans, workouts, or any gym questions!", sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { text: input, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Prepare history (last 10 messages) for context
            const history = messages.slice(-10).map(m => ({
                role: m.sender === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    history: history,
                    userId: user?.id
                })
            });
            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, { text: data.reply, sender: 'bot' }]);
            } else {
                setMessages(prev => [...prev, { text: "Sorry, I encountered an error. Please try again.", sender: 'bot' }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { text: "Network error. Please check your connection.", sender: 'bot' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '25px', // Adjusted for slightly better spacing
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#000',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0,255,136, 0.4)',
                    zIndex: 1000,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '1.5rem',
                    transition: 'transform 0.3s ease'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '25px',
                    width: '350px',
                    height: '500px',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    animation: 'slideUp 0.3s ease-out' // Assume slideUp exists or default to none
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '15px',
                        background: 'rgba(0,0,0,0.4)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>🤖</div>
                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>Gymtics AI Coach</h3>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        padding: '15px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.sender === 'user' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                color: msg.sender === 'user' ? '#000' : '#eee',
                                padding: '10px 15px',
                                borderRadius: '15px',
                                maxWidth: '80%',
                                fontSize: '0.9rem',
                                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '15px',
                                borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '15px'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', paddingLeft: '10px' }}>
                                Typing...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} style={{
                        padding: '10px',
                        borderTop: '1px solid var(--glass-border)',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about diet, workout..."
                            style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '20px',
                                padding: '10px 15px',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                        <button type="submit" disabled={loading} style={{
                            background: 'var(--primary)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: loading ? 0.7 : 1
                        }}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default Chatbot;
