import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000, onConfirm = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, onConfirm }]);

        if (!onConfirm) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
        confirm: (msg, onConfirm) => addToast(msg, 'confirm', 0, onConfirm)
    };

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            <div style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none' // Allow clicking through container
            }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        pointerEvents: 'auto',
                        background: toast.type === 'error' ? 'rgba(255, 68, 68, 0.9)' :
                            toast.type === 'success' ? 'rgba(74, 222, 128, 0.9)' :
                                toast.type === 'confirm' ? 'rgba(30, 30, 30, 0.95)' :
                                    'rgba(50, 50, 50, 0.9)',
                        color: 'white',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        minWidth: '250px',
                        maxWidth: '350px',
                        animation: 'slideIn 0.3s ease-out',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{toast.message}</span>
                            {!toast.onConfirm && (
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '1.2rem' }}
                                >
                                    &times;
                                </button>
                            )}
                        </div>

                        {toast.type === 'confirm' && (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        toast.onConfirm();
                                        removeToast(toast.id);
                                    }}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'var(--primary, #4ade80)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'black',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Confirm
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
