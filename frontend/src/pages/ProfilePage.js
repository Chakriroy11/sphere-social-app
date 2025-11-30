import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import postService from '../services/postService';
import userService from '../services/userService';
import Post from '../components/Post';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
// Icons
import { FaArrowLeft, FaSignOutAlt, FaPen, FaCamera, FaTimes, FaHeart, FaComment, FaEnvelope, FaSun, FaMoon, FaVideo, FaCog } from 'react-icons/fa';
import io from 'socket.io-client';

// Connect to LIVE Backend
const socket = io.connect("https://sphere-backend-2mx3.onrender.com");

const ProfilePage = () => {
    const { userId } = useParams();
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme, darkMode } = useContext(ThemeContext);
    const navigate = useNavigate();
    
    // Data States
    const [profileUser, setProfileUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    
    // UI States
    const [editMode, setEditMode] = useState(false);
    const [bio, setBio] = useState("");
    const [file, setFile] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [hoveredPostId, setHoveredPostId] = useState(null);

    const isMyProfile = user && user._id === userId;

    // --- HELPER FUNCTIONS ---

    // 1. Video Detection
    const isVideo = (url) => url && (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm'));

    // 2. URL Helper (Handles Cloudinary vs Local paths)
    const getImgUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path; // It's already a full Cloudinary URL
        return `https://sphere-backend-2mx3.onrender.com${path}`; // Fallback for old local files
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get User Data
                const userRes = await userService.getUser(userId);
                setProfileUser(userRes.data);
                setBio(userRes.data.bio || "");
                setIsFollowing(userRes.data.followers.includes(user?._id));

                // Get User Posts
                const postsRes = await postService.getPostsByUser(userId);
                setPosts(postsRes.data);
            } catch (error) {
                console.error("Error fetching profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId, user._id]);

    // --- HANDLERS ---

    const handleFollow = async () => {
        try {
            await userService.followUser(userId);
            
            // Update local state immediately for UI responsiveness
            setIsFollowing(!isFollowing);
            setProfileUser(prev => ({
                ...prev,
                followers: !isFollowing 
                    ? [...prev.followers, user._id] 
                    : prev.followers.filter(id => id !== user._id)
            }));

            // Send Notification if Following
            if (!isFollowing) {
                await postService.createNotification({
                    sender: user._id,
                    receiver: userId,
                    type: 'follow'
                });
                socket.emit("send_notification", {
                    senderName: user.username,
                    receiverId: userId,
                    type: 'follow'
                });
            }
        } catch (error) { console.error(error); }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("bio", bio);
        if (file) formData.append("profilePic", file);

        try {
            const res = await userService.updateUser(userId, formData);
            setProfileUser(res.data);
            setEditMode(false);
            alert("Profile Updated!");
        } catch (error) { alert("Failed to update profile"); }
    };

    const handleMessage = () => {
        // Unique Room ID logic: Sort IDs alphabetically
        const roomId = [user._id, userId].sort().join("_");
        navigate(`/chat/${roomId}`);
    };

    const removePost = (id) => {
        setPosts(posts.filter(post => post._id !== id));
        setSelectedPost(null);
    };

    if (loading) return <div style={{textAlign: 'center', marginTop: '50px', color: theme.text}}>Loading...</div>;

    const s = styles(theme);

    return (
        <div style={{ paddingBottom: '80px' }}>
            {/* --- HEADER --- */}
            <div style={s.header}>
                <Link to="/" style={{ textDecoration: 'none', color: theme.text }}>
                    <FaArrowLeft size={20} />
                </Link>
                <h3 style={{margin: 0}}>{profileUser.username}</h3>
                <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <button onClick={toggleTheme} style={s.iconBtn}>
                        {darkMode ? <FaSun size={20} color="orange" /> : <FaMoon size={20} />}
                    </button>
                    {isMyProfile && (
                        <>
                            <Link to="/settings" style={s.iconBtn}><FaCog size={20} /></Link>
                            <button onClick={logout} style={s.logoutBtn}><FaSignOutAlt size={20} /></button>
                        </>
                    )}
                </div>
            </div>

            {/* --- PROFILE INFO CARD --- */}
            <div style={s.profileCard}>
                <div style={s.avatarLarge}>
                    {profileUser.profilePic ? (
                        <img 
                            src={getImgUrl(profileUser.profilePic)} 
                            alt="Profile" 
                            style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}} 
                        />
                    ) : (
                        profileUser.username[0].toUpperCase()
                    )}
                </div>

                {editMode ? (
                    // EDIT FORM
                    <form onSubmit={handleUpdateProfile} style={s.editForm}>
                        <label style={s.fileLabel}>
                            <FaCamera /> Change Photo 
                            <input type="file" style={{display: 'none'}} onChange={(e) => setFile(e.target.files[0])} />
                        </label>
                        <textarea 
                            value={bio} 
                            onChange={(e) => setBio(e.target.value)} 
                            placeholder="Write a bio..." 
                            style={s.bioInput} 
                        />
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button type="submit" style={s.saveBtn}>Save</button>
                            <button type="button" onClick={() => setEditMode(false)} style={s.cancelBtn}>Cancel</button>
                        </div>
                    </form>
                ) : (
                    // DISPLAY INFO
                    <>
                        <h2 style={{margin: '10px 0'}}>@{profileUser.username}</h2>
                        <p style={{color: theme.textSecondary, margin: '5px 0'}}>{profileUser.bio || "No bio yet."}</p>
                        
                        <div style={s.stats}>
                            <span><strong>{posts.length}</strong> Posts</span>
                            <span><strong>{profileUser.followers.length}</strong> Followers</span>
                            <span><strong>{profileUser.following.length}</strong> Following</span>
                        </div>

                        {isMyProfile ? (
                            <button onClick={() => setEditMode(true)} style={s.editBtn}>
                                <FaPen size={12} /> Edit Profile
                            </button>
                        ) : (
                            <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                                <button onClick={handleFollow} style={isFollowing ? s.unfollowBtn : s.followBtn}>
                                    {isFollowing ? "Unfollow" : "Follow"}
                                </button>
                                <button onClick={handleMessage} style={s.messageBtn}>
                                    <FaEnvelope /> Message
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* --- POSTS GRID --- */}
            <div style={s.gridContainer}>
                {posts.map(post => (
                    <div 
                        key={post._id} 
                        style={s.gridItem} 
                        onClick={() => setSelectedPost(post)}
                        onMouseEnter={() => setHoveredPostId(post._id)}
                        onMouseLeave={() => setHoveredPostId(null)}
                    >
                        {post.imageUrl ? (
                            // Check if Video or Image
                            isVideo(post.imageUrl) ? (
                                <div style={{position: 'relative', width: '100%', height: '100%'}}>
                                    <video 
                                        src={getImgUrl(post.imageUrl)} 
                                        style={s.gridImage} 
                                        muted 
                                    />
                                    <div style={s.videoIcon}><FaVideo color="white" /></div>
                                </div>
                            ) : (
                                <img 
                                    src={getImgUrl(post.imageUrl)} 
                                    alt="Post" 
                                    style={s.gridImage} 
                                    loading="lazy"
                                />
                            )
                        ) : (
                            <div style={s.textPostPreview}>
                                <p>{post.content.substring(0, 30)}...</p>
                            </div>
                        )}

                        {/* Hover Overlay */}
                        {hoveredPostId === post._id && (
                            <div style={s.hoverOverlay}>
                                <div style={s.hoverStat}><FaHeart size={20} /> <span>{post.likes.length}</span></div>
                                <div style={s.hoverStat}><FaComment size={20} /> <span>{post.comments.length}</span></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {/* --- POST MODAL VIEWER --- */}
            {selectedPost && (
                <div style={s.modalOverlay} onClick={() => setSelectedPost(null)}>
                    <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={s.modalHeader}>
                            <span>Post Details</span>
                            <button onClick={() => setSelectedPost(null)} style={s.closeBtn}>
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <Post post={selectedPost} onDelete={removePost} />
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = (theme) => ({
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, color: theme.text },
    logoutBtn: { backgroundColor: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer' },
    iconBtn: { backgroundColor: 'transparent', color: theme.text, border: 'none', cursor: 'pointer' },
    
    profileCard: { textAlign: 'center', padding: '30px 20px', backgroundColor: theme.cardBg, borderBottom: `1px solid ${theme.border}`, marginBottom: '20px', color: theme.text },
    avatarLarge: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', fontSize: '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 15px auto', border: `3px solid ${theme.bg}` },
    stats: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px', fontSize: '0.9rem' },
    
    followBtn: { backgroundColor: '#0095f6', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    unfollowBtn: { backgroundColor: 'transparent', color: theme.text, border: `1px solid ${theme.border}`, padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' },
    messageBtn: { backgroundColor: theme.inputBg, color: theme.text, border: `1px solid ${theme.border}`, padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    editBtn: { backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}`, padding: '8px 20px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' },
    
    editForm: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' },
    bioInput: { width: '80%', padding: '10px', borderRadius: '5px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text },
    fileLabel: { cursor: 'pointer', color: '#007bff', display: 'flex', alignItems: 'center', gap: '5px' },
    saveBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' },
    cancelBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' },
    
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', maxWidth: '600px', margin: '0 auto' },
    gridItem: { aspectRatio: '1 / 1', backgroundColor: theme.inputBg, cursor: 'pointer', position: 'relative', overflow: 'hidden' },
    gridImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    videoIcon: { position: 'absolute', top: '5px', right: '5px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '5px' },
    textPostPreview: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px', fontSize: '0.8rem', color: theme.textSecondary, textAlign: 'center' },
    
    hoverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', color: 'white', fontWeight: 'bold', fontSize: '1.2rem' },
    hoverStat: { display: 'flex', alignItems: 'center', gap: '5px' },
    
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
    modalContent: { backgroundColor: theme.cardBg, width: '90%', maxWidth: '500px', borderRadius: '10px', padding: '10px', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 10px', color: theme.text },
    closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: theme.text }
});

export default ProfilePage;