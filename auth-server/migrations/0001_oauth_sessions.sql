CREATE TABLE IF NOT EXISTS oauth_sessions (
  id TEXT PRIMARY KEY,
  state TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verifying', 'not_member', 'completed', 'failed')),
  expires_at INTEGER NOT NULL,
  result_json TEXT,
  code TEXT
);

CREATE INDEX IF NOT EXISTS oauth_sessions_expiry
  ON oauth_sessions (expires_at);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES oauth_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS oauth_states_expiry
  ON oauth_states (expires_at);

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  rate_key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
