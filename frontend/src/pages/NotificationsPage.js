import React, { useState, useEffect, useContext } from 'react';
import postService from '../services/postService';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaHeart, FaComment, FaUserPlus, FaArrowLeft } from 'react-icons/fa';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await postService.getNotifications();
                setNotifications(res.data);
            } catch (err) { console.error(err); }
        };
        fetchNotifs();
    }, []);

    const getIcon = (type) => {
        if (type === 'like') return <FaHeart color="#ed4956" />;
        if (type === 'comment') return <FaComment color="#007bff" />;
        return <FaUserPlus color="#28a745" />;
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Link to="/" style={{color: '#333'}}><FaArrowLeft size={20}/></Link>
                <h3 style={{marginLeft: '15px', margin: 0}}>Notifications</h3>
            </div>

            <div style={styles.list}>
                {notifications.map(notif => (
                    <div key={notif._id} style={styles.item}>
                        {/* Avatar */}
                        <div style={styles.avatar}>
                            {notif.sender.profilePic ? 
                                <img src={`http://localhost:5000${notif.sender.profilePic}`} alt="pic" style={styles.img} /> : 
                                notif.sender.username[0].toUpperCase()
                            }
                        </div>

                        {/* Text */}
                        <div style={styles.text}>
                            <strong>{notif.sender.username}</strong>
                            <span style={{marginLeft: '5px'}}>
                                {notif.type === 'like' && 'liked your post.'}
                                {notif.type === 'comment' && 'commented on your post.'}
                                {notif.type === 'follow' && 'started following you.'}
                            </span>
                            <div style={{marginTop: '2px', fontSize: '0.8rem', color: '#888'}}>
                                {getIcon(notif.type)} {new Date(notif.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Post Preview (if exists) */}
                        {notif.post && notif.post.imageUrl && (
                            <img src={`http://localhost:5000${notif.post.imageUrl}`} alt="post" style={styles.postPreview} />
                        )}
                    </div>
                ))}
                {notifications.length === 0 && <p style={{textAlign: 'center', marginTop: '20px', color: '#999'}}>No notifications yet.</p>}
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: '600px', margin: '0 auto', paddingBottom: '20px' },
    header: { display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee', backgroundColor: '#fff' },
    list: { padding: '0' },
    item: { display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #f0f0f0', gap: '15px' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    img: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
    text: { flex: 1, fontSize: '0.9rem' },
    postPreview: { width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }
};

export default NotificationsPage;