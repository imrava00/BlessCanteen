"""
School Cafe - Weekly Meal Ordering System
Flask application for PythonAnywhere deployment
With Payment Proof Upload Feature (BCA Bank Transfer)
Supports: Local Storage + Google Drive Integration
"""

import os
import sqlite3
import json
import uuid
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, jsonify, g, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')
app.config['SECRET_KEY'] = 'school-cafe-secret-key-2024'
app.config['DATABASE'] = 'school_cafe.db'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

# ==================== GOOGLE DRIVE CONFIGURATION ====================
# Set to True to enable Google Drive uploads
app.config['ENABLE_GOOGLE_DRIVE'] = False  # Disabled - using local storage for now

# Google Drive settings (only used if ENABLE_GOOGLE_DRIVE = True)
app.config['GOOGLE_CREDENTIALS_FILE'] = 'credentials.json'  # Your service account JSON
app.config['GOOGLE_DRIVE_FOLDER'] = 'School Cafe Payment Proofs'  # Main folder name in Drive

# Database helpers
def get_db():
    """Get database connection for current request"""
    if 'db' not in g:
        g.db = sqlite3.connect(app.config['DATABASE'])
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exception):
    """Close database connection at end of request"""
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    """Initialize database schema"""
    db = get_db()
    
    # Create tables
    db.executescript('''
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'student',
            grade TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Categories table
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            icon_name TEXT,
            display_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Menu items table
        CREATE TABLE IF NOT EXISTS menu_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            image_url TEXT,
            is_available BOOLEAN DEFAULT 1,
            category_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        );
        
        -- Weekly orders table
        CREATE TABLE IF NOT EXISTS weekly_orders (
            id TEXT PRIMARY KEY,
            order_number TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            week_start_date DATE NOT NULL,
            week_end_date DATE NOT NULL,
            status TEXT DEFAULT 'pending',
            total_amount REAL NOT NULL,
            notes TEXT,
            payment_proof_path TEXT,
            payment_uploaded_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
        
        -- Weekly order items table
        CREATE TABLE IF NOT EXISTS weekly_order_items (
            id TEXT PRIMARY KEY,
            weekly_order_id TEXT NOT NULL,
            menu_item_id TEXT NOT NULL,
            meal_date DATE NOT NULL,
            meal_period TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            total_price REAL NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (weekly_order_id) REFERENCES weekly_orders (id) ON DELETE CASCADE,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
        );
        
        -- Payment proofs table (for tracking uploads)
        CREATE TABLE IF NOT EXISTS payment_proofs (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending_verification',
            notes TEXT,
            FOREIGN KEY (order_id) REFERENCES weekly_orders (id)
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
        CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
        CREATE INDEX IF NOT EXISTS idx_weekly_orders_user ON weekly_orders(user_id);
        CREATE INDEX IF NOT EXISTS idx_weekly_orders_status ON weekly_orders(status);
        CREATE INDEX IF NOT EXISTS idx_weekly_orders_week ON weekly_orders(week_start_date);
        CREATE INDEX IF NOT EXISTS idx_weekly_order_items_order ON weekly_order_items(weekly_order_id);
        CREATE INDEX IF NOT EXISTS idx_weekly_order_items_menu ON weekly_order_items(menu_item_id);
        CREATE INDEX IF NOT EXISTS idx_weekly_order_items_date ON weekly_order_items(meal_date);
        CREATE INDEX IF NOT EXISTS idx_weekly_order_items_period ON weekly_order_items(meal_period);
        CREATE INDEX IF NOT EXISTS idx_payment_proofs_order ON payment_proofs(order_id);
    ''')
    
    # Ensure upload directory exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    db.commit()

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== GOOGLE DRIVE FUNCTIONS ====================

def get_google_drive_service():
    """
    Initialize Google Drive API service using service account
    Returns service instance or None if not configured
    """
    if not app.config.get('ENABLE_GOOGLE_DRIVE'):
        return None
    
    credentials_file = app.config.get('GOOGLE_CREDENTIALS_FILE')
    if not credentials_file or not os.path.exists(credentials_file):
        print(f"⚠️ Google Drive credentials not found: {credentials_file}")
        return None
    
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        
        SCOPES = ['https://www.googleapis.com/auth/drive.file']
        creds = service_account.Credentials.from_service_account_file(
            credentials_file, scopes=SCOPES)
        
        service = build('drive', 'v3', credentials=creds)
        return service
        
    except ImportError:
        print("⚠️ Google libraries not installed. Run: pip install google-api-python-client google-auth")
        return None
    except Exception as e:
        print(f"❌ Error initializing Google Drive: {e}")
        return None


def get_or_create_drive_folder(service, folder_name, parent_id=None):
    """Get existing Google Drive folder or create new one"""
    try:
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
        if parent_id:
            query += f" and '{parent_id}' in parents"
        
        results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        folders = results.get('files', [])
        
        if folders:
            return folders[0]['id']
        
        # Create new folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        if parent_id:
            folder_metadata['parents'] = [parent_id]
        
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        return folder.get('id')
        
    except Exception as e:
        print(f"❌ Error creating Drive folder: {e}")
        return None


def setup_drive_folder_structure(service):
    """
    Create organized folder structure: School Cafe Payment Proofs/2026/August/
    Returns target folder ID for uploads
    """
    main_folder = get_or_create_drive_folder(service, app.config['GOOGLE_DRIVE_FOLDER'])
    if not main_folder:
        return None
    
    year_folder = get_or_create_drive_folder(service, str(datetime.now().year), main_folder)
    if not year_folder:
        return main_folder
    
    month_folder = get_or_create_drive_folder(service, datetime.now().strftime('%B'), year_folder)
    return month_folder or year_folder


def upload_to_google_drive(file_path, order_number, original_filename):
    """
    Upload file to Google Drive
    Returns dict with success status and file info
    """
    result = {
        'success': False,
        'file_id': None,
        'web_view_link': None,
        'web_content_link': None,
        'drive_path': None,
        'error': None
    }
    
    service = get_google_drive_service()
    if not service:
        result['error'] = 'Google Drive not configured'
        return result
    
    if not os.path.exists(file_path):
        result['error'] = f'File not found: {file_path}'
        return result
    
    try:
        from googleapiclient.http import MediaFileUpload
        from googleapiclient.errors import HttpError
        
        # Setup target folder
        target_folder = setup_drive_folder_structure(service)
        
        # Prepare filename
        safe_order_num = order_number.replace('/', '-').replace('\\', '-')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        drive_filename = f"{safe_order_num}_{timestamp}_{original_filename}"
        
        # Determine MIME type
        ext = original_filename.lower().split('.')[-1] if '.' in original_filename else ''
        mime_types = {
            'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
            'gif': 'image/gif', 'pdf': 'application/pdf'
        }
        mime_type = mime_types.get(ext, 'application/octet-stream')
        
        # Upload to Drive
        file_metadata = {
            'name': drive_filename,
            'parents': [target_folder] if target_folder else None
        }
        
        media = MediaFileUpload(file_path, resumable=True, mimetype=mime_type)
        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink, webContentLink'
        ).execute()
        
        # Make viewable by anyone with link
        permission = {'type': 'anyone', 'role': 'reader'}
        service.permissions().create(
            fileId=uploaded_file['id'],
            body=permission
        ).execute()
        
        # Build virtual path
        current_month = datetime.now().strftime('%B')
        current_year = str(datetime.now().year)
        drive_path = f"/{app.config['GOOGLE_DRIVE_FOLDER']}/{current_year}/{current_month}/{drive_filename}"
        
        result.update({
            'success': True,
            'file_id': uploaded_file['id'],
            'web_view_link': uploaded_file.get('webViewLink'),
            'web_content_link': uploaded_file.get('webContentLink'),
            'drive_path': drive_path
        })
        
        print(f"✅ Uploaded to Google Drive: {drive_filename}")
        return result
        
    except HttpError as e:
        error_detail = json.loads(e.content.decode()) if e.content else {}
        result['error'] = f"Google API Error: {error_detail.get('message', str(e))}"
        return result
    except Exception as e:
        result['error'] = str(e)
        return result

def generate_order_number():
    """Generate unique order number"""
    timestamp = datetime.now().strftime('%y%m%d%H%M%S')
    random_part = uuid.uuid4().hex[:6].upper()
    return f'WK-{timestamp}-{random_part}'

def get_monday(date):
    """Get Monday of the week for given date"""
    weekday = date.weekday()
    return date - timedelta(days=weekday)

def get_friday(monday):
    """Get Friday of the week from Monday"""
    return monday + timedelta(days=4)

# Routes

@app.route('/')
def index():
    """Main page - weekly ordering interface"""
    return render_template('index.html')

@app.route('/seed')
def seed_page():
    """Simple seed page - visit this URL to initialize database"""
    try:
        # Initialize database tables
        with app.app_context():
            init_db()
        
        # Direct seeding (simpler approach)
        db = get_db()
        
        # Clear existing data
        db.execute('DELETE FROM weekly_order_items')
        db.execute('DELETE FROM weekly_orders')
        db.execute('DELETE FROM menu_items')
        db.execute('DELETE FROM categories')
        db.execute('DELETE FROM users')
        
        # Create category
        db.execute('''INSERT INTO categories (id, name, description, icon_name, display_order)
                   VALUES (?, ?, ?, ?, ?)''', 
                  ('cat-main', 'Menu Items', 'Weekly menu selections', 'utensils', 1))
        
        # Create menu items
        items = [
            ('mi-makbes', 'MakBes', 'Makanan Besar - Main meal portion', 15.00, 'cat-main'),
            ('mi-makring', 'MakRing', 'Makanan Ringan - Light meal option', 10.00, 'cat-main'),
            ('mi-makcil', 'MakCil', 'Makanan Kecil - Small portion', 7.50, 'cat-main'),
        ]
        
        for item in items:
            db.execute('''INSERT INTO menu_items (id, name, description, price, category_id)
                       VALUES (?, ?, ?, ?, ?)''', item)
        
        # Create user
        db.execute('''INSERT INTO users (id, email, name, role, grade)
                   VALUES (?, ?, ?, ?, ?)''',
                  (str(uuid.uuid4()), 'student@school.edu', 'Student User', 'student', 'Grade 8'))
        
        db.commit()
        
        return '''
        <!DOCTYPE html>
        <html>
        <head><title>Database Seeded!</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>✅ Database Seeded Successfully!</h1>
            <p>Menu items initialized:</p>
            <ul style="list-style: none; font-size: 1.2em;">
                <li><strong>MakBes</strong> - $15.00</li>
                <li><strong>MakRing</strong> - $10.00</li>
                <li><strong>MakCil</strong> - $7.50</li>
            </ul>
            <p style="margin-top: 20px;">Redirecting to School Cafe...</p>
            <a href="/" style="padding: 10px 20px; background: #3b82f6; color: white; 
               text-decoration: none; border-radius: 5px; font-size: 1.1em;">Go to School Cafe →</a>
            <script>setTimeout(() => window.location = "/", 3000);</script>
        </body>
        </html>
        '''
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return f"<h1>Error seeding database</h1><p>{str(e)}</p><pre>{error_details}</pre>", 500

@app.route('/api/menu', methods=['GET'])
def get_menu():
    """Get all menu items with categories and filtering"""
    try:
        db = get_db()
        category = request.args.get('category', 'all')
        search = request.args.get('search', '')
        
        # Build query
        where_clauses = ['mi.is_available = 1']
        params = []
        
        if category != 'all':
            where_clauses.append('c.name = ?')
            params.append(category)
        
        if search:
            where_clauses.append('(mi.name LIKE ? OR mi.description LIKE ?)')
            search_term = f'%{search}%'
            params.extend([search_term, search_term])
        
        where_sql = ' AND '.join(where_clauses)
        
        # Get menu items with categories
        query = f'''
            SELECT mi.*, c.name as category_name, c.icon_name as category_icon, 
                   c.description as category_description
            FROM menu_items mi
            JOIN categories c ON mi.category_id = c.id
            WHERE {where_sql}
            ORDER BY c.display_order ASC, mi.name ASC
        '''
        
        cursor = db.execute(query, params)
        items = [dict(row) for row in cursor.fetchall()]
        
        # Get all active categories
        cursor = db.execute(
            'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC'
        )
        categories = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'success': True,
            'data': {
                'items': items,
                'categories': categories
            }
        })
    except Exception as e:
        print(f'Error fetching menu: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new weekly bulk order"""
    try:
        data = request.get_json()
        items = data.get('items', [])
        user_id = data.get('userId')
        notes = data.get('notes', '')
        
        if not items or len(items) == 0:
            return jsonify({'success': False, 'error': 'Order must contain at least one item'}), 400
        
        # Validate items
        valid_periods = ['breakfast', 'lunch', 'afternoon_snack']
        db = get_db()
        
        # Calculate total and validate each item
        total_amount = 0
        order_items_data = []
        
        for item in items:
            if not all(k in item for k in ['menuItemId', 'mealDate', 'mealPeriod', 'quantity']):
                return jsonify({
                    'success': False, 
                    'error': 'Each item must have menuItemId, mealDate, mealPeriod, and quantity'
                }), 400
            
            if item['mealPeriod'] not in valid_periods:
                return jsonify({
                    'success': False,
                    'error': f'Invalid meal period: {item["mealPeriod"]}. Must be one of: {valid_periods}'
                }), 400
            
            # Get menu item details
            cursor = db.execute(
                'SELECT * FROM menu_items WHERE id = ? AND is_available = 1',
                (item['menuItemId'],)
            )
            menu_item = cursor.fetchone()
            
            if not menu_item:
                return jsonify({
                    'success': False,
                    'error': f'Menu item not found: {item["menuItemId"]}'
                }), 400
            
            quantity = int(item['quantity'])
            if quantity < 1:
                return jsonify({
                    'success': False,
                    'error': 'Quantity must be at least 1'
                }), 400
            
            unit_price = float(menu_item['price'])
            item_total = unit_price * quantity
            total_amount += item_total
            
            order_items_data.append({
                'menu_item_id': item['menuItemId'],
                'meal_date': item['mealDate'],
                'meal_period': item['mealPeriod'],
                'quantity': quantity,
                'unit_price': unit_price,
                'total_price': item_total,
                'notes': item.get('notes', None)
            })
        
        # Get or create user
        final_user_id = user_id
        if not final_user_id:
            cursor = db.execute('SELECT id FROM users WHERE email = ?', ('student@school.edu',))
            existing_user = cursor.fetchone()
            
            if existing_user:
                final_user_id = existing_user['id']
            else:
                new_user_id = str(uuid.uuid4())
                db.execute('''
                    INSERT INTO users (id, email, name, role, grade)
                    VALUES (?, ?, ?, ?, ?)
                ''', (new_user_id, 'student@school.edu', 'Student User', 'student', 'Grade 5'))
                final_user_id = new_user_id
        
        # Calculate week dates
        first_item_date = datetime.strptime(items[0]['mealDate'], '%Y-%m-%d').date()
        monday = get_monday(first_item_date)
        friday = get_friday(monday)
        
        # Create weekly order
        order_id = str(uuid.uuid4())
        order_number = generate_order_number()
        
        db.execute('''
            INSERT INTO weekly_orders 
            (id, order_number, user_id, week_start_date, week_end_date, status, total_amount, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (order_id, order_number, final_user_id, monday, friday, 'pending', total_amount, notes))
        
        # Create order items
        for item_data in order_items_data:
            item_id = str(uuid.uuid4())
            db.execute('''
                INSERT INTO weekly_order_items
                (id, weekly_order_id, menu_item_id, meal_date, meal_period, quantity, unit_price, total_price, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (item_id, order_id, item_data['menu_item_id'], item_data['meal_date'],
                  item_data['meal_period'], item_data['quantity'], item_data['unit_price'],
                  item_data['total_price'], item_data['notes']))
        
        db.commit()
        
        # Fetch complete order with relations
        cursor = db.execute('SELECT * FROM weekly_orders WHERE id = ?', (order_id,))
        order = dict(cursor.fetchone())
        
        cursor = db.execute('''
            SELECT oi.*, mi.name as item_name, mi.description as item_description,
                   c.name as category_name, c.icon_name as category_icon
            FROM weekly_order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            JOIN categories c ON mi.category_id = c.id
            WHERE oi.weekly_order_id = ?
        ''', (order_id,))
        order_items = []
        for row in cursor.fetchall():
            item_dict = dict(row)
            item_dict['menuItem'] = {
                'id': item_dict.pop('menu_item_id'),
                'name': item_dict.pop('item_name'),
                'description': item_dict.pop('item_description'),
                'price': item_dict.pop('unit_price'),
                'category': {
                    'name': item_dict.pop('category_name'),
                    'icon': item_dict.pop('category_icon')
                }
            }
            order_items.append(item_dict)
        
        order['items'] = order_items
        
        cursor = db.execute('SELECT id, name, email FROM users WHERE id = ?', (final_user_id,))
        user = dict(cursor.fetchone())
        order['user'] = user
        
        return jsonify({
            'success': True,
            'data': order
        }), 201
        
    except Exception as e:
        print(f'Error creating order: {e}')
        return jsonify({'success': False, 'error': 'Failed to create order'}), 500

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get orders with optional filtering"""
    try:
        db = get_db()
        user_id = request.args.get('userId')
        status = request.args.get('status', 'all')
        week_of = request.args.get('weekOf')
        
        where_clauses = ['1=1']
        params = []
        
        if user_id:
            where_clauses.append('wo.user_id = ?')
            params.append(user_id)
        
        if status != 'all':
            where_clauses.append('wo.status = ?')
            params.append(status)
        
        if week_of:
            monday = get_monday(datetime.strptime(week_of, '%Y-%m-%d').date())
            friday = get_friday(monday)
            where_clauses.append('wo.week_start_date >= ?')
            params.append(monday)
            where_clauses.append('wo.week_end_date <= ?')
            params.append(friday)
        
        where_sql = ' AND '.join(where_clauses)
        
        cursor = db.execute(f'''
            SELECT wo.*, u.name as user_name, u.email as user_email
            FROM weekly_orders wo
            JOIN users u ON wo.user_id = u.id
            WHERE {where_sql}
            ORDER BY wo.created_at DESC
        ''', params)
        
        orders = []
        for row in cursor.fetchall():
            order_dict = dict(row)
            
            # Get items for this order
            item_cursor = db.execute('''
                SELECT oi.*, mi.name as item_name, mi.description as item_description,
                       c.name as category_name, c.icon_name as category_icon
                FROM weekly_order_items oi
                JOIN menu_items mi ON oi.menu_item_id = mi.id
                JOIN categories c ON mi.category_id = c.id
                WHERE oi.weekly_order_id = ?
            ''', (order_dict['id'],))
            
            items = []
            for item_row in item_cursor.fetchall():
                item_dict = dict(item_row)
                item_dict['menuItem'] = {
                    'id': item_dict.pop('menu_item_id'),
                    'name': item_dict.pop('item_name'),
                    'description': item_dict.pop('item_description'),
                    'price': item_dict.pop('unit_price'),
                    'category': {
                        'name': item_dict.pop('category_name'),
                        'icon': item_dict.pop('category_icon')
                    }
                }
                items.append(item_dict)
            
            order_dict['items'] = items
            order_dict['user'] = {
                'id': order_dict.pop('user_id'),
                'name': order_dict.pop('user_name'),
                'email': order_dict.pop('user_email')
            }
            
            orders.append(order_dict)
        
        return jsonify({
            'success': True,
            'data': orders
        })
        
    except Exception as e:
        print(f'Error fetching orders: {e}')
        return jsonify({'success': False, 'error': 'Failed to fetch orders'}), 500

@app.route('/api/seed', methods=['POST'])
def seed_database():
    """Seed database with sample data - Simplified 3-item menu"""
    try:
        db = get_db()
        
        # Clear existing data
        db.execute('DELETE FROM weekly_order_items')
        db.execute('DELETE FROM weekly_orders')
        db.execute('DELETE FROM menu_items')
        db.execute('DELETE FROM categories')
        db.execute('DELETE FROM users')
        
        # Create single category for all items
        categories = [
            ('cat-main', 'Menu Items', 'Weekly menu selections', 'utensils', 1),
        ]
        
        for cat in categories:
            db.execute('''
                INSERT INTO categories (id, name, description, icon_name, display_order)
                VALUES (?, ?, ?, ?, ?)
            ''', cat)
        
        # Create menu items - Only 3 types as requested
        menu_items = [
            ('mi-makbes', 'MakBes', 'Makanan Besar - Main meal portion with rice and side dishes', 15.00, 'cat-main'),
            ('mi-makring', 'MakRing', 'Makanan Ringan - Light meal/snack option', 10.00, 'cat-main'),
            ('mi-makcil', 'MakCil', 'Makanan Kecil - Small portion/light snack', 7.50, 'cat-main'),
        ]
        
        for item in menu_items:
            db.execute('''
                INSERT INTO menu_items (id, name, description, price, category_id)
                VALUES (?, ?, ?, ?, ?)
            ''', item)
        
        # Create sample user
        db.execute('''
            INSERT INTO users (id, email, name, phone, role, grade)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), 'student@school.edu', 'Alex Johnson', '+1-555-0123', 'student', 'Grade 8'))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Database seeded successfully with simplified menu',
            'data': {
                'categories_count': len(categories),
                'menu_items_count': len(menu_items),
                'menu_items': ['MakBes', 'MakRing', 'MakCil']
            }
        })
        
    except Exception as e:
        print(f'Error seeding database: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload-payment', methods=['POST'])
def upload_payment_proof():
    """Handle payment proof file upload for BCA bank transfer
    Supports: Local storage + Optional Google Drive upload
    """
    try:
        # Check if file is in request
        if 'payment_proof' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['payment_proof']
        order_id = request.form.get('order_id')
        
        if not file or file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        if not order_id:
            return jsonify({'success': False, 'error': 'Order ID is required'}), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({
                'success': False, 
                'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Check if order exists
        db = get_db()
        cursor = db.execute('SELECT * FROM weekly_orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        
        # Generate secure filename
        original_filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_filename = f"payment_{order_id}_{timestamp}_{original_filename}"
        
        # Save file LOCALLY (always as backup)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Initialize result data
        drive_info = {
            'uploaded_to_drive': False,
            'drive_file_id': None,
            'drive_view_link': None,
            'drive_download_link': None,
            'drive_path': None,
            'drive_error': None
        }
        
        # Try uploading to GOOGLE DRIVE (if enabled)
        if app.config.get('ENABLE_GOOGLE_DRIVE'):
            print(f"📤 Attempting Google Drive upload...")
            drive_result = upload_to_google_drive(
                file_path, 
                order['order_number'], 
                original_filename
            )
            
            if drive_result['success']:
                drive_info.update({
                    'uploaded_to_drive': True,
                    'drive_file_id': drive_result['file_id'],
                    'drive_view_link': drive_result['web_view_link'],
                    'drive_download_link': drive_result['web_content_link'],
                    'drive_path': drive_result['drive_path']
                })
                print(f"✅ Google Drive upload successful!")
            else:
                drive_info['drive_error'] = drive_result.get('error')
                print(f"⚠️ Google Drive upload failed: {drive_info['drive_error']}")
                print(f"   File saved locally instead")
        
        # Create payment proof record in database
        payment_id = str(uuid.uuid4())
        
        # Store both local path and Drive info as JSON
        storage_info = json.dumps({
            'local_path': file_path,
            'google_drive': drive_info
        })
        
        db.execute('''
            INSERT INTO payment_proofs 
            (id, order_id, file_name, file_path, file_size, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (payment_id, order_id, original_filename, storage_info, file_size, 
              'pending_verification', 
              f"Drive: {'Yes' if drive_info['uploaded_to_drive'] else 'No'}"))
        
        # Update order with payment info
        final_file_path = drive_info['drive_path'] if drive_info['uploaded_to_drive'] else file_path
        db.execute('''
            UPDATE weekly_orders 
            SET status = ?,
                payment_proof_path = ?,
                payment_uploaded_at = ?,
                updated_at = ?
            WHERE id = ?
        ''', ('payment_uploaded_google' if drive_info['uploaded_to_drive'] else 'payment_uploaded',
              final_file_path, datetime.now(), datetime.now(), order_id))
        
        db.commit()
        
        # Prepare response
        response_data = {
            'payment_id': payment_id,
            'order_id': order_id,
            'order_number': order['order_number'],
            'file_name': original_filename,
            'file_size': file_size,
            'status': 'pending_verification',
            'uploaded_at': datetime.now().isoformat(),
            'storage_locations': {
                'local': {
                    'path': file_path,
                    'available': True
                },
                'google_drive': drive_info
            },
            'bank_details': {
                'bank_name': 'BCA (Bank Central Asia)',
                'account_number': '3351015908',
                'account_name': 'School Cafe Catering'
            }
        }
        
        # Add success message based on storage
        if drive_info['uploaded_to_drive']:
            message = f'Payment proof uploaded successfully! 🎉\n✅ Saved to Google Drive\n📁 View: {drive_info["drive_view_link"]}'
        else:
            message = f'Payment proof uploaded! ✅\n💾 Saved locally (Google Drive: {drive_info["drive_error"] or "Not configured"})'
        
        return jsonify({
            'success': True,
            'message': message,
            'data': response_data
        }), 201
        
    except Exception as e:
        print(f'Error uploading payment proof: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/orders/<order_id>/status', methods=['GET'])
def get_order_status(order_id):
    """Get order status including payment information"""
    try:
        db = get_db()
        cursor = db.execute('''
            SELECT wo.*, 
                   pp.file_name as payment_file_name,
                   pp.status as payment_status,
                   pp.uploaded_at as payment_uploaded_at
            FROM weekly_orders wo
            LEFT JOIN payment_proofs pp ON wo.id = pp.order_id
            WHERE wo.id = ?
        ''', (order_id,))
        
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        
        order_dict = dict(order)
        
        return jsonify({
            'success': True,
            'data': {
                'id': order_dict['id'],
                'order_number': order_dict['order_number'],
                'status': order_dict['status'],
                'total_amount': order_dict['total_amount'],
                'payment_info': {
                    'has_payment': order_dict['payment_file_name'] is not None,
                    'file_name': order_dict['payment_file_name'],
                    'payment_status': order_dict['payment_status'],
                    'uploaded_at': order_dict['payment_uploaded_at']
                } if order_dict['payment_file_name'] else None
            }
        })
        
    except Exception as e:
        print(f'Error fetching order status: {e}')
        return jsonify({'success': False, 'error': str(e)}), 500

# Serve uploaded files
@app.route('/uploads/<filename>')
def serve_upload(filename):
    """Serve uploaded payment proof files"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Serve static files
@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500

# Initialize database on startup
with app.app_context():
    init_db()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
