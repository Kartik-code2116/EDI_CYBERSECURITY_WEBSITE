import api from './api';

export const analyzeUrl = (url) => api.post('/analyze/url', { url });

export const analyzeDocument = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/analyze/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};
