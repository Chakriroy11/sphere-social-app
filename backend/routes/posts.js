const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, 'post-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Helper to extract hashtags
const extractHashtags = (text) => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
};

// Create Post
router.post('/', protect, upload.single('image'), async (req, res) => {
    const { content, location } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    try {
        const newPost = new Post({
            content,
            imageUrl,
            location,
            author: req.user.id,
            hashtags: extractHashtags(content)
        });
        const post = await newPost.save();
        res.status(201).json(post);
    } catch (err) { res.status(500).json(err); }
});

// UPDATE POST (NEW)
router.put('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        // Check ownership
        if (post.author.toString() !== req.user.id) {
            return res.status(401).json("You can only edit your own posts");
        }

        // Update fields
        if (req.body.content) {
            post.content = req.body.content;
            post.hashtags = extractHashtags(req.body.content); // Re-extract tags
        }
        
        await post.save();
        res.status(200).json(post);
    } catch (err) { res.status(500).json(err); }
});

// Get All Posts (Infinite Scroll)
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;
    try {
        const posts = await Post.find()
            .populate('author', 'username profilePic')
            .sort({ createdAt: -1 })
            .skip(skip).limit(limit);
        res.status(200).json(posts);
    } catch (err) { res.status(500).json(err); }
});

// Get User Posts
router.get('/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId }).populate('author', 'username profilePic').sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) { res.status(500).json(err); }
});

// Get Posts by Tag
router.get('/tag/:tag', async (req, res) => {
    try {
        const posts = await Post.find({ hashtags: req.params.tag }).populate('author', 'username profilePic').sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) { res.status(500).json(err); }
});

// Delete Post
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.author.toString() !== req.user.id) return res.status(401).json("Not authorized");
        await post.deleteOne();
        res.status(200).json("Deleted");
    } catch (err) { res.status(500).json(err); }
});

// Interactions
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.user.id)) { await post.updateOne({ $push: { likes: req.user.id } }); res.status(200).json("Liked"); } 
        else { await post.updateOne({ $pull: { likes: req.user.id } }); res.status(200).json("Unliked"); }
    } catch (err) { res.status(500).json(err); }
});

router.post('/:id/comment', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        post.comments.push({ user: req.user.id, text: req.body.text });
        await post.save();
        res.status(200).json(post);
    } catch (err) { res.status(500).json(err); }
});

router.put('/:id/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.saved.includes(req.params.id)) { await user.updateOne({ $push: { saved: req.params.id } }); res.status(200).json("Saved"); } 
        else { await user.updateOne({ $pull: { saved: req.params.id } }); res.status(200).json("Unsaved"); }
    } catch (err) { res.status(500).json(err); }
});

module.exports = router;