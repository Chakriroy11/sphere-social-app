import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check local storage for saved preference
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
    };

    // Define Colors
    const theme = darkMode ? {
        bg: '#18191a',           // Very Dark Grey (Facebook Dark)
        cardBg: '#242526',       // Slightly lighter
        text: '#e4e6eb',         // Almost White
        textSecondary: '#b0b3b8',// Light Grey
        border: '#393a3d',       // Dark Border
        navBg: '#242526',
        inputBg: '#3a3b3c'
    } : {
        bg: '#f0f2f5',           // Light Grey
        cardBg: '#ffffff',       // White
        text: '#050505',         // Black
        textSecondary: '#65676b',// Grey
        border: '#dbdbdb',       // Light Border
        navBg: '#ffffff',
        inputBg: '#f0f2f5'
    };

    return (
        <ThemeContext.Provider value={{ darkMode, toggleTheme, theme }}>
            {children}
        </ThemeContext.Provider>
    );
};