import client from './client';

export const getTrainingModules = async () => {
  const response = await client.get('/api/training');
  return response.data;
};
