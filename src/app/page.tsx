'use client'

import { useState, useEffect } from 'react'
import { 
  UtensilsCrossed, 
  User, 
  School, 
  Phone, 
  ChevronRight,
  CheckCircle,
  Flame,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  ArrowLeft,
  Calendar,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Types
interface MenuItem {
  id: string
  name: string
  description: string
  price: number
}

interface Category {
  id: string
  name: string
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

interface SelectionItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface DaySelection {
  [key: string]: SelectionItem[]
}

interface StudentData {
  name: string
  school: string
  grade: string
  parentName: string
  parentPhone: string
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

// Step components type
type Step = 'register' | 'order' | 'success'

export default function OrderPage() {
  // Current step
  const [currentStep, setCurrentStep] = useState<Step>('register')
  
  // Data states
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Form states
  const [studentData, setStudentData] = useState<StudentData>({
    name: '',
    school: '',
    grade: '',
    parentName: '',
    parentPhone: ''
  })
  
  // Selection states
  const [selections, setSelections] = useState<DaySelection>({})
  const [currentDayIndex, setCurrentDayIndex] = useState(0)
  
  // Order result
  const [orderResult, setOrderResult] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load menu on mount
  useEffect(() => {
    loadActiveMenu()
  }, [])

  const loadActiveMenu = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/menu')
      const data = await res.json()
      
      // Find active menu or get the latest one
      const activeMenu = data.weeklyMenus?.find((m: WeeklyMenu) => m.isActive) || data.weeklyMenus?.[0]
      
      if (activeMenu) {
        setWeeklyMenu(activeMenu)
        // Initialize selections for each day
        const initialSelections: DaySelection = {}
        activeMenu.days.forEach((day: DayMenu) => {
          initialSelections[day.day.toLowerCase()] = []
        })
        setSelections(initialSelections)
      }
    } catch (error) {
      console.error('Failed to load menu:', error)
      toast.error('Gagal memuat menu')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle student form submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!studentData.name || !studentData.school || !studentData.grade || 
        !studentData.parentName || !studentData.parentPhone) {
      toast.error('Mohon lengkapi semua data')
      return
    }
    
    setCurrentStep('order')
    toast.success('Data siswa tersimpan!')
  }

  // Add item to selection
  const addItem = (dayKey: string, item: MenuItem) => {
    setSelections(prev => {
      const daySelections = prev[dayKey] || []
      const existingIndex = daySelections.findIndex(s => s.id === item.id)
      
      if (existingIndex >= 0) {
        const updated = [...daySelections]
        updated[existingIndex].quantity += 1
        return { ...prev, [dayKey]: updated }
      } else {
        return {
          ...prev,
          [dayKey]: [...daySelections, {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1
          }]
        }
      }
    })
  }

  // Remove item from selection
  const removeItem = (dayKey: string, itemId: string) => {
    setSelections(prev => {
      const daySelections = prev[dayKey] || []
      const updated = daySelections.filter(s => s.id !== itemId)
      return { ...prev, [dayKey]: updated }
    })
  }

  // Update item quantity
  const updateQuantity = (dayKey: string, itemId: string, delta: number) => {
    setSelections(prev => {
      const daySelections = prev[dayKey] || []
      const existingIndex = daySelections.findIndex(s => s.id === itemId)
      
      if (existingIndex >= 0) {
        const updated = [...daySelections]
        const newQty = updated[existingIndex].quantity + delta
        
        if (newQty <= 0) {
          updated.splice(existingIndex, 1)
        } else {
          updated[existingIndex].quantity = newQty
        }
        
        return { ...prev, [dayKey]: updated }
      }
      return prev
    })
  }

  // Get day total
  const getDayTotal = (dayKey: string) => {
    return (selections[dayKey] || []).reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  // Get weekly total
  const getWeeklyTotal = () => {
    return Object.keys(selections).reduce((total, dayKey) => total + getDayTotal(dayKey), 0)
  }

  // Get total items count
  const getTotalItemsCount = () => {
    return Object.values(selections).reduce((total, dayItems) => 
      total + dayItems.reduce((dayTotal, item) => dayTotal + item.quantity, 0), 0)
  }

  // Submit order
  const handleSubmitOrder = async () => {
    if (getWeeklyTotal() === 0) {
      toast.error('Pilih minimal satu menu')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Build order items from selections
      const orderItems: any[] = []
      
      Object.entries(selections).forEach(([dayKey, items]) => {
        if (items.length > 0 && weeklyMenu) {
          const dayMenu = weeklyMenu.days.find(d => d.day.toLowerCase() === dayKey)
          
          items.forEach(item => {
            // Find category and add to order items
            dayMenu?.categories.forEach(cat => {
              const menuItem = cat.items.find(mi => mi.id === item.id)
              if (menuItem) {
                orderItems.push({
                  day: dayMenu.day,
                  categoryName: cat.name,
                  itemName: menuItem.name,
                  itemEmoji: '', // No emoji as requested
                  price: menuItem.price,
                  quantity: item.quantity
                })
              }
            })
          })
        }
      })

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentData.name,
          school: studentData.school,
          grade: studentData.grade,
          parentName: studentData.parentName,
          parentPhone: studentData.parentPhone,
          items: orderItems,
          totalAmount: getWeeklyTotal()
        })
      })

      const data = await res.json()
      
      if (res.ok) {
        setOrderResult(data.order)
        setCurrentStep('success')
        toast.success('Pesanan berhasil dibuat!')
      } else {
        toast.error(data.error || 'Gagal membuat pesanan')
      }
    } catch (error) {
      console.error('Submit order error:', error)
      toast.error('Terjadi kesalahan saat mengirim pesanan')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate WhatsApp message
  const generateWhatsAppMessage = () => {
    if (!orderResult) return ''
    
    let msg = `*PESANAN KATERING SEKOLAH*\n`
    msg += `──────────────────────\n`
    msg += `*No Pesanan:* ${orderResult.orderId}\n`
    msg += `*Siswa:* ${studentData.name}\n`
    msg += `*Sekolah:* ${studentData.school} (${studentData.grade})\n`
    msg += `*Orang Tua:* ${studentData.parentName}\n`
    msg += `*Telp:* ${studentData.parentPhone}\n`
    msg += `──────────────────────\n\n`
    msg += `*DETAIL PESANAN:*\n`
    
    Object.entries(selections).forEach(([dayKey, items]) => {
      if (items.length > 0) {
        const dayName = dayKey.charAt(0).toUpperCase() + dayKey.slice(1)
        msg += `\n🔥 *${dayName}*\n`
        items.forEach(item => {
          msg += `• ${item.name} x${item.quantity} = ${formatRupiah(item.price * item.quantity)}\n`
        })
        msg += `  Subtotal: ${formatRupiah(getDayTotal(dayKey))}\n`
      }
    })
    
    msg += `\n──────────────────────\n`
    msg += `*TOTAL: ${formatRupiah(getWeeklyTotal())}*\n`
    msg += `──────────────────────\n`
    msg += `Terima kasih! 🙏`
    
    return encodeURIComponent(msg)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat menu...</p>
        </div>
      </div>
    )
  }

  // No menu available
  if (!weeklyMenu) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Menu Tidak Tersedia</h3>
            <p className="text-gray-500">Belum ada menu mingguan yang tersedia. Silakan hubungi admin.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Register Step
  if (currentStep === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg mb-4">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">School Catering</h1>
            <p className="text-gray-600">Pemesanan Katering Sekolah Mingguan</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Data Siswa</CardTitle>
              <CardDescription>Isi data siswa untuk pemesanan</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama Siswa *
                  </label>
                  <Input
                    value={studentData.name}
                    onChange={(e) => setStudentData({...studentData, name: e.target.value})}
                    placeholder="Nama lengkap siswa"
                    required
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <School className="w-4 h-4" />
                      Sekolah *
                    </label>
                    <Input
                      value={studentData.school}
                      onChange={(e) => setStudentData({...studentData, school: e.target.value})}
                      placeholder="Nama sekolah"
                      required
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Kelas *</label>
                    <Input
                      value={studentData.grade}
                      onChange={(e) => setStudentData({...studentData, grade: e.target.value})}
                      placeholder="Contoh: 5A"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama Orang Tua/Wali *
                  </label>
                  <Input
                    value={studentData.parentName}
                    onChange={(e) => setStudentData({...studentData, parentName: e.target.value})}
                    placeholder="Nama orang tua atau wali"
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Nomor Telepon *
                  </label>
                  <Input
                    type="tel"
                    value={studentData.parentPhone}
                    onChange={(e) => setStudentData({...studentData, parentPhone: e.target.value})}
                    placeholder="08xxxxxxxxxx"
                    required
                    className="h-11"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-base mt-6"
                >
                  Lanjut ke Pemesanan
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Order Step
  if (currentStep === 'order') {
    const currentDay = weeklyMenu.days[currentDayIndex]
    const currentDayKey = currentDay.day.toLowerCase()

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setCurrentStep('register')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Kembali</span>
            </button>
            
            <h1 className="font-semibold text-gray-900">Pemesanan Menu</h1>
            
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-600">{getTotalItemsCount()}</span>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 pb-24 lg:pb-4">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            {/* Main Content - Menu */}
            <div className="lg:col-span-2 space-y-6">
              {/* Day Tabs */}
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {weeklyMenu.days.map((menu, index) => {
                    const dayKey = menu.day.toLowerCase()
                    const hasSelection = (selections[dayKey] || []).length > 0
                    
                    return (
                      <button
                        key={menu.day}
                        onClick={() => setCurrentDayIndex(index)}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all duration-300 flex flex-col items-center gap-1 min-w-[80px] ${
                          currentDayIndex === index 
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                            : hasSelection 
                              ? 'bg-orange-50 text-orange-600 border-2 border-orange-200' 
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Flame className="w-5 h-5" />
                        <span className="text-sm">{menu.day}</span>
                        {hasSelection && (
                          <span className="text-xs opacity-75">{formatRupiah(getDayTotal(dayKey))}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Current Day's Menu */}
              <div className="space-y-6">
                {currentDay.categories.map((category) => (
                  <Card key={category.name} className="border-0 shadow-lg overflow-hidden">
                    <div className={`bg-gradient-to-r ${category.gradient} p-4`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                          <UtensilsCrossed className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-white">
                          <h3 className="font-bold text-lg">{category.name}</h3>
                          <p className="text-white/80 text-sm">
                            {category.items.length} pilihan tersedia
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {category.items.map((item) => {
                        const isSelected = (selections[currentDayKey] || []).some(s => s.id === item.id)
                        const selected = (selections[currentDayKey] || []).find(s => s.id === item.id)
                        
                        return (
                          <Card 
                            key={item.id} 
                            className={`border-2 transition-all cursor-pointer hover:shadow-md ${
                              isSelected ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 hover:border-gray-200'
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-3">
                                <span className="font-bold text-orange-600">{formatRupiah(item.price)}</span>
                                
                                {isSelected && selected ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="w-8 h-8"
                                      onClick={() => updateQuantity(currentDayKey, item.id, -1)}
                                    >
                                      <Minus className="w-4 h-4" />
                                    </Button>
                                    <span className="w-8 text-center font-semibold">{selected.quantity}</span>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="w-8 h-8"
                                      onClick={() => updateQuantity(currentDayKey, item.id, 1)}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => addItem(currentDayKey, item)}
                                    className="bg-orange-500 hover:bg-orange-600"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Tambah
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-20">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Ringkasan Pesanan
                    </CardTitle>
                    <CardDescription className="text-white/80">
                      {studentData.name} - {studentData.grade}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    {/* Day-by-day summary */}
                    <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-4">
                      {weeklyMenu.days.map((day) => {
                        const dayKey = day.day.toLowerCase()
                        const dayItems = selections[dayKey] || []
                        
                        if (dayItems.length === 0) return null
                        
                        return (
                          <div key={day.day} className="border-b border-gray-100 pb-3 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-gray-900 flex items-center gap-2">
                                <Flame className="w-4 h-4 text-orange-500" />
                                {day.day}
                              </span>
                              <span className="font-bold text-orange-600">{formatRupiah(getDayTotal(dayKey))}</span>
                            </div>
                            
                            <div className="space-y-1">
                              {dayItems.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm text-gray-600">
                                  <span className="flex items-center gap-1 truncate max-w-[150px]">
                                    <span>{item.name}</span>
                                    <span className="text-gray-400">x{item.quantity}</span>
                                  </span>
                                  <span>{formatRupiah(item.price * item.quantity)}</span>
                                </div>
                              ))}
                            </div>
                            
                            <button
                              onClick={() => setSelections(prev => ({...prev, [dayKey]: []}))}
                              className="text-xs text-red-500 hover:text-red-700 mt-2 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Hapus semua
                            </button>
                          </div>
                        )
                      })}
                      
                      {(Object.values(selections).flat().length === 0) && (
                        <p className="text-center text-gray-500 py-8">
                          Belum ada item dipilih
                        </p>
                      )}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* Total */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-gray-900 text-lg">Total Pembayaran</span>
                      <span className="text-xl font-bold text-orange-600">{formatRupiah(getWeeklyTotal())}</span>
                    </div>
                    
                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold text-base"
                      disabled={getWeeklyTotal() === 0 || isSubmitting}
                      onClick={handleSubmitOrder}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Memproses...
                        </>
                      ) : (
                        'Konfirmasi Pesanan'
                      )}
                    </Button>
                    
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Dengan memesan, Anda menyetujui syarat & ketentuan
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success Step
  if (currentStep === 'success') {
    const whatsappMessage = generateWhatsAppMessage()
    const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pesanan Berhasil!</h1>
            <p className="text-gray-600 mb-6">Terima kasih telah melakukan pemesanan</p>
            
            {orderResult && (
              <div className="bg-gray-50 rounded-xl p-4 text-left mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">Nomor Pesanan</span>
                  <Badge variant="secondary" className="font-mono">{orderResult.orderId}</Badge>
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Siswa</span>
                    <span className="font-medium">{studentData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sekolah</span>
                    <span className="font-medium">{studentData.school}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-green-600">{formatRupiah(orderResult.totalAmount)}</span>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(orderResult.createdAt).toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full"
              >
                <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Konfirmasi via WhatsApp
                </Button>
              </a>
              
              <Button 
                variant="outline" 
                className="w-full h-12"
                onClick={() => {
                  setCurrentStep('register')
                  setStudentData({ name: '', school: '', grade: '', parentName: '', parentPhone: '' })
                  setSelections({})
                  setOrderResult(null)
                }}
              >
                Buat Pesanan Baru
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
