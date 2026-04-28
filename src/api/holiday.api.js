import client from './client';

export const getAllHolidays = () => client.get('/holidays');
export const createHoliday = (data) => client.post('/holidays', data);
export const updateHoliday = (id, data) => client.put(`/holidays/${id}`, data);
export const deleteHoliday = (id) => client.delete(`/holidays/${id}`);
