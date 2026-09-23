import client from './client';

export const getMachines = async () => {
  const response = await client.get('/api/machines');
  // Backend returns { machines: [{ machine_id, machine_type, status }] }
  return response.data.machines || [];
};

export const getMachineIntelligence = async (machineId) => {
  const response = await client.get(`/api/machine-intelligence/${machineId}`);
  return response.data;
};
