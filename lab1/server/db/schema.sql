CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS threats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  source TEXT NOT NULL,
  detected_by TEXT NOT NULL,
  affected_asset TEXT NOT NULL,
  responsible TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  response TEXT NOT NULL,
  detected_at TEXT NOT NULL,
  resolved_at TEXT,
  reporter TEXT NOT NULL,
  comment TEXT,
  owner_id INTEGER NOT NULL,
  owner_username TEXT NOT NULL,
  notification_email TEXT,
  status_reminder_sent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(owner_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_threats_owner_id ON threats(owner_id);
CREATE INDEX IF NOT EXISTS idx_threats_status ON threats(status);
CREATE INDEX IF NOT EXISTS idx_threats_category ON threats(category);

CREATE TABLE IF NOT EXISTS dns_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  ttl INTEGER NOT NULL,
  comment TEXT,
  checksum TEXT NOT NULL,
  updated_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dns_backups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dns_record_id INTEGER,
  action TEXT NOT NULL,
  previous_snapshot TEXT NOT NULL,
  previous_checksum TEXT NOT NULL,
  changed_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(changed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_dns_records_host ON dns_records(host);
CREATE INDEX IF NOT EXISTS idx_dns_backups_record_id ON dns_backups(dns_record_id);
