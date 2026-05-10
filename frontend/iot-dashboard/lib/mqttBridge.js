import mqtt from 'mqtt';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// 1. Supabase Setup
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use Service Role for backend writes
);

// 2. HiveMQ Setup
const mqttOptions = {
  username: process.env.HIVEMQ_USERNAME,
  password: process.env.HIVEMQ_PASSWORD,
  clientId: 'nodejs_bridge_' + Math.random().toString(16).substr(2, 8),
};

const client = mqtt.connect('mqtts://' + process.env.NEXT_PUBLIC_HIVEMQ_HOST + ':8883', mqttOptions);

client.on('connect', () => {
  console.log('✅ Connected to HiveMQ Cloud');
  client.subscribe('farm/data', (err) => {
    if (!err) console.log('📡 Subscribed to topic: farm/data');
  });
});

client.on('message', async (topic, message) => {
  try {
    const rawData = JSON.parse(message.toString());
    console.log('📥 Received:', rawData);

    // 3. Persist to Supabase
    const { data, error } = await supabase
      .from('sensor_data')
      .insert([
        {
          tds: rawData.tds,
          ec: rawData.ec,
          moisture: rawData.moisture
        }
      ]);

    if (error) console.error('❌ Supabase Error:', error.message);
    else console.log('💾 Data saved to Supabase');

  } catch (e) {
    console.error('⚠️ Failed to parse message:', e.message);
  }
});

client.on('error', (err) => console.error('🔌 Connection Error:', err));
