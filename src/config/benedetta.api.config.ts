import axios from "axios";

export const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

const api = axios.create({
    baseURL: `${BASE_URL}/`,
});


api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('bb_token');
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
)

export default api;



