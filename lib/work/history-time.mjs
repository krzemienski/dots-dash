/** Comparison only: never normalize persisted evidence strings or batch hashes. */
export function snapshotInstant(value) {
  const match = typeof value === 'string' && /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,3}))?(Z|([+-])([0-9]{2}):([0-9]{2}))$/.exec(value);
  if (!match || match[0] !== value) throw new Error('Invalid snapshot timestamp; explicit reconciliation required');
  const [, year, month, day, hour, minute, second, fraction, zone, sign, offsetHour, offsetMinute] = match;
  const y = Number(year), mo = Number(month), d = Number(day);
  const h = Number(hour), mi = Number(minute), s = Number(second);
  const oh = Number(offsetHour || 0), om = Number(offsetMinute || 0);
  if (y < 1 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59 || oh > 23 || om > 59) {
    throw new Error('Invalid snapshot timestamp; explicit reconciliation required');
  }
  const local = new Date(0);
  local.setUTCFullYear(y, mo - 1, d);
  local.setUTCHours(h, mi, s, Number((fraction || '').padEnd(3, '0')));
  if (local.getUTCFullYear() !== y || local.getUTCMonth() !== mo - 1 || local.getUTCDate() !== d) {
    throw new Error('Invalid snapshot timestamp; explicit reconciliation required');
  }
  const offset = zone === 'Z' ? 0 : (oh * 60 + om) * (sign === '+' ? 1 : -1);
  return local.getTime() - offset * 60000;
}
