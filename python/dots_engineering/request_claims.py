"""Owner-reported request action claims; no execution or verified-result transition."""
import base64
import hashlib
import hmac
import json
import secrets
import uuid
from datetime import datetime, timezone
from .contracts import Rejected, IDENTIFIER, HASH, REVISION, obj, text, enum, validate, digest, sanitize
from .owner_reviews import connect
from .source_inventory import tables

FORMAT = 'dots-request-action-claim'
TABLES = {'rc_schema', 'rc_claims', 'rc_revisions', 'rc_operations', 'rc_audit'}
REQUEST = text(611, pattern=r'^commitment:[A-Za-z0-9_.:-]{1,600}$')
POSITIVE = {'type': 'integer'}
EVIDENCE = obj({'reviewId': IDENTIFIER, 'reviewVersion': POSITIVE, 'reviewExportDigest': HASH,
                'eventId': IDENTIFIER, 'eventDigest': HASH, 'analysisVersion': text(100),
                'codeRevision': REVISION, 'relation': enum('supports', 'contradicts', 'context'),
                'hashAlgorithm': {'const': 'stored-json-digest-v1'}})
REPORT = {'sourceRequestId': REQUEST, 'sourceRequestVersion': POSITIVE, 'sourceRequestHash': HASH,
          'requestHashAlgorithm': {'const': 'node-stored-json-sha256-v1'}, 'projectId': IDENTIFIER,
          'actionSummary': text(), 'expectedResult': text(),
          'performance': enum('reported_performed', 'unknown'),
          'reportedResult': enum('pass', 'fail', 'gap', 'blocked', 'unknown')}


def now(): return datetime.now(timezone.utc).isoformat()


def initialized(db):
    present = tables(db) & TABLES
    if not present: return False
    if present != TABLES or db.execute('SELECT version FROM rc_schema').fetchall() != [(1,)]:
        raise Rejected('Action claim schema unavailable', 503)
    expected = {f'{t}_{op}' for t in TABLES for op in ('update', 'delete')}
    triggers = {r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='trigger'")}
    if not expected <= triggers: raise Rejected('Action claim immutability guards unavailable', 503)
    return True


def migrate(filename, owner):
    db = connect(filename, owner, True)
    try:
        if not initialized(db):
            for statement in (
                'CREATE TABLE rc_schema(version INTEGER NOT NULL, cursor_key TEXT NOT NULL)',
                'CREATE TABLE rc_claims(id TEXT PRIMARY KEY, request_id TEXT NOT NULL, project_id TEXT NOT NULL)',
                'CREATE TABLE rc_revisions(sequence INTEGER PRIMARY KEY, claim_id TEXT NOT NULL REFERENCES rc_claims(id), revision INTEGER NOT NULL, data TEXT NOT NULL, UNIQUE(claim_id,revision))',
                'CREATE TABLE rc_operations(id TEXT PRIMARY KEY, request_id TEXT NOT NULL, hash TEXT NOT NULL, response TEXT NOT NULL)',
                'CREATE TABLE rc_audit(sequence INTEGER PRIMARY KEY, operation_id TEXT UNIQUE NOT NULL, data TEXT NOT NULL)',
            ): db.execute(statement)
            db.execute('INSERT INTO rc_schema VALUES(1,?)', (secrets.token_hex(32),))
            for table in TABLES:
                for op in ('update', 'delete'):
                    db.execute(f"CREATE TRIGGER {table}_{op} BEFORE {op.upper()} ON {table} BEGIN SELECT RAISE(ABORT,'Action claim history is immutable'); END")
        db.commit()
    finally: db.close()


def normalize(body):
    if not isinstance(body, dict): raise Rejected()
    action = body.get('action')
    common = {'format': {'const': FORMAT}, 'schemaVersion': {'const': 1}, 'operationId': IDENTIFIER,
              'action': enum('create', 'correct', 'withdraw')}
    if action in ('correct', 'withdraw'): common.update(claimId=IDENTIFIER, expectedRevision=POSITIVE, reason=text(500))
    if action != 'withdraw': common.update(REPORT, reportedAt={}, evidence={})
    validate(body, obj(common))
    for key in ('expectedRevision', 'sourceRequestVersion'):
        if key in body and (type(body[key]) is not int or body[key] < 1): raise Rejected('Invalid version')
    if action != 'withdraw':
        value = body['reportedAt']
        if value is not None:
            validate(value, text(40, format='date-time'))
        if body['evidence'] is not None:
            validate(body['evidence'], EVIDENCE)
            if type(body['evidence']['reviewVersion']) is not int or body['evidence']['reviewVersion'] < 1: raise Rejected('Invalid review version')
    for key in ('actionSummary', 'expectedResult', 'reason'):
        if key in body and sanitize(body[key]) != body[key]:
            raise Rejected('Sanitized preview for '+key+': '+sanitize(body[key])+'. Resubmit explicitly.', 400)
    return {k: v for k, v in body.items() if k != 'operationId'}


def evidence_target(db, owner, review_id, event_id):
    if 'reviews' not in tables(db): raise Rejected('Review schema unavailable', 503)
    row = db.execute('SELECT data FROM reviews WHERE id=?', (review_id,)).fetchone()
    if row is None: raise Rejected('Review missing', 404)
    review = json.loads(row[0])
    if review['export']['ownerId'] != owner: raise Rejected('Review not authorized', 403)
    if review['id'] != review_id: raise Rejected('Review identity unavailable', 503)
    event = next((e for e in review['export']['events'] if e['id'] == event_id), None)
    if event is None: raise Rejected('Event missing', 404)
    if event['kind'] not in ('action', 'claim', 'evidence'): raise Rejected('Unsupported evidence kind')
    pins = {'reviewId': review_id, 'reviewVersion': review['version'], 'reviewExportDigest': digest(review['export']),
            'eventId': event_id, 'eventDigest': digest(event), 'analysisVersion': review['analysisVersion'],
            'codeRevision': event['codeRevision'], 'hashAlgorithm': 'stored-json-digest-v1'}
    return {'pins': pins, 'projectId': review['export']['projectId'], 'event': event,
            'attribution': event.get('attribution', 'unknown'), 'basis': event.get('basis', 'unknown'), 'observedAt': now()}


def request_target(sources, request_id):
    if not sources or sources.get('state') == 'unavailable': raise Rejected('Request target unavailable', 503)
    row = sources.get('request')
    if row is None: raise Rejected('Request missing', 404)
    if row['id'] != request_id: raise Rejected('Request projection mismatch', 503)
    return row


def relevance(db, owner, record, sources):
    if record.get('ownerId') != owner: raise Rejected('Claim not authorized', 403)
    def state(fn, pins):
        try:
            current = fn()
            mismatches = [k for k, v in pins.items() if current.get(k) != v]
            return {'state': 'stale' if mismatches else 'matching_at_read', 'mismatches': mismatches}
        except Rejected as e:
            if e.status == 403: raise
            return {'state': 'missing' if e.status == 404 else 'unavailable', 'mismatches': []}
    req = state(lambda: request_target(sources, record['sourceRequestId']),
                {'version': record['sourceRequestVersion'], 'hash': record['sourceRequestHash']})
    ev = record['evidence']
    evidence = state(lambda: evidence_target(db, owner, ev['reviewId'], ev['eventId'])['pins'],
                     {k: v for k, v in ev.items() if k != 'relation'}) if ev else {'state': 'not_bound', 'mismatches': []}
    return {**record, 'requestState': req, 'evidenceState': evidence}


def cursor(db, owner, request_id, scope, ceiling, offset):
    value = {'owner': owner, 'request': request_id, 'scope': scope, 'ceiling': ceiling, 'offset': offset}
    raw = json.dumps(value, sort_keys=True, separators=(',', ':')).encode()
    key = db.execute('SELECT cursor_key FROM rc_schema').fetchone()[0].encode()
    return base64.urlsafe_b64encode(raw).decode()+'.'+hmac.new(key, raw, hashlib.sha256).hexdigest()


def page(db, owner, request_id, scope, token):
    maximum = db.execute('SELECT COALESCE(MAX(sequence),0) FROM rc_revisions').fetchone()[0]
    if not token: return maximum, 0
    try:
        raw, signature = token.split('.')
        data = json.loads(base64.b64decode(raw, altchars=b'-_', validate=True))
        if (set(data) != {'owner','request','scope','ceiling','offset'} or data['owner'] != owner or data['request'] != request_id or data['scope'] != scope
            or type(data['ceiling']) is not int or not 0 <= data['ceiling'] <= maximum or type(data['offset']) is not int or not 0 <= data['offset'] <= 1000 or data['offset'] % 50): raise ValueError()
        if not hmac.compare_digest(token, cursor(db, owner, request_id, scope, data['ceiling'], data['offset'])): raise ValueError()
        return data['ceiling'], data['offset']
    except (ValueError, KeyError, TypeError): raise Rejected('Invalid action claim cursor')


def handle_claims(filename, owner, principal, method, body, sources, allowed=False):
    if not owner or owner != principal: raise Rejected('Owner required', 401)
    if method not in ('CLAIMS_GET', 'CLAIMS_POST'): raise Rejected('Method not allowed', 405)
    write = method == 'CLAIMS_POST'
    if write and not allowed: raise Rejected('Action claim writes disabled', 403)
    normalized = normalize(body) if write else None
    db = connect(filename, owner, write)
    try:
        if not initialized(db): raise Rejected('Action claim schema unavailable; explicit migration required', 503)
        if not write:
            query = body or {}
            if set(query)-{'sourceRequestId','claimId','cursor','operationId','reviewId','eventId','revision'}: raise Rejected()
            request_id = query.get('sourceRequestId'); validate(request_id, REQUEST)
            if 'operationId' in query:
                validate(query['operationId'], IDENTIFIER)
                row = db.execute('SELECT hash,response FROM rc_operations WHERE id=? AND request_id=?', (query['operationId'],request_id)).fetchone()
                return {'operation': {'state': 'committed', 'payloadDigest': row[0], 'response': json.loads(row[1])} if row else {'state': 'unknown'}}
            if 'reviewId' in query or 'eventId' in query:
                validate(query.get('reviewId'), IDENTIFIER); validate(query.get('eventId'), IDENTIFIER)
                return {'candidate': evidence_target(db, owner, query['reviewId'], query['eventId'])}
            claim_id = query.get('claimId')
            if claim_id:
                validate(claim_id, IDENTIFIER)
                if not db.execute('SELECT 1 FROM rc_claims WHERE id=? AND request_id=?',(claim_id,request_id)).fetchone(): raise Rejected('Claim missing',404)
            ceiling, offset = page(db, owner, request_id, claim_id or 'claims', query.get('cursor'))
            if claim_id:
                rows = db.execute('SELECT r.data FROM rc_revisions r JOIN rc_claims c ON c.id=r.claim_id WHERE c.request_id=? AND c.id=? AND r.sequence<=? ORDER BY r.sequence DESC', (request_id,claim_id,ceiling)).fetchall()
            else:
                rows = db.execute('SELECT r.data FROM rc_revisions r JOIN rc_claims c ON c.id=r.claim_id WHERE c.request_id=? AND r.sequence=(SELECT MAX(x.sequence) FROM rc_revisions x WHERE x.claim_id=c.id AND x.sequence<=?) ORDER BY r.sequence DESC', (request_id,ceiling)).fetchall()
            selected = [json.loads(row[0]) for row in rows]
            if 'revision' in query:
                value = query['revision']
                if not claim_id or not isinstance(value,str) or not value.isdigit() or not 1 <= int(value) <= 1000: raise Rejected('Invalid revision')
                selected = [r for r in selected if r['revision']==int(value)]
            visible = [relevance(db, owner, r, sources) for r in selected[offset:offset+50]]
            operations = db.execute('SELECT id,response FROM rc_operations WHERE request_id=? ORDER BY rowid DESC LIMIT 50',(request_id,)).fetchall()
            return {'writeEnabled': allowed, 'basis':'owner_reported', 'records':visible, 'request': sources,
                    'page':{'ceiling':ceiling,'offset':offset,'total':len(selected),'next':cursor(db,owner,request_id,claim_id or 'claims',ceiling,offset+50) if offset+50<len(selected) else None},
                    'recentOperations':[{'operationId':r[0],**json.loads(r[1])} for r in operations], 'operationScope':'Latest 50 operations for this request; older operation IDs remain individually queryable'}
        operation_id = body['operationId']; payload_hash = digest(normalized)
        previous = db.execute('SELECT hash,response FROM rc_operations WHERE id=?',(operation_id,)).fetchone()
        if previous:
            if previous[0] != payload_hash: raise Rejected('Operation conflicts with prior content',409)
            return json.loads(previous[1])
        action = normalized['action']; previous_record = None
        if action != 'create':
            row = db.execute('SELECT data FROM rc_revisions WHERE claim_id=? ORDER BY revision DESC LIMIT 1',(body['claimId'],)).fetchone()
            if not row: raise Rejected('Claim missing',404)
            previous_record = json.loads(row[0])
            if previous_record.get('ownerId') != owner: raise Rejected('Claim not authorized',403)
            if previous_record['revision'] != body['expectedRevision'] or previous_record['lifecycle'] == 'withdrawn': raise Rejected('Claim head changed or withdrawn',409)
            if previous_record['revision'] >= 1000: raise Rejected('Claim revision retention bound reached',409)
        if action == 'withdraw':
            record = {**previous_record, 'lifecycle':'withdrawn'}
        else:
            target = request_target(sources, body['sourceRequestId'])
            if target['version'] != body['sourceRequestVersion'] or target['hash'] != body['sourceRequestHash']: raise Rejected('Request pins changed',409)
            if previous_record and any(previous_record[k] != body[k] for k in ('sourceRequestId','projectId')): raise Rejected('Request/project identity immutable',409)
            evidence = body['evidence']; observed = None
            if evidence:
                observed = evidence_target(db,owner,evidence['reviewId'],evidence['eventId'])
                if observed['projectId'] != body['projectId']: raise Rejected('Project differs',403)
                if any(observed['pins'][k] != v for k,v in evidence.items() if k!='relation'): raise Rejected('Evidence pins changed',409)
            record = {k:body[k] for k in (*REPORT.keys(),'reportedAt','evidence')}
            record.update(evidenceSnapshot=observed, requestObservedAt=sources['observedAt'], lifecycle='active')
        claim_id = previous_record['claimId'] if previous_record else 'claim-'+uuid.uuid4().hex
        if not previous_record:
            if db.execute('SELECT COUNT(*) FROM rc_claims WHERE request_id=?',(body['sourceRequestId'],)).fetchone()[0]>=1000: raise Rejected('Request claim retention bound reached',409)
            db.execute('INSERT INTO rc_claims VALUES(?,?,?)',(claim_id,body['sourceRequestId'],body['projectId']))
        revision = previous_record['revision']+1 if previous_record else 1
        record.update(claimId=claim_id,revision=revision,ownerId=owner,basis='owner_reported',actor='unknown',recordedAt=now(),predecessorRevision=revision-1 if previous_record else None,reason=body.get('reason'),operationId=operation_id)
        data = json.dumps(record)
        db.execute('INSERT INTO rc_revisions(claim_id,revision,data) VALUES(?,?,?)',(claim_id,revision,data))
        response = {'ok':True,'claimId':claim_id,'revision':revision,'sourceRequestId':record['sourceRequestId'],'basis':'owner_reported','executed':False,'payloadDigest':payload_hash,'operationId':operation_id}
        db.execute('INSERT INTO rc_operations VALUES(?,?,?,?)',(operation_id,record['sourceRequestId'],payload_hash,json.dumps(response)))
        db.execute('INSERT INTO rc_audit(operation_id,data) VALUES(?,?)',(operation_id,data))
        db.commit()
        return response
    finally: db.close()
