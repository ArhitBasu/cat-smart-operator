import client from './client';

export const predictTask = async (data) => {
  const response = await client.post('/api/task/predict', data);
  return response.data;
};
