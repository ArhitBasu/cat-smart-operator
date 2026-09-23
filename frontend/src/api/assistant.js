import client from './client';

export const explainAlert = async (machineId) => {
  const response = await client.post('/api/assistant/explain-alert', {
    machine_id: machineId
  });
  return response.data;
};

export const askAssistant = async (message, machineId) => {
  const response = await client.post('/api/assistant', {
    message,
    machine_id: machineId
  });
  return response.data;
};
