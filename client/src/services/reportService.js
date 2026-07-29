import api from './api';

export const getHistory = (params) => api.get('/history', { params });
export const getStats = () => api.get('/history/stats');
export const getScan = (id) => api.get(`/history/${id}`);
export const deleteScan = (id) => api.delete(`/history/${id}`);

export const getReports = () => api.get('/report');
export const downloadReport = (scanId) =>
  api.get(`/report/${scanId}`, { responseType: 'blob' });

export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);
export const changePassword = (data) => api.put('/profile/password', data);
export const deleteAccount = () => api.delete('/profile');

export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminScans = (params) => api.get('/admin/scans', { params });
