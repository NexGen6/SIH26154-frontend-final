import axios from 'axios';

const api = axios.create({
     baseURL:
     'https://sih26154-backend-2.onrender.com/api',
     withCredentials: true,
});

export default api;