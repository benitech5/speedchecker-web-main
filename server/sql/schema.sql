-- Fleet Monitor schema (Task 1)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS gps_readings CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS rule_states CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS planned_routes CASCADE;

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number VARCHAR(32) NOT NULL UNIQUE,
  label VARCHAR(120) NOT NULL,
  speed_limit_kmh INTEGER NOT NULL DEFAULT 80,
  status VARCHAR(20) NOT NULL DEFAULT 'offline'
    CHECK (status IN ('idle', 'active', 'offline')),
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed')),
  speed_limit_kmh INTEGER,
  risk_score INTEGER,
  risk_label VARCHAR(20)
    CHECK (risk_label IS NULL OR risk_label IN ('low', 'medium', 'high')),
  risk_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE gps_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_kmh DOUBLE PRECISION,
  distance_m DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('restricted', 'allowed')),
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  type VARCHAR(40) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task 2: open-event state for alert deduplication (one event = one alert)
CREATE TABLE rule_states (
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  rule_key VARCHAR(120) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vehicle_id, trip_id, rule_key)
);

CREATE TABLE planned_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gps_vehicle_recorded ON gps_readings (vehicle_id, recorded_at DESC);
CREATE INDEX idx_gps_trip_recorded ON gps_readings (trip_id, recorded_at ASC);
CREATE INDEX idx_trips_vehicle_status ON trips (vehicle_id, status);
CREATE INDEX idx_alerts_vehicle ON alerts (vehicle_id, created_at DESC);
CREATE INDEX idx_alerts_type ON alerts (type, created_at DESC);
CREATE INDEX idx_rule_states_trip ON rule_states (trip_id);
