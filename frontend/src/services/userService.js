import axios from 'axios';

// UPDATED TO RENDER URL
const API_URL = 'https://sphere-backend-2mx3.onrender.com/api/users/';

const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
};

const getUser = (userId) => axios.get(API_URL + userId);
const searchUsers = (query) => axios.get(API_URL + 'search/' + query);

const followUser = (userId) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    return axios.put(API_URL + userId + '/follow', {}, config);
};

const updateUser = (userId, data) => {
    const token = getToken();
    const config = { 
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        } 
    };
    return axios.put(API_URL + userId, data, config);
};

const changePassword = (userId, data) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    return axios.put(API_URL + userId + '/password', data, config);
};

const deleteAccount = (userId) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    return axios.delete(API_URL + userId, config);
};

export default { getUser, searchUsers, followUser, updateUser, changePassword, deleteAccount };