const router = require('express').Router();
const Message = require('../models/Message');

// Get messages
router.get('/:conversationId', async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.conversationId,
        });
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Save message
router.post('/', async (req, res) => {
    const newMessage = new Message(req.body);
    try {
        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (err) {
        res.status(500).json(err);
    }
});

// NEW: Mark messages as read
router.put('/read/:conversationId', async (req, res) => {
    try {
        // Mark all messages in this conversation as read where I am NOT the sender
        await Message.updateMany(
            { conversationId: req.params.conversationId, sender: { $ne: req.body.username } },
            { $set: { read: true } }
        );
        res.status(200).json("Messages marked as read");
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;