require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs'); // <--- Import FS
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(cors({ origin: "*" }));
app.use(express.json());

// --- CRITICAL FIX: Create 'uploads' folder if it doesn't exist ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
    console.log("Created 'uploads' directory");
}

// Serve the static files
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

// Socket Logic
let onlineUsers = []; 
io.on('connection', (socket) => {
    socket.on("add_user", (userId) => {
        if (!onlineUsers.some((u) => u.userId === userId)) {
            onlineUsers.push({ userId, socketId: socket.id });
        }
        io.emit("get_users", onlineUsers);
    });
    socket.on('join_user_room', (userId) => socket.join(userId));
    socket.on('join_room', (roomId) => socket.join(roomId));
    socket.on('send_message', (data) => socket.to(data.room).emit('receive_message', data));
    socket.on('send_notification', (data) => socket.to(data.receiverId).emit('get_notification', data));
    socket.on("typing", (data) => socket.to(data.room).emit("display_typing", data));
    socket.on("stop_typing", (data) => socket.to(data.room).emit("hide_typing", data));
    socket.on('disconnect', () => {
        onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
        io.emit("get_users", onlineUsers);
    });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));