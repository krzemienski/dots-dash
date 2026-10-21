/** Local disposable-controller guard; not an identity provider or OS sandbox. */
export function rehearsalGuard(owner, epoch, digest, kind) {
  return sqlite => {
    const row = sqlite.prepare('SELECT * FROM rehearsal_handoff WHERE id=1').get();
    const pending = row?.pending ? JSON.parse(row.pending) : null;
    if (!row || row.owner !== owner || row.writer !== 'node' || row.epoch !== epoch || pending?.hash !== digest ||
        (kind !== undefined && pending?.kind !== kind)) {
      throw new Error('Invalid or stale rehearsal writer lease');
    }
    if (kind !== undefined) {
      const sessions = sqlite.prepare('SELECT owner,version FROM rehearsal_session').all();
      if (sessions.length !== 1 || sessions[0].owner !== owner || sessions[0].version !== 2) throw new Error('Invalid rehearsal session');
    }
  };
}
