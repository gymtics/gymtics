import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../utils/store';
import { format } from 'date-fns';

const GlobalChat = () => {
    const { user } = useAuth();

    // Only show if user is logged in
    if (!user) return null;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false); // Toggle like the chatbot

    const [isConnected, setIsConnected] = useState(false); // Connection status

    // Initialize Socket
    useEffect(() => {
        // ... (existing code)
        const newSocket = io('/', {
            path: '/socket.io/',
            autoConnect: false,
            transports: ['websocket', 'polling'] // Explicitly enable both
        });

        setSocket(newSocket);
        return () => newSocket.close();
    }, []);

    // Handle Socket Events
    useEffect(() => {
        if (!socket) return;
        if (!isOpen) {
            socket.disconnect();
            return;
        }

        socket.connect();

        // Debugging Events
        socket.on('connect', () => {
            console.log('[GlobalChat] Connected:', socket.id);
            setIsConnected(true);
            socket.emit('join_global');
        });

        socket.on('connect_error', (err) => {
            console.error('[GlobalChat] Connection Error:', err);
            setIsConnected(false);
        });

        socket.on('disconnect', () => {
            console.log('[GlobalChat] Disconnected');
            setIsConnected(false);
        });

        socket.on('message_error', (err) => {
            console.error('[GlobalChat] Message Error:', err);
            alert(`Message failed: ${err.details || err.error}`);
        });

        socket.on('receive_history', (history) => {
            console.log('[GlobalChat] History received:', history.length);
            setMessages(history);
            scrollToBottom();
        });

        socket.on('receive_message', (message) => {
            console.log('[GlobalChat] Message received:', message);
            setMessages((prev) => [...prev, message]);
            scrollToBottom();
        });

        return () => {
            socket.off('connect');
            socket.off('connect_error');
            socket.off('disconnect');
            socket.off('message_error');
            socket.off('receive_history');
            socket.off('receive_message');
        };
    }, [socket, isOpen]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        const messageData = {
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            text: input
        };

        console.log('[GlobalChat] Sending:', messageData);

        // Emit with Acknowledgement
        socket.emit('send_message', messageData, (response) => {
            console.log('[GlobalChat] Server Acknowledgment:', response);
            if (response.status !== 'ok') {
                alert(`Error sending message: ${response.error}`);
            }
        });

        setInput('');
    };

    return (
        <>
            {/* Floating Action Button (Left side to avoid conflict with Chatbot) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#FF4C4C', // Distinct color
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(255, 76, 76, 0.4)',
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
                title="Global Community Chat"
            >
                {isOpen ? '✕' : '🌍'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'fixed',
                    bottom: '90px',
                    left: '20px',
                    width: '350px',
                    height: '500px',
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000,
                    overflow: 'hidden',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    background: 'rgba(20, 20, 20, 0.95)', // Darker background
                    backdropFilter: 'blur(10px)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(90deg, #FF4C4C, #C62828)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.2rem' }}>🌍</span>
                            <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>Community Chat</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isConnected ? '#4ade80' : '#ff4444',
                                boxShadow: isConnected ? '0 0 5px #4ade80' : 'none'
                            }} />
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                                {isConnected ? 'Live' : 'Connecting...'}
                            </span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div style={{
                        flex: 1,
                        padding: '15px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px'
                    }}>
                        {messages.map((msg, idx) => {
                            const isMe = user?.id === msg.userId;
                            return (
                                <div key={idx} style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start'
                                }}>
                                    {!isMe && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#aaa',
                                            marginBottom: '2px',
                                            marginLeft: '5px'
                                        }}>
                                            {msg.username}
                                        </span>
                                    )}
                                    <div style={{
                                        background: isMe ? '#FF4C4C' : 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        padding: '8px 12px',
                                        borderRadius: '15px',
                                        fontSize: '0.9rem',
                                        borderBottomRightRadius: isMe ? '2px' : '15px',
                                        borderBottomLeftRadius: !isMe ? '2px' : '15px',
                                        wordBreak: 'break-word'
                                    }}>
                                        {msg.text}
                                    </div>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        color: 'rgba(255,255,255,0.4)',
                                        marginTop: '2px',
                                        marginRight: isMe ? '5px' : '0',
                                        marginLeft: !isMe ? '5px' : '0'
                                    }}>
                                        {format(new Date(msg.timestamp || msg.createdAt), 'h:mm a')}
                                    </span>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px',
                                padding: '10px 15px',
                                color: '#fff',
                                outline: 'none'
                            }}
                        />
                        <button type="submit" disabled={!input.trim()} style={{
                            background: input.trim() ? '#FF4C4C' : 'rgba(255,255,255,0.1)', // Active/Inactive color
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: input.trim() ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.3s'
                        }}>
                            ➤
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default GlobalChat;
