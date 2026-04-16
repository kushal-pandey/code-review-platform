import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
    // 1. Log the error so we can see WHICH call is failing
    console.error("Axios Error:", error.response?.status, error.config.url);

    // 2. Only redirect if it's a 401 AND we aren't currently authenticating
    const isAuthPath = window.location.pathname.includes('/auth/callback');
    
    if (error.response?.status === 401 && !isAuthPath) {
      console.warn("401 detected. NOT removing token yet for debugging.");
       localStorage.removeItem('token'); // COMMENT THIS OUT TEMPORARILY
       window.location.href = '/login';   // COMMENT THIS OUT TEMPORARILY
    }
    return Promise.reject(error);
  }
);

export default api