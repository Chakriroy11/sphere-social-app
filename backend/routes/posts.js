const router = require('express').Router();
const multer = require('multer');
const Post = require('../models/Post');
const User = require('../models/User');
const { storage } = require('../config/cloudinary'); // Import Cloudinary Storage
const { protect } = require('../middleware/authMiddleware');

// Configure Multer to use Cloudinary
const upload = multer({ storage });

// Helper to extract hashtags from text
const extractHashtags = (text) => {
    const regex = /#(\w+)/g;
    const matches = text.match(regex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
};

// --- 1. CREATE POST ---
router.post('/', protect, upload.single('image'), async (req, res) => {
    const { content, location } = req.body;
    try {
        // Cloudinary returns the full URL in req.file.path
        const imageUrl = req.file ? req.file.path : null;

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

// --- 2. UPDATE POST (Edit) ---
router.put('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");

        // Check ownership
        if (post.author.toString() !== req.user.id) {
            return res.status(401).json("You can only edit your own posts");
        }

        // Update content
        if (req.body.content) {
            post.content = req.body.content;
            post.hashtags = extractHashtags(req.body.content); // Re-extract hashtags
        }
        
        // (Optional) Update location if sent
        if (req.body.location) post.location = req.body.location;

        await post.save();
        res.status(200).json(post);
    } catch (err) { res.status(500).json(err); }
});

// --- 3. GET ALL POSTS (Infinite Scroll) ---
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5; // Number of posts per load
    const skip = (page - 1) * limit;

    try {
        const posts = await Post.find()
            .populate('author', 'username profilePic')
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit);
        res.status(200).json(posts);
    } catch (err) { res.status(500).json(err); }
});

// --- 4. GET USER POSTS ---
router.get('/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId })
            .populate('author', 'username profilePic')
            .sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) { res.status(500).json(err); }
});

// --- 5. GET POSTS BY HASHTAG ---
router.get('/tag/:tag', async (req, res) => {
    try {
        const posts = await Post.find({ hashtags: req.params.tag })
            .populate('author', 'username profilePic')
            .sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) { res.status(500).json(err); }
});

// --- 6. DELETE POST ---
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json("Post not found");
        
        if (post.author.toString() !== req.user.id) {
            return res.status(401).json("Not authorized");
        }
        
        await post.deleteOne();
        res.status(200).json("Deleted");
    } catch (err) { res.status(500).json(err); }
});

// --- 7. LIKE / UNLIKE ---
router.put('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post.likes.includes(req.user.id)) {
            await post.updateOne({ $push: { likes: req.user.id } });
            res.status(200).json("Liked");
        } else {
            await post.updateOne({ $pull: { likes: req.user.id } });
            res.status(200).json("Unliked");
        }
    } catch (err) { res.status(500).json(err); }
});

// --- 8. ADD COMMENT ---
router.post('/:id/comment', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        const newComment = {
            user: req.user.id,
            text: req.body.text,
            createdAt: new Date()
        };
        post.comments.push(newComment);
        await post.save();
        res.status(200).json(post);
    } catch (err) { res.status(500).json(err); }
});

// --- 9. SAVE / UNSAVE POST ---
router.put('/:id/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user.saved.includes(req.params.id)) {
            await user.updateOne({ $push: { saved: req.params.id } });
            res.status(200).json("Saved");
        } else {
            await user.updateOne({ $pull: { saved: req.params.id } });
            res.status(200).json("Unsaved");
        }
    } catch (err) { res.status(500).json(err); }
});

module.exports = router;