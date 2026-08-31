-- Fixed UUIDs aligned with frontend mock for easy integration
-- Drivers
INSERT INTO drivers (id, name, phone) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Alex Morgan', '+233 20 000 0001'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Jordan Lee', '+233 20 000 0002');

-- Vehicles (Kumasi / Ashanti Region demo)
INSERT INTO vehicles (id, plate_number, label, speed_limit_kmh, status, driver_id) VALUES
  ('11111111-1111-1111-1111-111111111101', 'AB12 CDE', 'Delivery Van 1', 80, 'offline', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
  ('11111111-1111-1111-1111-111111111102', 'XY34 FGH', 'Service Car 2', 80, 'offline', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  ('11111111-1111-1111-1111-111111111103', 'LM56 NPQ', 'Pool Vehicle 3', 80, 'offline', NULL);

-- Geofences (Kumasi)
INSERT INTO geofences (id, name, type, center_lat, center_lng, radius_m) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Company Depot', 'allowed', 6.6885, -1.6244, 250),
  ('44444444-4444-4444-4444-444444444402', 'Restricted Zone A', 'restricted', 6.7020, -1.6050, 180);

-- Planned route (Ashanti demo corridor NE from depot)
INSERT INTO planned_routes (id, name, waypoints) VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    'Kumasi Central Demo Route',
    '[
      {"lat": 6.6885, "lng": -1.6244},
      {"lat": 6.6910, "lng": -1.6200},
      {"lat": 6.6940, "lng": -1.6150},
      {"lat": 6.6970, "lng": -1.6100},
      {"lat": 6.7000, "lng": -1.6060},
      {"lat": 6.7015, "lng": -1.6040},
      {"lat": 6.7025, "lng": -1.6025}
    ]'::jsonb
  );
