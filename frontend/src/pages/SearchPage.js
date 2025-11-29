import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import userService from '../services/userService';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';

const SearchPage = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        const text = e.target.value;
        setQuery(text);
        if (text.length > 0) {
            try {
                const res = await userService.searchUsers(text);
                setResults(res.data);
            } catch (err) { console.error(err); }
        } else {
            setResults([]);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Link to="/" style={{color: '#333', marginRight: '15px'}}><FaArrowLeft size={20}/></Link>
                <div style={styles.searchBox}>
                    <FaSearch color="#888" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={query}
                        onChange={handleSearch}
                        style={styles.input}
                        autoFocus
                    />
                </div>
            </div>

            <div style={styles.results}>
                {results.map(user => (
                    <Link to={`/profile/${user._id}`} key={user._id} style={styles.userCard}>
                        <div style={styles.avatar}>
                            {user.profilePic ? 
                                <img src={`http://localhost:5000${user.profilePic}`} alt="pic" style={styles.img} /> : 
                                user.username[0].toUpperCase()
                            }
                        </div>
                        <div style={styles.info}>
                            <span style={styles.username}>{user.username}</span>
                            <span style={styles.bio}>{user.bio ? user.bio.substring(0, 30) + '...' : ''}</span>
                        </div>
                    </Link>
                ))}
                {query && results.length === 0 && <p style={{textAlign: 'center', color: '#888'}}>No users found.</p>}
            </div>
        </div>
    );
};

const styles = {
    container: { maxWidth: '600px', margin: '0 auto' },
    header: { display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' },
    searchBox: { flex: 1, backgroundColor: '#efefef', borderRadius: '8px', padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '10px' },
    input: { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '1rem' },
    results: { padding: '10px' },
    userCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', textDecoration: 'none', color: 'black', borderBottom: '1px solid #f0f0f0' },
    avatar: { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    img: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
    info: { display: 'flex', flexDirection: 'column' },
    username: { fontWeight: 'bold' },
    bio: { fontSize: '0.85rem', color: '#666' }
};

export default SearchPage;