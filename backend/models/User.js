const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    followers: { type: Array, default: [] },
    following: { type: Array, default: [] },
    // NEW: Array to store IDs of saved posts
    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], 
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);