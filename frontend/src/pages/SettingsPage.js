import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { FaArrowLeft, FaLock, FaTrash } from 'react-icons/fa';
// Import Toast
import { toast } from 'react-toastify';

const SettingsPage = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const handleChangePassword = async (e) => {
        e.preventDefault();
        try {
            await userService.changePassword(user._id, { currentPassword, newPassword });
            // SUCCESS TOAST
            toast.success("Password updated successfully! 🔒");
            setCurrentPassword("");
            setNewPassword("");
        } catch (error) {
            // ERROR TOAST
            toast.error(error.response?.data || "Failed to update password");
        }
    };

    const handleDeleteAccount = async () => {
        // We keep window.confirm because deleting is dangerous and needs a hard stop
        if (window.confirm("Are you SURE? This cannot be undone.")) {
            try {
                await userService.deleteAccount(user._id);
                toast.info("Account deleted. Goodbye! 👋");
                logout();
                navigate('/login');
            } catch (error) {
                toast.error("Failed to delete account");
            }
        }
    };

    const s = styles(theme);

    return (
        <div style={s.container}>
            <div style={s.header}>
                <Link to={`/profile/${user._id}`} style={{color: theme.text}}><FaArrowLeft size={20}/></Link>
                <h3 style={{marginLeft: '15px', margin: 0}}>Settings</h3>
            </div>

            <div style={s.section}>
                <h4 style={s.sectionTitle}><FaLock style={{marginRight: '10px'}}/> Change Password</h4>
                <form onSubmit={handleChangePassword} style={s.form}>
                    <input 
                        type="password" 
                        placeholder="Current Password" 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        style={s.input} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        style={s.input} 
                        required 
                    />
                    <button type="submit" style={s.saveBtn}>Update Password</button>
                </form>
            </div>

            <div style={{...s.section, borderBottom: 'none'}}>
                <h4 style={{...s.sectionTitle, color: '#ff4444'}}><FaTrash style={{marginRight: '10px'}}/> Danger Zone</h4>
                <p style={{color: theme.textSecondary, fontSize: '0.9rem'}}>Once you delete your account, there is no going back. Please be certain.</p>
                <button onClick={handleDeleteAccount} style={s.deleteBtn}>Delete Account</button>
            </div>
        </div>
    );
};

const styles = (theme) => ({
    container: { maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: theme.bg, color: theme.text },
    header: { display: 'flex', alignItems: 'center', padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.cardBg },
    section: { padding: '20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, marginTop: '10px' },
    sectionTitle: { display: 'flex', alignItems: 'center', marginBottom: '15px', marginTop: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '10px' },
    input: { padding: '12px', borderRadius: '5px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, outline: 'none' },
    saveBtn: { padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    deleteBtn: { padding: '12px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', width: '100%', marginTop: '10px' }
});

export default SettingsPage;