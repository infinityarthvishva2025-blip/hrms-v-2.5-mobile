import client from './client';

export const getMyAnnouncements = (params) => client.get('/announcements/my', { params });
export const getAllAnnouncements = (params) => client.get('/announcements', { params });
export const getUnreadCount = () => client.get('/announcements/unread-count');
export const markAsRead = (id) => client.patch(`/announcements/${id}/read`);
export const createAnnouncement = (data) => client.post('/announcements', data);
export const updateAnnouncement = (id, data) => client.patch(`/announcements/${id}`, data);
export const deleteAnnouncement = (id) => client.delete(`/announcements/${id}`);
