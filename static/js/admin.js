/**
 * School Cafe - Admin Dashboard JavaScript
 * Handles all admin functionality including menu management, orders, and settings
 */

// ==================== CURRENCY FORMATTING (INDONESIAN RUPIAH) ====================

/**
 * Format number as Indonesian Rupiah
 * @param {number} amount - The amount to format
 * @returns {string} Formatted Rupiah string (e.g., "Rp 15.000")
 */
function formatRupiah(amount) {
    if (!amount && amount !== 0) return 'Rp 0';
    
    // Convert to number if string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Format with Indonesian locale
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numAmount);
}

// ==================== GLOBAL STATE ====================
const state = {
    currentSection: 'dashboard',
    menuItems: [],
    orders: [],
    currentOrderPage: 1,
    ordersPerPage: 10,
    totalOrders: 0
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Update time display
    updateTime();
    setInterval(updateTime, 1000);
    
    // Load dashboard data
    loadDashboardStats();
    
    // Setup navigation
    setupNavigation();
    
    // Load initial data for active section
    if (state.currentSection === 'dashboard') {
        loadDashboardStats();
    }
}

function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('current-time').textContent = timeStr;
}

// ==================== NAVIGATION ====================
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
        });
    });
}

function showSection(sectionName) {
    state.currentSection = sectionName;
    
    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionName) {
            item.classList.add('active');
        }
    });
    
    // Show/hide sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update page title
    const titles = {
        'dashboard': { title: 'Dashboard', subtitle: 'Welcome back, Admin!' },
        'menu': { title: 'Menu Management', subtitle: 'Manage your cafe menu items' },
        'daily-menu': { title: 'Daily Menu Schedule', subtitle: 'Set different menus for each day of the week' },
        'orders': { title: 'Order Management', subtitle: 'View and manage customer orders' },
        'settings': { title: 'Settings', subtitle: 'Configure system settings' }
    };
    
    if (titles[sectionName]) {
        document.getElementById('page-title').textContent = titles[sectionName].title;
        document.getElementById('page-subtitle').textContent = titles[sectionName].subtitle;
    }
    
    // Load section-specific data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardStats();
            break;
        case 'menu':
            loadMenuItems();
            break;
        case 'daily-menu':
            loadDailyMenuSchedule();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'settings':
            loadWeekDates();
            break;
    }
    
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('show');
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

// ==================== DASHBOARD STATS ====================
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'X-Admin-Auth': getAdminAuth() }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            
            // Update stat cards
            animateValue('stat-total-orders', data.total_orders);
            document.getElementById('stat-revenue').textContent = formatRupiah(data.total_revenue);
            animateValue('stat-today-orders', data.today_orders);
            animateValue('stat-pending-proofs', data.pending_proofs);
        }
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showToast('Failed to load dashboard statistics', 'error');
    }
}

function animateValue(elementId, endValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
        element.textContent = currentValue;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// ==================== MENU MANAGEMENT ====================
async function loadMenuItems() {
    const container = document.getElementById('menu-container');
    container.innerHTML = '<div class="loading">Loading menu items...</div>';
    
    try {
        const response = await fetch('/api/admin/menu', {
            headers: { 'X-Admin-Auth': getAdminAuth() }
        });
        
        const result = await response.json();
        
        if (result.success) {
            state.menuItems = result.data;
            renderMenuItems(result.data);
        } else {
            container.innerHTML = '<p class="error">Failed to load menu items</p>';
        }
        
    } catch (error) {
        console.error('Error loading menu:', error);
        container.innerHTML = '<p class="error">Error loading menu items</p>';
    }
}

function renderMenuItems(items) {
    const container = document.getElementById('menu-container');
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <p style="color: var(--text-secondary); font-size: 16px;">No menu items found</p>
                <button class="btn btn-primary" onclick="showAddMenuModal()" style="margin-top: 16px;">
                    + Add Your First Menu Item
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="menu-item-card" data-id="${item.id}">
            <div class="menu-item-header">
                <div class="menu-item-name">${escapeHtml(item.name)}</div>
                <div class="menu-item-price">${formatRupiah(item.price)}</div>
            </div>
            
            ${item.description ? `<div class="menu-item-description">${escapeHtml(item.description)}</div>` : ''}
            
            <div class="menu-item-status">
                <span class="status-badge ${item.is_available ? 'available' : 'unavailable'}">
                    ${item.is_available ? '<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Available' : '<svg style="width:14px;height:14px;vertical-align:-2px;margin-right:4px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Unavailable'}
                </span>
                
                <div class="menu-item-actions">
                    <button class="btn-icon btn-edit" onclick="editMenuItem('${item.id}')" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteMenuItem('${item.id}', '${escapeHtml(item.name)}')" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function showAddMenuModal() {
    document.getElementById('modal-title').textContent = 'Add Menu Item';
    document.getElementById('menu-form').reset();
    document.getElementById('menu-item-id').value = '';
    document.getElementById('menu-available').checked = true;
    document.getElementById('menu-modal').classList.add('show');
}

function editMenuItem(itemId) {
    const item = state.menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('modal-title').textContent = 'Edit Menu Item';
    document.getElementById('menu-item-id').value = item.id;
    document.getElementById('menu-name').value = item.name;
    document.getElementById('menu-description').value = item.description || '';
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-available').checked = item.is_available;
    document.getElementById('menu-modal').classList.add('show');
}

function closeMenuModal() {
    document.getElementById('menu-modal').classList.remove('show');
}

async function saveMenuItem(event) {
    event.preventDefault();
    
    const itemId = document.getElementById('menu-item-id').value;
    const formData = {
        name: document.getElementById('menu-name').value.trim(),
        description: document.getElementById('menu-description').value.trim(),
        price: parseFloat(document.getElementById('menu-price').value),
        is_available: document.getElementById('menu-available').checked
    };
    
    if (!formData.name) {
        showToast('Please enter an item name', 'warning');
        return;
    }
    
    if (!formData.price || formData.price <= 0) {
        showToast('Please enter a valid price', 'warning');
        return;
    }
    
    try {
        let response;
        if (itemId) {
            // Update existing item
            response = await fetch(`/api/admin/menu/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Auth': getAdminAuth()
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Add new item
            response = await fetch('/api/admin/menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Auth': getAdminAuth()
                },
                body: JSON.stringify(formData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message || 'Menu item saved successfully!', 'success');
            closeMenuModal();
            loadMenuItems(); // Refresh list
        } else {
            showToast(result.error || 'Failed to save menu item', 'error');
        }
        
    } catch (error) {
        console.error('Error saving menu item:', error);
        showToast('Error saving menu item', 'error');
    }
}

async function deleteMenuItem(itemId, itemName) {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/menu/${itemId}`, {
            method: 'DELETE',
            headers: { 'X-Admin-Auth': getAdminAuth() }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            loadMenuItems(); // Refresh list
        } else {
            showToast(result.error || 'Failed to delete item', 'error');
        }
        
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showToast('Error deleting menu item', 'error');
    }
}

async function toggleMenuItemAvailability(itemId) {
    const item = state.menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    try {
        const response = await fetch(`/api/admin/menu/${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Auth': getAdminAuth()
            },
            body: JSON.stringify({ is_available: !item.is_available })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Item marked as ${!item.is_available ? 'available' : 'unavailable'}`, 'success');
            loadMenuItems(); // Refresh list
        } else {
            showToast(result.error || 'Failed to update availability', 'error');
        }
        
    } catch (error) {
        console.error('Error toggling availability:', error);
        showToast('Error updating availability', 'error');
    }
}

// ==================== ORDER MANAGEMENT ====================
let orderTimeout;

function debounce(func, wait) {
    return function(...args) {
        clearTimeout(orderTimeout);
        orderTimeout = setTimeout(() => func.apply(this, args), wait);
    };
}

async function loadOrders(page = 1) {
    state.currentOrderPage = page;
    
    const tbody = document.getElementById('orders-tbody');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading orders...</td></tr>';
    
    try {
        const statusFilter = document.getElementById('order-status-filter')?.value || '';
        const searchQuery = document.getElementById('order-search')?.value || '';
        
        const params = new URLSearchParams({
            status: statusFilter,
            search: searchQuery,
            limit: state.ordersPerPage,
            offset: (page - 1) * state.ordersPerPage
        });
        
        const response = await fetch(`/api/admin/orders?${params}`, {
            headers: { 'X-Admin-Auth': getAdminAuth() }
        });
        
        const result = await response.json();
        
        if (result.success) {
            state.totalOrders = result.data.total;
            renderOrdersTable(result.data.orders);
            renderPagination();
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="error">Failed to load orders</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="error">Error loading orders</td></tr>';
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-tbody');
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    No orders found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>#${order.order_number ? order.order_number.substring(0, 8) : order.id.substring(0, 8)}</strong></td>
            <td>${escapeHtml(order.customer_name || 'Guest')}</td>
            <td>${formatOrderItems(order.items)}</td>
            <td><strong>${formatRupiah(order.total_amount)}</strong></td>
            <td>
                <select class="order-status status-${order.status}" 
                        onchange="updateOrderStatus('${order.id}', this.value)">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Ready</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <button class="btn-icon btn-edit" onclick="viewOrderDetails('${order.id}')" title="View Details">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function formatOrderItems(items) {
    if (!items || items.length === 0) return '-';
    
    return items.slice(0, 2).map(item => 
        `${item.quantity}x ${item.menu_item_name || 'Item'}`
    ).join(', ') + (items.length > 2 ? ` +${items.length - 2}` : '');
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    const totalPages = Math.ceil(state.totalOrders / state.ordersPerPage);
    
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button class="page-btn" onclick="loadOrders(${state.currentOrderPage - 1})" 
             ${state.currentOrderPage === 1 ? 'disabled' : ''}>← Prev</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= state.currentOrderPage - 1 && i <= state.currentOrderPage + 1)) {
            html += `<button class="page-btn ${i === state.currentOrderPage ? 'active' : ''}" 
                     onclick="loadOrders(${i})">${i}</button>`;
        } else if (i === state.currentOrderPage - 2 || i === state.currentOrderPage + 2) {
            html += '<span>...</span>';
        }
    }
    
    // Next button
    html += `<button class="page-btn" onclick="loadOrders(${state.currentOrderPage + 1})" 
             ${state.currentOrderPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    
    paginationContainer.innerHTML = html;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Auth': getAdminAuth()
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Order status updated to ${newStatus}`, 'success');
        } else {
            showToast(result.error || 'Failed to update status', 'error');
            loadOrders(state.currentOrderPage); // Refresh to revert change
        }
        
    } catch (error) {
        console.error('Error updating order status:', error);
        showToast('Error updating order status', 'error');
        loadOrders(state.currentOrderPage); // Refresh to revert change
    }
}

async function viewOrderDetails(orderId) {
    // Find order from current loaded orders or fetch it
    const modal = document.getElementById('order-modal');
    const content = document.getElementById('order-details-content');
    
    content.innerHTML = '<div class="loading">Loading order details...</div>';
    modal.classList.add('show');
    
    try {
        // Re-fetch orders to get full details
        const params = new URLSearchParams({ limit: 100 }); // Get more to find our order
        const response = await fetch(`/api/admin/orders?${params}`, {
            headers: { 'X-Admin-Auth': getAdminAuth() }
        });
        
        const result = await response.json();
        const order = result.data.orders.find(o => o.id === orderId);
        
        if (!order) {
            content.innerHTML = '<p>Order not found</p>';
            return;
        }
        
        content.innerHTML = `
            <div style="padding: 24px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                    <div>
                        <h4 style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">ORDER NUMBER</h4>
                        <p style="font-weight: 600;">#${order.order_number || order.id}</p>
                    </div>
                    <div>
                        <h4 style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">STATUS</h4>
                        <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                    </div>
                    <div>
                        <h4 style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">CUSTOMER</h4>
                        <p style="font-weight: 600;">${escapeHtml(order.customer_name || 'Guest')}</p>
                    </div>
                    <div>
                        <h4 style="color: var(--text-secondary); font-size: 12px; margin-bottom: 4px;">DATE</h4>
                        <p style="font-weight: 600;">${new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>
                
                <h3 style="margin-bottom: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                    Order Items
                </h3>
                
                ${order.items && order.items.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--bg-light);">
                                <th style="padding: 12px; text-align: left;">Item</th>
                                <th style="padding: 12px; text-align: center;">Qty</th>
                                <th style="padding: 12px; text-align: right;">Price</th>
                                <th style="padding: 12px; text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr style="border-bottom: 1px solid var(--border-color);">
                                    <td style="padding: 12px;">${escapeHtml(item.menu_item_name || 'Unknown')}</td>
                                    <td style="padding: 12px; text-align: center;">${item.quantity}</td>
                                    <td style="padding: 12px; text-align: right;">${formatRupiah(item.unit_price)}</td>
                                    <td style="padding: 12px; text-align: right; font-weight: 600;">${formatRupiah(item.total_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="font-size: 18px; font-weight: 700;">
                                <td colspan="3" style="padding: 16px 12px; text-align: right;">TOTAL:</td>
                                <td style="padding: 16px 12px; text-align: right; color: var(--success-color);">
                                    ${formatRupiah(order.total_amount)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                ` : '<p>No items in this order</p>'}
                
                ${order.notes ? `
                    <div style="margin-top: 20px; padding: 16px; background: #fffaf0; border-radius: 8px;">
                        <strong>Notes:</strong> ${escapeHtml(order.notes)}
                    </div>
                ` : ''}
                
                ${order.payment_file ? `
                    <div style="margin-top: 20px; padding: 16px; background: #f0fff4; border-radius: 8px;">
                        <strong>Payment Proof:</strong> ${escapeHtml(order.payment_file)}
                        <br>
                        <small>Status: ${order.payment_status || 'N/A'}</small>
                    </div>
                ` : ''}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading order details:', error);
        content.innerHTML = '<p>Error loading order details</p>';
    }
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.remove('show');
}

// ==================== SETTINGS ====================
async function loadWeekDates() {
    try {
        const response = await fetch('/api/admin/config/week-dates', {
            headers: { 'X-Admin-Auth': getAdminAuth() }
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('week-start').value = result.data.week_start;
            document.getElementById('week-end').value = result.data.week_end;
        }
        
    } catch (error) {
        console.error('Error loading week dates:', error);
    }
}

async function updateWeekDates() {
    const weekStart = document.getElementById('week-start').value;
    const weekEnd = document.getElementById('week-end').value;
    
    if (!weekStart || !weekEnd) {
        showToast('Please select both dates', 'warning');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/config/week-dates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Auth': getAdminAuth()
            },
            body: JSON.stringify({
                week_start: weekStart,
                week_end: weekEnd
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
        } else {
            showToast(result.error || 'Failed to update week dates', 'error');
        }
        
    } catch (error) {
        console.error('Error updating week dates:', error);
        showToast('Error updating week dates', 'error');
    }
}

// ==================== UTILITY FUNCTIONS ====================
function getAdminAuth() {
    // Try cookie first, then fallback to default
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});
    
    return cookies.admin_auth || 'admin123';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== DAILY MENU SCHEDULE FUNCTIONS ====================

let dailyMenuData = {}; // Store current state of daily menu checkboxes

async function loadDailyMenuSchedule() {
    const tbody = document.getElementById('daily-menu-tbody');
    const statusDiv = document.getElementById('daily-menu-status');
    
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading menu schedule...</td></tr>';
    statusDiv.innerHTML = '';
    
    try {
        const response = await fetch('/api/admin/daily-menu', {
            headers: { 'X-Admin-Auth': getAdminAuth() }
        });
        
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            const allItems = data.all_menu_items;
            const scheduleByDay = data.schedule_by_day;
            
            // Reset data structure
            dailyMenuData = {};
            
            // Build table rows
            if (allItems.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                            No menu items found. Please add items in Menu Management first.
                        </td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = allItems.map(item => {
                // Initialize this item's day availability
                dailyMenuData[item.id] = [];
                
                // Check which days this item is available
                for (let day = 1; day <= 5; day++) {
                    const daySchedule = scheduleByDay[day] || [];
                    const isAvailable = daySchedule.some(d => d.menu_item_id === item.id && d.is_available);
                    
                    if (isAvailable) {
                        dailyMenuData[item.id].push(day);
                    }
                }
                
                // Generate checkbox HTML for each day
                const dayCheckboxes = [1, 2, 3, 4, 5].map(day => {
                    const isChecked = dailyMenuData[item.id].includes(day);
                    return `
                        <td style="text-align: center;">
                            <input type="checkbox" 
                                   id="day-${item.id}-${day}" 
                                   data-item-id="${item.id}" 
                                   data-day="${day}"
                                   ${isChecked ? 'checked' : ''}
                                   onchange="toggleDayForItem('${item.id}', ${day}, this.checked)">
                        </td>
                    `;
                }).join('');
                
                // Select all checkbox
                const allDaysSelected = dailyMenuData[item.id].length === 5;
                
                return `
                    <tr>
                        <td><strong>${escapeHtml(item.name)}</strong></td>
                        <td>${formatRupiah(item.price)}</td>
                        ${dayCheckboxes}
                        <td style="text-align: center;">
                            <input type="checkbox" 
                                   id="select-all-${item.id}"
                                   ${allDaysSelected ? 'checked' : ''}
                                   onchange="toggleAllDaysForItem('${item.id}', this.checked)">
                        </td>
                    </tr>
                `;
            }).join('');
            
            statusDiv.innerHTML = `<span class="status-info">Loaded ${allItems.length} menu items</span>`;
            
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="error">Failed to load menu schedule</td>
                </tr>
            `;
            showToast(result.error || 'Error loading schedule', 'error');
        }
        
    } catch (error) {
        console.error('Error loading daily menu schedule:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="error">Error loading menu schedule</td>
            </tr>
        `;
        showToast('Error loading menu schedule', 'error');
    }
}

function toggleDayForItem(itemId, day, isChecked) {
    if (!dailyMenuData[itemId]) {
        dailyMenuData[itemId] = [];
    }
    
    if (isChecked) {
        if (!dailyMenuData[itemId].includes(day)) {
            dailyMenuData[itemId].push(day);
        }
    } else {
        dailyMenuData[itemId] = dailyMenuData[itemId].filter(d => d !== day);
    }
    
    // Update "Select All" checkbox state
    updateSelectAllCheckbox(itemId);
}

function toggleAllDaysForItem(itemId, isChecked) {
    // Update all day checkboxes for this item
    for (let day = 1; day <= 5; day++) {
        const checkbox = document.getElementById(`day-${itemId}-${day}`);
        if (checkbox) {
            checkbox.checked = isChecked;
            toggleDayForItem(itemId, day, isChecked);
        }
    }
}

function updateSelectAllCheckbox(itemId) {
    const selectAllCheckbox = document.getElementById(`select-all-${itemId}`);
    if (selectAllCheckbox && dailyMenuData[itemId]) {
        selectAllCheckbox.checked = dailyMenuData[itemId].length === 5;
    }
}

async function saveDailyMenuSchedule() {
    const statusDiv = document.getElementById('daily-menu-status');
    statusDiv.innerHTML = '<span class="status-saving">Saving...</span>';
    
    try {
        const response = await fetch('/api/admin/daily-menu', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Auth': getAdminAuth()
            },
            body: JSON.stringify({
                schedule: dailyMenuData
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusDiv.innerHTML = `<span class="status-success">${result.message}</span>`;
            showToast(result.message, 'success');
        } else {
            statusDiv.innerHTML = `<span class="status-error">${result.error || 'Failed to save'}</span>`;
            showToast(result.error || 'Failed to save schedule', 'error');
        }
        
    } catch (error) {
        console.error('Error saving daily menu schedule:', error);
        statusDiv.innerHTML = '<span class="status-error">Error saving schedule</span>';
        showToast('Error saving schedule', 'error');
    }
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        closeMenuModal();
        closeOrderModal();
    }
    
    // Ctrl+S to save (when in modal)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const menuModal = document.getElementById('menu-modal');
        if (menuModal.classList.contains('show')) {
            e.preventDefault();
            document.getElementById('menu-form').dispatchEvent(new Event('submit'));
        }
    }
});
