import client from './client';

export const getIncidents = async () => {
  const response = await client.get('/api/incidents');
  return response.data;
};

export const reportIncident = async (data) => {
  const response = await client.post('/api/incidents', data);
  return response.data;
};
