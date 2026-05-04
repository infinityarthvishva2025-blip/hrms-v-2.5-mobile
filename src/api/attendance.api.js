import client from './client';

export const checkIn = (data) => client.post('/attendance/check-in', data);
export const checkOut = (data) => client.post('/attendance/check-out', data);
export const getTodayStatus = () => client.get('/attendance/today');
export const getMySummary = (params) => client.get('/attendance/my-summary', { params });
export const getAdminAttendance = (params) => client.get('/attendance/admin', { params });
export const trackLocation = (data) => client.post('/attendance/track', data);
export const requestCorrection = (id, data) => client.post(`/attendance/correction/${id}`, data);
export const getPendingCorrections = () => client.get('/attendance/corrections/pending');
export const approveCorrection = (id, data) => client.patch(`/attendance/correction-approve/${id}`, data);
export const rejectCorrection = (id, data) => client.patch(`/attendance/correction-reject/${id}`, data);
export const markReportAsRead = (id) => client.patch(`/attendance/mark-read/${id}`);
