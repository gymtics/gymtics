import React, { useState, useEffect, useRef } from 'react';

const RestTimer = () => {
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const timerRef = useRef(null);
    const audioRef = useRef(new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg'));

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            audioRef.current.play().catch(e => console.log('Audio play failed', e));
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }

        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const startTimer = (seconds) => {
        setTimeLeft(seconds);
        setIsActive(true);
        setIsMinimized(false);
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(0);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (isMinimized && timeLeft === 0 && !isActive) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="btn-primary"
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    zIndex: 1000
                }}
            >
                ⏱️
            </button>
        )
    }

    return (
        <div className="glass-panel" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '1rem',
            zIndex: 1000,
            width: isMinimized ? 'auto' : '280px',
            transition: 'all 0.3s ease',
            border: '1px solid var(--primary)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMinimized ? 0 : '1rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ⏱️ {timeLeft > 0 ? formatTime(timeLeft) : 'Rest Timer'}
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        {isMinimized ? '🔼' : '🔽'}
                    </button>
                    {!isMinimized && (
                        <button
                            onClick={() => setIsActive(false)} // Just close/hide if needed, but here we just minimize logic
                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {!isMinimized && (
                <div className="animate-fade-in">
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', justifyContent: 'center' }}>
                        {[30, 60, 90, 120].map(sec => (
                            <button
                                key={sec}
                                onClick={() => startTimer(sec)}
                                className="btn-outline"
                                style={{ padding: '5px 10px', fontSize: '0.8rem', borderColor: timeLeft === sec ? 'var(--primary)' : 'var(--glass-border)' }}
                            >
                                {sec}s
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={toggleTimer}
                            className="btn-primary"
                            style={{ flex: 1, background: isActive ? 'var(--accent)' : 'var(--primary)' }}
                        >
                            {isActive ? 'Pause' : 'Start'}
                        </button>
                        <button onClick={resetTimer} className="btn-outline" style={{ flex: 1 }}>
                            Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestTimer;
