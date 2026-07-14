export const MIGRATIONS: string[] = [

  `
  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    unit_count INTEGER,
    region TEXT NOT NULL,
    last_inspected_at TEXT,
    status TEXT NOT NULL,
    version INTEGER NOT NULL,
    synced_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_properties_region ON properties(region);
  CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
  CREATE INDEX IF NOT EXISTS idx_properties_name ON properties(name);

  CREATE TABLE IF NOT EXISTS rooms (
    property_id TEXT NOT NULL,
    id TEXT NOT NULL,
    label TEXT NOT NULL,
    floor INTEGER NOT NULL,
    PRIMARY KEY (property_id, id)
  );

  CREATE TABLE IF NOT EXISTS inspections (
    local_id TEXT PRIMARY KEY,
    server_id TEXT,
    property_id TEXT NOT NULL,
    property_version_at_start INTEGER NOT NULL,
    type TEXT NOT NULL DEFAULT 'routine',
    rooms_json TEXT NOT NULL,
    completed_at INTEGER,
    status TEXT NOT NULL DEFAULT 'draft',
    idempotency_key TEXT,
    conflict_retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
  CREATE INDEX IF NOT EXISTS idx_inspections_property ON inspections(property_id);

  CREATE TABLE IF NOT EXISTS photos (
    local_id TEXT PRIMARY KEY,
    local_uri TEXT NOT NULL,
    inspection_local_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    server_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_photos_inspection ON photos(inspection_local_id);

  CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  `,
];
