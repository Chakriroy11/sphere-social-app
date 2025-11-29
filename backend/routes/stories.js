const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Story = require('../models/Story');
const { protect } = require('../middleware/authMiddleware');

// Reuse the upload logic
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'story-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Upload a Story
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const newStory = new Story({
            user: req.user.id,
            imageUrl: `/uploads/${req.file.filename}`
        });
        await newStory.save();
        res.status(201).json(newStory);
    } catch (err) { res.status(500).json(err); }
});

// Get All Active Stories
router.get('/', async (req, res) => {
    try {
        // Fetch all stories and populate username
        const stories = await Story.find().populate('user', 'username').sort({ createdAt: -1 });
        res.status(200).json(stories);
    } catch (err) { res.status(500).json(err); }
});

module.exports = router;