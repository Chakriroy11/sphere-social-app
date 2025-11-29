const router = require('express').Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Get My Notifications
router.get('/', protect, async (req, res) => {
    try {
        const notifs = await Notification.find({ receiver: req.user.id })
            .populate('sender', 'username profilePic')
            .populate('post', 'imageUrl content') // Show preview of post
            .sort({ createdAt: -1 });
        res.status(200).json(notifs);
    } catch (err) { res.status(500).json(err); }
});

// Create Notification (Internal use mostly, but good to have API)
router.post('/', protect, async (req, res) => {
    try {
        const newNotif = new Notification(req.body);
        await newNotif.save();
        res.status(201).json(newNotif);
    } catch (err) { res.status(500).json(err); }
});

module.exports = router;