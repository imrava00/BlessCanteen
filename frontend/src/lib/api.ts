/**
 * BlessCanteen API Service
 * Connects to Flask Backend for meal ordering system
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id: string;
  category_name?: string;
  category_icon?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  display_order: number;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  weekly_order_id: string;
  menu_item_id: string;
  meal_date: string;
  meal_period: 'breakfast' | 'lunch' | 'afternoon_snack';
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  menuItem?: {
    id: string;
    name: string;
    description: string;
    price: number;
    category?: {
      name: string;
      icon: string;
    };
  };
}

export interface WeeklyOrder {
  id: string;
  order_number: string;
  user_id: string;
  week_start_date: string;
  week_end_date: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'payment_uploaded';
  total_amount: number;
  notes?: string;
  payment_proof_path?: string;
  payment_uploaded_at?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  grade?: string;
}

export interface PaymentProof {
  id: string;
  order_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: string;
  status: string;
  notes?: string;
}

export interface AdminStats {
  total_orders: number;
  orders_by_status: Record<string, number>;
  total_revenue: number;
  total_menu_items: number;
  available_menu_items: number;
  today_orders: number;
  pending_proofs: number;
}

export interface DailyMenuSchedule {
  all_menu_items: MenuItem[];
  schedule_by_day: Record<number, Array<{
    menu_item_id: string;
    name: string;
    price: number;
    is_available: boolean;
  }>>;
  days_of_week: Record<number, string>;
}

// Helper function for API calls
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit,
  port?: number
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const url = port 
      ? `${endpoint}?XTransformPort=${port}`
      : endpoint;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Menu APIs
export async function getMenuItems(category?: string, search?: string): Promise<{ success: boolean; data?: { items: MenuItem[]; categories: Category[] }; error?: string }> {
  const params = new URLSearchParams();
  if (category && category !== 'all') params.append('category', category);
  if (search) params.append('search', search);
  
  const queryString = params.toString();
  return fetchAPI<{ items: MenuItem[]; categories: Category[] }>(
    `/api/menu${queryString ? `?${queryString}` : ''}`,
    undefined,
    5000
  );
}

// Order APIs
export async function createOrder(
  items: Array<{
    menuItemId: string;
    mealDate: string;
    mealPeriod: string;
    quantity: number;
    notes?: string;
  }>,
  userId?: string,
  notes?: string
): Promise<{ success: boolean; data?: WeeklyOrder; error?: string }> {
  return fetchAPI<WeeklyOrder>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ items, userId, notes }),
  }, 5000);
}

export async function getOrders(
  userId?: string,
  status?: string,
  weekOf?: string
): Promise<{ success: boolean; data?: WeeklyOrder[]; error?: string }> {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (status && status !== 'all') params.append('status', status);
  if (weekOf) params.append('weekOf', weekOf);
  
  const queryString = params.toString();
  return fetchAPI<WeeklyOrder[]>(
    `/api/orders${queryString ? `?${queryString}` : ''}`,
    undefined,
    5000
  );
}

// Payment Upload
export async function uploadPaymentProof(
  orderId: string,
  file: File
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('payment_proof', file);
    formData.append('order_id', orderId);

    const response = await fetch(`/api/upload-payment?XTransformPort=5000`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Upload failed' };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Upload Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Order Status
export async function getOrderStatus(orderId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  return fetchAPI(`/api/orders/${orderId}/status`, undefined, 5000);
}

// Admin Authentication
export async function adminLogin(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('password', password);

    const response = await fetch(`/admin/login?XTransformPort=5000`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Login Error:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Admin Stats
export async function getAdminStats(): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
  return fetchAPI<AdminStats>('/api/admin/stats', {
    headers: {
      'X-Admin-Auth': 'admin123',
    },
  }, 5000);
}

// Admin Menu Management
export async function adminGetMenu(): Promise<{ success: boolean; data?: MenuItem[]; error?: string }> {
  return fetchAPI<MenuItem[]>('/api/admin/menu', {
    headers: {
      'X-Admin-Auth': 'admin123',
    },
  }, 5000);
}

export async function adminAddMenuItem(item: {
  name: string;
  description?: string;
  price: number;
  is_available?: boolean;
  category_id?: string;
}): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  return fetchAPI<{ id: string }>('/api/admin/menu', {
    method: 'POST',
    headers: {
      'X-Admin-Auth': 'admin123',
    },
    body: JSON.stringify(item),
  }, 5000);
}

export async function adminUpdateMenuItem(
  itemId: string,
  updates: Partial<MenuItem>
): Promise<{ success: boolean; error?: string }> {
  return fetchAPI(`/api/admin/menu/${itemId}`, {
    method: 'PUT',
    headers: {
      'X-Admin-Auth': 'admin123',
    },
    body: JSON.stringify(updates),
  }, 5000);
}

export async function adminDeleteMenuItem(itemId: string): Promise<{ success: boolean; error?: string }> {
  return fetchAPI(`/api/admin/menu/${itemId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Auth': 'admin123',
    },
  }, 5000);
}

// Admin Orders
export async function adminGetOrders(
  status?: string,
  search?: string,
  limit?: number,
  offset?: number
): Promise<{ success: boolean; data?: { orders: WeeklyOrder[]; total: number; limit: number; offset: number }; error?: string }> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (search) params.append('search', search);
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());
  
  const queryString = params.toString();
  return fetchAPI<{ orders: WeeklyOrder[]; total: number; limit: number; offset: number }>(
    `/api/admin/orders${queryString ? `?${queryString}` : ''}`,
    {
      headers: {
        'X-Admin-Auth': 'admin123',
      },
    },
    5000
  );
}

export async function adminUpdateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  return fetchAPI(`/api/admin/orders/${orderId}`, {
    method: 'PUT',
    headers: {
      'X-Admin-Auth': 'admin123',
    },
    body: JSON.stringify({ status }),
  }, 5000);
}

// Daily Menu Schedule
export async function getDailyMenuSchedule(): Promise<{ success: boolean; data?: DailyMenuSchedule; error?: string }> {
  return fetchAPI<DailyMenuSchedule>('/api/admin/daily-menu', {
    headers: {
      'X-Admin-Auth': 'admin123',
    },
  }, 5000);
}

export async function updateDailyMenuSchedule(
  schedule: Record<string, number[]>
): Promise<{ success: boolean; error?: string }> {
  return fetchAPI('/api/admin/daily-menu', {
    method: 'POST',
    headers: {
      'X-Admin-Auth': 'admin123',
    },
    body: JSON.stringify({ schedule }),
  }, 5000);
}

// Seed Database
export async function seedDatabase(): Promise<{ success: boolean; data?: any; error?: string }> {
  return fetchAPI('/api/seed', {
    method: 'POST',
  }, 5000);
}
