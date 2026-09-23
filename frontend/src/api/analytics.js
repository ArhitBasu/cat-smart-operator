import client from './client';

export const getAnalytics = async (machineId) => {
  const response = await client.get(`/api/analytics/${machineId}`);
  return response.data;
};
