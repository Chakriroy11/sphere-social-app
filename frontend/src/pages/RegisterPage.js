import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const { register } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(username, email, password);
            navigate('/');
        } catch (error) {
            alert('Registration failed.');
        }
    };

    const s = styles(theme);

    return (
        <div style={s.container}>
            <div style={s.card}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    {/* UPDATED NAME */}
                    <h1 style={s.textLogo}>Sphere</h1>
                    <p style={s.subHeading}>Create an account to join.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={s.input}
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={s.input}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={s.input}
                        required
                    />
                    <button type="submit" style={s.button}>Sign Up</button>
                </form>

                <div style={s.footer}>
                    <p>Already have an account? <Link to="/login" style={s.link}>Log In</Link></p>
                </div>
            </div>
        </div>
    );
};

const styles = (theme) => ({
    container: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.bg,
        padding: '20px'
    },
    card: {
        backgroundColor: theme.cardBg,
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        border: `1px solid ${theme.border}`
    },
    textLogo: {
        margin: '0',
        color: '#007bff',
        fontSize: '2.5rem',
        fontWeight: '800',
        letterSpacing: '-1px'
    },
    subHeading: {
        margin: '10px 0 0 0',
        color: theme.textSecondary,
        fontSize: '0.95rem'
    },
    input: {
        width: '100%',
        padding: '14px',
        marginBottom: '15px',
        borderRadius: '8px',
        border: `1px solid ${theme.border}`,
        backgroundColor: theme.inputBg,
        color: theme.text,
        fontSize: '1rem',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    button: {
        width: '100%',
        padding: '14px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#007bff',
        color: 'white',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)'
    },
    footer: {
        marginTop: '25px',
        color: theme.textSecondary,
        fontSize: '0.9rem'
    },
    link: {
        color: '#007bff',
        textDecoration: 'none',
        fontWeight: 'bold'
    }
});

export default RegisterPage;