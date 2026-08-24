'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit3, 
  Save, 
  X,
  UtensilsCrossed,
  Cookie,
  Coffee,
  Trash2,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

// Types
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
  dayOrder: number
  date: Date
  categories: Category[]
}

interface WeeklyMenu {
  id: string
  weekNumber: number
  year: number
  isActive: boolean
  days: DayMenu[]
}

// Day names in Indonesian
const DAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DEFAULT_CATEGORIES = [
  { name: 'Hidangan Utama', icon: '🍽️', gradient: 'from-orange-500 to-red-500' },
  { name: 'Makanan Ringan', icon: '🍪', gradient: 'from-green-500 to-emerald-400' },
  { name: 'Tambahan', icon: '🥤', gradient: 'from-blue-500 to-cyan-400' }
]

// Format currency
const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate()
}

// Get first day of month (0 = Sunday, 1 = Monday, etc.)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay()
}

// Check if date is today
const isToday = (date: Date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// Check if date is in the past
const isPast = (date: Date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate < today
}

// Get week number from date
const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

interface MenuCalendarProps {
  weeklyMenus: WeeklyMenu[]
  onRefresh: () => void
}

export default function MenuCalendar({ weeklyMenus, onRefresh }: MenuCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingDay, setEditingDay] = useState<DayMenu | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Find menu data for a specific date
  const findMenuForDate = (date: Date): DayMenu | undefined => {
    const dayIndex = date.getDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    if (dayIndex === 0 || dayIndex === 6) return undefined // Skip weekends
    
    const dayName = DAY_NAMES[dayIndex - 1]
    const weekNum = getWeekNumber(date)
    const year = date.getFullYear()
    
    // Find the weekly menu
    const weekMenu = weeklyMenus.find(wm => wm.weekNumber === weekNum && wm.year === year)
    if (!weekMenu) return undefined
    
    // Find the day
    return weekMenu.days.find(d => d.day === dayName)
  }

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    
    const days: (Date | null)[] = []
    
    // Add empty cells for days before the first day of month
    // Adjust for Monday start (if firstDay is Sunday=0, show 6 empty cells, etc.)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1
    for (let i = 0; i < startOffset; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }, [currentDate])

  // Navigate months
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    
    // Limit to 3 months ahead
    const now = new Date()
    const maxDate = new Date(now.getFullYear(), now.getMonth() + 3, 1)
    
    if (newDate <= maxDate) {
      setCurrentDate(newDate)
      setSelectedDate(null)
      setEditingDay(null)
    } else {
        toast.error('Maksimal 3 bulan ke depan')
      }
  }

  // Handle day click
  const handleDayClick = (date: Date) => {
    const dayOfWeek = date.getDay()
    // Only allow Mon-Fri
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast.info('Catering hanya tersedia Senin-Jumat')
      return
    }
    
    // Don't allow editing past dates
    if (isPast(date)) {
      toast.error('Tidak dapat mengedit tanggal yang sudah lewat')
      return
    }
    
    setSelectedDate(date)
    setEditingDay(null)
    
    // Auto-start editing if no menu exists
    const existingMenu = findMenuForDate(date)
    if (!existingMenu) {
      // Pass the date directly to avoid state timing issue
      setTimeout(() => startEditingWithDate(date), 100)
    }
  }

  // Start editing with explicit date parameter (avoids state timing issues)
  const startEditingWithDate = async (date: Date) => {
    console.log('startEditingWithDate: Starting for date:', date.toISOString())
    setIsLoading(true)
    
    try {
      const dayName = DAY_NAMES[date.getDay() - 1]
      const weekNum = getWeekNumber(date)
      const year = date.getFullYear()
      
      console.log('startEditingWithDate: Looking for week', weekNum, 'year', year)
      
      // Check if week exists
      let weekMenu = weeklyMenus.find(wm => wm.weekNumber === weekNum && wm.year === year)
      
      if (!weekMenu) {
        console.log('startEditingWithDate: Week not found, creating new week...')
        // Create new week
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekNumber: weekNum,
            year: year,
            days: DAY_NAMES.map(day => ({
              day,
              categories: DEFAULT_CATEGORIES.map(cat => ({
                ...cat,
                items: []
              }))
            }))
          })
        })
        
        console.log('startEditingWithDate: API response status:', res.status)
        
        if (res.ok) {
          toast.success(`Minggu ${weekNum} dibuat!`)
          onRefresh()
          
          // Wait for refresh then set editing
          setTimeout(async () => {
            try {
              console.log('startEditingWithDate: Refreshing menu data...')
              const refreshedRes = await fetch('/api/menu')
              const data = await refreshedRes.json()
              console.log('startEditingWithDate: Refreshed data:', data.weeklyMenus?.length, 'weeks')
              const newWeek = data.weeklyMenus?.find((wm: WeeklyMenu) => wm.weekNumber === weekNum && wm.year === year)
              
              if (newWeek) {
                console.log('startEditingWithDate: Found new week, looking for day:', dayName)
                const dayData = newWeek.days.find((d: DayMenu) => d.day === dayName)
                if (dayData) {
                  // Attach the date to the day object
                  dayData.date = date
                  setEditingDay(dayData)
                  console.log('startEditingWithDate: Editing mode started!')
                } else {
                  console.error('startEditingWithDate: Day not found in new week')
                  toast.error('Hari tidak ditemukan')
                }
              } else {
                console.error('startEditingWithDate: New week not found after refresh')
                toast.error('Minggu baru tidak ditemukan')
              }
            } catch (refreshError) {
              console.error('startEditingWithDate: Error refreshing:', refreshError)
              toast.error('Gagal memuat data terbaru')
            }
          }, 500)
        } else {
          const error = await res.json().catch(() => ({ error: 'Unknown error' }))
          console.error('startEditingWithDate: API error:', error)
          toast.error(error.error || 'Gagal membuat minggu')
        }
      } else {
        console.log('startEditingWithDate: Week exists, finding day...')
        // Week exists, find or create the day
        let dayData = weekMenu.days.find(d => d.day === dayName)
        
        if (dayData) {
          dayData.date = date
          setEditingDay(dayData)
          console.log('startEditingWithDate: Editing mode started for existing day!')
        } else {
          console.error('startEditingWithDate: Day not found in existing week')
          toast.error('Hari tidak ditemukan dalam minggu ini')
        }
      }
    } catch (error) {
      console.error('startEditingWithDate: Exception:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  // Start editing selected day
  const startEditing = async () => {
    if (!selectedDate) {
      console.log('startEditing: No selected date')
      return
    }
    
    console.log('startEditing: Starting for date:', selectedDate.toISOString())
    setIsLoading(true)
    
    try {
      const dayName = DAY_NAMES[selectedDate.getDay() - 1]
      const weekNum = getWeekNumber(selectedDate)
      const year = selectedDate.getFullYear()
      
      console.log('startEditing: Looking for week', weekNum, 'year', year)
      
      // Check if week exists
      let weekMenu = weeklyMenus.find(wm => wm.weekNumber === weekNum && wm.year === year)
      
      if (!weekMenu) {
        console.log('startEditing: Week not found, creating new week...')
        // Create new week
        const res = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekNumber: weekNum,
            year: year,
            days: DAY_NAMES.map(day => ({
              day,
              categories: DEFAULT_CATEGORIES.map(cat => ({
                ...cat,
                items: []
              }))
            }))
          })
        })
        
        console.log('startEditing: API response status:', res.status)
        
        if (res.ok) {
          toast.success(`Minggu ${weekNum} dibuat!`)
          onRefresh()
          
          // Wait for refresh then set editing
          setTimeout(async () => {
            try {
              console.log('startEditing: Refreshing menu data...')
              const refreshedRes = await fetch('/api/menu')
              const data = await refreshedRes.json()
              console.log('startEditing: Refreshed data:', data.weeklyMenus?.length, 'weeks')
              const newWeek = data.weeklyMenus?.find((wm: WeeklyMenu) => wm.weekNumber === weekNum && wm.year === year)
              
              if (newWeek) {
                console.log('startEditing: Found new week, looking for day:', dayName)
                const dayData = newWeek.days.find((d: DayMenu) => d.day === dayName)
                if (dayData) {
                  // Attach the date to the day object
                  dayData.date = selectedDate
                  setEditingDay(dayData)
                  console.log('startEditing: Editing mode started!')
                } else {
                  console.error('startEditing: Day not found in new week')
                  toast.error('Hari tidak ditemukan')
                }
              } else {
                console.error('startEditing: New week not found after refresh')
                toast.error('Minggu baru tidak ditemukan')
              }
            } catch (refreshError) {
              console.error('startEditing: Error refreshing:', refreshError)
              toast.error('Gagal memuat data terbaru')
            }
          }, 500)
        } else {
          const error = await res.json().catch(() => ({ error: 'Unknown error' }))
          console.error('startEditing: API error:', error)
          toast.error(error.error || 'Gagal membuat minggu')
        }
      } else {
        console.log('startEditing: Week exists, finding day...')
        // Week exists, find or create the day
        let dayData = weekMenu.days.find(d => d.day === dayName)
        
        if (dayData) {
          dayData.date = selectedDate
          setEditingDay(dayData)
          console.log('startEditing: Editing mode started for existing day!')
        } else {
          console.error('startEditing: Day not found in existing week')
          toast.error('Hari tidak ditemukan dalam minggu ini')
        }
      }
    } catch (error) {
      console.error('startEditing: Exception:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  // Add menu item
  const addMenuItem = (categoryIndex: number) => {
    if (!editingDay) return
    
    const updated = { ...editingDay }
    updated.categories = [...updated.categories]
    updated.categories[categoryIndex] = {
      ...updated.categories[categoryIndex],
      items: [
        ...updated.categories[categoryIndex].items,
        { id: '', name: '', description: '', price: 0, emoji: '🍽️' }
      ]
    }
    setEditingDay(updated)
  }

  // Update menu item
  const updateMenuItem = (categoryIndex: number, itemIndex: number, field: string, value: any) => {
    if (!editingDay) return
    
    const updated = { ...editingDay }
    updated.categories = [...updated.categories]
    updated.categories[categoryIndex] = {
      ...updated.categories[categoryIndex],
      items: updated.categories[categoryIndex].items.map((item, idx) =>
        idx === itemIndex ? { ...item, [field]: value } : item
      )
    }
    setEditingDay(updated)
  }

  // Remove menu item
  const removeMenuItem = (categoryIndex: number, itemIndex: number) => {
    if (!editingDay) return
    
    const updated = { ...editingDay }
    updated.categories = [...updated.categories]
    updated.categories[categoryIndex] = {
      ...updated.categories[categoryIndex],
      items: updated.categories[categoryIndex].items.filter((_, idx) => idx !== itemIndex)
    }
    setEditingDay(updated)
  }

  // Save changes
  const saveChanges = async () => {
    if (!editingDay || !selectedDate) return
    
    setIsSaving(true)
    
    try {
      // Filter out empty items and prepare data
      const categoriesToSave = editingDay.categories.map(cat => ({
        ...cat,
        items: cat.items.filter(item => item.name.trim() !== '')
      }))
      
      const res = await fetch('/api/menu/day', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          day: editingDay.day,
          categories: categoriesToSave
        })
      })
      
      if (res.ok) {
        toast.success('Menu berhasil disimpan!')
        setEditingDay(null)
        onRefresh()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Gagal menyimpan')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Terjadi kesalahan saat menyimpan')
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingDay(null)
  }

  // Get item count for a date
  const getItemCount = (date: Date): number => {
    const menu = findMenuForDate(date)
    if (!menu) return 0
    return menu.categories.reduce((total, cat) => total + cat.items.length, 0)
  }

  // Check if date has menu
  const hasMenu = (date: Date): boolean => {
    return getItemCount(date) > 0
  }

  const selectedDateMenu = selectedDate ? findMenuForDate(selectedDate) : null
  const isEditing = editingDay !== null

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <span>Kalender Menu Catering</span>
            </CardTitle>
            
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth(-1)}
                disabled={currentDate.getMonth() <= new Date().getMonth()}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <h2 className="text-xl font-bold min-w-[200px] text-center">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Calendar Grid Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-24" />
              }
              
              const dayOfWeek = date.getDay()
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
              const isSelected = selectedDate && 
                               date.getDate() === selectedDate.getDate() &&
                               date.getMonth() === selectedDate.getMonth() &&
                               date.getFullYear() === selectedDate.getFullYear()
              const itemCount = getItemCount(date)
              const menuExists = hasMenu(date)
              const dateIsToday = isToday(date)
              const dateIsPast = isPast(date)
              
              return (
                <div
                  key={date.toISOString()}
                  onClick={() => handleDayClick(date)}
                  className={`
                    h-24 p-1 border rounded-lg cursor-pointer transition-all
                    ${isWeekend ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'hover:border-orange-300 hover:bg-orange-50'}
                    ${isSelected ? 'border-orange-500 bg-orange-100 ring-2 ring-orange-200' : 'border-gray-200'}
                    ${menuExists && !isWeekend ? 'bg-green-50 border-green-200' : ''}
                    ${dateIsToday && !isWeekend ? 'ring-2 ring-blue-400' : ''}
                    ${dateIsPast && !isWeekend ? 'opacity-60' : ''}
                  `}
                >
                  <div className="text-right text-sm font-medium text-gray-700">
                    {date.getDate()}
                    {dateIsToday && <span className="ml-1 text-xs text-blue-600">hari ini</span>}
                  </div>
                  
                  {!isWeekend && (
                    <div className="mt-1">
                      {menuExists ? (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-200">
                          🍽️ {itemCount} item
                        </Badge>
                      ) : !dateIsPast ? (
                        <div className="text-xs text-gray-400 text-center mt-2">
                          <Plus className="w-3 h-3 mx-auto mb-1" />
                          Tambah
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 text-center mt-2">
                          -
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Detail / Edit Panel */}
      {selectedDate && !isWeekend(selectedDate) && (
        <Card className={isEditing ? 'border-orange-200 bg-orange-50/30' : ''}>
          <CardHeader className={isEditing ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg' : ''}>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg ${isEditing ? 'text-white' : ''}`}>
                {isEditing ? '✏️ Edit Menu' : '📅 Detail Menu'}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isEditing ? 'text-white' : 'text-gray-700'}`}>
                  {DAY_NAMES[selectedDate.getDay() - 1]}, {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </span>
                
                {!isEditing && !isPast(selectedDate) && (
                  <Button onClick={() => startEditingWithDate(selectedDate)} disabled={isLoading} size="sm">
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Edit3 className="w-4 h-4 mr-2" />
                    )}
                    Edit
                  </Button>
                )}
                
                {isEditing && (
                  <>
                    <Button onClick={saveChanges} disabled={isSaving} size="sm" className="bg-green-600 hover:bg-green-700">
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Simpan
                    </Button>
                    <Button onClick={cancelEditing} variant="outline" size="sm">
                      Batal
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mr-3"></div>
                <span className="text-gray-600">Memuat...</span>
              </div>
            ) : isEditing && editingDay ? (
              /* EDIT MODE */
              <div className="space-y-6">
                {editingDay.categories.map((cat, catIndex) => (
                  <div key={cat.name}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 bg-gradient-to-br ${cat.gradient} rounded-lg flex items-center justify-center`}>
                        <UtensilsCrossed className="w-4 h-4 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900">{cat.name}</h4>
                      <Badge variant="outline">{cat.items.length} item</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cat.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="p-3 bg-white rounded-lg border border-orange-200 space-y-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateMenuItem(catIndex, itemIndex, 'name', e.target.value)}
                            placeholder="Nama menu"
                            className="font-medium"
                          />
                          <Input
                            value={item.description}
                            onChange={(e) => updateMenuItem(catIndex, itemIndex, 'description', e.target.value)}
                            placeholder="Deskripsi"
                          />
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                              <Input
                                type="number"
                                value={item.price || ''}
                                onChange={(e) => updateMenuItem(catIndex, itemIndex, 'price', parseInt(e.target.value) || 0)}
                                className="pl-10"
                                placeholder="0"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeMenuItem(catIndex, itemIndex)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="dashed"
                        className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-600"
                        onClick={() => addMenuItem(catIndex)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Item
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDateMenu ? (
              /* VIEW MODE - Has Menu */
              <div className="space-y-6">
                {selectedDateMenu.categories.map((cat) => (
                  cat.items.length > 0 && (
                    <div key={cat.name}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${cat.gradient} rounded-lg flex items-center justify-center`}>
                          <UtensilsCrossed className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900">{cat.name}</h4>
                        <Badge variant="secondary">{cat.items.length} item</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {cat.items.map((item) => (
                          <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{item.emoji} {item.name}</p>
                                {item.description && (
                                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                                )}
                              </div>
                            </div>
                            <p className="font-semibold text-orange-600 mt-2">{formatRupiah(item.price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            ) : (
              /* VIEW MODE - No Menu Yet */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Menu</h3>
                <p className="text-gray-500 mb-4">
                  Tanggal ini belum memiliki menu catering
                </p>
                {!isPast(selectedDate) && (
                  <Button onClick={() => startEditingWithDate(selectedDate)} disabled={isLoading}>
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Tambah Menu
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 px-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span>Ada menu</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-gray-200 rounded"></div>
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-gray-200 rounded opacity-60"></div>
          <span>Sudah lewat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-50 rounded opacity-50"></div>
          <span>Akhir pekan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 ring-2 ring-blue-400 rounded"></div>
          <span>Hari ini</span>
        </div>
      </div>
    </div>
  )
}
