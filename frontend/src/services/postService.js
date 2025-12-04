import axios from 'axios';

// ✅ LIVE BACKEND URL
const BASE_URL = 'https://sphere-backend-2mx3.onrender.com/api/';

const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
};

const authConfig = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
const fileConfig = () => ({ headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'multipart/form-data' } });

const getPosts = (page = 1) => axios.get(BASE_URL + `posts?page=${page}`);
const getPostsByTag = (tag) => axios.get(BASE_URL + `posts/tag/${tag}`);
const getPostsByUser = (userId) => axios.get(BASE_URL + `posts/user/${userId}`);

const createPost = (data) => axios.post(BASE_URL + 'posts/', data, fileConfig());
const likePost = (id) => axios.put(BASE_URL + `posts/${id}/like`, {}, authConfig());
const savePost = (id) => axios.put(BASE_URL + `posts/${id}/save`, {}, authConfig());
const addComment = (id, text) => axios.post(BASE_URL + `posts/${id}/comment`, { text }, authConfig());
const deletePost = (id) => axios.delete(BASE_URL + `posts/${id}`, authConfig());

const getStories = () => axios.get(BASE_URL + 'stories/');
const addStory = (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return axios.post(BASE_URL + 'stories/', formData, fileConfig());
};

const getNotifications = () => axios.get(BASE_URL + 'notifications/', authConfig());
const createNotification = (data) => axios.post(BASE_URL + 'notifications/', data, authConfig());

export default { 
    getPosts, getPostsByTag, getPostsByUser, createPost, 
    likePost, savePost, addComment, deletePost, 
    getStories, addStory, getNotifications, createNotification 
};