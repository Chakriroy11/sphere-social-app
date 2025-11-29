import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users/';

const getToken = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.token;
};

const getUser = async (userId) => {
    return await axios.get(API_URL + userId);
};

const searchUsers = async (query) => {
    return await axios.get(API_URL + 'search/' + query);
};

const followUser = async (userId) => {
    const token = getToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };
    return await axios.put(API_URL + userId + '/follow', {}, config);
};

const updateUser = async (userId, userData) => {
    const token = getToken();
    const config = { 
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
        } 
    };
    return await axios.put(API_URL + userId, userData, config);
};

const userService = { getUser, searchUsers, followUser, updateUser };
export default userService;