'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  ShoppingCart, 
  LogOut, 
  Menu, 
  X, 
  Users, 
  TrendingUp,
  Calendar,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit3,
  Trash2,
  Save,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Types
interface AdminUser {
  id: string
  username: string
  name: string
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  emoji: string
}

interface Category {
  id: string
  name: string
  icon: string
  gradient: string
  items: MenuItem[]
}

interface DayMenu {
  id: string
  day: string
  categories: Category[]
}

interface WeeklyMenu {
  id: string
  weekNumber: number
  year: number
  isActive: boolean
  days: DayMenu[]
}

interface OrderItem {
  id: string
  day: string
  categoryName: string
  itemName: string
  itemEmoji: string
  price: number
  quantity: number
}

interface Order {
  id: string
  orderId: string
  studentName: string
  school: string
  grade: string
  parentName: string
  parentPhone: string
  totalAmount: number
  status: string
  createdAt: string
  items: OrderItem[]
}

interface StatsData {
  summary: {
    totalOrders: number
    ordersToday: number
    ordersThisWeek: number
    ordersThisMonth: number
    totalRevenue: number
    todayRevenue: number
    weekRevenue: number
  }
  byStatus: {
    pending: number
    confirmed: number
    cancelled: number
  }
  last7Days: Array<{
    date: string
    orders: number
    revenue: number
  }>
  recentOrders: Order[]
}

// Preparation Summary types
interface PrepSummaryItem {
  day: string
  itemName: string
  categoryName: string
  itemEmoji: string
  totalQuantity: number
  totalPrice: number
  orderCount: number
}

interface PrepSummaryData {
  weekNumber: number
  year: number
  summary: PrepSummaryItem[]
  groupedByDay: Record<string, PrepSummaryItem[]>
  totals: {
    items: number
    revenue: number
    orders: number
  }
}

// Format currency
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get date range from week number (Monday to Friday) - Format: dd/mm/yyyy
const getWeekDateRange = (weekNumber: number, year?: number): string => {
  const currentYear = year || new Date().getFullYear()
  
  // Find January 1st of the year
  const janFirst = new Date(currentYear, 0, 1)
  
  // Find first Monday of the year (ISO week date system)
  const firstDay = janFirst.getDay()
  const firstMonday = new Date(janFirst)
  
  // Adjust to get to the first Monday
  const daysToAdd = firstDay === 1 ? 0 : 
                   firstDay === 0 ? 1 : 
                   (8 - firstDay)
  
  firstMonday.setDate(janFirst.getDate() + daysToAdd)
  
  // Calculate the start of the target week (Monday)
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + ((weekNumber - 1) * 7))
  
  // Week end is Friday (4 days after Monday)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 4)
  
  // Format as dd/mm/yyyy
  const formatDateDDMMYYYY = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const yr = date.getFullYear()
    return `${day}/${month}/${yr}`
  }
  
  return `${formatDateDDMMYYYY(weekStart)} - ${formatDateDDMMYYYY(weekEnd)}`
}

// Default menu structure
const getDefaultMenuStructure = (): DayMenu[] => [
  {
    id: '',
    day: 'Senin',
    categories: [
      { id: '', name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [] },
      { id: '', name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [] },
      { id: '', name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [] }
    ]
  },
  {
    id: '',
    day: 'Selasa',
    categories: [
      { id: '', name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [] },
      { id: '', name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [] },
      { id: '', name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [] }
    ]
  },
  {
    id: '',
    day: 'Rabu',
    categories: [
      { id: '', name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [] },
      { id: '', name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [] },
      { id: '', name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [] }
    ]
  },
  {
    id: '',
    day: 'Kamis',
    categories: [
      { id: '', name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [] },
      { id: '', name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [] },
      { id: '', name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [] }
    ]
  },
  {
    id: '',
    day: 'Jumat',
    categories: [
      { id: '', name: 'Hidangan Utama', icon: '🍛', gradient: 'from-orange-500 to-red-500', items: [] },
      { id: '', name: 'Makanan Ringan', icon: '🥪', gradient: 'from-green-500 to-emerald-400', items: [] },
      { id: '', name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400', items: [] }
    ]
  }
]

export default function AdminDashboard() {
  // Auth state
  const [isAdmin, setIsAdmin] = useState(false)
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Data states
  const [stats, setStats] = useState<StatsData | null>(null)
  const [weeklyMenus, setWeeklyMenus] = useState<WeeklyMenu[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedMenu, setSelectedMenu] = useState<WeeklyMenu | null>(null)
  const [prepData, setPrepData] = useState<PrepSummaryData | null>(null)
  const [isLoadingPrep, setIsLoadingPrep] = useState(false)
  
  // Pagination & filters
  const [orderPage, setOrderPage] = useState(1)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Editing states
  const [editingMenu, setEditingMenu] = useState<DayMenu[] | null>(null)
  const [isSavingMenu, setIsSavingMenu] = useState(false)
  const [isAddingWeek, setIsAddingWeek] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check')
      const data = await res.json()
      
      if (data.authenticated) {
        setIsAdmin(true)
        setAdmin(data.admin)
        await loadAllData()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAllData = async () => {
    await Promise.all([
      loadStats(),
      loadMenus(),
      loadOrders()
    ])
  }

  const loadStats = async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  // Day order mapping for consistent sorting
  const dayOrderPriority: { [key: string]: number } = {
    'Senin': 1,
    'Selasa': 2,
    'Rabu': 3,
    'Kamis': 4,
    'Jumat': 5
  }

  // Sort days in correct order (Senin -> Jumat)
  const sortDaysByOrder = (days: DayMenu[]): DayMenu[] => {
    return [...days].sort((a, b) => {
      const orderA = dayOrderPriority[a.day] || 99
      const orderB = dayOrderPriority[b.day] || 99
      return orderA - orderB
    })
  }

  const loadMenus = async () => {
    try {
      const res = await fetch('/api/menu')
      const data = await res.json()
      setWeeklyMenus(data.weeklyMenus || [])
      if (data.weeklyMenus?.length > 0 && !selectedMenu) {
        // Sort days when setting the initial menu
        const menu = data.weeklyMenus[0]
        if (menu && menu.days) {
          menu.days = sortDaysByOrder(menu.days)
        }
        setSelectedMenu(menu)
      }
    } catch (error) {
      console.error('Failed to load menus:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: orderPage.toString(),
        limit: '10',
        ...(orderStatusFilter !== 'all' && { status: orderStatusFilter }),
        ...(orderSearch && { search: orderSearch })
      })
      
      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      setOrders(data.orders || [])
      setTotalOrders(data.pagination?.total || 0)
      setTotalPages(data.pagination?.pages || 1)
    } catch (error) {
      console.error('Failed to load orders:', error)
    }
  }

  // Load preparation summary for selected week
  const loadPrepSummary = async (weekNumber: number, year: number) => {
    setIsLoadingPrep(true)
    try {
      const res = await fetch(`/api/menu-prep?weekNumber=${weekNumber}&year=${year}`)
      const data = await res.json()
      setPrepData(data)
    } catch (error) {
      console.error('Failed to load prep summary:', error)
      setPrepData(null)
    } finally {
      setIsLoadingPrep(false)
    }
  }

  // Load prep summary when selected menu changes
  useEffect(() => {
    if (selectedMenu && activeTab === 'menu') {
      loadPrepSummary(selectedMenu.weekNumber, selectedMenu.year)
    }
  }, [selectedMenu, activeTab])

  // Reload orders when filters change
  useEffect(() => {
    if (isAdmin) {
      loadOrders()
    }
  }, [orderPage, orderStatusFilter])

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setIsAdmin(true)
        setAdmin(data.admin)
        toast.success('Login berhasil! Selamat datang, ' + data.admin.name)
        await loadAllData()
      } else {
        toast.error(data.error || 'Login gagal')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat login')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setIsAdmin(false)
      setAdmin(null)
      setActiveTab('dashboard')
      toast.success('Logout berhasil')
    } catch (error) {
      toast.error('Gagal logout')
    }
  }

  // Handle menu save
  const handleSaveMenu = async () => {
    if (!selectedMenu || !editingMenu) return
    
    setIsSavingMenu(true)
    try {
      // Ensure days are in correct order before saving
      const orderedDays = sortDaysByOrder(editingMenu)
      
      // Clean up the data - remove empty items and ensure proper structure
      const cleanedDays = orderedDays.map(day => ({
        day: day.day,
        categories: (day.categories || [])
          .filter(cat => cat.name && cat.name.trim() !== '')
          .map(cat => ({
            name: cat.name,
            icon: cat.icon || '',
            gradient: cat.gradient || '',
            items: (cat.items || [])
              .filter(item => item.name && item.name.trim() !== '')
              .map(item => ({
                name: item.name,
                description: item.description || '',
                price: Number(item.price) || 0,
                emoji: item.emoji || ''
              }))
          }))
      }))
      
      console.log('Saving menu data:', JSON.stringify(cleanedDays, null, 2))
      
      const res = await fetch(`/api/menu/${selectedMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: cleanedDays })
      })
      
      const data = await res.json()
      console.log('Save response:', data)
      
      if (res.ok) {
        toast.success('Menu berhasil disimpan!')
        // Sort the returned menu days correctly
        if (data.menu && data.menu.days) {
          data.menu.days = sortDaysByOrder(data.menu.days)
        }
        setSelectedMenu(data.menu)
        setEditingMenu(null)
        await loadMenus()
      } else {
        console.error('Save error:', data.error)
        toast.error(data.error || 'Gagal menyimpan menu')
      }
    } catch (error) {
      console.error('Save exception:', error)
      toast.error('Terjadi kesalahan saat menyimpan menu')
    } finally {
      setIsSavingMenu(false)
    }
  }

  // Handle add new week
  const handleAddNewWeek = async () => {
    try {
      // Find the highest week number from existing menus
      const lastWeek = weeklyMenus.reduce((max, menu) => {
        if (menu.year > max.year) return menu
        if (menu.year === max.year && menu.weekNumber > max.weekNumber) return menu
        return max
      }, weeklyMenus[0] || { weekNumber: 0, year: new Date().getFullYear() })
      
      const newWeekNumber = lastWeek.weekNumber + 1
      const newYear = lastWeek.year
      
      // Create new week via API
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weekNumber: newWeekNumber, 
          year: newYear,
          days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => ({
            day,
            categories: [
              { name: 'Hidangan Utama', icon: '', gradient: 'from-orange-500 to-red-500', items: [] },
              { name: 'Makanan Ringan', icon: '', gradient: 'from-green-500 to-emerald-400', items: [] },
              { name: 'Tambahan', icon: '', gradient: 'from-blue-500 to-cyan-400', items: [] }
            ]
          }))
        })
      })
      
      if (res.ok) {
        toast.success(`Minggu ${newWeekNumber} berhasil ditambahkan!`)
        await loadMenus()
      } else {
        const data = await res.json()
        if (res.status === 409) {
          toast.error('Minggu tersebut sudah ada')
        } else {
          toast.error(data.error || 'Gagal menambahkan minggu')
        }
      }
    } catch (error) {
      console.error('Add week exception:', error)
      toast.error('Terjadi kesalahan saat menambahkan minggu')
    }
  }

  // Handle order status update
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (res.ok) {
        toast.success(`Status pesanan diubah menjadi ${status}`)
        await Promise.all([loadOrders(), loadStats()])
      } else {
        const data = await res.json()
        toast.error(data.error || 'Gagal mengubah status')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan')
    }
  }

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setOrderSearch(value)
    setOrderPage(1)
  }, [])

  // Menu item helpers
  const addMenuItem = (dayIndex: number, catIndex: number) => {
    if (!editingMenu) return
    const updated = [...editingMenu]
    updated[dayIndex].categories[catIndex].items.push({
      id: '',
      name: '',
      description: '',
      price: 0
    })
    setEditingMenu(updated)
  }

  const updateMenuItem = (dayIndex: number, catIndex: number, itemIndex: number, field: string, value: any) => {
    if (!editingMenu) return
    const updated = [...editingMenu]
    ;(updated[dayIndex].categories[catIndex].items[itemIndex] as any)[field] = value
    setEditingMenu(updated)
  }

  const removeMenuItem = (dayIndex: number, catIndex: number, itemIndex: number) => {
    if (!editingMenu) return
    const updated = [...editingMenu]
    updated[dayIndex].categories[catIndex].items.splice(itemIndex, 1)
    setEditingMenu(updated)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  // Login screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">School Catering</CardTitle>
            <CardDescription className="text-gray-600">Masuk ke Panel Administrator</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <Input
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </Button>
            </form>
            <div className="mt-6 p-3 bg-orange-50 rounded-lg">
              <p className="text-xs text-orange-700 text-center">
                <strong>Demo:</strong> admin / admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main admin dashboard
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">School Catering</h1>
              <p className="text-xs text-gray-500">Panel Admin</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <button
              onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => { setActiveTab('menu'); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === 'menu' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UtensilsCrossed className="w-5 h-5" />
              <span className="font-medium">Kelola Menu</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                activeTab === 'orders' 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium">Pesanan</span>
              {stats?.byStatus.pending ? (
                <Badge className="ml-auto bg-yellow-500 text-white">{stats.byStatus.pending}</Badge>
              ) : null}
            </button>
          </nav>

          {/* User info & Logout */}
          <div className="px-4 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{admin?.name}</p>
                <p className="text-xs text-gray-500 truncate">{admin?.username}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <div className="hidden lg:block">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'menu' && 'Kelola Menu Mingguan'}
                {activeTab === 'orders' && 'Daftar Pesanan'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && stats && (
            <div className="space-y-6">
              {/* Stats Cards - Simplified for Weekly Income */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
                <Card className="border-0 shadow-lg shadow-gray-200/50 bg-gradient-to-br from-purple-500 to-indigo-600">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-100 mb-1">Pendapatan Minggu Ini</p>
                        <p className="text-2xl lg:text-3xl font-bold text-white">{formatRupiah(stats.summary.weekRevenue)}</p>
                      </div>
                      <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <DollarSign className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-purple-100">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{stats.summary.ordersThisWeek} pesanan minggu ini</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-gray-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Pesanan</p>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.summary.totalOrders}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-green-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>+{stats.summary.ordersToday} hari ini</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-gray-200/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Pendapatan</p>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{formatRupiah(stats.summary.totalRevenue)}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>Semua waktu</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Cards & Recent Orders */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Status */}
                <Card className="border-0 shadow-lg shadow-gray-200/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Status Pesanan</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-gray-700">Pending</span>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                        {stats.byStatus.pending}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-gray-700">Dikonfirmasi</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-200 text-green-800">
                        {stats.byStatus.confirmed}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="font-medium text-gray-700">Dibatalkan</span>
                      </div>
                      <Badge variant="secondary" className="bg-red-200 text-red-800">
                        {stats.byStatus.cancelled}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                <Card className="border-0 shadow-lg shadow-gray-200/50 lg:col-span-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Pesanan Terbaru</CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab('orders')}
                      >
                        Lihat Semua
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {stats.recentOrders.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Belum ada pesanan</p>
                      ) : (
                        stats.recentOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{order.studentName}</p>
                              <p className="text-sm text-gray-500">{order.orderId} • {order.school}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-semibold text-gray-900">{formatRupiah(order.totalAmount)}</p>
                              <Badge 
                                variant="secondary" 
                                className={
                                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {order.status === 'pending' ? 'Menunggu' :
                                 order.status === 'confirmed' ? 'Dikonfirmasi' : 'Dibatalkan'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>


            </div>
          )}

          {/* Menu Management Tab */}
          {activeTab === 'menu' && (
            <div className="space-y-6">
              {/* Week Selector */}
              <Card className="border-0 shadow-lg shadow-gray-200/50">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Pilih Periode Menu</CardTitle>
                      <CardDescription>
                        {selectedMenu ? getWeekDateRange(selectedMenu.weekNumber, selectedMenu.year) : 'Pilih periode untuk mengelola menu'}
                      </CardDescription>
                    </div>
                    <div className="relative z-50 flex items-center gap-2">
                      <Select 
                        value={selectedMenu?.id || ''} 
                        onValueChange={(value) => {
                          const menu = weeklyMenus.find(m => m.id === value)
                          // Sort days when selecting a new menu
                          if (menu && menu.days) {
                            menu.days = sortDaysByOrder(menu.days)
                          }
                          setSelectedMenu(menu || null)
                          setEditingMenu(null)
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-64 cursor-pointer">
                          <SelectValue placeholder="Pilih periode menu..." />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {weeklyMenus.length === 0 ? (
                            <SelectItem value="" disabled>
                              Tidak ada menu tersedia
                            </SelectItem>
                          ) : (
                            weeklyMenus.map((menu) => (
                              <SelectItem key={menu.id} value={menu.id}>
                                {getWeekDateRange(menu.weekNumber, menu.year)} {menu.isActive && '(Aktif)'}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      
                      {/* Add New Week Button */}
                      <Button
                        onClick={handleAddNewWeek}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="icon"
                        title="Tambah Minggu Baru"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {selectedMenu && (
                <>
                  {/* Menu Actions */}
                  {!editingMenu ? (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => {
                          // Sort days correctly when entering edit mode
                          const sortedDays = sortDaysByOrder(selectedMenu.days)
                          setEditingMenu(JSON.parse(JSON.stringify(sortedDays)))
                        }}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit Menu
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSaveMenu}
                        disabled={isSavingMenu}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSavingMenu ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setEditingMenu(null)}
                      >
                        Batal
                      </Button>
                      <Button
                          onClick={handleAddNewWeek}
                          disabled={isAddingWeek}
                          className={`bg-green-600 hover:bg-green-700 text-white ${isAddingWeek ? 'opacity-75 cursor-not-allowed' : ''}`}
                          size="icon"
                          title={isAddingWeek ? 'Memproses...' : 'Tambah Minggu Baru'}
                        >
                          {isAddingWeek ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                    </Button>
                    </div>
                  )}

                  {/* Menu Display/Edit */}
                  <div className="space-y-6">
                    {(editingMenu ? sortDaysByOrder(editingMenu) : sortDaysByOrder(selectedMenu.days)).map((day, dayIndex) => (
                      <Card key={day.day} className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Flame className="w-6 h-6 text-white" />
                            <h3 className="text-xl font-bold text-white">{day.day}</h3>
                          </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                          {(editingMenu?.[dayIndex]?.categories || day.categories).map((cat, catIndex) => (
                            <div key={cat.name}>
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                  <UtensilsCrossed className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="font-semibold text-gray-900 text-lg">{cat.name}</h4>
                                <span className="text-sm text-gray-500">
                                  ({(editingMenu?.[dayIndex]?.categories[catIndex]?.items || cat.items).length} item)
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(editingMenu?.[dayIndex]?.categories[catIndex]?.items || cat.items).map((item, itemIndex) => (
                                  <div 
                                    key={itemIndex} 
                                    className={`p-4 rounded-xl border ${
                                      editingMenu ? 'border-orange-200 bg-orange-50/50' : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    {editingMenu ? (
                                      <div className="space-y-3">
                                          <Input
                                            value={item.name}
                                            onChange={(e) => updateMenuItem(dayIndex, catIndex, itemIndex, 'name', e.target.value)}
                                            placeholder="Nama menu"
                                            className="font-medium"
                                          />
                                          <Input
                                            value={item.description}
                                            onChange={(e) => updateMenuItem(dayIndex, catIndex, itemIndex, 'description', e.target.value)}
                                            placeholder="Deskripsi"
                                          />
                                          <div className="flex gap-2">
                                            <div className="relative flex-1">
                                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                                              <Input
                                                type="number"
                                                value={item.price}
                                                onChange={(e) => updateMenuItem(dayIndex, catIndex, itemIndex, 'price', parseInt(e.target.value) || 0)}
                                                className="pl-10"
                                                placeholder="0"
                                              />
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="icon"
                                              onClick={() => removeMenuItem(dayIndex, catIndex, itemIndex)}
                                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                      </div>
                                    ) : (
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-sm text-gray-500 line-clamp-1">{item.description}</p>
                                        <p className="text-sm font-semibold text-orange-600 mt-1">{formatRupiah(item.price)}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                                
                                {editingMenu && (
                                  <Button
                                    variant="dashed"
                                    className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-600"
                                    onClick={() => addMenuItem(dayIndex, catIndex)}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Item
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Preparation Summary Section */}
              {selectedMenu && (
                <Card className="border-0 shadow-lg shadow-gray-200/50 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Ringkasan Persiapan</h3>
                          <p className="text-sm text-emerald-100">
                            Jumlah pesanan per menu untuk persiapan
                          </p>
                        </div>
                      </div>
                      {prepData && (
                        <div className="hidden sm:flex items-center gap-6 text-white">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{prepData.totals.orders}</p>
                            <p className="text-xs text-emerald-100">Pesanan</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{prepData.totals.items}</p>
                            <p className="text-xs text-emerald-100">Total Item</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{formatRupiah(prepData.totals.revenue)}</p>
                            <p className="text-xs text-emerald-100">Pendapatan</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    {isLoadingPrep ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
                        <span className="text-gray-600">Memuat data persiapan...</span>
                      </div>
                    ) : !prepData || prepData.summary.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Belum ada pesanan untuk minggu ini</p>
                        <p className="text-sm text-gray-400 mt-1">Pesanan akan muncul di sini setelah siswa melakukan pemesanan</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Mobile Stats */}
                        <div className="sm:hidden grid grid-cols-3 gap-3">
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-emerald-700">{prepData.totals.orders}</p>
                            <p className="text-xs text-emerald-600">Pesanan</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-emerald-700">{prepData.totals.items}</p>
                            <p className="text-xs text-emerald-600">Total Item</p>
                          </div>
                          <div className="bg-emerald-50 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-emerald-700">{formatRupiah(prepData.totals.revenue)}</p>
                            <p className="text-xs text-emerald-600">Pendapatan</p>
                          </div>
                        </div>

                        {/* Grouped by Day */}
                        {Object.entries(prepData.groupedByDay).map(([day, items]) => {
                          const dayEmoji: Record<string, string> = {
                            'Senin': '📅',
                            'Selasa': '📅', 
                            'Rabu': '📅',
                            'Kamis': '📅',
                            'Jumat': '📅'
                          }
                          return (
                            <div key={day} className="border border-gray-200 rounded-xl overflow-hidden">
                              <div className="bg-gray-50 px-4 py-3 flex items-center gap-2">
                                <span className="text-lg">{dayEmoji[day] || '📅'}</span>
                                <h4 className="font-semibold text-gray-900">{day}</h4>
                                <span className="text-sm text-gray-500">({items.length} menu dipesan)</span>
                              </div>
                              <div className="divide-y divide-gray-100">
                                {items.map((item, idx) => (
                                  <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                      <span className="text-2xl">{item.itemEmoji || '🍽️'}</span>
                                      <div>
                                        <p className="font-medium text-gray-900">{item.itemName}</p>
                                        <p className="text-sm text-gray-500">{item.categoryName}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <div className="text-right">
                                        <p className="text-lg font-bold text-emerald-600">{item.totalQuantity}x</p>
                                        <p className="text-xs text-gray-500">{item.orderCount} pesanan</p>
                                      </div>
                                      <div className="w-24 text-right">
                                        <p className="font-semibold text-gray-900">{formatRupiah(item.totalPrice)}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {weeklyMenus.length === 0 && (
                <Card className="border-0 shadow-lg shadow-gray-200/50">
                  <CardContent className="py-12 text-center">
                    <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Menu</h3>
                    <p className="text-gray-500">Buat menu mingguan untuk memulai</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="border-0 shadow-lg shadow-gray-200/50">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Cari pesanan..."
                        value={orderSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={orderStatusFilter} onValueChange={(v) => { setOrderStatusFilter(v); setOrderPage(1) }}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="pending">Menunggu</SelectItem>
                        <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                        <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Orders Table */}
              <Card className="border-0 shadow-lg shadow-gray-200/50">
                <CardContent className="p-0">
                  {orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Pesanan</h3>
                      <p className="text-gray-500">{orderSearch || orderStatusFilter !== 'all' ? 'Coba ubah filter pencarian' : 'Belum ada pesanan masuk'}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID Pesanan</TableHead>
                          <TableHead>Siswa</TableHead>
                          <TableHead className="hidden md:table-cell">Sekolah</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono text-sm">{order.orderId}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{order.studentName}</p>
                                <p className="text-sm text-gray-500">{order.parentName}</p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm">{order.school}</span>
                              <br />
                              <span className="text-xs text-gray-500">{order.grade}</span>
                            </TableCell>
                            <TableCell className="font-semibold">{formatRupiah(order.totalAmount)}</TableCell>
                            <TableCell>
                              <Select 
                                value={order.status} 
                                onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className={`w-32 ${
                                  order.status === 'pending' ? 'border-yellow-300' :
                                  order.status === 'confirmed' ? 'border-green-300' :
                                  'border-red-300'
                                }`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    <span className="flex items-center gap-2">
                                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                                      Menunggu
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="confirmed">
                                    <span className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      Konfirmasi
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="cancelled">
                                    <span className="flex items-center gap-2">
                                      <XCircle className="w-4 h-4 text-red-500" />
                                      Batalkan
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {formatDate(order.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setSelectedOrderId(order.id)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Detail Pesanan</DialogTitle>
                                    <DialogDescription>{order.orderId}</DialogDescription>
                                  </DialogHeader>
                                  <OrderDetail order={order} />
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        Menampilkan {((orderPage - 1) * 10) + 1}-{Math.min(orderPage * 10, totalOrders)} dari {totalOrders} pesanan
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={orderPage <= 1}
                          onClick={() => setOrderPage(p => p - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600 px-2">
                          Halaman {orderPage} dari {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={orderPage >= totalPages}
                          onClick={() => setOrderPage(p => p + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Order Detail Component
function OrderDetail({ order }: { order: Order }) {
  // Group items by day
  const groupedItems = order.items.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = []
    acc[item.day].push(item)
    return acc
  }, {} as Record<string, OrderItem[]>)

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Nama Siswa</p>
          <p className="font-medium">{order.studentName}</p>
        </div>
        <div>
          <p className="text-gray-500">Sekolah / Kelas</p>
          <p className="font-medium">{order.school} ({order.grade})</p>
        </div>
        <div>
          <p className="text-gray-500">Orang Tua/Wali</p>
          <p className="font-medium">{order.parentName}</p>
        </div>
        <div>
          <p className="text-gray-500">Telepon</p>
          <p className="font-medium">{order.parentPhone}</p>
        </div>
        <div>
          <p className="text-gray-500">Tanggal Pemesanan</p>
          <p className="font-medium">{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="text-gray-500">Status</p>
          <Badge className={
            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            order.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }>
            {order.status === 'pending' ? 'Menunggu' :
             order.status === 'confirmed' ? 'Dikonfirmasi' : 'Dibatalkan'}
          </Badge>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-medium mb-3">Item Pesanan:</h4>
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([day, items]) => (
            <div key={day}>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-gray-900">{day}</span>
              </div>
              <div className="pl-6 space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>{item.itemName}</span>
                      <span className="text-gray-500">({item.categoryName})</span>
                    </span>
                    <span className="font-medium">{formatRupiah(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <span className="font-semibold text-lg">Total Pembayaran</span>
        <span className="font-bold text-xl text-orange-600">{formatRupiah(order.totalAmount)}</span>
      </div>
    </div>
  )
}
