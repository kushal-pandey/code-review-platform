import axios from 'axios'
import { BACKEND_URL } from '../config'; 

const api = axios.create({
  baseURL: BACKEND_URL ,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Axios Error:", error.response?.status, error.config.url);

    const isAuthPath = window.location.pathname.includes('/auth/callback');
    
   
    if (error.response?.status === 401 && !isAuthPath) {
       localStorage.removeItem('token'); 
       window.location.href = '/login';   
    }
    return Promise.reject(error);
  }
);

export default api;