-- 1. Irrigation Sessions (every cycle logged here)
CREATE TABLE irrigation_sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id       TEXT NOT NULL,
  zone_name     TEXT NOT NULL,
  started_at    TIMESTAMPTZ DEFAULT now(),
  stopped_at    TIMESTAMPTZ,
  duration_set  INTEGER,           -- planned duration in minutes
  duration_actual INTEGER,         -- actual elapsed minutes
  status        TEXT CHECK (status IN ('running', 'completed', 'stopped', 'error')),
  triggered_by  TEXT DEFAULT 'manual',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Sensor Readings (captured during each session)
CREATE TABLE irrigation_readings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id      UUID REFERENCES irrigation_sessions(id) ON DELETE CASCADE,
  zone_id         TEXT NOT NULL,
  recorded_at     TIMESTAMPTZ DEFAULT now(),
  soil_moisture   FLOAT,           -- 0–100 %
  water_flow_rate FLOAT,           -- liters/min
  temperature     FLOAT,           -- °C
  pressure        FLOAT,           -- bar
  battery_level   FLOAT            -- % (for IoT sensors)
);

-- 3. Download Archive Log
CREATE TABLE download_archive (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  downloaded_by TEXT,              -- user id or email
  file_name    TEXT,
  format       TEXT CHECK (format IN ('csv', 'json', 'xlsx')),
  date_from    DATE,
  date_to      DATE,
  row_count    INTEGER,
  downloaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE irrigation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE irrigation_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_archive ENABLE ROW LEVEL SECURITY;

-- Simple RLS Policies (Allow authenticated users)
CREATE POLICY "Allow all for authenticated users" ON irrigation_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON irrigation_readings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON download_archive FOR ALL TO authenticated USING (true);
