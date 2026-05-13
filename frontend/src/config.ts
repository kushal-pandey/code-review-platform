const isProduction = window.location.hostname !== "localhost";

export const BACKEND_URL = isProduction
  ? import.meta.env.VITE_API_URL 
  : "http://localhost:8080";    

export const WS_URL = isProduction
  ? import.meta.env.VITE_WS_URL  
  : "ws://localhost:8080";      