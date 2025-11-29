const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: { type: String, required: true },
    sender: { type: String, required: true }, // Username
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
    isGroup: { type: Boolean, default: false }, // <--- New Field
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);