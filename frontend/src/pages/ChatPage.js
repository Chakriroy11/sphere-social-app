import React, { useState, useEffect, useContext, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useParams } from 'react-router-dom';
import { FaCheckDouble } from 'react-icons/fa';

const socket = io.connect("https://sphere-backend-2mx3.onrender.com");

const ChatPage = () => {
    const { user, onlineUsers } = useContext(AuthContext);
    const { roomId } = useParams();
    
    const [showChat, setShowChat] = useState(!!roomId); 
    const [room, setRoom] = useState(roomId || ""); 
    const [currentMessage, setCurrentMessage] = useState("");
    const [messageList, setMessageList] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchHistory = async (id) => {
        try {
            const res = await axios.get(`https://sphere-backend-2mx3.onrender.com/api/messages/${id}`);
            setMessageList(res.data);
            await axios.put(`https://sphere-backend-2mx3.onrender.com/api/messages/read/${id}`, { username: user.username });
            scrollToBottom();
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (roomId) {
            setRoom(roomId);
            setShowChat(true);
            socket.emit("join_room", roomId);
            fetchHistory(roomId);
        }
    }, [roomId]);

    const joinRoom = () => {
        if (room !== "") {
            socket.emit("join_room", room);
            setShowChat(true);
            fetchHistory(room);
        }
    };

    const sendMessage = async () => {
        if (currentMessage !== "") {
            const messageData = {
                conversationId: room,
                room: room,
                sender: user.username,
                text: currentMessage,
                time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            await socket.emit("send_message", messageData);
            setMessageList((list) => [...list, messageData]);
            setCurrentMessage("");
            socket.emit("stop_typing", { room: room }); 
            await axios.post("https://sphere-backend-2mx3.onrender.com/api/messages", messageData);
        }
    };

    const handleInput = (e) => {
        setCurrentMessage(e.target.value);
        if (e.target.value.length > 0) {
            socket.emit("typing", { room: room, user: user.username });
        } else {
            socket.emit("stop_typing", { room: room });
        }
    };

    useEffect(() => { scrollToBottom(); }, [messageList, isTyping]);

    useEffect(() => {
        const receiveMessage = (data) => {
            setMessageList((list) => [...list, data]);
        };
        
        socket.on("receive_message", receiveMessage);
        socket.on("display_typing", (data) => {
            if (data.user !== user.username) setIsTyping(true);
        });
        socket.on("hide_typing", () => setIsTyping(false));

        return () => { 
            socket.off("receive_message", receiveMessage); 
            socket.off("display_typing");
            socket.off("hide_typing");
        };
    }, [socket, user.username]);

    const getOtherUserId = () => {
        if (!roomId) return null;
        const ids = roomId.split('_');
        return ids.find(id => id !== user._id);
    };
    const otherUserId = getOtherUserId();
    const isOnline = otherUserId && onlineUsers.some(u => u.userId === otherUserId);

    return (
        <div style={styles.pageContainer}>
            <div style={styles.topBar}>
                <Link to="/" style={styles.backLink}>← Back to Feed</Link>
            </div>

            {!showChat ? (
                <div style={styles.joinCard}>
                    <h2 style={{marginBottom: '20px', color: '#333'}}>💬 Join Conversation</h2>
                    <input type="text" placeholder="Enter Room Name" onChange={(event) => setRoom(event.target.value)} style={styles.joinInput} />
                    <button onClick={joinRoom} style={styles.joinBtn}>Start Chatting</button>
                </div>
            ) : (
                <div style={styles.chatWindow}>
                    <div style={styles.chatHeader}>
                        <div style={{...styles.onlineDot, backgroundColor: isOnline ? '#31a24c' : '#ccc'}}></div>
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>
                                {roomId ? "Private Conversation" : `#${room}`}
                            </span>
                            <span style={{fontSize: '0.8rem', color: isOnline ? '#31a24c' : '#999'}}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <div style={styles.chatBody}>
                        {messageList.map((msg, index) => {
                            const isMe = msg.sender === user.username;
                            return (
                                <div key={index} style={isMe ? styles.messageRowMe : styles.messageRowOther}>
                                    <div style={isMe ? styles.bubbleMe : styles.bubbleOther}>
                                        {!isMe && <div style={styles.senderName}>{msg.sender}</div>}
                                        <p style={{margin: 0}}>{msg.text}</p>
                                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px'}}>
                                            <span style={isMe ? styles.timeMe : styles.timeOther}>{msg.time}</span>
                                            {isMe && <FaCheckDouble size={12} color={msg.read ? '#00e676' : 'rgba(255,255,255,0.7)'} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isTyping && (
                            <div style={styles.messageRowOther}>
                                <div style={{...styles.bubbleOther, fontStyle: 'italic', color: '#888'}}>
                                    Typing...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={styles.chatFooter}>
                        <input
                            type="text"
                            value={currentMessage}
                            placeholder="Type a message..."
                            onChange={handleInput}
                            onKeyPress={(event) => { event.key === "Enter" && sendMessage(); }}
                            style={styles.chatInput}
                        />
                        <button onClick={sendMessage} style={styles.sendBtn}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    pageContainer: { height: '100vh', backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px', boxSizing: 'border-box' },
    topBar: { width: '100%', maxWidth: '600px', marginBottom: '10px', paddingLeft: '10px' },
    backLink: { textDecoration: 'none', color: '#007bff', fontWeight: 'bold', fontSize: '1rem' },
    joinCard: { backgroundColor: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '90%', maxWidth: '400px', marginTop: '50px' },
    joinInput: { width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', boxSizing: 'border-box', outline: 'none' },
    joinBtn: { width: '100%', padding: '12px', backgroundColor: '#0084ff', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
    chatWindow: { width: '100%', maxWidth: '600px', height: '80vh', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    chatHeader: { height: '60px', backgroundColor: '#fff', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', padding: '0 20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', zIndex: 10 },
    onlineDot: { width: '12px', height: '12px', borderRadius: '50%', marginRight: '10px' },
    chatBody: { flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column', gap: '10px' },
    messageRowMe: { display: 'flex', justifyContent: 'flex-end' },
    messageRowOther: { display: 'flex', justifyContent: 'flex-start' },
    bubbleMe: { backgroundColor: '#0084ff', color: 'white', padding: '10px 15px', borderRadius: '18px 18px 0 18px', maxWidth: '70%', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', wordWrap: 'break-word' },
    bubbleOther: { backgroundColor: '#e4e6eb', color: 'black', padding: '10px 15px', borderRadius: '18px 18px 18px 0', maxWidth: '70%', position: 'relative', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', wordWrap: 'break-word' },
    senderName: { fontSize: '0.75rem', color: '#666', fontWeight: 'bold', marginBottom: '2px' },
    timeMe: { fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', display: 'block', textAlign: 'right', marginTop: '5px' },
    timeOther: { fontSize: '0.65rem', color: '#65676b', display: 'block', textAlign: 'right', marginTop: '5px' },
    chatFooter: { padding: '10px', backgroundColor: 'white', borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' },
    chatInput: { flex: 1, padding: '12px 20px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#f0f2f5', outline: 'none', fontSize: '0.95rem' },
    sendBtn: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0084ff', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }
};

export default ChatPage;