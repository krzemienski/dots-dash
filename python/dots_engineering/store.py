"""Physically separate SQLite ledger with owner binding and atomic audit/replay."""
import json
import os
import sqlite3
from pathlib import Path
from .contracts import Rejected


class Store:
    def __init__(self, filename, owner):
        if filename != ":memory:":
            path = Path(filename)
            path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            if path.is_symlink():
                raise Rejected("Storage path rejected", 503)
            descriptor = os.open(path, os.O_CREAT | os.O_WRONLY, 0o600)
            os.close(descriptor)
            path.chmod(0o600)
        self.db = sqlite3.connect(filename, timeout=5)
        self.db.row_factory = sqlite3.Row
        self.db.executescript("""
            PRAGMA foreign_keys=ON;
            CREATE TABLE IF NOT EXISTS owner_binding (id INTEGER PRIMARY KEY CHECK(id=1), owner TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY, data TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS operations (id TEXT PRIMARY KEY, hash TEXT NOT NULL, response TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS audit (sequence INTEGER PRIMARY KEY, operation TEXT NOT NULL, review_id TEXT NOT NULL, version INTEGER NOT NULL, snapshot TEXT NOT NULL, recorded_at TEXT NOT NULL);
        """)
        with self.db:
            self.db.execute("INSERT OR IGNORE INTO owner_binding VALUES (1,?)", (owner,))
            if self.db.execute("SELECT owner FROM owner_binding").fetchone()[0] != owner:
                self.db.close()
                raise Rejected("Owner storage mismatch", 403)

    def index(self):
        rows = self.db.execute("SELECT id, json_extract(data,'$.version'), json_extract(data,'$.export.sessionId'), json_extract(data,'$.export.projectId') FROM reviews ORDER BY rowid DESC LIMIT 50")
        return [{"id": row[0], "version": row[1], "sessionId": row[2], "projectId": row[3]} for row in rows]

    def get(self, review_id):
        row = self.db.execute("SELECT data FROM reviews WHERE id=?", (review_id,)).fetchone()
        if row is None:
            raise Rejected("Review not found", 404)
        return json.loads(row[0])

    def save(self, review, operation, now):
        data = json.dumps(review)
        self.db.execute("INSERT INTO reviews VALUES (?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data", (review["id"], data))
        self.db.execute("INSERT INTO audit(operation,review_id,version,snapshot,recorded_at) VALUES (?,?,?,?,?)",
                        (operation, review["id"], review["version"], data, now))

    def mutate(self, request_id, payload_hash, action):
        self.db.execute("BEGIN IMMEDIATE")
        try:
            previous = self.db.execute("SELECT hash,response FROM operations WHERE id=?", (request_id,)).fetchone()
            if previous:
                if previous["hash"] != payload_hash:
                    raise Rejected("Request ID conflicts with prior content", 409)
                response = json.loads(previous["response"])
                response["duplicate"] = True
            else:
                response = action()
                self.db.execute("INSERT INTO operations VALUES (?,?,?)", (request_id, payload_hash, json.dumps(response)))
            self.db.commit()
            return response
        except BaseException:
            self.db.rollback()
            raise

    def close(self):
        self.db.close()
