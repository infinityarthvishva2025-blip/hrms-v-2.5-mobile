import client from './client';

export const getEmployees = (params) => client.get('/employees', { params });
export const getEmployeeById = (id) => client.get(`/employees/${id}`);
export const createEmployee = (data) => client.post('/employees', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateEmployee = (id, data) => client.put(`/employees/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const toggleEmployeeStatus = (id) => client.patch(`/employees/${id}/status`);
export const getDepartments = () => client.get('/employees/departments');
export const getNextEmployeeCode = () => client.get('/employees/next-code');
export const getManagementEmployees = () => client.get('/employees/management');
export const getUpcomingBirthdays = () => client.get('/employees/birthdays/upcoming');
export const updateFaceDescriptor = (data) => client.put('/employees/profile/face-descriptor', data);

