"""Read durable supervision evidence without claiming process ownership/liveness."""
import sqlite3
from .contracts import Rejected


def supervision_status(connection, owner):
    if not connection.execute("SELECT 1 FROM sqlite_master WHERE name='rehearsal_supervision'").fetchone():
        return dict(state="no_workers", workers=0, exitUnconfirmed=0)
    try:
        rows = connection.execute("SELECT owner,state,exit_code FROM rehearsal_supervision").fetchall()
    except sqlite3.DatabaseError as error:
        raise Rejected("Supervision evidence unavailable; lifecycle remains blocked", 409) from error
    unconfirmed = sum(not (
        row[0] == owner and (
            (row[1] == "exited" and type(row[2]) is int)
            or (row[1] == "not_started" and row[2] is None)
        )
    ) for row in rows)
    return dict(state="exit_unconfirmed" if unconfirmed else "settled" if rows else "no_workers",
                workers=len(rows), exitUnconfirmed=unconfirmed)


def require_settled_supervision(connection, owner):
    if supervision_status(connection, owner)["exitUnconfirmed"]:
        raise Rejected("Owned supervised worker exit is not confirmed", 409)
