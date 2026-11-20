-- DEMO-ONLY note for the primary database (connection `primary`). The stack up seed step applies it after `db migrate` (sql/ entry of dev/seeds/seeds.yaml, mode upsert).
-- Idempotent: an existing note is left as it is.
INSERT INTO notes (id, body, created_at) VALUES
    ('00000000-0000-4000-8000-000000000001', 'Welcome to starci-next', '2026-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;
