import { useState, useEffect, useCallback, useRef } from 'react';
import { supabaseApi } from '../../services/supabaseApi';
import { useMQTT } from '../../contexts/MQTTContext';

export const STATES = {
  IDLE: 'IDLE',
  CONFIRMING: 'CONFIRMING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  ERROR: 'ERROR'
};

export const useIrrigationCycle = ({ 
  zoneId, 
  zoneName, 
  defaultDuration = 20, 
  maxDuration = 60,
  soilMoistureLevel,
  onCycleStart,
  onCycleStop,
  onCycleComplete
}) => {
  const { sensorData } = useMQTT();
  const [state, setState] = useState(STATES.IDLE);
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(defaultDuration * 60);
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const timerRef = useRef(null);
  const logRef = useRef(null);
  const cooldownRef = useRef(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (logRef.current) clearInterval(logRef.current);
  };

  const startCycle = async () => {
    if (soilMoistureLevel > 75) {
      alert("Soil moisture is high enough (>75%). Irrigation blocked.");
      return;
    }

    if (cooldown > 0) return;

    setIsApiLoading(true);
    try {
      const session = await supabaseApi.startSession({
        zone_id: zoneId,
        zone_name: zoneName,
        duration_set: defaultDuration,
        status: 'running',
        triggered_by: 'manual'
      });
      
      setSessionId(session.id);
      setState(STATES.RUNNING);
      setElapsed(0);
      setRemaining(defaultDuration * 60);
      if (onCycleStart) onCycleStart(zoneId);
    } catch (err) {
      console.error("Failed to start session:", err);
      setState(STATES.ERROR);
      setErrorMsg("Failed to initialize session in database.");
    } finally {
      setIsApiLoading(false);
    }
  };

  const stopCycle = async (finalStatus = 'stopped') => {
    setIsApiLoading(true);
    try {
      if (sessionId) {
        await supabaseApi.completeSession(sessionId, Math.floor(elapsed / 60), finalStatus);
      }
      stopTimer();
      setState(STATES.IDLE);
      if (onCycleStop) onCycleStop(zoneId, elapsed);
    } catch (err) {
      console.error("Failed to stop session:", err);
    } finally {
      setIsApiLoading(false);
    }
  };

  const handleComplete = useCallback(async () => {
    setIsApiLoading(true);
    try {
      if (sessionId) {
        await supabaseApi.completeSession(sessionId, Math.floor(elapsed / 60), 'completed');
      }
      stopTimer();
      setState(STATES.COMPLETED);
      if (onCycleComplete) onCycleComplete(zoneId);
      
      setCooldown(180);
      cooldownRef.current = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setState(STATES.IDLE);
      }, 4000);
    } catch (err) {
      console.error("Completion log failed:", err);
    } finally {
      setIsApiLoading(false);
    }
  }, [zoneId, onCycleComplete, sessionId, elapsed]);

  // Log reading every 30 seconds
  const performLog = useCallback(async () => {
    if (!sessionId || !sensorData) return;
    try {
      await supabaseApi.logReading({
        session_id: sessionId,
        zone_id: zoneId,
        soil_moisture: sensorData.moisture,
        water_flow_rate: 4.2, // Mock flow rate for demo
        temperature: sensorData.temperature,
        pressure: 2.1, // Mock pressure
        battery_level: sensorData.battery || 85
      });
    } catch (err) {
      console.warn("Log reading failed:", err);
    }
  }, [sessionId, zoneId, sensorData]);

  useEffect(() => {
    if (state === STATES.RUNNING) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          if (next >= maxDuration * 60) {
             handleComplete();
          }
          return next;
        });
        setRemaining(prev => Math.max(0, prev - 1));
      }, 1000);

      logRef.current = setInterval(performLog, 30000);
      // Initial log
      performLog();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [state, performLog, handleComplete, maxDuration]);

  return {
    state,
    setState,
    elapsed,
    remaining,
    isApiLoading,
    errorMsg,
    cooldown,
    startCycle,
    stopCycle
  };
};
