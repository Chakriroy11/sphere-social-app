import React, { useContext, useState, memo } from 'react'; // Added memo
import { Link } from 'react-router-dom';
import postService from '../services/postService';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { FaHeart, FaRegHeart, FaRegComment, FaTrashAlt, FaBookmark, FaRegBookmark, FaMapMarkerAlt, FaPen, FaCheck, FaTimes } from 'react-icons/fa';

const timeAgo = (date) => { /* ... keep existing logic ... */ 
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
};

const renderContentWithTags = (text) => { /* ... keep existing logic ... */ 
    return text.split(' ').map((word, index) => {
        if (word.startsWith('#')) {
            const tag = word.substring(1);
            return <Link key={index} to={`/tags/${tag}`} style={{color: '#007bff', textDecoration: 'none', marginRight: '4px'}}>{word}</Link>;
        }
        return word + ' ';
    });
};

const Post = ({ post, onDelete }) => {
    const { user } = useContext(AuthContext);
    const { theme } = useContext(ThemeContext);
    
    const [liked, setLiked] = useState(post.likes.includes(user?._id));
    const [likeCount, setLikeCount] = useState(post.likes.length);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState(post.comments || []);
    const [commentText, setCommentText] = useState('');
    const [saved, setSaved] = useState(false);
    
    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [displayContent, setDisplayContent] = useState(post.content);

    const imageUrl = post.imageUrl ? `https://sphere-backend-2mx3.onrender.com${post.imageUrl}` : null;
    const isOwner = user && post.author._id === user._id;
    const isVideo = (url) => url && (url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm'));

    const s = styles(theme);

    const handleLike = async () => { try { await postService.likePost(post._id); setLikeCount(liked ? likeCount - 1 : likeCount + 1); setLiked(!liked); } catch (error) { console.error(error); } };
    const handleSave = async () => { try { await postService.savePost(post._id); setSaved(!saved); } catch (error) { console.error(error); } };
    const handleDelete = async () => { if (window.confirm("Delete?")) { try { await postService.deletePost(post._id); onDelete(post._id); } catch (error) { console.error(error); } } };
    const handleComment = async (e) => { e.preventDefault(); if (!commentText.trim()) return; try { const response = await postService.addComment(post._id, commentText); setComments(response.data.comments); setCommentText(''); } catch (error) { console.error(error); } };
    
    const handleUpdate = async () => {
        try {
            await postService.updatePost(post._id, editContent);
            setDisplayContent(editContent);
            setIsEditing(false);
        } catch (error) { alert("Failed to update"); }
    };

    return (
        <div style={s.card}>
            <div style={s.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {post.author.profilePic ? (
                        <img 
                            src={`https://sphere-backend-2mx3.onrender.com${post.author.profilePic}`} 
                            alt="avatar" 
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            loading="lazy" // <--- OPTIMIZATION: Lazy Load Avatar
                        />
                    ) : (
                        <div style={s.avatarPlaceholder}>{post.author.username[0].toUpperCase()}</div>
                    )}
                    <div>
                        <Link to={`/profile/${post.author._id}`} style={s.username}>@{post.author.username}</Link>
                        {post.location && <span style={{fontSize:'0.8rem', color:'#007bff', display:'block'}}><FaMapMarkerAlt size={10} /> {post.location}</span>}
                        <span style={s.time}>{timeAgo(post.createdAt)}</span>
                    </div>
                </div>
                {isOwner && (
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={() => setIsEditing(!isEditing)} style={s.actionIconBtn}><FaPen size={14} color={theme.textSecondary} /></button>
                        <button onClick={handleDelete} style={s.actionIconBtn}><FaTrashAlt size={14} color="#dc3545" /></button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <div style={{marginBottom: '10px'}}>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} style={s.editTextarea} />
                    <div style={{display: 'flex', gap: '10px', marginTop: '5px'}}>
                        <button onClick={handleUpdate} style={s.saveBtn}><FaCheck /> Save</button>
                        <button onClick={() => setIsEditing(false)} style={s.cancelBtn}><FaTimes /> Cancel</button>
                    </div>
                </div>
            ) : (
                <div style={s.content}>{renderContentWithTags(displayContent)}</div>
            )}
            
            {imageUrl && (
                isVideo(imageUrl) ? (
                    <video controls style={s.image} loop muted playsInline preload="metadata"> {/* Preload metadata only */}
                        <source src={imageUrl} type="video/mp4" />
                    </video>
                ) : (
                    <img 
                        src={imageUrl} 
                        alt="Post" 
                        style={s.image} 
                        loading="lazy" // <--- OPTIMIZATION: Lazy Load Post Image
                    />
                )
            )}

            <div style={s.actions}>
                <div style={{display: 'flex', gap: '20px'}}>
                    <button onClick={handleLike} style={s.actionBtn}>{liked ? <FaHeart color="#ed4956" size={20} /> : <FaRegHeart size={20} />} <span>{likeCount}</span></button>
                    <button onClick={() => setShowComments(!showComments)} style={s.actionBtn}><FaRegComment size={20} /> <span>{comments.length}</span></button>
                </div>
                <button onClick={handleSave} style={{...s.actionBtn, marginLeft: 'auto'}}>{saved ? <FaBookmark size={20} /> : <FaRegBookmark size={20} />}</button>
            </div>

            {showComments && (
                <div style={s.commentSection}>
                    {comments.map((c, i) => <div key={i} style={s.comment}><strong style={{marginRight: '5px'}}>{user?.username}:</strong>{c.text}</div>)}
                    <form onSubmit={handleComment} style={s.commentForm}><input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." style={s.input} /><button type="submit" style={s.postBtn}>Post</button></form>
                </div>
            )}
        </div>
    );
};

const styles = (theme) => ({
    // ... (Keep existing styles exactly as they were) ...
    card: { backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: '8px', marginBottom: '20px', padding: '15px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    avatarPlaceholder: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#007bff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    username: { fontWeight: 'bold', color: theme.text, textDecoration: 'none' },
    time: { color: theme.textSecondary, fontSize: '0.8rem' },
    actionIconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px' },
    content: { marginBottom: '15px', lineHeight: '1.5', color: theme.text },
    editTextarea: { width: '100%', padding: '8px', borderRadius: '5px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, fontFamily: 'inherit', resize: 'vertical' },
    saveBtn: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' },
    cancelBtn: { backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem' },
    image: { width: '100%', borderRadius: '4px', border: `1px solid ${theme.border}`, marginBottom: '12px' },
    actions: { display: 'flex', gap: '20px', borderTop: `1px solid ${theme.border}`, paddingTop: '12px' },
    actionBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: theme.text, fontSize: '1rem' },
    commentSection: { marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${theme.border}` },
    comment: { fontSize: '0.9rem', marginBottom: '5px', color: theme.text },
    commentForm: { display: 'flex', marginTop: '10px' },
    input: { flex: 1, border: 'none', outline: 'none', padding: '8px', backgroundColor: theme.inputBg, borderRadius: '4px', color: theme.text },
    postBtn: { background: 'none', border: 'none', color: '#0095f6', fontWeight: 'bold', cursor: 'pointer', paddingLeft: '10px' }
});

// WRAP IN MEMO (Performance Boost)
export default memo(Post);