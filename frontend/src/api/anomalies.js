import client from './client';

export const getAnomalies = async (machineId) => {
  const response = await client.get(`/api/anomalies/${machineId}`);
  return response.data;
};
