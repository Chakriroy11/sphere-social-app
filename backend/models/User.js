const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Profile info
    profilePic: { type: String, default: "" },
    bio: { type: String, default: "" },
    
    // THE FIX: These must utilize 'ObjectId' and 'ref' to work with .populate()
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    saved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], 
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);