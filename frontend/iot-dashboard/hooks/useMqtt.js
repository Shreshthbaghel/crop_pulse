'use client';
import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

/**
 * Custom hook to connect to HiveMQ Cloud via WebSockets.
 * @param {string} topic - The MQTT topic to subscribe to.
 */
export const useMqtt = (topic = 'farm/data') => {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    // Prevent multiple connections in dev mode (StrictMode)
    if (clientRef.current) return;

    const url = process.env.NEXT_PUBLIC_HIVEMQ_URL;
    const options = {
      username: process.env.NEXT_PUBLIC_HIVEMQ_USERNAME,
      password: process.env.NEXT_PUBLIC_HIVEMQ_PASSWORD,
      clientId: 'nextjs_client_' + Math.random().toString(16).substring(2, 10),
      reconnectPeriod: 3000,
      connectTimeout: 5000,
      clean: true,
    };

    console.log('🔌 Connecting to HiveMQ:', url);
    const client = mqtt.connect(url, options);
    clientRef.current = client;

    client.on('connect', () => {
      setConnected(true);
      setError(null);
      console.log('✅ Connected to HiveMQ Cloud');
      client.subscribe(topic, (err) => {
        if (!err) console.log(`📡 Subscribed to: ${topic}`);
        else console.error('❌ Subscription error:', err);
      });
    });

    client.on('message', (receivedTopic, message) => {
      if (receivedTopic === topic) {
        try {
          const parsed = JSON.parse(message.toString());
          console.log('📥 MQTT Message Received:', parsed);
          setData(parsed);
        } catch (e) {
          console.error('⚠️ Malformed JSON received:', message.toString());
        }
      }
    });

    client.on('error', (err) => {
      console.error('🔌 MQTT Error:', err.message);
      setError(err.message);
      setConnected(false);
    });

    client.on('offline', () => {
      console.warn('🔌 MQTT Client is offline');
      setConnected(false);
    });

    return () => {
      if (clientRef.current) {
        console.log('🔌 Closing HiveMQ connection');
        clientRef.current.end(true);
        clientRef.current = null;
      }
    };
  }, [topic]);

  return { data, connected, error };
};

export default useMqtt;
