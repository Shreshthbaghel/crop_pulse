import { supabase } from '../supabaseClient';

export const supabaseApi = {
  // --- Feature 1: Session Management ---
  
  startSession: async (payload) => {
    const { data, error } = await supabase
      .from("irrigation_sessions")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  logReading: async (reading) => {
    const { error } = await supabase
      .from("irrigation_readings")
      .insert([reading]);
    if (error) throw error;
  },

  completeSession: async (sessionId, actualDuration, status) => {
    const { error } = await supabase
      .from("irrigation_sessions")
      .update({ 
        stopped_at: new Date().toISOString(), 
        duration_actual: actualDuration, 
        status 
      })
      .eq("id", sessionId);
    if (error) throw error;
  },

  // --- Feature 2: Archive Retrieval ---

  fetchReadingsForExport: async (filters) => {
    let query = supabase
      .from("irrigation_readings")
      .select(`
        recorded_at,
        zone_id,
        soil_moisture,
        water_flow_rate,
        temperature,
        pressure,
        battery_level,
        irrigation_sessions(zone_name, status, started_at, stopped_at)
      `)
      .gte("recorded_at", filters.dateFrom)
      .lte("recorded_at", filters.dateTo)
      .order("recorded_at", { ascending: false });

    if (filters.zoneId && filters.zoneId !== 'all') {
      query = query.eq("zone_id", filters.zoneId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  logDownload: async (log) => {
    const { error } = await supabase
      .from("download_archive")
      .insert([log]);
    if (error) throw error;
  },

  getDownloadHistory: async () => {
    const { data, error } = await supabase
      .from("download_archive")
      .select("*")
      .order("downloaded_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data;
  }
};
