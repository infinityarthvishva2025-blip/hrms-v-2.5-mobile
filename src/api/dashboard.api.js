import client from './client';

export const getEmployeeDashboard = () => client.get('/dashboard/employee-dashboard');
