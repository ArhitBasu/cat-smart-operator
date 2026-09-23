import client from './client';

export const getDashboard = async (machineId) => {
  const response = await client.get(`/api/dashboard/${machineId}`);
  return response.data;
};
