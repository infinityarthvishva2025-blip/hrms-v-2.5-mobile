import client from './client';

export const getMyLeaves = (params) => client.get('/leaves/my', { params });
export const applyLeave = (data) => client.post('/leaves/apply', data);
export const getLeaveStats = () => client.get('/leaves/stats');
export const getPendingLeaves = () => client.get('/leaves/pending');
export const approveLeave = (id, data) => client.patch(`/leaves/${id}/approve`, data);
export const rejectLeave = (id, data) => client.patch(`/leaves/${id}/reject`, data);
export const cancelLeave = (id) => client.patch(`/leaves/${id}/cancel`);
export const getAllLeaves = (params) => client.get('/leaves/all', { params });
