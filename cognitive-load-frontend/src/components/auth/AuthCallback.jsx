import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('Verifying...');

    useEffect(() => {
        // Check for errors in the hash/query params
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const errorDescription = params.get('error_description');

        if (errorDescription) {
            setMessage(`Error: ${errorDescription.replace(/\+/g, ' ')}`);
        } else {
            setMessage('Email verified successfully! You can now log in.');
            // Auto-redirect to login after a short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    }, [navigate]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#121212',
            color: '#fff'
        }}>
            <div style={{
                padding: '2rem',
                background: '#1e1e1e',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                maxWidth: '400px',
                width: '90%'
            }}>
                <h2 style={{ marginBottom: '1rem', color: '#e0e0e0' }}>
                    Email Verification
                </h2>

                <p style={{ marginBottom: '1.5rem', color: '#aaa' }}>{message}</p>

                <button
                    onClick={() => navigate('/login')}
                    style={{
                        padding: '10px 20px',
                        background: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.background = '#2980b9'}
                    onMouseOut={(e) => e.target.style.background = '#3498db'}
                >
                    Go to Login
                </button>
            </div>
        </div>
    );
};

export default AuthCallback;
