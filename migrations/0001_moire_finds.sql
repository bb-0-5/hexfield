-- Build 362: the moire painter's shared memory (D1 database hexfield-moire, bound as MOIRE).
-- Per kind of painting, the finds every visitor's browser sends: its genes, the score it claimed, the genome version, and when.
CREATE TABLE IF NOT EXISTS finds (kind TEXT NOT NULL, genes TEXT NOT NULL, score REAL NOT NULL, version INTEGER NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (kind, genes));
CREATE INDEX IF NOT EXISTS finds_by_kind ON finds (version, kind, score DESC);
