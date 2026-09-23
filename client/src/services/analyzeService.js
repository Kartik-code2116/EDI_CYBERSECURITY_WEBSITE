import api from './api';
import axios from 'axios';

export const analyzeUrl = (url) => api.post('/analyze/url', { url });

export const analyzeDocument = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

// Calls FastAPI backend (port 8000) via Vite /ai-api proxy
export const analyzeImage = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post('/ai-api/api/analyze/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};
