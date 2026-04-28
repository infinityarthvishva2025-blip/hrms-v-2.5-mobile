import client from './client';

export const getPayrollList = (params) => client.get('/payroll/list', { params });
export const generatePayroll = (data) => client.post('/payroll/generate', data);
export const generateAllPayroll = (data) => client.post('/payroll/generate-all', data);
export const getSalarySlip = (id) => client.get(`/payroll/salary-slip/${id}`);
