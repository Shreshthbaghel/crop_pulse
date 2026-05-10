import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

export default function useRealtimeData(userId, onNewReading, onNewAlert) {
  useEffect(() => {
    if (!userId) return

    // 1. Subscribe to Live Readings
    const readingsSubscription = supabase
      .channel('live-readings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'readings',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New live reading received:', payload.new)
          if (onNewReading) onNewReading(payload.new)
        }
      )
      .subscribe()

    // 2. Subscribe to Live Alerts
    const alertsSubscription = supabase
      .channel('live-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New live alert received:', payload.new)
          if (onNewAlert) onNewAlert(payload.new)
        }
      )
      .subscribe()

    // 3. Polling Fallback (Every 30 seconds)
    const interval = setInterval(() => {
      // In a real app, you might trigger a manual fetch here 
      // if you detect the websocket is down
    }, 30000)

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(readingsSubscription)
      supabase.removeChannel(alertsSubscription)
      clearInterval(interval)
    }
  }, [userId, onNewReading, onNewAlert])
}
