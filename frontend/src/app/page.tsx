'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Utensils, 
  ShoppingCart, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  Settings,
  BarChart3,
  Package,
  Users,
  DollarSign,
  Calendar,
  Sun,
  Coffee,
  Sandwich,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
  category_name?: string;
}

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  mealDate: string;
  mealPeriod: 'breakfast' | 'lunch' | 'afternoon_snack';
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
  items: CartItem[];
}

// Constants
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MEAL_PERIODS = [
  { value: 'breakfast', label: 'Breakfast', icon: Sun },
  { value: 'lunch', label: 'Lunch', icon: Sandwich },
  { value: 'afternoon_snack', label: 'Snack', icon: Coffee },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  payment_uploaded: 'bg-purple-100 text-purple-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
  payment_uploaded: 'Payment Uploaded',
};

export default function BlessCanteenPage() {
  // State
  const [activeTab, setActiveTab] = useState<'ordering' | 'orders' | 'admin'>('ordering');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Date>(getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0-4 for Mon-Fri
  const [selectedPeriod, setSelectedPeriod] = useState<string>('lunch');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminStats, setAdminStats] = useState<any>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [adminMenuItems, setAdminMenuItems] = useState<MenuItem[]>([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Loading states
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  // Helper to get Monday of the week
  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get week dates
  const getWeekDates = () => {
    const dates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(selectedWeek);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  // Fetch menu items
  const fetchMenuItems = useCallback(async () => {
    setIsLoadingMenu(true);
    try {
      const response = await fetch('/api/menu');
      const data = await response.json();
      if (data.success) {
        setMenuItems(data.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      toast.error('Failed to load menu items');
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  // Fetch user orders
  const fetchUserOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        setMyOrders(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load your orders');
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Admin functions
  const handleAdminLogin = async () => {
    try {
      const formData = new FormData();
      formData.append('password', adminPassword);
      
      const response = await fetch('/admin/login', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.success) {
        setIsAdminAuthenticated(true);
        toast.success('Welcome, Admin!');
        fetchAdminData();
      } else {
        toast.error(data.error || 'Invalid password');
      }
    } catch (error) {
      toast.error('Login failed');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminStats(null);
    setAllOrders([]);
    setAdminMenuItems([]);
    setAdminPassword('');
  };

  const fetchAdminData = async () => {
    setIsLoadingAdmin(true);
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'X-Admin-Auth': 'admin123' },
      });
      const statsData = await statsRes.json();
      if (statsData.success) setAdminStats(statsData.data);

      // Fetch orders
      const ordersRes = await fetch('/api/admin/orders', {
        headers: { 'X-Admin-Auth': 'admin123' },
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) setAllOrders(ordersData.data.orders);

      // Fetch menu items
      const menuRes = await fetch('/api/admin/menu', {
        headers: { 'X-Admin-Auth': 'admin123' },
      });
      const menuData = await menuRes.json();
      if (menuData.success) setAdminMenuItems(menuData.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoadingAdmin(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Auth': 'admin123',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchAdminData();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const toggleMenuItemAvailability = async (itemId: string, currentAvailability: boolean) => {
    try {
      const response = await fetch(`/api/admin/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Auth': 'admin123',
        },
        body: JSON.stringify({ is_available: !currentAvailability }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Menu item updated');
        fetchAdminData();
        fetchMenuItems();
      } else {
        toast.error(data.error || 'Failed to update item');
      }
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    const weekDates = getWeekDates();
    const selectedDate = weekDates[selectedDay];
    const dateString = selectedDate.toISOString().split('T')[0];
    
    setCart(prev => {
      const existingIndex = prev.findIndex(
        ci => ci.menuItemId === item.id && ci.mealDate === dateString && ci.mealPeriod === selectedPeriod
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        mealDate: dateString,
        mealPeriod: selectedPeriod as CartItem['mealPeriod'],
        quantity: 1,
      }];
    });
    
    toast.success(`${item.name} added to cart`);
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = [...prev];
      updated[index].quantity += delta;
      if (updated[index].quantity <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast.info('Item removed from cart');
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Cart cleared');
  };

  // Calculate totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit order
  const submitOrder = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to your cart first');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = cart.map(item => ({
        menuItemId: item.menuItemId,
        mealDate: item.mealDate,
        mealPeriod: item.mealPeriod,
        quantity: item.quantity,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: orderItems,
          notes: orderNotes,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentOrderId(data.data.id);
        setShowPaymentDialog(true);
        toast.success('Order created! Please upload payment proof.');
        clearCart();
        fetchUserOrders();
      } else {
        toast.error(data.error || 'Failed to create order');
      }
    } catch (error) {
      toast.error('Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload payment proof
  const uploadPaymentProof = async () => {
    if (!paymentFile || !currentOrderId) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('payment_proof', paymentFile);
      formData.append('order_id', currentOrderId);

      const response = await fetch('/api/upload-payment', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Payment proof uploaded successfully!');
        setShowPaymentDialog(false);
        setPaymentFile(null);
        fetchUserOrders();
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  // Seed database
  const seedDatabase = async () => {
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Database seeded successfully!');
        fetchMenuItems();
      }
    } catch (error) {
      toast.error('Failed to seed database');
    }
  };

  // Initialize
  useEffect(() => {
    fetchMenuItems();
    fetchUserOrders();
  }, [fetchMenuItems, fetchUserOrders]);

  // Render week navigation
  const renderWeekNavigation = () => (
    <div className="flex items-center justify-between mb-6">
      <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous Week
      </Button>
      <div className="text-center">
        <h3 className="font-semibold text-lg">
          Week of {selectedWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h3>
        <p className="text-sm text-muted-foreground">Select a day and meal period to order</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
        Next Week
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );

  // Render day selector
  const renderDaySelector = () => (
    <div className="grid grid-cols-5 gap-2 mb-6">
      {getWeekDates().map((date, index) => (
        <Button
          key={index}
          variant={selectedDay === index ? "default" : "outline"}
          className="flex flex-col items-center gap-1 h-auto py-3"
          onClick={() => setSelectedDay(index)}
        >
          <span className="text-xs font-medium">{DAYS_OF_WEEK[index]}</span>
          <span className="text-sm font-bold">{date.getDate()}</span>
        </Button>
      ))}
    </div>
  );

  // Render meal period selector
  const renderPeriodSelector = () => (
    <div className="flex gap-2 mb-6">
      {MEAL_PERIODS.map(period => {
        const Icon = period.icon;
        return (
          <Button
            key={period.value}
            variant={selectedPeriod === period.value ? "default" : "outline"}
            className="flex-1"
            onClick={() => setSelectedPeriod(period.value)}
          >
            <Icon className="h-4 w-4 mr-2" />
            {period.label}
          </Button>
        );
      })}
    </div>
  );

  // Render menu items
  const renderMenuItems = () => {
    if (isLoadingMenu) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (menuItems.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Menu Items Available</h3>
            <p className="text-muted-foreground mb-4">Start by seeding the database with sample menu items</p>
            <Button onClick={seedDatabase}>Initialize Menu</Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map(item => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant="secondary" className="font-bold">
                  {formatCurrency(item.price)}
                </Badge>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => addToCart(item)}
                disabled={!item.is_available}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Order
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render cart
  const renderCart = () => (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Your Order
          </span>
          {cartItemCount > 0 && (
            <Badge variant="default">{cartItemCount} items</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Your cart is empty</p>
            <p className="text-sm">Add items from the menu above</p>
          </div>
        ) : (
          <>
            <ScrollArea className="max-h-64 mb-4">
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.mealDate)} • {MEAL_PERIODS.find(p => p.value === item.mealPeriod)?.label}
                      </p>
                      <p className="text-sm font-semibold text-primary">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItemQuantity(index, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateCartItemQuantity(index, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeCartItem(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(cartTotal)}</span>
              </div>

              <Textarea
                placeholder="Special notes or requests (optional)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                rows={2}
              />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                >
                  Clear
                </Button>
                <Button
                  className="flex-1"
                  onClick={submitOrder}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Place Order
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  // Render my orders tab
  const renderMyOrders = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Orders</h2>
        <Button variant="outline" onClick={fetchUserOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {isLoadingOrders ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : myOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground">Place your first order from the Ordering tab!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myOrders.map(order => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm font-medium">{order.order_number}</span>
                      <Badge className={STATUS_COLORS[order.status] || ''}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        dateStyle: 'medium',
                      })} • {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{formatCurrency(order.total_amount)}</p>
                    {(order.status === 'pending' || order.status === 'payment_uploaded') && !order.payment_proof_path && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setCurrentOrderId(order.id);
                          setShowPaymentDialog(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Payment
                      </Button>
                    )}
                    {order.payment_proof_path && (
                      <Badge variant="secondary" className="mt-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Payment Uploaded
                      </Badge>
                    )}
                  </div>
                </div>
                
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Order Items:</p>
                    <div className="flex flex-wrap gap-2">
                      {order.items.map((item, idx) => (
                        <Badge key={idx} variant="outline">
                          {item.quantity}x {typeof item === 'object' && 'name' in item ? item.name : 'Item'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render admin login
  const renderAdminLogin = () => (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <Settings className="h-12 w-12 mx-auto text-primary mb-2" />
        <CardTitle className="text-2xl">Admin Access</CardTitle>
        <CardDescription>Enter admin password to access dashboard</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Admin Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
          />
        </div>
        <Button className="w-full" onClick={handleAdminLogin}>
          Sign In
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Default password: admin123
        </p>
      </CardContent>
    </Card>
  );

  // Render admin dashboard
  const renderAdminDashboard = () => {
    if (!isAdminAuthenticated) {
      return renderAdminLogin();
    }

    return (
      <div className="space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Admin Dashboard
            </h2>
            <p className="text-muted-foreground">Manage orders, menus, and settings</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAdminData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="destructive" onClick={handleAdminLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {isLoadingAdmin ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : adminStats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-3xl font-bold">{adminStats.total_orders}</p>
                  </div>
                  <Package className="h-10 w-10 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-3xl font-bold">{formatCurrency(adminStats.total_revenue)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Orders</p>
                    <p className="text-3xl font-bold">{adminStats.today_orders}</p>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payments</p>
                    <p className="text-3xl font-bold">{adminStats.pending_proofs}</p>
                  </div>
                  <AlertCircle className="h-10 w-10 text-orange-600 opacity-20" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Orders Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Recent Orders
              </CardTitle>
              <div className="flex gap-2">
                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger className="w-[150px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="payment_uploaded">Payment Uploaded</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-10 w-[200px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOrders
                    .filter(order => {
                      if (orderFilter !== 'all' && order.status !== orderFilter) return false;
                      if (orderSearch && !order.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) &&
                          !order.customer_name?.toLowerCase().includes(orderSearch.toLowerCase())) return false;
                      return true;
                    })
                    .slice(0, 10)
                    .map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                      <TableCell>{order.customer_name || 'N/A'}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[order.status] || ''}>
                          {STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirm</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="completed">Complete</SelectItem>
                            <SelectItem value="cancelled">Cancel</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Menu Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Utensils className="h-5 w-5 mr-2" />
              Menu Management
            </CardTitle>
            <CardDescription>Manage available menu items and their availability</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adminMenuItems.map(item => (
                <Card key={item.id} className={!item.is_available ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                      </div>
                      <Badge variant="secondary">{formatCurrency(item.price)}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant={item.is_available ? 'default' : 'destructive'}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleMenuItemAvailability(item.id, item.is_available)}
                      >
                        {item.is_available ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Bless Canteen
                </h1>
                <p className="text-xs text-muted-foreground">Weekly Meal Ordering</p>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="ordering">
                  <Utensils className="h-4 w-4 mr-2" />
                  Order
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <Package className="h-4 w-4 mr-2" />
                  My Orders
                </TabsTrigger>
                <TabsTrigger value="admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} className="w-full">
          {/* Ordering Tab */}
          <TabsContent value="ordering" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Menu Selection */}
              <div className="lg:col-span-2 space-y-6">
                {renderWeekNavigation()}
                {renderDaySelector()}
                {renderPeriodSelector()}
                {renderMenuItems()}
              </div>

              {/* Right: Cart */}
              <div className="lg:col-span-1">
                {renderCart()}
              </div>
            </div>
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="orders" className="mt-0">
            {renderMyOrders()}
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="mt-0">
            {renderAdminDashboard()}
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Upload Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-primary" />
              Upload Payment Proof
            </DialogTitle>
            <DialogDescription>
              Please transfer to BCA and upload the payment receipt below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Bank Details */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Bank Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Bank:</span> <strong>BCA (Bank Central Asia)</strong></p>
                  <p><span className="text-muted-foreground">Account No:</span> <strong>3351015908</strong></p>
                  <p><span className="text-muted-foreground">Account Name:</span> <strong>Eva Susyana</strong></p>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="payment-file">Payment Receipt</Label>
              <Input
                id="payment-file"
                type="file"
                accept=".png,.jpg,.jpeg,.gif,.pdf"
                onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Accepted formats: PNG, JPG, JPEG, GIF, PDF (Max 16MB)
              </p>
            </div>

            {paymentFile && (
              <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="text-sm truncate">{paymentFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setPaymentFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={uploadPaymentProof}
              disabled={!paymentFile || isUploading}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Proof
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 Bless Canteen. Made with ❤️ for our school community.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Ordering hours: Mon-Fri, 7AM - 2PM</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
