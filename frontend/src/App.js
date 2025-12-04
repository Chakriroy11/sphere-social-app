import React, { useContext, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Lazy Load Pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HashtagPage = lazy(() => import('./pages/HashtagPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ✅ LIVE SOCKET CONNECTION
const socket = io.connect("https://sphere-backend-2mx3.onrender.com");

const PageLoader = () => (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#007bff'}}>
        <h3>Loading Sphere...</h3>
    </div>
);

const RequireAuth = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <AppRoutes />
            </ThemeProvider>
        </AuthProvider>
    );
}

const AppRoutes = () => {
    const { user, setOnlineUsers } = useContext(AuthContext);
    const { theme, darkMode } = useContext(ThemeContext);

    useEffect(() => {
        if (user) {
            socket.emit("add_user", user._id);
            socket.emit("join_user_room", user._id);
            socket.on("get_users", (users) => setOnlineUsers(users));
            socket.on("get_notification", (data) => {
                toast.info(`🔔 ${data.senderName} ${data.type}ed you!`);
            });
        }
    }, [user, setOnlineUsers]);

    return (
        <div style={{ backgroundColor: theme.bg, minHeight: '100vh', color: theme.text }}>
            <ToastContainer position="top-right" autoClose={3000} theme={darkMode ? "dark" : "light"} />
            
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
                    <Route path="/profile/:userId" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                    <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
                    <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                    <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
                    <Route path="/chat/:roomId?" element={<RequireAuth><ChatPage /></RequireAuth>} />
                    <Route path="/tags/:tag" element={<RequireAuth><HashtagPage /></RequireAuth>} />
                    
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </div>
    );
};

export default App;