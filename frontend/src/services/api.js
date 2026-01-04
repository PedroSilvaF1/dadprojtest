 import axios from 'axios';

// const apiDomain = import.meta.env.VITE_API_DOMAIN;

// For deployment
// const apiDomain = 'https://api-dad-group-34-172.22.21.253.sslip.io';

// Criação da instância do Axios
const api = axios.create({
  baseURL: `/api`,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE para apanhar o erro 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sessão expirada. A redirecionar para login...');

      localStorage.removeItem('token');

      // localStorage.removeItem('user');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
