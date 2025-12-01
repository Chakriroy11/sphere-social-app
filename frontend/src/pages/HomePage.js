import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import postService from '../services/postService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import Post from '../components/Post';
import CreatePost from '../components/CreatePost';
import { FaHome, FaUser, FaSearch, FaCommentDots, FaPlusSquare, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [stories, setStories] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewStory, setViewStory] = useState(null);
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    const fileInputRef = useRef(null);

    // --- URL HELPER (PERMANENT FIX) ---
    const getImgUrl = (path) => {
        if (!path) return "";
        // 1. Cloudinary: Force HTTPS
        if (path.startsWith('http')) {
            return path.replace('http:', 'https:');
        }
        // 2. Fallback for old Render disk files
        return `https://sphere-backend-2mx3.onrender.com${path}`;
    };

    // Initial Data Fetch
    const fetchData = async () => {
        setLoading(true);
        try {
            const [postsRes, storiesRes, notifRes] = await Promise.all([
                postService.getPosts(1),
                postService.getStories(),
                postService.getNotifications()
            ]);
            
            setPosts(postsRes.data);
            setStories(storiesRes.data);
            setUnreadCount(notifRes.data.length);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    // Infinite Scroll Fetch
    const fetchMorePosts = async () => {
        if (!hasMore) return;
        try {
            const nextPage = page + 1;
            const res = await postService.getPosts(nextPage);
            
            if (res.data.length === 0) {
                setHasMore(false);
            } else {
                setPosts(prev => [...prev, ...res.data]);
                setPage(nextPage);
            }
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchData();
        const handleScroll = () => {
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 50) {
                fetchMorePosts();
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleStoryUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            await postService.addStory(file);
            const storiesRes = await postService.getStories();
            setStories(storiesRes.data);
            toast.success("Story added successfully! 📸");
        } catch (error) {
            toast.error("Failed to upload story");
        }
    };

    const removePost = (id) => {
        setPosts(posts.filter(post => post._id !== id));
        toast.info("Post deleted.");
    };

    const handlePostCreated = () => {
        setPage(1);
        setHasMore(true);
        fetchData(); 
        setIsModalOpen(false);
        toast.success("Post created! 🚀");
    };

    const myStories = stories.filter(s => s.user._id === user?._id);
    const otherStories = stories.filter(s => s.user._id !== user?._id);
    const s = styles(theme);

    return (
        <div style={s.mainContainer}>
            {/* Header */}
            <div style={s.header}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: theme.text }}>Sphere</h2>
                <Link to="/chat" style={{ textDecoration: 'none', color: '#007bff', display: 'flex', alignItems: 'center' }}>
                    <FaCommentDots size={28} />
                </Link>
            </div>

            {loading ? (
                <div style={{textAlign:'center', padding:'50px', color:'#007bff'}}><h2>Loading...</h2></div>
            ) : (
                <>
                    {/* Stories */}
                    <div style={s.storiesContainer}>
                        {/* My Story */}
                        <div style={s.storyItem}>
                            <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*,video/*" onChange={handleStoryUpload} />
                            {myStories.length > 0 ? (
                                <div style={{position: 'relative'}}>
                                    <div style={s.myStoryActive} onClick={() => setViewStory(myStories[0])}>
                                        <img src={getImgUrl(myStories[0].imageUrl)} alt="My Story" style={s.storyThumbnail} />
                                    </div>
                                    <div style={s.addBadge} onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>+</div>
                                </div>
                            ) : (
                                <div style={s.myStoryCircle} onClick={() => fileInputRef.current.click()}>
                                    <div style={s.myStoryInner}><span style={{fontSize: '1.5rem', marginTop: '-3px'}}>+</span></div>
                                </div>
                            )}
                            <span style={s.storyUsername}>Your Story</span>
                        </div>

                        {/* Other Stories */}
                        {otherStories.map((story) => (
                            <div key={story._id} style={s.storyItem} onClick={() => setViewStory(story)}>
                                <div style={s.storyCircle}>
                                    {story.user.profilePic ? (
                                        <img src={getImgUrl(story.user.profilePic)} style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover', border: '2px solid white'}} />
                                    ) : <div style={s.storyInner}>{story.user.username[0].toUpperCase()}</div>}
                                </div>
                                <span style={s.storyUsername}>{story.user.username.slice(0, 8)}...</span>
                            </div>
                        ))}
                    </div>

                    {/* Feed */}
                    <div style={s.feedContainer}>
                        {posts.map(post => <Post key={post._id} post={post} onDelete={removePost} />)}
                        {!hasMore && posts.length > 0 && <p style={{ textAlign: 'center', color: theme.textSecondary, marginTop: '20px', marginBottom: '20px' }}>You're all caught up! ✅</p>}
                    </div>
                </>
            )}

            {/* Bottom Nav */}
            <div style={s.bottomNav}>
                <button style={s.navItem} onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}><FaHome size={26} /></button>
                <Link to="/search" style={s.navItem}><FaSearch size={26} /></Link>
                <button onClick={() => setIsModalOpen(true)} style={s.navItem}><FaPlusSquare size={30} /></button>
                <Link to="/notifications" style={{...s.navItem, position: 'relative'}}>
                    <FaBell size={26} />
                    {unreadCount > 0 && <span style={s.notificationBadge}>{unreadCount}</span>}
                </Link>
                <Link to={`/profile/${user?._id}`} style={s.navItem}><FaUser size={26} /></Link>
            </div>

            {/* Create Post Modal */}
            {isModalOpen && (
                <div style={s.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={s.modalHeader}><h3>New Post</h3><button onClick={() => setIsModalOpen(false)} style={s.closeBtn}>×</button></div>
                        <CreatePost onPostCreated={handlePostCreated} />
                    </div>
                </div>
            )}

            {/* View Story Modal */}
            {viewStory && (
                <div style={s.storyOverlay} onClick={() => setViewStory(null)}>
                    <div style={s.storyContent} onClick={(e) => e.stopPropagation()}>
                        {viewStory.imageUrl.endsWith('.mp4') ? 
                            <video src={getImgUrl(viewStory.imageUrl)} style={s.storyImage} autoPlay loop controls /> : 
                            <img src={getImgUrl(viewStory.imageUrl)} alt="Story" style={s.storyImage} />
                        }
                        <div style={s.storyFooter}><strong>@{viewStory.user.username}</strong><button onClick={() => setViewStory(null)} style={s.closeStoryBtn}>Close</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = (theme) => ({
    mainContainer: { paddingBottom: '80px', backgroundColor: theme.bg, minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', backgroundColor: theme.navBg, borderBottom: 'none', position: 'sticky', top: 0, zIndex: 100, height: '60px' },
    storiesContainer: { display: 'flex', gap: '15px', padding: '15px', overflowX: 'auto', backgroundColor: theme.navBg, borderBottom: 'none', scrollbarWidth: 'none' },
    storyItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px', cursor: 'pointer' },
    myStoryActive: { width: '62px', height: '62px', borderRadius: '50%', border: '2px solid #007bff', padding: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' },
    storyThumbnail: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
    addBadge: { position: 'absolute', bottom: '5px', right: '0', backgroundColor: '#007bff', color: 'white', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', border: `2px solid ${theme.bg}`, fontWeight: 'bold' },
    myStoryCircle: { width: '62px', height: '62px', borderRadius: '50%', border: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' },
    myStoryInner: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: theme.inputBg, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#007bff' },
    storyCircle: { width: '62px', height: '62px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '5px' },
    storyInner: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: theme.navBg, display: 'flex', justifyContent: 'center', alignItems: 'center', border: `2px solid ${theme.navBg}`, fontWeight: 'bold', color: theme.text },
    storyUsername: { fontSize: '0.75rem', color: theme.text },
    feedContainer: { maxWidth: '600px', margin: '0 auto', padding: '10px' },
    bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: '60px', backgroundColor: theme.navBg, borderTop: 'none', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 },
    navItem: { background: 'none', border: 'none', cursor: 'pointer', color: theme.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' },
    notificationBadge: { position: 'absolute', top: '-2px', right: '-2px', backgroundColor: '#ff4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', border: `2px solid ${theme.navBg}` },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: theme.cardBg, padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '500px', color: theme.text },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: theme.text },
    storyOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'black', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
    storyContent: { position: 'relative', width: '100%', maxWidth: '400px', height: '80%' },
    storyImage: { width: '100%', height: '100%', objectFit: 'contain', borderRadius: '10px' },
    storyFooter: { position: 'absolute', bottom: '20px', left: '20px', right: '20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textShadow: '0 1px 3px rgba(0,0,0,0.8)' },
    closeStoryBtn: { backgroundColor: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
});

export default HomePage;