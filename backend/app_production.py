"""
Bless Canteen - Production Flask Application for PythonAnywhere
Serves both API and static Next.js frontend files

This is the PRODUCTION version optimized for PythonAnywhere deployment.
It serves:
- API endpoints (/api/*, /admin/*)
- Static files from Next.js export (out/ directory)
- Uploaded payment proofs (uploads/ directory)
"""

import os
import sqlite3
import json
import uuid
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, jsonify, g, send_from_directory, redirect, send_file
from werkzeug.utils import secure_filename

# ==================== CONFIGURATION ====================

# Create Flask app - configure for PythonAnywhere
app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

# Security settings for production
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'bless-canteen-production-secret-' + os.urandom(16).hex())
app.config['DATABASE'] = 'bless_canteen.db'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Path to Next.js static export output
STATIC_EXPORT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')
if not os.path.exists(STATIC_EXPORT_DIR):
    # Fallback for development
    STATIC_EXPORT_DIR = 'out'

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}

# Google Drive configuration (disabled by default)
app.config['ENABLE_GOOGLE_DRIVE'] = False


# ==================== DATABASE HELPERS ====================

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
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
        
        -- Weekly orders table
        CREATE TABLE IF NOT EXISTS weekly_orders (
            id TEXT PRIMARY KEY,
            order_number TEXT UNIQUE NOT NULL,
            user_id TEXT NOT NULL,
            week_start_date DATE NOT NULL,
            week_end_date DATE NOT NULL,
            status TEXT DEFAULT 'pending',
            total_amount REAL DEFAULT 0,
            notes TEXT,
            payment_method TEXT DEFAULT 'transfer',
            payment_status TEXT DEFAULT 'unpaid',
            proof_image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        -- Order items table
        CREATE TABLE IF NOT EXISTS order_items (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            menu_item_id TEXT NOT NULL,
            day_of_week TEXT NOT NULL,
            meal_type TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            unit_price REAL NOT NULL,
            subtotal REAL NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES weekly_orders(id),
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        );
        
        -- Daily menu schedule table
        CREATE TABLE IF NOT EXISTS daily_menu_schedule (
            id TEXT PRIMARY KEY,
            menu_item_id TEXT NOT NULL,
            day_of_week TEXT NOT NULL,
            meal_type TEXT NOT NULL,
            is_available BOOLEAN DEFAULT 1,
            max_orders INTEGER DEFAULT 50,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
        );
        
        -- Settings/Config table
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if we need to seed initial data
    cursor = db.execute('SELECT COUNT(*) as count FROM users')
    if cursor.fetchone()['count'] == 0:
        seed_database(db)
    
    db.commit()


def seed_database(db):
    """Seed initial data into the database"""
    
    # Create default admin user
    admin_id = str(uuid.uuid4())
    db.execute('''
        INSERT INTO users (id, email, name, phone, role) 
        VALUES (?, ?, ?, ?, ?)
    ''', (admin_id, 'admin@blesscanteen.com', 'Administrator', '+628123456789', 'admin'))
    
    # Create meal categories
    categories = [
        ('breakfast', 'Breakfast/Sarapan', 'Morning meals served 7-9 AM', 'sunrise', 1),
        ('lunch', 'Lunch/Makan Siang', 'Midday meals served 11 AM-1 PM', 'utensils', 2),
        ('afternoon_tea', 'Afternoon Tea/Sore', 'Light snacks served 3-5 PM', 'coffee', 3)
    ]
    
    category_ids = {}
    for cat in categories:
        cat_id = str(uuid.uuid4())
        db.execute('''
            INSERT INTO categories (id, name, description, icon_name, display_order) 
            VALUES (?, ?, ?, ?, ?)
        ''', (cat_id, cat[1], cat[2], cat[3], cat[4]))
        category_ids[cat[0]] = cat_id
    
    # Create sample menu items
    menu_items = [
        ('MakBes (Nasi Uduk)', 'Complete rice dish with side dishes', 15000, category_ids['breakfast']),
        ('MakRing (Gorengan)', 'Fried snacks variety pack', 10000, category_ids['afternoon_tea']),
        ('MakCil (Es Cendol)', 'Traditional ice dessert with palm sugar', 7500, category_ids['lunch'])
    ]
    
    for item in menu_items:
        item_id = str(uuid.uuid4())
        db.execute('''
            INSERT INTO menu_items (id, name, description, price, category_id) 
            VALUES (?, ?, ?, ?, ?)
        ''', (item_id, item[0], item[1], item[2], item[3]))
        
        # Schedule for all days (Monday-Friday)
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
        for day in days:
            schedule_id = str(uuid.uuid4())
            db.execute('''
                INSERT INTO daily_menu_schedule (id, menu_item_id, day_of_week, meal_type, is_available, max_orders) 
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (schedule_id, item_id, day, item[0].split('(')[0].strip(), 1, 50))
    
    print("Database seeded with initial data!")


# ==================== AUTHENTICATION DECORATORS ====================

def admin_required(f):
    """Decorator to require admin authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        # In production, verify JWT token here
        # For now, accept any non-empty token as valid (simplify for demo)
        if not token:
            return jsonify({'success': False, 'error': 'Invalid authorization token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function


# ==================== FILE UPLOAD HELPERS ====================

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_upload(file, order_id=None):
    """Save uploaded file and return URL"""
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        # Add timestamp to prevent overwrites
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        return f'/uploads/{filename}'
    return None


# ==================== STATIC FILE SERVING (Next.js Export) ====================

@app.route('/')
@app.route('/ordering/')
@app.route('/orders/')
@app.route('/admin-panel/')
def serve_frontend():
    """Serve the main Next.js application (index.html)"""
    return send_from_directory(STATIC_EXPORT_DIR, 'index.html')


@app.route('/<path:path>')
def serve_static_files(path):
    """
    Serve static files from Next.js export or handle API routes.
    This function handles:
    - Static assets (_next, images, etc.)
    - Uploaded files (uploads/)
    - Fallback to index.html for client-side routing
    """
    # Try to serve from Next.js export directory first
    file_path = os.path.join(STATIC_EXPORT_DIR, path)
    if os.path.isfile(file_path):
        return send_file(file_path)
    
    # Try serving with .html extension (for clean URLs)
    html_path = file_path + '.html' if not path.endswith('.html') else file_path
    if os.path.isfile(html_path):
        return send_file(html_path)
    
    # If it's an uploads path, try to serve uploaded files
    if path.startswith('uploads/'):
        filename = path.replace('uploads/', '', 1)
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.isfile(upload_path):
            return send_file(upload_path)
    
    # Fallback: serve index.html for client-side routing (SPA support)
    index_path = os.path.join(STATIC_EXPORT_DIR, 'index.html')
    if os.path.isfile(index_path):
        return send_file(index_path)
    
    return jsonify({'error': 'Not found'}), 404


# ==================== API ROUTES ====================
# All your existing API routes go here...
# (Copy all routes from app.py - they remain unchanged)

# ===== MENU API =====

@app.route('/api/menu', methods=['GET'])
def get_menu():
    """Get available menu items with optional filters"""
    try:
        category = request.args.get('category')
        search = request.args.get('search')
        available_only = request.args.get('available_only', 'true').lower() == 'true'
        
        query = '''
            SELECT mi.*, c.name as category_name, c.icon_name
            FROM menu_items mi
            JOIN categories c ON mi.category_id = c.id
            WHERE 1=1
        '''
        params = []
        
        if category:
            query += ' AND c.name LIKE ?'
            params.append(f'%{category}%')
        
        if search:
            query += ' AND (mi.name LIKE ? OR mi.description LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%'])
        
        if available_only:
            query += ' AND mi.is_available = 1'
        
        query += ' ORDER BY c.display_order, mi.name'
        
        db = get_db()
        items = db.execute(query, params).fetchall()
        
        result = [{
            'id': item['id'],
            'name': item['name'],
            'description': item['description'],
            'price': item['price'],
            'image_url': item['image_url'],
            'is_available': bool(item['is_available']),
            'category': {
                'id': item['category_id'],
                'name': item['category_name'],
                'icon_name': item['icon_name']
            }
        } for item in items]
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all active categories"""
    try:
        db = get_db()
        categories = db.execute('''
            SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order
        ''').fetchall()
        
        result = [{
            'id': cat['id'],
            'name': cat['name'],
            'description': cat['description'],
            'icon_name': cat['icon_name']
        } for cat in categories]
        
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/daily-schedule', methods=['GET'])
def get_daily_schedule():
    """Get menu availability for specific day"""
    try:
        day = request.args.get('day', 'monday')
        meal_type = request.args.get('meal_type')
        
        query = '''
            SELECT dms.*, mi.name, mi.price, mi.image_url, c.name as category_name
            FROM daily_menu_schedule dms
            JOIN menu_items mi ON dms.menu_item_id = mi.id
            JOIN categories c ON mi.category_id = c.id
            WHERE dms.day_of_week = ? AND dms.is_available = 1
        '''
        params = [day]
        
        if meal_type:
            query += ' AND dms.meal_type LIKE ?'
            params.append(f'%{meal_type}%')
        
        db = get_db()
        schedules = db.execute(query, params).fetchall()
        
        result = [{
            'id': sched['id'],
            'menu_item_id': sched['menu_item_id'],
            'name': sched['name'],
            'price': sched['price'],
            'image_url': sched['image_url'],
            'meal_type': sched['meal_type'],
            'max_orders': sched['max_orders'],
            'category': sched['category_name']
        } for sched in schedules]
        
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== ORDERS API =====

@app.route('/api/orders', methods=['POST'])
def create_order():
    """Create a new weekly order"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if 'items' not in data or len(data['items']) == 0:
            return jsonify({'success': False, 'error': 'Order must contain at least one item'}), 400
        
        # Generate unique order number
        order_num = f"BC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Calculate total amount
        total_amount = sum(item.get('subtotal', item.get('price', 0) * item.get('quantity', 1)) for item in data['items'])
        
        # Get week dates
        today = datetime.now()
        monday = today - timedelta(days=today.weekday())
        friday = monday + timedelta(days=4)
        
        db = get_db()
        order_id = str(uuid.uuid4())
        
        # For demo purposes, use a default user (in production, get from auth token)
        user_id = data.get('user_id', 'demo-user-id')
        
        # Create order
        db.execute('''
            INSERT INTO weekly_orders (id, order_number, user_id, week_start_date, week_end_date, 
                                       status, total_amount, notes, payment_method, payment_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (order_id, order_num, user_id, monday.strftime('%Y-%m-%d'), friday.strftime('%Y-%m-%d'),
              'pending', total_amount, data.get('notes', ''), 'transfer', 'unpaid'))
        
        # Create order items
        for item in data['items']:
            item_id = str(uuid.uuid4())
            db.execute('''
                INSERT INTO order_items (id, order_id, menu_item_id, day_of_week, meal_type, 
                                        quantity, unit_price, subtotal, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (item_id, order_id, item['menu_item_id'], item.get('day_of_week', 'monday'),
                  item.get('meal_type', 'lunch'), item.get('quantity', 1), 
                  item.get('price', 0), item.get('subtotal', item.get('price', 0) * item.get('quantity', 1)),
                  item.get('notes', '')))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'order_id': order_id,
                'order_number': order_num,
                'total_amount': total_amount,
                'status': 'pending',
                'payment_status': 'unpaid',
                'message': 'Order created successfully! Please upload payment proof.'
            }
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get orders (with optional filters)"""
    try:
        status = request.args.get('status')
        search = request.args.get('search')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        query = '''
            SELECT wo.*, u.name as user_name, u.email as user_email
            FROM weekly_orders wo
            LEFT JOIN users u ON wo.user_id = u.id
            WHERE 1=1
        '''
        params = []
        
        if status:
            query += ' AND wo.status = ?'
            params.append(status)
        
        if search:
            query += ' AND (wo.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'
            params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
        
        query += ' ORDER BY wo.created_at DESC LIMIT ? OFFSET?'
        params.extend([limit, offset])
        
        db = get_db()
        orders = db.execute(query, params).fetchall()
        
        # Get count for pagination
        count_query = 'SELECT COUNT(*) as count FROM weekly_orders wo LEFT JOIN users u ON wo.user_id = u.id WHERE 1=1'
        count_params = []
        if status:
            count_query += ' AND wo.status = ?'
            count_params.append(status)
        if search:
            count_query += ' AND (wo.order_number LIKE ? OR u.name LIKE ? OR u.email LIKE ?)'
            count_params.extend([f'%{search}%', f'%{search}%', f'%{search}%'])
        
        total_count = db.execute(count_query, count_params).fetchone()['count']
        
        result = [{
            'id': order['id'],
            'order_number': order['order_number'],
            'user': {
                'name': order['user_name'],
                'email': order['user_email']
            },
            'week_start_date': order['week_start_date'],
            'week_end_date': order['week_end_date'],
            'status': order['status'],
            'total_amount': order['total_amount'],
            'payment_status': order['payment_status'],
            'proof_image_url': order['proof_image_url'],
            'notes': order['notes'],
            'created_at': order['created_at']
        } for order in orders]
        
        return jsonify({
            'success': True,
            'data': result,
            'pagination': {
                'total': total_count,
                'limit': limit,
                'offset': offset
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_detail(order_id):
    """Get detailed information about a specific order"""
    try:
        db = get_db()
        
        # Get order
        order = db.execute('''
            SELECT wo.*, u.name as user_name, u.email as user_email, u.phone as user_phone
            FROM weekly_orders wo
            LEFT JOIN users u ON wo.user_id = u.id
            WHERE wo.id = ?
        ''', (order_id,)).fetchone()
        
        if not order:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        
        # Get order items
        items = db.execute('''
            SELECT oi.*, mi.name as menu_item_name, mi.image_url
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = ?
        ''', (order_id,)).fetchall()
        
        result = {
            'id': order['id'],
            'order_number': order['order_number'],
            'user': {
                'id': order['user_id'],
                'name': order['user_name'],
                'email': order['user_email'],
                'phone': order['user_phone']
            },
            'dates': {
                'start': order['week_start_date'],
                'end': order['week_end_date']
            },
            'status': order['status'],
            'payment': {
                'method': order['payment_method'],
                'status': order['payment_status'],
                'proof_url': order['proof_image_url']
            },
            'total_amount': order['total_amount'],
            'notes': order['notes'],
            'items': [{
                'id': item['id'],
                'menu_item': item['menu_item_name'],
                'day': item['day_of_week'],
                'meal_type': item['meal_type'],
                'quantity': item['quantity'],
                'unit_price': item['unit_price'],
                'subtotal': item['subtotal'],
                'image_url': item['image_url']
            } for item in items],
            'created_at': order['created_at'],
            'updated_at': order['updated_at']
        }
        
        return jsonify({'success': True, 'data': result})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== PAYMENT PROOF UPLOAD =====

@app.route('/api/upload-payment/<order_id>', methods=['POST'])
def upload_payment_proof(order_id):
    """Upload payment proof for an order"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No file selected'}), 400
        
        # Verify order exists
        db = get_db()
        order = db.execute('SELECT * FROM weekly_orders WHERE id = ?', (order_id,)).fetchone()
        if not order:
            return jsonify({'success': False, 'error': 'Order not found'}), 404
        
        # Save file
        file_url = save_upload(file, order_id)
        if not file_url:
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        # Update order with payment proof
        db.execute('''
            UPDATE weekly_orders SET proof_image_url = ?, payment_status = ?, updated_at = ?
            WHERE id = ?
        ''', (file_url, 'pending_verification', datetime.now().isoformat(), order_id))
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Payment proof uploaded successfully',
            'data': {
                'order_id': order_id,
                'proof_url': file_url,
                'payment_status': 'pending_verification'
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== ADMIN ROUTES =====

@app.route('/api/admin/stats', methods=['GET'])
@admin_required
def get_admin_stats():
    """Get dashboard statistics for admin"""
    try:
        db = get_db()
        
        # Total orders this week
        today = datetime.now()
        monday = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        
        stats = {}
        
        # Orders by status
        status_counts = db.execute('''
            SELECT status, COUNT(*) as count FROM weekly_orders 
            WHERE week_start_date >= ? GROUP BY status
        ''', (monday,)).fetchall()
        
        stats['orders_by_status'] = {row['status']: row['count'] for row in status_counts}
        stats['total_orders_this_week'] = sum(row['count'] for row in status_counts)
        
        # Revenue
        revenue_result = db.execute('''
            SELECT COALESCE(SUM(total_amount), 0) as revenue 
            FROM weekly_orders 
            WHERE payment_status = 'paid' AND week_start_date >= ?
        ''', (monday,)).fetchone()
        
        stats['revenue_this_week'] = revenue_result['revenue']
        
        # Pending verifications
        pending = db.execute('''
            SELECT COUNT(*) as count FROM weekly_orders WHERE payment_status = 'pending_verification'
        ''').fetchone()
        stats['pending_verifications'] = pending['count']
        
        # Popular items
        popular = db.execute('''
            SELECT mi.name, SUM(oi.quantity) as total_ordered
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            JOIN weekly_orders wo ON oi.order_id = wo.id
            WHERE wo.week_start_date >= ?
            GROUP BY mi.id
            ORDER BY total_ordered DESC
            LIMIT 5
        ''', (monday,)).fetchall()
        
        stats['popular_items'] = [{'name': row['name'], 'ordered': row['total_ordered']} for row in popular]
        
        return jsonify({'success': True, 'data': stats})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(order_id):
    """Update order status (admin only)"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        payment_status = data.get('payment_status')
        
        if not new_status and not payment_status:
            return jsonify({'success': False, 'error': 'No status provided'}), 400
        
        db = get_db()
        
        updates = []
        params = []
        
        if new_status:
            updates.append('status = ?')
            params.append(new_status)
        
        if payment_status:
            updates.append('payment_status = ?')
            params.append(payment_status)
        
        updates.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(order_id)
        
        db.execute(f'''
            UPDATE weekly_orders SET {', '.join(updates)} WHERE id = ?
        ''', params)
        db.commit()
        
        return jsonify({
            'success': True,
            'message': f'Order {order_id} updated successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/menu-items', methods=['POST'])
@admin_required
def create_menu_item():
    """Create new menu item (admin only)"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'price', 'category_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'success': False, 'error': f'Missing required field: {field}'}), 400
        
        item_id = str(uuid.uuid4())
        db = get_db()
        
        db.execute('''
            INSERT INTO menu_items (id, name, description, price, image_url, category_id)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (item_id, data['name'], data.get('description', ''), data['price'], 
              data.get('image_url', ''), data['category_id']))
        
        db.commit()
        
        return jsonify({
            'success': True,
            'data': {'id': item_id},
            'message': 'Menu item created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/menu-items/<item_id>', methods=['PUT'])
@admin_required
def update_menu_item(item_id):
    """Update menu item (admin only)"""
    try:
        data = request.get_json()
        db = get_db()
        
        # Check if item exists
        existing = db.execute('SELECT id FROM menu_items WHERE id = ?', (item_id,)).fetchone()
        if not existing:
            return jsonify({'success': False, 'error': 'Menu item not found'}), 404
        
        # Build dynamic update query
        allowed_fields = ['name', 'description', 'price', 'image_url', 'is_available', 'category_id']
        updates = []
        params = []
        
        for field in allowed_fields:
            if field in data:
                updates.append(f'{field} = ?')
                params.append(data[field])
        
        if not updates:
            return jsonify({'success': False, 'error': 'No valid fields to update'}), 400
        
        updates.append('updated_at = ?')
        params.append(datetime.now().isoformat())
        params.append(item_id)
        
        db.execute(f'''
            UPDATE menu_items SET {', '.join(updates)} WHERE id = ?
        ''', params)
        db.commit()
        
        return jsonify({
            'success': True,
            'message': f'Menu item {item_id} updated successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/menu-items/<item_id>/toggle', methods=['POST'])
@admin_required
def toggle_menu_availability(item_id):
    """Toggle menu item availability (admin only)"""
    try:
        db = get_db()
        
        item = db.execute('SELECT is_available FROM menu_items WHERE id = ?', (item_id,)).fetchone()
        if not item:
            return jsonify({'success': False, 'error': 'Menu item not found'}), 404
        
        new_status = not bool(item['is_available'])
        
        db.execute('''
            UPDATE menu_items SET is_available = ?, updated_at = ? WHERE id = ?
        ''', (new_status, datetime.now().isoformat(), item_id))
        db.commit()
        
        return jsonify({
            'success': True,
            'data': {'is_available': new_status},
            'message': f'Menu item {"enabled" if new_status else "disabled"} successfully'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== USER API =====

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        email = data.get('email', '')
        password = data.get('password', '')
        
        db = get_db()
        
        # For demo purposes, accept admin credentials
        if email == 'admin@blesscanteen.com' and password == 'admin123':
            user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            return jsonify({
                'success': True,
                'data': {
                    'token': 'admin-token-demo-' + uuid.uuid4().hex[:16],
                    'user': {
                        'id': user['id'],
                        'email': user['email'],
                        'name': user['name'],
                        'role': user['role']
                    }
                }
            })
        
        # For other users, look up by email (no password check in demo)
        user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if user:
            return jsonify({
                'success': True,
                'data': {
                    'token': 'user-token-demo-' + uuid.uuid4().hex[:16],
                    'user': {
                        'id': user['id'],
                        'email': user['email'],
                        'name': user['name'],
                        'role': user['role']
                    }
                }
            })
        
        # Auto-register new users
        new_user_id = str(uuid.uuid4())
        db.execute('''
            INSERT INTO users (id, email, name) VALUES (?, ?, ?)
        ''', (new_user_id, email, email.split('@')[0]))
        db.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'token': 'user-token-demo-' + uuid.uuid4().hex[:16],
                'user': {
                    'id': new_user_id,
                    'email': email,
                    'name': email.split('@')[0],
                    'role': 'student'
                }
            }
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ===== WEEK CONFIGURATION =====

@app.route('/api/config/week', methods=['GET', 'POST'])
def week_config():
    """Get or set current ordering week configuration"""
    if request.method == 'GET':
        today = datetime.now()
        monday = today - timedelta(days=today.weekday())
        friday = monday + timedelta(days=4)
        
        return jsonify({
            'success': True,
            'data': {
                'week_start': monday.strftime('%Y-%m-%d'),
                'week_end': friday.strftime('%Y-%m-%d'),
                'current_day': today.strftime('%A').lower(),
                'is_ordering_open': True  # Could be configurable
            }
        })
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            week_start = data.get('week_start')
            week_end = data.get('week_end')
            
            # Store in settings table
            db = get_db()
            db.execute('''
                INSERT OR REPLACE INTO settings (key, value, updated_at) 
                VALUES ('week_start', ?, ?)
            ''', (week_start, datetime.now().isoformat()))
            
            db.execute('''
                INSERT OR REPLACE INTO settings (key, value, updated_at) 
                VALUES ('week_end', ?, ?)
            ''', (week_end, datetime.now().isoformat()))
            
            db.commit()
            
            return jsonify({
                'success': True,
                'message': f'Week dates updated to {week_start} - {week_end}',
                'data': {
                    'week_start': week_start,
                    'week_end': week_end
                }
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors - fallback to index.html for SPA routing"""
    index_path = os.path.join(STATIC_EXPORT_DIR, 'index.html')
    if os.path.exists(index_path):
        return send_file(index_path)
    return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Internal server error'}), 500


# ==================== APPLICATION INITIALIZATION ====================

# Initialize database on startup
with app.app_context():
    init_db()

# Run development server (not used on PythonAnywhere)
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
