const router = require('express').Router();
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'avatar-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// 1. Get User Data (UPDATED: Populates 'following' list for Chat Sidebar)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'username profilePic bio'); // <--- THIS IS THE KEY CHANGE
        const { password, ...other } = user._doc;
        res.status(200).json(other);
    } catch (err) { res.status(500).json(err); }
});

// Search Users
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const users = await User.find({
            username: { $regex: query, $options: 'i' }
        }).limit(10);
        res.status(200).json(users);
    } catch (err) { res.status(500).json(err); }
});

// Follow User
router.put('/:id/follow', protect, async (req, res) => {
    if (req.user.id !== req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            const currentUser = await User.findById(req.user.id);
            if (!user.followers.includes(req.user.id)) {
                await user.updateOne({ $push: { followers: req.user.id } });
                await currentUser.updateOne({ $push: { following: req.params.id } });
                res.status(200).json("Followed");
            } else {
                await user.updateOne({ $pull: { followers: req.user.id } });
                await currentUser.updateOne({ $pull: { following: req.params.id } });
                res.status(200).json("Unfollowed");
            }
        } catch (err) { res.status(500).json(err); }
    } else { res.status(403).json("Cannot follow self"); }
});

// Update Profile
router.put('/:id', protect, upload.single('profilePic'), async (req, res) => {
    if (req.user.id === req.params.id) {
        try {
            const updateData = { bio: req.body.bio };
            if (req.file) updateData.profilePic = `/uploads/${req.file.filename}`;
            const user = await User.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
            res.status(200).json(user);
        } catch (err) { res.status(500).json(err); }
    } else { res.status(403).json("Unauthorized"); }
});

// Change Password
router.put('/:id/password', protect, async (req, res) => {
    if (req.user.id === req.params.id) {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.params.id);
            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) return res.status(400).json("Invalid current password");
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            await user.save();
            res.status(200).json("Password updated");
        } catch (err) { res.status(500).json(err); }
    } else { res.status(403).json("Unauthorized"); }
});

// Delete Account
router.delete('/:id', protect, async (req, res) => {
    if (req.user.id === req.params.id) {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Account deleted");
        } catch (err) { res.status(500).json(err); }
    } else { res.status(403).json("Unauthorized"); }
});

module.exports = router;