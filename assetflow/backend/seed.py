import bcrypt
from db import get_db, init_db
from datetime import date, timedelta

def seed():
    init_db()
    conn = get_db()

    def make_hash(pw):
        return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

    users = [
        ('Admin Council', 'admin@cultiitr.in', make_hash('admin123'), 'admin', 'Cultural Council'),
        ('Arjun Mehta',   'arjun@iitr.ac.in',  make_hash('user123'),  'user',  'Music Section'),
        ('Priya Sharma',  'priya@iitr.ac.in',  make_hash('user123'),  'user',  'Dance Section'),
        ('Rahul Verma',   'rahul@iitr.ac.in',  make_hash('user123'),  'user',  'Photography Section'),
        ('Sneha Patel',   'sneha@iitr.ac.in',  make_hash('user123'),  'user',  'Drama Section'),
        ('Karan Singh',   'karan@iitr.ac.in',  make_hash('user123'),  'user',  'Fine Arts'),
    ]
    for u in users:
        conn.execute("INSERT OR IGNORE INTO users (name,email,password_hash,role,department) VALUES (?,?,?,?,?)", u)

    assets = [
        ('Canon EOS 5D Mark IV',       'DSLR Camera',          'Professional full-frame DSLR, 30.4MP, 4K video',                    3,3,'available','excellent','Media Room, SAC'),
        ('Sony Alpha A7III',            'DSLR Camera',          'Mirrorless full-frame, excellent low-light performance',            2,2,'available','good',     'Media Room, SAC'),
        ('Nikon D750',                  'DSLR Camera',          'Full-frame DSLR ideal for events and portrait photography',         2,1,'available','good',     'Media Room, SAC'),
        ('Softbox Lighting Kit 2-panel','Studio Lighting',      '2-panel softbox with stands and diffusers, 5500K',                 4,4,'available','good',     'Production Studio, SAC'),
        ('LED Video Light Panel',       'Studio Lighting',      'Dimmable bi-color LED panel, 960 LEDs, CRI 96+',                   6,5,'available','excellent','Production Studio, SAC'),
        ('Fresnel Spotlight 650W',      'Studio Lighting',      'Professional fresnel spotlight for stage and studio use',          4,4,'available','fair',     'Stage Storage'),
        ('Shure SM58 Vocal Microphone', 'Audio Systems',        'Industry-standard cardioid dynamic vocal microphone',              8,6,'available','good',     'Audio Room, SAC'),
        ('Yamaha MG16 Mixing Console',  'Audio Systems',        '16-channel console with built-in effects',                        2,2,'available','excellent','Audio Room, SAC'),
        ('JBL EON615 PA Speaker',       'Audio Systems',        '15-inch 2-way self-powered PA system, 1000W',                     4,3,'available','good',     'Audio Room, SAC'),
        ('Rajasthani Costume Set',      'Costumes',             'Complete ghagra, kanchli, odhni set — multiple sizes',            10,10,'available','good',   'Costume Room, SAC'),
        ('Bharatanatyam Costume Set',   'Costumes',             'Classical dance costume with jewelry, S/M/L',                     5,5,'available','excellent','Costume Room, SAC'),
        ('Western Formal Suit Set',     'Costumes',             'Formal suit with shirt, tie, cufflinks',                          6,6,'available','good',     'Costume Room, SAC'),
        ('Modular Stage Platform 2x4ft','Stage Props',          'Interlocking stage platform, 2ft height, non-slip',              20,18,'available','good',    'Stage Warehouse'),
        ('Portable Backdrop Stand',     'Stage Props',          '10x7 ft collapsible backdrop stand with bag',                     5,5,'available','good',     'Production Studio, SAC'),
        ('Decorative Arch Frame',       'Stage Props',          'Metallic arch 8x4 ft for stage decor',                           3,3,'available','fair',     'Stage Warehouse'),
        ('Zoom H6 Audio Recorder',      'Recording Equipment',  '6-track portable recorder, interchangeable capsule system',       3,3,'available','excellent','Audio Room, SAC'),
        ('Rode NTG3 Shotgun Mic',       'Recording Equipment',  'Professional directional condenser microphone for film',          4,4,'available','good',     'Media Room, SAC'),
        ('Event Truss 3m Section',      'Event Infrastructure', 'Box truss aluminum section for lighting rigs',                   12,12,'available','good',    'Equipment Yard'),
        ('Extension Reel 50m',          'Event Infrastructure', 'Heavy-duty 13A extension reel, 4-socket',                        10,9,'available','good',     'Equipment Store'),
        ('Epson EB-L200 Projector',     'Recording Equipment',  'Laser projector, 4000 lumens, WXGA, wireless',                   3,2,'available','excellent','AV Room, SAC'),
    ]
    for a in assets:
        conn.execute("""INSERT OR IGNORE INTO assets
            (name,category,description,total_quantity,available_quantity,status,condition,location,created_by)
            VALUES (?,?,?,?,?,?,?,?,1)""", a)

    today = date.today()
    def d(offset): return (today + timedelta(days=offset)).isoformat()

    bookings = [
        (2, 1, 1, 'Annual Photography Competition - Utkarsh 2026', d(2),  d(5),  'approved', 1),
        (3, 7, 2, 'Sangeet Night rehearsal for Thomso',            d(1),  d(3),  'pending',  None),
        (4, 4, 2, 'Dance performance lighting for Choreo Night',   d(7),  d(10), 'approved', 1),
        (5,10, 3, 'Drama Club annual play costume requirement',     d(-2), d(3),  'issued',   1),
        (6,13, 4, 'Cultural Night stage setup',                    d(-10),d(-5), 'returned', 1),
    ]
    for b in bookings:
        conn.execute("""INSERT OR IGNORE INTO bookings
            (user_id,asset_id,quantity,purpose,start_date,end_date,status,reviewed_by)
            VALUES (?,?,?,?,?,?,?,?)""", b)

    logs = [
        (1,'ASSET_CREATED','asset',1,'Canon EOS 5D Mark IV added to inventory'),
        (1,'BOOKING_APPROVED','booking',1,'Booking approved for Arjun Mehta'),
        (2,'BOOKING_CREATED','booking',1,'New booking request submitted'),
    ]
    for l in logs:
        conn.execute("INSERT INTO audit_logs (user_id,action,entity_type,entity_id,details) VALUES (?,?,?,?,?)", l)

    conn.commit()
    conn.close()
    print("Seed complete!")
    print("  Admin: admin@cultiitr.in / admin123")
    print("  User:  arjun@iitr.ac.in  / user123")

if __name__ == '__main__':
    seed()
