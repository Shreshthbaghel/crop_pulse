const BASE_URL = '/api/irrigation';

export const irrigationApi = {
  start: async (zoneId, duration) => {
    const response = await fetch(`${BASE_URL}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId, duration }),
    });
    if (response.status === 409) throw new Error('CONFLICT');
    if (!response.ok) throw new Error('FAILED');
    return response.json();
  },

  stop: async (zoneId) => {
    const response = await fetch(`${BASE_URL}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoneId }),
    });
    if (!response.ok) throw new Error('FAILED');
    return response.json();
  },

  getStatus: async (zoneId) => {
    const response = await fetch(`${BASE_URL}/status/${zoneId}`);
    if (!response.ok) throw new Error('FAILED');
    return response.json();
  }
};
