import axios from 'axios'

// Determine if we are on Vercel or Localhost
const isProduction = window.location.hostname !== "localhost";
const baseURL = isProduction 
  ? "https://codereview-backend-4fp2.onrender.com" // Your exact Render URL
  : (import.meta.env.VITE_API_URL || "http://localhost:8080");

const api = axios.create({
  baseURL,
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
    
    // Check if it's a 401. 
    // IMPORTANT: Re-enable the redirect logic once you've updated the baseURL above
    if (error.response?.status === 401 && !isAuthPath) {
       localStorage.removeItem('token'); 
       window.location.href = '/login';   
    }
    return Promise.reject(error);
  }
);

export default api;