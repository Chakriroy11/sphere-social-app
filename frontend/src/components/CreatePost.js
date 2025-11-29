import React, { useState, useContext, useEffect } from 'react';
import postService from '../services/postService';
import { ThemeContext } from '../context/ThemeContext';
import { FaImage, FaTimes, FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import axios from 'axios';

const CreatePost = ({ onPostCreated }) => {
    const [content, setContent] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    
    // Location States
    const [location, setLocation] = useState(""); 
    const [showLocSearch, setShowLocSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [loadingLoc, setLoadingLoc] = useState(false);
    
    // NEW: Posting State (To fix the "Button not working" feeling)
    const [isPosting, setIsPosting] = useState(false);
    
    const { theme } = useContext(ThemeContext);

    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    // --- LOCATION LOGIC ---
    const handleGetLocation = () => {
        setLoadingLoc(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const address = res.data.address;
                    const city = address.city || address.town || address.village || address.county;
                    const country = address.country;
                    setLocation(city && country ? `📍 ${city}, ${country}` : "📍 Unknown Location");
                    setShowLocSearch(false);
                } catch (error) { setLocation("📍 GPS Location"); } 
                finally { setLoadingLoc(false); }
            }, () => { alert("Permission denied"); setLoadingLoc(false); });
        }
    };

    const searchLocation = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        setLoadingLoc(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`);
            setSearchResults(res.data);
        } catch (error) { console.error(error); } 
        finally { setLoadingLoc(false); }
    };

    const selectLocation = (place) => {
        setLocation(`📍 ${place.display_name.split(',')[0]}, ${place.display_name.split(',').pop().trim()}`);
        setShowLocSearch(false);
        setSearchQuery("");
        setSearchResults([]);
    };

    const clearImage = () => { setFile(null); setPreviewUrl(null); };

    // --- SUBMIT LOGIC (UPDATED) ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // Stop page reload
        
        // Validation: Must have text OR image
        if (!content.trim() && !file) {
            alert("Please write something or add an image.");
            return;
        }

        setIsPosting(true); // Disable button immediately

        const formData = new FormData();
        formData.append('content', content);
        if (location) formData.append('location', location);
        if (file) formData.append('image', file);

        try {
            await postService.createPost(formData);
            
            // Reset Form
            setContent('');
            setLocation('');
            clearImage();
            
            // Notify Parent (HomePage) to refresh feed
            if (onPostCreated) onPostCreated();
            
        } catch (error) {
            console.error("Post Error:", error);
            alert('Failed to create post. Please try again.');
        } finally {
            setIsPosting(false); // Re-enable button
        }
    };

    const s = styles(theme);

    return (
        <div style={s.container}>
            <form onSubmit={handleSubmit}>
                <textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={s.textarea}
                />
                
                {location && (
                    <div style={s.locationBadge}>
                        {location} 
                        <button type="button" onClick={() => setLocation('')} style={s.removeLocBtn}>×</button>
                    </div>
                )}

                {/* SEARCH BOX */}
                {showLocSearch && (
                    <div style={s.searchBox}>
                        <div style={{display: 'flex', gap: '5px'}}>
                            <input 
                                type="text" 
                                placeholder="Search city..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={s.searchInput}
                            />
                            <button type="button" onClick={searchLocation} style={s.searchBtn}><FaSearch /></button>
                        </div>
                        {searchResults.length > 0 && (
                            <ul style={s.resultsList}>
                                {searchResults.slice(0, 3).map((place) => (
                                    <li key={place.place_id} onClick={() => selectLocation(place)} style={s.resultItem}>
                                        {place.display_name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {previewUrl && (
                    <div style={s.previewContainer}>
                        {file && file.type.startsWith('video') ? <video src={previewUrl} style={s.previewImage} controls /> : <img src={previewUrl} alt="Preview" style={s.previewImage} />}
                        <button type="button" onClick={clearImage} style={s.removeBtn}><FaTimes /></button>
                    </div>
                )}

                <div style={s.controls}>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <label style={s.iconButton}>
                            <FaImage size={24} color="#28a745" />
                            <input type="file" onChange={handleFileChange} accept="image/*,video/*" style={{display: 'none'}} />
                        </label>
                        <button type="button" onClick={() => setShowLocSearch(!showLocSearch)} style={s.iconButton}>
                            <FaMapMarkerAlt size={24} color="#dc3545" />
                        </button>
                        {showLocSearch && (
                            <button type="button" onClick={handleGetLocation} style={s.gpsBtn}>
                                {loadingLoc ? "..." : "Use GPS"}
                            </button>
                        )}
                    </div>
                    
                    {/* SUBMIT BUTTON (Disabled while posting) */}
                    <button type="submit" style={{...s.button, opacity: isPosting ? 0.7 : 1}} disabled={isPosting}>
                        {isPosting ? "Posting..." : "Post"}
                    </button>
                </div>
            </form>
        </div>
    );
};

const styles = (theme) => ({
    container: { padding: '0', border: 'none', backgroundColor: 'transparent' },
    textarea: { width: '100%', height: '100px', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: `1px solid ${theme.border}`, backgroundColor: theme.inputBg, color: theme.text, fontFamily: 'inherit', fontSize: '1rem', resize: 'none', boxSizing: 'border-box', outline: 'none' },
    
    locationBadge: { color: '#007bff', fontSize: '0.9rem', marginBottom: '10px', fontWeight: 'bold', display: 'flex', alignItems: 'center' },
    removeLocBtn: { background: 'none', border: 'none', color: '#ff4444', fontSize: '1.2rem', cursor: 'pointer', marginLeft: '5px' },

    searchBox: { marginBottom: '10px', padding: '10px', backgroundColor: theme.inputBg, borderRadius: '8px' },
    searchInput: { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '70%' },
    searchBtn: { padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '5px' },
    gpsBtn: { fontSize: '0.8rem', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    resultsList: { listStyle: 'none', padding: 0, marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' },
    resultItem: { padding: '8px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '0.9rem', color: 'black' },

    previewContainer: { position: 'relative', marginBottom: '15px', width: '100%', maxHeight: '300px', overflow: 'hidden', borderRadius: '8px', border: `1px solid ${theme.border}` },
    previewImage: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
    removeBtn: { position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' },
    controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' },
    iconButton: { cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s', color: theme.text, backgroundColor: theme.inputBg, border: 'none' },
    button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }
});

export default CreatePost;