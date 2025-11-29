import React, { useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import userService from '../services/userService';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaCheckDouble, FaArrowLeft, FaPaperPlane } from 'react-icons/fa';

// Connect to LIVE Backend
const socket = io.connect("https://sphere-backend-2mx3.onrender.com");
const API_BASE = "https://sphere-backend-2mx3.onrender.com/api";

const ChatPage = () => {
    const { user, onlineUsers } = useContext(AuthContext);
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    const [friends, setFriends] = useState([]); 
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    
    const messagesEndRef = useRef(null);

    // 1. Fetch Friends (With Safety Check)
    useEffect(() => {
        const getFriends = async () => {
            try {
                if (user?._id) {
                    const res = await userService.getUser(user._id);
                    console.log("DEBUG FRIENDS LIST:", res.data.following);
                    // Filter out bad data to prevent crashes
                    const validFriends = (res.data.following || []).filter(f => f && f.username);
                    setFriends(validFriends);
                }
            } catch (err) { console.error(err); }
        };
        getFriends();
    }, [user]);

    // 2. Auto-Join Room
    useEffect(() => {
        if (roomId) {
            socket.emit("join_room", roomId);
            fetchHistory(roomId);
        }
    }, [roomId]);

    const fetchHistory = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/messages/${id}`);
            setMessageList(res.data);
            if (user?.username) {
                await axios.put(`${API_BASE}/messages/read/${id}`, { username: user.username });
            }
            scrollToBottom();
        } catch (err) { console.error(err); }
    };

    const sendMessage = async () => {
        // Ensure user is loaded before sending to avoid "Unknown User"
        if (currentMessage !== "" && user?.username) {
            const messageData = {
                conversationId: roomId,
                room: roomId,
                sender: user.username, 
                text: currentMessage,
                time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
            socket.emit("stop_typing", { room: roomId }); 
            await axios.post(`${API_BASE}/messages`, messageData);
        } else if (!user?.username) {
            // Retry safety
            console.log("Waiting for user data...");
        }
    };

    const handleInput = (e) => {
        setCurrentMessage(e.target.value);
        if (e.target.value.length > 0 && user?.username) {
            socket.emit("typing", { room: roomId, user: user.username });
        } else {
            socket.emit("stop_typing", { room: roomId });
        }
    };

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(() => { scrollToBottom(); }, [messageList, isTyping]);

    useEffect(() => {
        const receiveMessage = (data) => setMessageList((list) => [...list, data]);
        socket.on("receive_message", receiveMessage);
        socket.on("display_typing", (data) => { if (data.user !== user?.username) setIsTyping(true); });
        socket.on("hide_typing", () => setIsTyping(false));
        return () => { 
            socket.off("receive_message", receiveMessage); 
            socket.off("display_typing");
            socket.off("hide_typing");
        };
    }, [user]);

    const openChat = (friendId) => {
        const newRoomId = [user._id, friendId].sort().join("_");
        navigate(`/chat/${newRoomId}`);
    };

    const isMobile = window.innerWidth <= 768;
    const showSidebar = !roomId || !isMobile;
    const showChatArea = roomId || !isMobile;

    return (
        <div style={styles.container}>
            {/* --- SIDEBAR --- */}
            {showSidebar && (
                <div style={{...styles.sidebar, width: isMobile ? '100%' : '350px'}}>
                    <div style={styles.sidebarHeader}>
                        <Link to="/" style={{color: '#333', marginRight: '10px'}}><FaArrowLeft /></Link>
                        <h3 style={{margin: 0}}>Chats</h3>
                    </div>
                    <div style={styles.friendList}>
                        {friends.length === 0 && <p style={{padding: '20px', color: '#999'}}>Follow people to chat!</p>}
                        
                        {friends.map((friend) => {
                            if (!friend) return null;
                            const isOnline = onlineUsers.some(u => u.userId === friend._id);
                            const initial = friend.username.charAt(0).toUpperCase();

                            return (
                                <div key={friend._id} onClick={() => openChat(friend._id)} style={styles.friendItem}>
                                    <div style={{position: 'relative'}}>
                                        {friend.profilePic ? (
                                            <img src={`https://sphere-backend-2mx3.onrender.com${friend.profilePic}`} alt="pic" style={styles.avatar} />
                                        ) : (
                                            <div style={styles.avatarPlaceholder}>{initial}</div>
                                        )}
                                        {isOnline && <div style={styles.onlineBadge}></div>}
                                    </div>
                                    <div style={styles.friendInfo}>
                                        <span style={{fontWeight: 'bold'}}>{friend.username}</span>
                                        <span style={{fontSize: '0.8rem', color: isOnline ? '#31a24c' : '#999'}}>
                                            {isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- CHAT AREA --- */}
            {showChatArea && (
                <div style={styles.chatArea}>
                    {roomId ? (
                        <>
                            <div style={styles.chatHeader}>
                                {isMobile && <button onClick={() => navigate('/chat')} style={styles.backBtn}>←</button>}
                                <h3>Private Chat</h3>
                            </div>
                            <div style={styles.chatBody}>
                                {messageList.map((msg, index) => {
                                    const isMe = msg.sender === user?.username;
                                    return (
                                        <div key={index} style={isMe ? styles.messageRowMe : styles.messageRowOther}>
                                            <div style={isMe ? styles.bubbleMe : styles.bubbleOther}>
                                                
                                                {/* CLEANER UI: Removed Sender Name Display */}
                                                
                                                <p style={{margin: 0}}>{msg.text}</p>
                                                <div style={styles.metaRow}>
                                                    <span style={isMe ? styles.timeMe : styles.timeOther}>{msg.time}</span>
                                                    {isMe && <FaCheckDouble size={10} color={msg.read ? '#00e676' : 'rgba(255,255,255,0.7)'} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {isTyping && <div style={styles.typingIndicator}>Typing...</div>}
                                <div ref={messagesEndRef} />
                            </div>
                            <div style={styles.chatFooter}>
                                <input
                                    type="text"
                                    value={currentMessage}
                                    placeholder="Type a message..."
                                    onChange={handleInput}
                                    onKeyPress={(event) => event.key === "Enter" && sendMessage()}
                                    style={styles.chatInput}
                                />
                                <button onClick={sendMessage} style={styles.sendBtn}><FaPaperPlane /></button>
                            </div>
                        </>
                    ) : (
                        <div style={styles.emptyState}>
                            <h2>Select a friend to start chatting 💬</h2>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { display: 'flex', height: '100vh', backgroundColor: '#f0f2f5' },
    sidebar: { backgroundColor: 'white', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' },
    sidebarHeader: { padding: '20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', height: '60px', boxSizing: 'border-box' },
    friendList: { flex: 1, overflowY: 'auto' },
    friendItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #f9f9f9' },
    friendInfo: { marginLeft: '15px', display: 'flex', flexDirection: 'column' },
    avatar: { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' },
    avatarPlaceholder: { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
    onlineBadge: { width: '12px', height: '12px', backgroundColor: '#31a24c', borderRadius: '50%', position: 'absolute', bottom: '0', right: '0', border: '2px solid white' },
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' },
    chatHeader: { height: '60px', backgroundColor: 'white', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', padding: '0 20px' },
    backBtn: { marginRight: '10px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    chatBody: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
    emptyState: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' },
    messageRowMe: { display: 'flex', justifyContent: 'flex-end' },
    messageRowOther: { display: 'flex', justifyContent: 'flex-start' },
    bubbleMe: { backgroundColor: '#0084ff', color: 'white', padding: '10px 15px', borderRadius: '18px 18px 0 18px', maxWidth: '70%' },
    bubbleOther: { backgroundColor: '#e4e6eb', color: 'black', padding: '10px 15px', borderRadius: '18px 18px 18px 0', maxWidth: '70%' },
    metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginTop: '5px' },
    timeMe: { fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)' },
    timeOther: { fontSize: '0.65rem', color: '#65676b' },
    typingIndicator: { fontStyle: 'italic', color: '#888', marginLeft: '20px', marginBottom: '10px' },
    chatFooter: { padding: '15px', backgroundColor: 'white', borderTop: '1px solid #ddd', display: 'flex', gap: '10px' },
    chatInput: { flex: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #ddd', outline: 'none', backgroundColor: '#f0f2f5' },
    sendBtn: { width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#0084ff', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default ChatPage;