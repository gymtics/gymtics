import React from 'react';

const DonationModal = ({ onClose }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                padding: '2rem',
                borderRadius: 'var(--radius-md)',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                position: 'relative',
                animation: 'slideUp 0.3s ease'
            }} onClick={e => e.stopPropagation()}>

                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '1.5rem',
                        cursor: 'pointer'
                    }}
                >
                    &times;
                </button>

                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
                <h2 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Support Development</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    If you enjoy using this app and want to support its maintenance and future features, consider buying me a coffee! ☕
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <a
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                            background: '#FFDD00',
                            color: 'black',
                            fontWeight: 'bold'
                        }}
                    >
                        <span>☕</span> Buy Me a Coffee
                    </a>

                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: '1rem'
                    }}>
                        {/* Placeholder for QR Code */}
                        <div style={{
                            width: '150px',
                            height: '150px',
                            background: '#f0f0f0',
                            margin: '0 auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#888',
                            fontSize: '0.8rem',
                            border: '2px dashed #ccc'
                        }}>
                            QR Code Placeholder
                        </div>
                        <p style={{ color: 'black', margin: '10px 0 0 0', fontSize: '0.9rem', fontWeight: 'bold' }}>UPI / PayPal</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DonationModal;
