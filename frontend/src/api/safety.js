import client from './client';

export const getSafety = async (machineId) => {
  const response = await client.get(`/api/safety/${machineId}`);
  return response.data;
};
