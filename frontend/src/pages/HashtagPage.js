import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import postService from '../services/postService';
import Post from '../components/Post';
import { FaArrowLeft } from 'react-icons/fa';
import { ThemeContext } from '../context/ThemeContext';

const HashtagPage = () => {
    const { tag } = useParams();
    const [posts, setPosts] = useState([]);
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await postService.getPostsByTag(tag);
                setPosts(res.data);
            } catch (error) { console.error(error); }
        };
        fetchPosts();
    }, [tag]);

    const s = styles(theme);

    return (
        <div style={s.container}>
            <div style={s.header}>
                <Link to="/" style={{ color: theme.text, marginRight: '15px' }}><FaArrowLeft size={20}/></Link>
                <h2 style={{margin: 0}}>#{tag}</h2>
            </div>
            
            <div style={s.list}>
                {posts.map(post => <Post key={post._id} post={post} />)}
                {posts.length === 0 && <p style={{textAlign: 'center', marginTop: '20px', color: theme.textSecondary}}>No posts found for #{tag}</p>}
            </div>
        </div>
    );
};

const styles = (theme) => ({
    container: { maxWidth: '600px', margin: '0 auto', paddingBottom: '80px', backgroundColor: theme.bg, minHeight: '100vh', color: theme.text },
    header: { padding: '15px', borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.cardBg, display: 'flex', alignItems: 'center' },
    list: { padding: '10px' }
});

export default HashtagPage;