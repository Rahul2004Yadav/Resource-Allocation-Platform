import os, io, base64
from datetime import datetime, date, timedelta
from functools import wraps

import bcrypt
import qrcode
import json
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)

from db import get_db, init_db

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', 'assetflow_iitr_secret_2026')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, origins=['http://localhost:3000'], supports_credentials=True)
jwt = JWTManager(app)

# ── helpers ──────────────────────────────────────────────────────────────────

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

def audit(conn, user_id, action, entity_type, entity_id=None, details=None):
    try:
        conn.execute(
            "INSERT INTO audit_logs (user_id,action,entity_type,entity_id,details,ip_address) VALUES (?,?,?,?,?,?)",
            (user_id, action, entity_type, entity_id, details, request.remote_addr)
        )
    except Exception:
        pass

def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify(error='Admin access required'), 403
        return fn(*args, **kwargs)
    return wrapper

# ── AUTH ─────────────────────────────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json or {}
    name = data.get('name','').strip()
    email = data.get('email','').lower().strip()
    password = data.get('password','')
    department = data.get('department','')
    if not name or not email or not password:
        return jsonify(error='Name, email and password are required'), 400
    if len(password) < 6:
        return jsonify(error='Password must be at least 6 characters'), 400
    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
        if existing:
            return jsonify(error='Email already registered'), 409
        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        cur = conn.execute(
            "INSERT INTO users (name,email,password_hash,role,department) VALUES (?,?,?,'user',?)",
            (name, email, pw_hash, department)
        )
        conn.commit()
        user = row_to_dict(conn.execute("SELECT id,name,email,role,department FROM users WHERE id=?", (cur.lastrowid,)).fetchone())
        token = create_access_token(identity=str(user['id']), additional_claims={'role': user['role']})
        return jsonify(token=token, user=user), 201
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json or {}
    email = data.get('email','').lower().strip()
    password = data.get('password','')
    if not email or not password:
        return jsonify(error='Email and password are required'), 400
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
            return jsonify(error='Invalid credentials'), 401
        u = {'id':user['id'],'name':user['name'],'email':user['email'],'role':user['role'],'department':user['department']}
        token = create_access_token(identity=str(u['id']), additional_claims={'role': u['role']})
        return jsonify(token=token, user=u)
    finally:
        conn.close()

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def me():
    uid = int(get_jwt_identity())
    conn = get_db()
    try:
        user = row_to_dict(conn.execute("SELECT id,name,email,role,department FROM users WHERE id=?", (uid,)).fetchone())
        return jsonify(user=user)
    finally:
        conn.close()

@app.route('/api/auth/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    uid = int(get_jwt_identity())
    data = request.json or {}
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE id=?", (uid,)).fetchone()
        new_hash = user['password_hash']
        if data.get('newPassword'):
            if not bcrypt.checkpw(data.get('currentPassword','').encode(), user['password_hash'].encode()):
                return jsonify(error='Current password is incorrect'), 400
            new_hash = bcrypt.hashpw(data['newPassword'].encode(), bcrypt.gensalt()).decode()
        conn.execute("UPDATE users SET name=?,department=?,password_hash=? WHERE id=?",
                     (data.get('name', user['name']), data.get('department', user['department']), new_hash, uid))
        conn.commit()
        updated = row_to_dict(conn.execute("SELECT id,name,email,role,department FROM users WHERE id=?", (uid,)).fetchone())
        return jsonify(user=updated)
    finally:
        conn.close()

# ── ASSETS ───────────────────────────────────────────────────────────────────

@app.route('/api/assets', methods=['GET'])
@jwt_required()
def list_assets():
    search = request.args.get('search','')
    category = request.args.get('category','')
    status = request.args.get('status','')
    available_only = request.args.get('available_only','') == 'true'
    conn = get_db()
    try:
        q = "SELECT * FROM assets WHERE 1=1"
        params = []
        if search:
            q += " AND (name LIKE ? OR description LIKE ? OR category LIKE ?)"
            s = f"%{search}%"
            params += [s,s,s]
        if category:
            q += " AND category=?"; params.append(category)
        if status:
            q += " AND status=?"; params.append(status)
        if available_only:
            q += " AND available_quantity>0 AND status='available'"
        q += " ORDER BY category,name"
        assets = rows_to_list(conn.execute(q, params).fetchall())
        return jsonify(assets=assets)
    finally:
        conn.close()

@app.route('/api/assets/categories', methods=['GET'])
@jwt_required()
def list_categories():
    conn = get_db()
    try:
        rows = conn.execute("SELECT DISTINCT category FROM assets ORDER BY category").fetchall()
        return jsonify(categories=[r['category'] for r in rows])
    finally:
        conn.close()

@app.route('/api/assets/<int:aid>', methods=['GET'])
@jwt_required()
def get_asset(aid):
    conn = get_db()
    try:
        asset = row_to_dict(conn.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone())
        if not asset: return jsonify(error='Asset not found'), 404
        maintenance = rows_to_list(conn.execute("""
            SELECT m.*,u.name as reporter_name FROM maintenance_records m
            LEFT JOIN users u ON m.reported_by=u.id WHERE m.asset_id=? ORDER BY m.created_at DESC LIMIT 10
        """, (aid,)).fetchall())
        return jsonify(asset=asset, maintenance=maintenance)
    finally:
        conn.close()

@app.route('/api/assets', methods=['POST'])
@admin_required
def create_asset():
    uid = int(get_jwt_identity())
    data = request.json or {}
    if not data.get('name') or not data.get('category'):
        return jsonify(error='Name and category are required'), 400
    qty = int(data.get('total_quantity', 1))
    conn = get_db()
    try:
        cur = conn.execute("""
            INSERT INTO assets (name,category,description,total_quantity,available_quantity,status,condition,location,created_by)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, (data['name'], data['category'], data.get('description',''), qty, qty,
              data.get('status','available'), data.get('condition','good'), data.get('location',''), uid))
        conn.commit()
        audit(conn, uid, 'ASSET_CREATED', 'asset', cur.lastrowid, f"Asset '{data['name']}' created")
        conn.commit()
        asset = row_to_dict(conn.execute("SELECT * FROM assets WHERE id=?", (cur.lastrowid,)).fetchone())
        return jsonify(asset=asset), 201
    finally:
        conn.close()

@app.route('/api/assets/<int:aid>', methods=['PUT'])
@admin_required
def update_asset(aid):
    uid = int(get_jwt_identity())
    data = request.json or {}
    conn = get_db()
    try:
        asset = row_to_dict(conn.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone())
        if not asset: return jsonify(error='Asset not found'), 404
        new_total = int(data.get('total_quantity', asset['total_quantity']))
        diff = new_total - asset['total_quantity']
        new_avail = max(0, asset['available_quantity'] + diff)
        conn.execute("""
            UPDATE assets SET name=?,category=?,description=?,total_quantity=?,available_quantity=?,
            status=?,condition=?,location=?,updated_at=CURRENT_TIMESTAMP WHERE id=?
        """, (data.get('name', asset['name']), data.get('category', asset['category']),
              data.get('description', asset['description']), new_total, new_avail,
              data.get('status', asset['status']), data.get('condition', asset['condition']),
              data.get('location', asset['location']), aid))
        audit(conn, uid, 'ASSET_UPDATED', 'asset', aid, f"Asset {aid} updated")
        conn.commit()
        updated = row_to_dict(conn.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone())
        return jsonify(asset=updated)
    finally:
        conn.close()

@app.route('/api/assets/<int:aid>', methods=['DELETE'])
@admin_required
def delete_asset(aid):
    uid = int(get_jwt_identity())
    conn = get_db()
    try:
        asset = conn.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone()
        if not asset: return jsonify(error='Asset not found'), 404
        active = conn.execute("SELECT id FROM bookings WHERE asset_id=? AND status IN ('pending','approved','issued')", (aid,)).fetchall()
        if active: return jsonify(error='Cannot delete asset with active bookings'), 400
        conn.execute("DELETE FROM assets WHERE id=?", (aid,))
        audit(conn, uid, 'ASSET_DELETED', 'asset', aid, f"Asset {aid} deleted")
        conn.commit()
        return jsonify(message='Asset deleted successfully')
    finally:
        conn.close()

@app.route('/api/assets/<int:aid>/qrcode', methods=['GET'])
@jwt_required()
def asset_qr(aid):
    conn = get_db()
    try:
        asset = row_to_dict(conn.execute("SELECT * FROM assets WHERE id=?", (aid,)).fetchone())
        if not asset: return jsonify(error='Asset not found'), 404
        data = json.dumps({'id': asset['id'], 'name': asset['name'], 'category': asset['category']})
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='#1e3a5f', back_color='white')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        b64 = 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()
        return jsonify(qr_code=b64, asset_id=asset['id'], asset_name=asset['name'])
    finally:
        conn.close()

@app.route('/api/assets/<int:aid>/maintenance', methods=['POST'])
@jwt_required()
def report_maintenance(aid):
    uid = int(get_jwt_identity())
    data = request.json or {}
    if not data.get('issue_description'):
        return jsonify(error='Issue description required'), 400
    conn = get_db()
    try:
        cur = conn.execute(
            "INSERT INTO maintenance_records (asset_id,reported_by,issue_description,severity) VALUES (?,?,?,?)",
            (aid, uid, data['issue_description'], data.get('severity','low'))
        )
        if data.get('severity') == 'high':
            conn.execute("UPDATE assets SET status='maintenance',updated_at=CURRENT_TIMESTAMP WHERE id=?", (aid,))
        conn.commit()
        return jsonify(message='Maintenance record created', id=cur.lastrowid), 201
    finally:
        conn.close()

# ── BOOKINGS ─────────────────────────────────────────────────────────────────

BOOKING_JOIN = """
    SELECT b.*,
        u.name as user_name, u.email as user_email, u.department,
        a.name as asset_name, a.category as asset_category, a.available_quantity,
        r.name as reviewer_name
    FROM bookings b
    JOIN users u ON b.user_id=u.id
    JOIN assets a ON b.asset_id=a.id
    LEFT JOIN users r ON b.reviewed_by=r.id
"""

@app.route('/api/bookings', methods=['GET'])
@jwt_required()
def list_bookings():
    uid = int(get_jwt_identity())
    claims = get_jwt()
    status = request.args.get('status','')
    user_id = request.args.get('user_id','')
    conn = get_db()
    try:
        q = BOOKING_JOIN + " WHERE 1=1"
        params = []
        if claims.get('role') != 'admin':
            q += " AND b.user_id=?"; params.append(uid)
        elif user_id:
            q += " AND b.user_id=?"; params.append(int(user_id))
        if status:
            q += " AND b.status=?"; params.append(status)
        q += " ORDER BY b.created_at DESC"
        bookings = rows_to_list(conn.execute(q, params).fetchall())
        return jsonify(bookings=bookings)
    finally:
        conn.close()

@app.route('/api/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    uid = int(get_jwt_identity())
    data = request.json or {}
    asset_id = data.get('asset_id')
    purpose = data.get('purpose','').strip()
    start_date = data.get('start_date','')
    end_date = data.get('end_date','')
    quantity = int(data.get('quantity', 1))
    if not asset_id or not purpose or not start_date or not end_date:
        return jsonify(error='asset_id, purpose, start_date and end_date are required'), 400
    if end_date <= start_date:
        return jsonify(error='End date must be after start date'), 400
    conn = get_db()
    try:
        asset = row_to_dict(conn.execute("SELECT * FROM assets WHERE id=?", (asset_id,)).fetchone())
        if not asset: return jsonify(error='Asset not found'), 404
        if asset['status'] != 'available':
            return jsonify(error='Asset is not available for booking'), 400
        if quantity > asset['available_quantity']:
            return jsonify(error=f"Only {asset['available_quantity']} units available"), 400
        cur = conn.execute("""
            INSERT INTO bookings (user_id,asset_id,quantity,purpose,start_date,end_date,status)
            VALUES (?,?,?,?,?,?,'pending')
        """, (uid, asset_id, quantity, purpose, start_date, end_date))
        audit(conn, uid, 'BOOKING_CREATED', 'booking', cur.lastrowid, f"Requested {quantity}x '{asset['name']}'")
        conn.commit()
        booking = row_to_dict(conn.execute(BOOKING_JOIN + " WHERE b.id=?", (cur.lastrowid,)).fetchone())
        return jsonify(booking=booking), 201
    finally:
        conn.close()

@app.route('/api/bookings/<int:bid>/approve', methods=['PUT'])
@admin_required
def approve_booking(bid):
    uid = int(get_jwt_identity())
    data = request.json or {}
    conn = get_db()
    try:
        b = row_to_dict(conn.execute("SELECT * FROM bookings WHERE id=?", (bid,)).fetchone())
        if not b: return jsonify(error='Booking not found'), 404
        if b['status'] != 'pending': return jsonify(error='Only pending bookings can be approved'), 400
        asset = row_to_dict(conn.execute("SELECT * FROM assets WHERE id=?", (b['asset_id'],)).fetchone())
        if b['quantity'] > asset['available_quantity']:
            return jsonify(error='Insufficient quantity available'), 400
        conn.execute("""UPDATE bookings SET status='approved',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,
            admin_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?""",
            (uid, data.get('admin_note'), bid))
        audit(conn, uid, 'BOOKING_APPROVED', 'booking', bid, f"Approved booking #{bid}")
        conn.commit()
        booking = row_to_dict(conn.execute(BOOKING_JOIN + " WHERE b.id=?", (bid,)).fetchone())
        return jsonify(booking=booking)
    finally:
        conn.close()

@app.route('/api/bookings/<int:bid>/reject', methods=['PUT'])
@admin_required
def reject_booking(bid):
    uid = int(get_jwt_identity())
    data = request.json or {}
    conn = get_db()
    try:
        b = row_to_dict(conn.execute("SELECT * FROM bookings WHERE id=?", (bid,)).fetchone())
        if not b: return jsonify(error='Booking not found'), 404
        if b['status'] not in ('pending','approved'):
            return jsonify(error='Cannot reject booking in current state'), 400
        conn.execute("""UPDATE bookings SET status='rejected',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,
            admin_note=?,updated_at=CURRENT_TIMESTAMP WHERE id=?""",
            (uid, data.get('admin_note','Request declined'), bid))
        audit(conn, uid, 'BOOKING_REJECTED', 'booking', bid, f"Rejected booking #{bid}")
        conn.commit()
        booking = row_to_dict(conn.execute(BOOKING_JOIN + " WHERE b.id=?", (bid,)).fetchone())
        return jsonify(booking=booking)
    finally:
        conn.close()

@app.route('/api/bookings/<int:bid>/issue', methods=['PUT'])
@admin_required
def issue_booking(bid):
    uid = int(get_jwt_identity())
    conn = get_db()
    try:
        b = row_to_dict(conn.execute("SELECT * FROM bookings WHERE id=?", (bid,)).fetchone())
        if not b: return jsonify(error='Booking not found'), 404
        if b['status'] != 'approved': return jsonify(error='Only approved bookings can be issued'), 400
        conn.execute("""UPDATE bookings SET status='issued',issued_at=CURRENT_TIMESTAMP,
            due_date=?,updated_at=CURRENT_TIMESTAMP WHERE id=?""", (b['end_date'], bid))
        conn.execute("UPDATE assets SET available_quantity=available_quantity-?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                     (b['quantity'], b['asset_id']))
        audit(conn, uid, 'ASSET_ISSUED', 'booking', bid, f"Issued {b['quantity']} unit(s) for booking #{bid}")
        conn.commit()
        booking = row_to_dict(conn.execute(BOOKING_JOIN + " WHERE b.id=?", (bid,)).fetchone())
        return jsonify(booking=booking)
    finally:
        conn.close()

@app.route('/api/bookings/<int:bid>/return', methods=['PUT'])
@admin_required
def return_booking(bid):
    uid = int(get_jwt_identity())
    data = request.json or {}
    conn = get_db()
    try:
        b = row_to_dict(conn.execute("SELECT * FROM bookings WHERE id=?", (bid,)).fetchone())
        if not b: return jsonify(error='Booking not found'), 404
        if b['status'] not in ('issued','overdue'):
            return jsonify(error='Only issued/overdue bookings can be returned'), 400
        conn.execute("""UPDATE bookings SET status='returned',returned_at=CURRENT_TIMESTAMP,
            updated_at=CURRENT_TIMESTAMP WHERE id=?""", (bid,))
        conn.execute("UPDATE assets SET available_quantity=available_quantity+?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                     (b['quantity'], b['asset_id']))
        audit(conn, uid, 'ASSET_RETURNED', 'booking', bid, f"Returned {b['quantity']} unit(s) from booking #{bid}")
        conn.commit()
        booking = row_to_dict(conn.execute(BOOKING_JOIN + " WHERE b.id=?", (bid,)).fetchone())
        return jsonify(booking=booking)
    finally:
        conn.close()

@app.route('/api/bookings/<int:bid>/cancel', methods=['PUT'])
@jwt_required()
def cancel_booking(bid):
    uid = int(get_jwt_identity())
    claims = get_jwt()
    conn = get_db()
    try:
        b = row_to_dict(conn.execute("SELECT * FROM bookings WHERE id=?", (bid,)).fetchone())
        if not b: return jsonify(error='Booking not found'), 404
        if claims.get('role') != 'admin' and b['user_id'] != uid:
            return jsonify(error='Access denied'), 403
        if b['status'] not in ('pending','approved'):
            return jsonify(error='Cannot cancel booking in current state'), 400
        conn.execute("UPDATE bookings SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?", (bid,))
        conn.commit()
        booking = row_to_dict(conn.execute(BOOKING_JOIN + " WHERE b.id=?", (bid,)).fetchone())
        return jsonify(booking=booking)
    finally:
        conn.close()

@app.route('/api/bookings/mark-overdue', methods=['POST'])
@admin_required
def mark_overdue():
    today = date.today().isoformat()
    conn = get_db()
    try:
        cur = conn.execute("""UPDATE bookings SET status='overdue',updated_at=CURRENT_TIMESTAMP
            WHERE status='issued' AND due_date<?""", (today,))
        conn.commit()
        return jsonify(updated=cur.rowcount)
    finally:
        conn.close()

# ── ANALYTICS ────────────────────────────────────────────────────────────────

@app.route('/api/analytics/dashboard', methods=['GET'])
@admin_required
def dashboard():
    today = date.today().isoformat()
    conn = get_db()
    try:
        def scalar(q, *p): return conn.execute(q,p).fetchone()[0] or 0
        summary = {
            'total_assets':      scalar("SELECT COUNT(*) FROM assets"),
            'total_units':       scalar("SELECT SUM(total_quantity) FROM assets"),
            'available_assets':  scalar("SELECT COUNT(*) FROM assets WHERE status='available' AND available_quantity>0"),
            'pending_bookings':  scalar("SELECT COUNT(*) FROM bookings WHERE status='pending'"),
            'active_bookings':   scalar("SELECT COUNT(*) FROM bookings WHERE status IN ('approved','issued')"),
            'overdue_bookings':  scalar("SELECT COUNT(*) FROM bookings WHERE status='overdue'"),
            'total_users':       scalar("SELECT COUNT(*) FROM users WHERE role='user'"),
            'due_today':         scalar("SELECT COUNT(*) FROM bookings WHERE status='issued' AND due_date=?", today),
        }
        return jsonify(summary=summary)
    finally:
        conn.close()

@app.route('/api/analytics/utilization', methods=['GET'])
@admin_required
def utilization():
    conn = get_db()
    try:
        rows = rows_to_list(conn.execute("""
            SELECT a.id,a.name,a.category,a.total_quantity,a.available_quantity,
                COUNT(b.id) as total_bookings,
                SUM(CASE WHEN b.status IN ('issued','returned','overdue') THEN 1 ELSE 0 END) as fulfilled_bookings,
                ROUND((a.total_quantity-a.available_quantity)*100.0/MAX(a.total_quantity,1),1) as utilization_pct
            FROM assets a LEFT JOIN bookings b ON a.id=b.asset_id
            GROUP BY a.id ORDER BY total_bookings DESC LIMIT 15
        """).fetchall())
        return jsonify(utilization=rows)
    finally:
        conn.close()

@app.route('/api/analytics/category-breakdown', methods=['GET'])
@admin_required
def category_breakdown():
    conn = get_db()
    try:
        rows = rows_to_list(conn.execute("""
            SELECT a.category,
                COUNT(b.id) as booking_count,
                SUM(CASE WHEN b.status='returned' THEN 1 ELSE 0 END) as returned,
                SUM(CASE WHEN b.status='issued' THEN 1 ELSE 0 END) as active
            FROM bookings b JOIN assets a ON b.asset_id=a.id
            GROUP BY a.category ORDER BY booking_count DESC
        """).fetchall())
        return jsonify(breakdown=rows)
    finally:
        conn.close()

@app.route('/api/analytics/booking-trend', methods=['GET'])
@admin_required
def booking_trend():
    conn = get_db()
    try:
        rows = rows_to_list(conn.execute("""
            SELECT date(created_at) as date, COUNT(*) as count
            FROM bookings WHERE created_at >= date('now','-30 days')
            GROUP BY date(created_at) ORDER BY date
        """).fetchall())
        return jsonify(trend=rows)
    finally:
        conn.close()

@app.route('/api/analytics/recent-activity', methods=['GET'])
@admin_required
def recent_activity():
    conn = get_db()
    try:
        rows = rows_to_list(conn.execute("""
            SELECT al.*,u.name as user_name FROM audit_logs al
            LEFT JOIN users u ON al.user_id=u.id
            ORDER BY al.created_at DESC LIMIT 20
        """).fetchall())
        return jsonify(activity=rows)
    finally:
        conn.close()

@app.route('/api/analytics/overdue', methods=['GET'])
@admin_required
def overdue_list():
    today = date.today().isoformat()
    conn = get_db()
    try:
        rows = rows_to_list(conn.execute("""
            SELECT b.*,u.name as user_name,u.email as user_email,a.name as asset_name
            FROM bookings b JOIN users u ON b.user_id=u.id JOIN assets a ON b.asset_id=a.id
            WHERE b.status IN ('overdue','issued') AND b.due_date<?
            ORDER BY b.due_date ASC
        """, (today,)).fetchall())
        return jsonify(overdue=rows)
    finally:
        conn.close()

@app.route('/api/analytics/audit-logs', methods=['GET'])
@admin_required
def audit_logs():
    page = int(request.args.get('page',1))
    limit = int(request.args.get('limit',50))
    offset = (page-1)*limit
    conn = get_db()
    try:
        logs = rows_to_list(conn.execute("""
            SELECT al.*,u.name as user_name FROM audit_logs al
            LEFT JOIN users u ON al.user_id=u.id
            ORDER BY al.created_at DESC LIMIT ? OFFSET ?
        """, (limit, offset)).fetchall())
        total = conn.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0]
        return jsonify(logs=logs, total=total, page=page)
    finally:
        conn.close()

# ── USERS (admin) ─────────────────────────────────────────────────────────────

@app.route('/api/users', methods=['GET'])
@admin_required
def list_users():
    conn = get_db()
    try:
        rows = rows_to_list(conn.execute("""
            SELECT u.id,u.name,u.email,u.role,u.department,u.created_at,
                COUNT(b.id) as total_bookings
            FROM users u LEFT JOIN bookings b ON u.id=b.user_id
            GROUP BY u.id ORDER BY u.created_at DESC
        """).fetchall())
        return jsonify(users=rows)
    finally:
        conn.close()

# ── HEALTH ────────────────────────────────────────────────────────────────────

@app.route('/api/health')
def health():
    return jsonify(status='ok', service='AssetFlow API', version='1.0.0')

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print(f"AssetFlow API running on http://localhost:{port}")
    print("Run 'python seed.py' to seed sample data")
    app.run(port=port, debug=False)
