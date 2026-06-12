from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

W, H = A4
NAVY   = colors.HexColor('#1e3a5f')
GOLD   = colors.HexColor('#e8a020')
LIGHT  = colors.HexColor('#f0f4f8')
BORDER = colors.HexColor('#e2e8f0')
MUTED  = colors.HexColor('#64748b')
WHITE  = colors.white

def build_styles():
    base = getSampleStyleSheet()
    S = {}
    S['cover_title'] = ParagraphStyle('cover_title', fontName='Helvetica-Bold',
        fontSize=26, textColor=WHITE, alignment=TA_CENTER, spaceAfter=6)
    S['cover_sub']   = ParagraphStyle('cover_sub', fontName='Helvetica',
        fontSize=13, textColor=colors.HexColor('#c8d8ee'), alignment=TA_CENTER, spaceAfter=4)
    S['cover_tag']   = ParagraphStyle('cover_tag', fontName='Helvetica',
        fontSize=10, textColor=GOLD, alignment=TA_CENTER)
    S['h1'] = ParagraphStyle('h1', fontName='Helvetica-Bold',
        fontSize=15, textColor=NAVY, spaceBefore=14, spaceAfter=6,
        borderPad=4)
    S['h2'] = ParagraphStyle('h2', fontName='Helvetica-Bold',
        fontSize=12, textColor=NAVY, spaceBefore=10, spaceAfter=4)
    S['body'] = ParagraphStyle('body', fontName='Helvetica',
        fontSize=9.5, textColor=colors.HexColor('#334155'),
        leading=15, spaceAfter=5, alignment=TA_JUSTIFY)
    S['bullet'] = ParagraphStyle('bullet', fontName='Helvetica',
        fontSize=9.5, textColor=colors.HexColor('#334155'),
        leading=14, leftIndent=14, spaceAfter=3,
        bulletIndent=4, bulletFontSize=9)
    S['code'] = ParagraphStyle('code', fontName='Courier',
        fontSize=8.5, textColor=colors.HexColor('#1e3a5f'),
        backColor=colors.HexColor('#f8fafc'), leading=13,
        leftIndent=10, rightIndent=10, spaceBefore=3, spaceAfter=3)
    S['caption'] = ParagraphStyle('caption', fontName='Helvetica-Oblique',
        fontSize=8.5, textColor=MUTED, alignment=TA_CENTER, spaceAfter=6)
    S['section_num'] = ParagraphStyle('section_num', fontName='Helvetica-Bold',
        fontSize=10, textColor=GOLD, spaceAfter=2)
    return S

def tbl(data, col_widths, header_bg=NAVY, stripe=True):
    t = Table(data, colWidths=col_widths)
    style = [
        ('BACKGROUND', (0,0), (-1,0), header_bg),
        ('TEXTCOLOR',  (0,0), (-1,0), WHITE),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE',   (0,0), (-1,0), 9),
        ('FONTNAME',   (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE',   (0,1), (-1,-1), 8.5),
        ('ALIGN',      (0,0), (-1,-1), 'LEFT'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUND', (0,1), (-1,-1), [WHITE, colors.HexColor('#f8fafc')]),
        ('GRID',       (0,0), (-1,-1), 0.4, BORDER),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]
    t.setStyle(TableStyle(style))
    return t

def hr(story):
    story.append(HRFlowable(width='100%', thickness=0.5, color=BORDER, spaceAfter=8, spaceBefore=2))

def section(story, number, title, S):
    story.append(Spacer(1, 4))
    story.append(Paragraph(f'Section {number}', S['section_num']))
    story.append(Paragraph(title, S['h1']))
    hr(story)

def build_pdf(path):
    doc = SimpleDocTemplate(path, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=16*mm, bottomMargin=16*mm)
    S = build_styles()
    story = []

    # ── COVER PAGE ────────────────────────────────────────────────────────────
    cover_tbl = Table(
        [[Paragraph('AssetFlow', S['cover_title'])],
         [Paragraph('Smart Asset Management &amp; Resource Allocation Platform', S['cover_sub'])],
         [Spacer(1,6)],
         [Paragraph('Design Document  ·  v1.0', S['cover_tag'])],
         [Paragraph('Cultural Council · IIT Roorkee · 2026', S['cover_tag'])],
        ],
        colWidths=[W - 36*mm]
    )
    cover_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('TOPPADDING',    (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING',   (0,0), (-1,-1), 20),
        ('RIGHTPADDING',  (0,0), (-1,-1), 20),
        ('ROUNDEDCORNERS', [8]),
    ]))
    story.append(Spacer(1, 40))
    story.append(cover_tbl)
    story.append(Spacer(1, 24))

    meta = [
        ['Document Type', 'Technical Design Document'],
        ['Project',       'AssetFlow — Asset Management Platform'],
        ['Organization',  'Cultural Council, IIT Roorkee'],
        ['Version',       '1.0 — June 2026'],
        ['Stack',         'Python / Flask  +  React 18  +  SQLite3'],
        ['Deliverable',   'Problem Statement 1 — Cult Open Projects 2026'],
    ]
    story.append(tbl([['Field','Value']] + meta, [60*mm, W-36*mm-60*mm]))
    story.append(PageBreak())

    # ── 1. PROBLEM UNDERSTANDING ───────────────────────────────────────────────
    section(story, '1', 'Problem Understanding', S)
    story.append(Paragraph(
        'The Cultural Council of IIT Roorkee manages a large inventory of shared resources — DSLR cameras, '
        'studio lighting rigs, audio consoles, costumes, stage props, and event infrastructure — across '
        'dozens of sections and hundreds of annual events. Resource allocation is currently fragmented '
        'across WhatsApp groups, spreadsheets, and informal verbal agreements, resulting in double-bookings, '
        'untracked losses, inventory blind-spots, and disputes over availability.', S['body']))
    story.append(Paragraph(
        'AssetFlow replaces this fragmentation with a centralised, role-aware platform where any section '
        'member can browse available stock, submit a dated booking request with stated purpose, and track '
        'the lifecycle of that request — from pending through approved, issued, and returned — while '
        'administrators maintain full operational visibility through live dashboards and an immutable audit trail.',
        S['body']))

    story.append(Paragraph('Key Pain Points Addressed', S['h2']))
    pain = [
        ('Scheduling conflicts', 'System prevents bookings that exceed available stock at submission time.'),
        ('Inventory blind-spots', 'Live available_quantity counter reflects all issued and approved bookings.'),
        ('Accountability gaps',  'Every state transition is audit-logged with user, timestamp, and IP.'),
        ('Overdue returns',      'Automatic overdue detection flags items past their due date.'),
        ('No utilisation data',  'Analytics dashboard surfaces category-wise utilisation and booking trends.'),
    ]
    for title, desc in pain:
        story.append(Paragraph(f'<b>{title}:</b> {desc}', S['bullet']))

    # ── 2. SYSTEM ARCHITECTURE ────────────────────────────────────────────────
    section(story, '2', 'System Architecture', S)
    story.append(Paragraph(
        'AssetFlow uses a clean two-tier client–server architecture with a stateless REST API backend '
        'and a single-page React frontend. The two tiers communicate exclusively over HTTP/JSON; no '
        'server-side rendering is involved.', S['body']))

    arch_rows = [
        ['Layer', 'Technology', 'Responsibility'],
        ['Presentation', 'React 18 + React Router v6', 'SPA UI, client-side routing, JWT storage'],
        ['API Gateway', 'Flask 3 + Flask-CORS', 'REST endpoints, CORS, request validation'],
        ['Auth', 'Flask-JWT-Extended + bcrypt', 'Token issuance, verification, role claims'],
        ['Business Logic', 'Python 3 route handlers', 'Inventory maths, booking lifecycle rules'],
        ['Persistence', 'SQLite3 (stdlib)', 'Relational storage, WAL mode, FK constraints'],
        ['QR Module', 'qrcode + Pillow', 'Server-side PNG generation, base64 response'],
    ]
    story.append(tbl(arch_rows, [38*mm, 55*mm, W-36*mm-38*mm-55*mm]))
    story.append(Spacer(1,8))

    story.append(Paragraph('Request Flow', S['h2']))
    flow_steps = [
        'Browser sends HTTP request with Authorization: Bearer <JWT>',
        'Flask-JWT-Extended validates token; role claim attached to request context',
        '@admin_required / @jwt_required decorator enforces access control',
        'Route handler queries SQLite, applies business rules, mutates state',
        'Audit log entry written in the same DB transaction',
        'JSON response returned; React updates UI state via Axios interceptor',
    ]
    for i, step in enumerate(flow_steps, 1):
        story.append(Paragraph(f'{i}.  {step}', S['bullet']))

    # ── 3. DATABASE SCHEMA ────────────────────────────────────────────────────
    section(story, '3', 'Database Schema', S)
    story.append(Paragraph(
        'Five tables form the relational core. SQLite3 enforces foreign-key constraints '
        '(PRAGMA foreign_keys = ON) and uses WAL journaling for write concurrency.', S['body']))

    tables_desc = [
        ('users',       'Stores all accounts. role column enforces admin/user split.'),
        ('assets',      'Master inventory. available_quantity is the live "free stock" counter.'),
        ('bookings',    'Every request, approval, issuance and return. status FSM enforced in Python.'),
        ('audit_logs',  'Append-only event log. Never updated after insert.'),
        ('maintenance_records', 'Health reports per asset. High-severity auto-flags asset status.'),
    ]
    story.append(tbl(
        [['Table', 'Purpose']] + tables_desc,
        [48*mm, W-36*mm-48*mm]
    ))
    story.append(Spacer(1,8))

    story.append(Paragraph('Key Column Definitions', S['h2']))
    cols = [
        ['Table.Column', 'Type', 'Constraint / Notes'],
        ['users.role',         'TEXT', "CHECK IN ('admin','user')"],
        ['assets.status',      'TEXT', "CHECK IN ('available','maintenance','retired')"],
        ['assets.condition',   'TEXT', "CHECK IN ('excellent','good','fair','poor')"],
        ['assets.available_quantity', 'INT', 'Decremented on issue; incremented on return'],
        ['bookings.status',    'TEXT', "FSM: pending→approved/rejected, approved→issued, issued→returned/overdue"],
        ['bookings.due_date',  'TEXT', 'Set to end_date at issue time; drives overdue detection'],
        ['audit_logs.*',       '—',   'Append-only; no UPDATE or DELETE ever issued on this table'],
    ]
    story.append(tbl(cols, [52*mm, 22*mm, W-36*mm-52*mm-22*mm]))

    story.append(PageBreak())

    # ── 4. ERD ─────────────────────────────────────────────────────────────────
    section(story, '4', 'Entity Relationship Diagram (ERD)', S)
    story.append(Paragraph(
        'The diagram below represents all five entities and their relationships. '
        'PK = Primary Key, FK = Foreign Key.', S['body']))

    # Text ERD using table cells
    erd_data = [
        ['USERS', '', 'ASSETS', '', 'MAINTENANCE_RECORDS'],
        ['PK id', '', 'PK id', '', 'PK id'],
        ['name', '', 'name', '←FK asset_id→', 'FK asset_id'],
        ['email (UNIQUE)', '', 'category', '', 'FK reported_by'],
        ['password_hash', '', 'description', '', 'issue_description'],
        ['role', '', 'total_quantity', '', 'severity'],
        ['department', '', 'available_quantity', '', 'resolved_at'],
        ['created_at', '', 'status / condition', '', 'created_at'],
        ['', '', 'location', '', ''],
        ['', '', 'FK created_by (users)', '', ''],
    ]

    erd_tbl = Table(erd_data, colWidths=[52*mm, 18*mm, 52*mm, 8*mm, 44*mm])
    erd_tbl.setStyle(TableStyle([
        ('BOX',        (0,0), (0,-1), 1.2, NAVY),
        ('BOX',        (2,0), (2,-1), 1.2, NAVY),
        ('BOX',        (4,0), (4,-1), 1.2, NAVY),
        ('BACKGROUND', (0,0), (0,0),  NAVY),
        ('BACKGROUND', (2,0), (2,0),  NAVY),
        ('BACKGROUND', (4,0), (4,0),  NAVY),
        ('TEXTCOLOR',  (0,0), (0,0),  WHITE),
        ('TEXTCOLOR',  (2,0), (2,0),  WHITE),
        ('TEXTCOLOR',  (4,0), (4,0),  WHITE),
        ('FONTNAME',   (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTNAME',   (0,1), (-1,-1),'Helvetica'),
        ('FONTSIZE',   (0,0), (-1,-1), 8),
        ('ALIGN',      (1,0), (1,-1), 'CENTER'),
        ('ALIGN',      (3,0), (3,-1), 'CENTER'),
        ('VALIGN',     (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('TEXTCOLOR',  (1,0), (1,-1), NAVY),
        ('TEXTCOLOR',  (3,0), (3,-1), NAVY),
    ]))
    story.append(erd_tbl)
    story.append(Spacer(1,6))

    # bookings row
    book_tbl = Table(
        [['BOOKINGS'],
         ['PK id'],
         ['FK user_id → users.id'],
         ['FK asset_id → assets.id'],
         ['quantity, purpose'],
         ['start_date, end_date, due_date'],
         ['status (FSM)'],
         ['FK reviewed_by → users.id'],
         ['issued_at, returned_at'],
         ['admin_note']],
        colWidths=[W - 36*mm]
    )
    book_tbl.setStyle(TableStyle([
        ('BOX',        (0,0), (-1,-1), 1.2, GOLD),
        ('BACKGROUND', (0,0), (-1,0),  GOLD),
        ('TEXTCOLOR',  (0,0), (-1,0),  NAVY),
        ('FONTNAME',   (0,0), (-1,0),  'Helvetica-Bold'),
        ('FONTNAME',   (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE',   (0,0), (-1,-1), 8.5),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Paragraph('Central BOOKINGS table — links all entities:', S['h2']))
    story.append(book_tbl)

    audit_tbl = Table(
        [['AUDIT_LOGS (append-only)'],
         ['PK id  |  FK user_id → users.id'],
         ['action (e.g. BOOKING_APPROVED)  |  entity_type  |  entity_id'],
         ['details  |  ip_address  |  created_at']],
        colWidths=[W - 36*mm]
    )
    audit_tbl.setStyle(TableStyle([
        ('BOX',        (0,0), (-1,-1), 1.2, MUTED),
        ('BACKGROUND', (0,0), (-1,0),  MUTED),
        ('TEXTCOLOR',  (0,0), (-1,0),  WHITE),
        ('FONTNAME',   (0,0), (-1,0),  'Helvetica-Bold'),
        ('FONTNAME',   (0,1), (-1,-1), 'Courier'),
        ('FONTSIZE',   (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(Spacer(1,6))
    story.append(audit_tbl)

    story.append(PageBreak())

    # ── 5. API OVERVIEW ───────────────────────────────────────────────────────
    section(story, '5', 'API Overview', S)
    story.append(Paragraph(
        'All endpoints are prefixed with /api/. Authentication uses Bearer tokens '
        'in the Authorization header. Responses are always JSON.', S['body']))

    api_rows = [
        ['Method', 'Endpoint', 'Auth', 'Description'],
        ['POST', '/auth/register',           'Public',    'Create new user account'],
        ['POST', '/auth/login',              'Public',    'Authenticate; returns JWT'],
        ['GET',  '/auth/me',                 'Any',       'Get current user profile'],
        ['PUT',  '/auth/profile',            'Any',       'Update name/dept/password'],
        ['GET',  '/assets',                  'Any',       'List assets (search/filter)'],
        ['GET',  '/assets/categories',       'Any',       'Distinct category list'],
        ['GET',  '/assets/:id',              'Any',       'Single asset + maintenance log'],
        ['POST', '/assets',                  'Admin',     'Create asset'],
        ['PUT',  '/assets/:id',              'Admin',     'Update asset fields'],
        ['DELETE','/assets/:id',             'Admin',     'Delete (no active bookings)'],
        ['GET',  '/assets/:id/qrcode',       'Any',       'Generate QR PNG (base64)'],
        ['POST', '/assets/:id/maintenance',  'Any',       'Report maintenance issue'],
        ['GET',  '/bookings',                'Any',       'List bookings (own or all)'],
        ['POST', '/bookings',                'Any',       'Submit booking request'],
        ['PUT',  '/bookings/:id/approve',    'Admin',     'Approve pending booking'],
        ['PUT',  '/bookings/:id/reject',     'Admin',     'Reject booking'],
        ['PUT',  '/bookings/:id/issue',      'Admin',     'Issue asset; decrement stock'],
        ['PUT',  '/bookings/:id/return',     'Admin',     'Record return; restore stock'],
        ['PUT',  '/bookings/:id/cancel',     'Owner/Admin','Cancel pending/approved'],
        ['POST', '/bookings/mark-overdue',   'Admin',     'Batch-flag overdue records'],
        ['GET',  '/analytics/dashboard',     'Admin',     'KPI summary cards'],
        ['GET',  '/analytics/utilization',   'Admin',     'Asset utilisation rates'],
        ['GET',  '/analytics/category-breakdown','Admin', 'Bookings by category'],
        ['GET',  '/analytics/booking-trend', 'Admin',     '30-day daily booking count'],
        ['GET',  '/analytics/recent-activity','Admin',    'Last 20 audit events'],
        ['GET',  '/analytics/overdue',       'Admin',     'Overdue items with users'],
        ['GET',  '/analytics/audit-logs',    'Admin',     'Paginated full audit trail'],
        ['GET',  '/users',                   'Admin',     'All users with booking counts'],
        ['GET',  '/health',                  'Public',    'Service health check'],
    ]
    story.append(tbl(api_rows, [14*mm, 58*mm, 18*mm, W-36*mm-14*mm-58*mm-18*mm]))

    story.append(PageBreak())

    # ── 6. DESIGN DECISIONS ───────────────────────────────────────────────────
    section(story, '6', 'Design Decisions', S)

    decisions = [
        ('Python + Flask over Node.js',
         'The container environment does not support native Node addons (node-gyp / better-sqlite3). '
         'Python\'s stdlib sqlite3 module requires zero compilation, providing identical SQL semantics '
         'with full WAL-mode and foreign-key support. Flask\'s minimal footprint keeps the codebase '
         'readable and the route logic transparent.'),
        ('SQLite for persistence',
         'Campus-scale usage (hundreds of assets, tens of concurrent users) sits well within SQLite\'s '
         'write throughput. SQLite eliminates a separate database process, simplifying deployment to a '
         'single "python app.py" command — critical for a hackathon submission that must be reproducible.'),
        ('JWT stateless authentication',
         'Stateless tokens allow the React frontend and Flask backend to be deployed on separate origins '
         'without shared session storage. The role claim embedded in the token drives both frontend '
         'route guards and backend @admin_required decorators from a single source of truth.'),
        ('Inventory updated at issue, not at approval',
         'Available quantity is only decremented when an admin physically issues the asset, not at '
         'approval time. This mirrors the real Council workflow: approval is a green-light, but the '
         'counter should not drop until the item leaves the store. It also allows cancellations after '
         'approval without requiring an inventory correction.'),
        ('Append-only audit_logs',
         'The audit table is never updated or deleted — only inserted into. This provides a tamper-evident '
         'activity trail. Every significant state change (asset CRUD, booking transitions) calls the '
         'shared audit() helper within the same database connection, guaranteeing log consistency.'),
        ('QR codes generated server-side',
         'Server-side generation (qrcode + Pillow) produces a consistent PNG regardless of the client '
         'browser or OS. The image is returned as a base64 data-URI so no file system storage is needed '
         'and the endpoint can be called on demand. The QR payload is a small JSON object with asset '
         'id, name, and category — sufficient for scanning during physical issue/return.'),
        ('React SPA with proxy',
         'The frontend package.json proxy field forwards all /api/* calls to the Flask server during '
         'development, eliminating CORS complexity locally. In production, a reverse proxy (nginx) '
         'would serve the built React bundle and proxy API calls identically.'),
        ('Minimal external dependencies',
         'The frontend uses only Recharts for charts and React Router for navigation — no heavy UI '
         'framework. All styling is custom CSS with CSS variables, keeping the bundle small and the '
         'visual design fully in the team\'s control.'),
    ]

    for title, body in decisions:
        story.append(Paragraph(f'<b>{title}</b>', S['h2']))
        story.append(Paragraph(body, S['body']))

    story.append(Spacer(1,8))
    hr(story)
    story.append(Paragraph(
        'AssetFlow — Design Document v1.0 · Cultural Council, IIT Roorkee · 2026',
        ParagraphStyle('footer', fontName='Helvetica', fontSize=8, textColor=MUTED, alignment=TA_CENTER)
    ))

    doc.build(story)
    print(f"PDF written to {path}")

if __name__ == '__main__':
    import os
    out = '/mnt/user-data/outputs/AssetFlow_Design_Document.pdf'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    build_pdf(out)
