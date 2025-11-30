const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'sphere_social',
        allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov'],
        resource_type: 'auto' // Automatically detects images vs videos
    },
});

module.exports = { cloudinary, storage };