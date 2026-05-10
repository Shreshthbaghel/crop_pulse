import mqtt from 'mqtt';

// 1. Read ALL credentials from environment variables
const host = import.meta.env.VITE_HIVEMQ_HOST;
const port = import.meta.env.VITE_HIVEMQ_PORT;
const username = import.meta.env.VITE_HIVEMQ_USERNAME;
const password = import.meta.env.VITE_HIVEMQ_PASSWORD;
const topic = import.meta.env.VITE_MQTT_TOPIC;

let client = null;

// 2. Validate env vars exist
const validateEnv = () => {
  const missing = [];
  if (!host) missing.push('VITE_HIVEMQ_HOST');
  if (!port) missing.push('VITE_HIVEMQ_PORT');
  if (!username) missing.push('VITE_HIVEMQ_USERNAME');
  if (!password) missing.push('VITE_HIVEMQ_PASSWORD');
  if (!topic) missing.push('VITE_MQTT_TOPIC');
  
  if (missing.length > 0) {
    console.error(`[MQTT] Missing ENV variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

export const mqttService = {
  connect: (onMessage, onConnect, onError) => {
    if (!validateEnv()) return;

    // 3. Build the WSS URL required for browsers
    const connectUrl = `wss://${host}:${port}/mqtt`;
    
    console.log(`[MQTT] Connecting to HiveMQ: ${connectUrl}`);

    // 4. Create the client with secure browser options
    client = mqtt.connect(connectUrl, {
      username,
      password,
      clientId: 'croppulse_' + Math.random().toString(16).substr(2, 8),
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      protocol: 'wss'
    });

    client.on('connect', () => {
      console.log('%c[MQTT] Connected to HiveMQ successfully', 'color: #22c55e; font-weight: bold;');
      client.subscribe(topic, (err) => {
        if (!err) {
          console.log(`[MQTT] Subscribed to topic: ${topic}`);
          if (onConnect) onConnect();
        } else {
          console.error(`[MQTT] Subscription error: ${err}`);
        }
      });
    });

    client.on('message', (receivedTopic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log(`[MQTT] Message received on ${receivedTopic}:`, payload);
        if (onMessage) onMessage(receivedTopic, payload);
      } catch (e) {
        console.error('[MQTT] Failed to parse JSON payload:', message.toString());
      }
    });

    client.on('error', (err) => {
      console.error('[MQTT] Connection Error:', err.message);
      if (onError) onError(err);
    });

    client.on('reconnect', () => {
      console.warn('[MQTT] Reconnecting to HiveMQ...');
    });

    client.on('close', () => {
      console.log('[MQTT] Connection closed');
    });
  },

  disconnect: () => {
    if (client) {
      console.log('[MQTT] Disconnecting...');
      client.end();
    }
  },

  isConnected: () => {
    return client ? client.connected : false;
  }
};
