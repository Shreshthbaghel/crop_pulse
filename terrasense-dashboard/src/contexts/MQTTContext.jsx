import React, { createContext, useContext, useState, useEffect } from 'react';
import { mqttService } from '../services/mqttService';
import { supabase } from '../supabaseClient';

const MQTTContext = createContext();

export const MQTTProvider = ({ children }) => {
  const [sensorData, setSensorData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);

  useEffect(() => {
    const handleMessage = (topic, data) => {
      setLastUpdated(new Date());

      // Standardize data from MQTT
      const enrichedData = {
        ...data,
        tds: data.tds || (data.ec ? data.ec * 500 : 0),
        time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };

      setSensorData(enrichedData);
      
      // Maintain history
      setSensorHistory(prev => {
        const newHistory = [...prev, enrichedData];
        return newHistory.slice(-50);
      });

      console.log("%c [MQTT] Live Feed Received ", "background: #2D6A4F; color: #fff; font-weight: bold;", enrichedData.time);
      console.log("[MQTT] Received Data Keys:", Object.keys(data));
    };

    const handleConnect = () => {
      setConnectionStatus('connected');
      setErrorMessage(null);
    };

    const handleError = (err) => {
      setConnectionStatus('error');
      setErrorMessage(err.message);
    };

    // Initialize connection
    mqttService.connect(handleMessage, handleConnect, handleError);

    // Cleanup on unmount
    return () => {
      mqttService.disconnect();
    };
  }, []);

  const value = {
    sensorData,
    connectionStatus,
    lastUpdated,
    errorMessage,
    sensorHistory
  };

  return (
    <MQTTContext.Provider value={value}>
      {children}
    </MQTTContext.Provider>
  );
};

export const useMQTT = () => {
  const context = useContext(MQTTContext);
  if (!context) {
    throw new Error('useMQTT must be used within an MQTTProvider');
  }
  return context;
};
