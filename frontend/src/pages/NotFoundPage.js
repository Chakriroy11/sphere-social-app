import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const NotFoundPage = () => {
    const { theme } = useContext(ThemeContext);

    const s = {
        container: {
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: theme.text,
            textAlign: 'center',
            padding: '20px'
        },
        h1: { fontSize: '6rem', margin: 0, color: '#007bff', fontWeight: '900' },
        h2: { fontSize: '2rem', margin: '10px 0' },
        p: { fontSize: '1.1rem', marginTop: '10px', color: theme.textSecondary },
        btn: {
            marginTop: '30px',
            padding: '12px 25px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '30px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0,123,255,0.3)',
            transition: 'transform 0.2s'
        }
    };

    return (
        <div style={s.container}>
            <h1 style={s.h1}>404</h1>
            <h2 style={s.h2}>Page Not Found</h2>
            <p style={s.p}>Oops! The page you are looking for does not exist.</p>
            <Link to="/" style={s.btn}>Go Back Home</Link>
        </div>
    );
};

export default NotFoundPage;