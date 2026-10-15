CREATE TABLE IF NOT EXISTS demo_races (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  race_id TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  selected_horse INTEGER NOT NULL CHECK (selected_horse BETWEEN 1 AND 8),
  winner_horse INTEGER NOT NULL CHECK (winner_horse BETWEEN 1 AND 8),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_demo_races_wallet_created ON demo_races(wallet_address, created_at DESC);
