/**
 * School Cafe - Weekly Meal Ordering System
 * Frontend JavaScript - Beautiful Custom SVG Icons
 * Payment Proof Upload for BCA Bank Transfer
 */

// ============ State Management ============
const state = {
  menuItems: [],
  categories: [],
  cart: [],
  selectedDayIndex: 0,
  weekOffset: 0,
  weekDates: [],
  isLoading: true,
  isOrdering: false,
  showCart: false,
  showOrderConfirm: false,
  showPaymentModal: false,
  orderSuccess: null,
  uploadedFile: null
};

// ============ Constants ============
const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon', fullLabel: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullLabel: 'Thursday' },
  { key: 'friday', label: 'Fri', fullLabel: 'Friday' }
];

// Meal periods removed - simplified ordering system

// BCA Bank Details for Payment
const BANK_DETAILS = {
  bankName: 'BCA (Bank Central Asia)',
  accountNumber: '3351015908',
  accountName: 'School Cafe Catering',
  instructions: [
    'Transfer the exact order amount to the BCA account above',
    'Take a clear screenshot or photo of your transfer confirmation',
    'Upload the proof of payment using the button below',
    'Your order will be confirmed within 24 hours after verification'
  ]
};

// ============ Utility Functions ============

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ============ BEAUTIFUL CUSTOM SVG ICONS ============
// Each icon is carefully designed with modern aesthetics

const ICONS = {
  // Logo - Elegant Chef Hat with Star
  logo: `<svg class="icon icon-logo" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#1d4ed8"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#logoGrad)"/>
    <path d="M24 10c-4.4 0-8 3.2-8 7.2 0 2.4 1.2 4.5 3 5.9V28h10v-4.9c1.8-1.4 3-3.5 3-5.9 0-4-3.6-7.2-8-7.2z" fill="white"/>
    <rect x="18" y="28" width="12" height="3" rx="1" fill="white"/>
    <rect x="16" y="31" width="16" height="2" rx="1" fill="white" opacity="0.8"/>
    <path d="M21 17l2 2 4-4" stroke="#1d4ed8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="24" cy="38" r="2" fill="#fbbf24"/>
    <circle cx="18" cy="40" r="1.5" fill="#fbbf24" opacity="0.7"/>
    <circle cx="30" cy="40" r="1.5" fill="#fbbf24" opacity="0.7"/>
  </svg>`,

  // Search - Modern Magnifying Glass
  search: `<svg class="icon icon-search" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#6b7280"/>
        <stop offset="100%" style="stop-color:#374151"/>
      </linearGradient>
    </defs>
    <circle cx="10.5" cy="10.5" r="7" stroke="url(#searchGrad)" stroke-width="2.5" fill="none"/>
    <line x1="15.5" y1="15.5" x2="20.5" y2="20.5" stroke="url(#searchGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="8" cy="9" r="1.5" fill="#94a3b8"/>
  </svg>`,

  // Cart - Shopping Cart with Items
  cart: `<svg class="icon icon-cart" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#2563eb"/>
      </linearGradient>
    </defs>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" stroke="url(#cartGrad)" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="9" cy="20" r="1.5" fill="#3b82f6"/>
    <circle cx="18" cy="20" r="1.5" fill="#3b82f6"/>
    <path d="M10 10h4l1 4H9" stroke="#60a5fa" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </svg>`,

  // Plus - Circular Add Button
  plus: `<svg class="icon icon-plus" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="plusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981"/>
        <stop offset="100%" style="stop-color:#059669"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#plusGrad)"/>
    <line x1="12" y1="7" x2="12" y2="17" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="7" y1="12" x2="17" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  // Minus - Remove Button
  minus: `<svg class="icon icon-minus" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/>
    <line x1="7" y1="12" x2="17" y2="12" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  // Trash - Delete with Lid
  trash: `<svg class="icon icon-trash" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#ef4444"/>
        <stop offset="100%" style="stop-color:#dc2626"/>
      </linearGradient>
    </defs>
    <path d="M3 6h18" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="#ef4444" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" stroke="url(#trashGrad)" stroke-width="2" fill="none" stroke-linejoin="round"/>
    <line x1="10" y1="11" x2="10" y2="17" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="14" y1="11" x2="14" y2="17" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  // Close - X Button
  close: `<svg class="icon icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#f1f5f9"/>
    <line x1="8" y1="8" x2="16" y2="16" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="16" y1="8" x2="8" y2="16" stroke="#64748b" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  // Chevron Left - Navigation Arrow
  chevronLeft: `<svg class="icon icon-chevron-left" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <polyline points="14,7 9,12 14,17" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Chevron Right - Navigation Arrow
  chevronRight: `<svg class="icon icon-chevron-right" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>
    <polyline points="10,7 15,12 10,17" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Calendar - Weekly Planner Style
  calendar: `<svg class="icon icon-calendar" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6"/>
        <stop offset="100%" style="stop-color:#7c3aed"/>
      </linearGradient>
    </defs>
    <rect x="3" y="4" width="18" height="17" rx="3" fill="url(#calGrad)"/>
    <rect x="3" y="4" width="18" height="5" rx="3" fill="#7c3aed"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="6" y="12" width="3" height="3" rx="0.5" fill="white" opacity="0.9"/>
    <rect x="10.5" y="12" width="3" height="3" rx="0.5" fill="white" opacity="0.7"/>
    <rect x="15" y="12" width="3" height="3" rx="0.5" fill="white" opacity="0.5"/>
    <rect x="6" y="16" width="3" height="3" rx="0.5" fill="white" opacity="0.6"/>
  </svg>`,

  // Breakfast - Sun with Egg & Coffee Cup
  breakfast: `<svg class="icon icon-breakfast" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fbbf24"/>
        <stop offset="100%" style="stop-color:#f59e0b"/>
      </linearGradient>
    </defs>
    <!-- Sun rays -->
    <g stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round">
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </g>
    <!-- Main sun circle -->
    <circle cx="12" cy="12" r="5" fill="url(#sunGrad)"/>
    <!-- Coffee cup -->
    <path d="M16 16h2a2 2 0 0 1 0 4h-2" stroke="#78350f" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M7 16h9v3a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" fill="#fef3c7" stroke="#d97706" stroke-width="1"/>
    <!-- Steam -->
    <path d="M9 14c0-.5.3-1 .5-1.2M11.5 14c0-.5.3-1 .5-1.2M14 14c0-.5.3-1 .5-1.2" stroke="#d1d5db" stroke-width="1" stroke-linecap="round" fill="none"/>
  </svg>`,

  // Lunch - Plate with Utensils
  lunch: `<svg class="icon icon-lunch" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="plateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ea580c"/>
        <stop offset="100%" style="stop-color:#c2410c"/>
      </linearGradient>
    </defs>
    <!-- Plate -->
    <ellipse cx="12" cy="14" rx="9" ry="5" fill="#fff7ed" stroke="url(#plateGrad)" stroke-width="1.5"/>
    <ellipse cx="12" cy="14" rx="6" ry="3" fill="none" stroke="#fed7aa" stroke-width="1"/>
    <!-- Fork left -->
    <g transform="translate(2, 6)">
      <line x1="2" y1="0" x2="2" y2="12" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="2" y1="3" x2="0" y2="1" stroke="#ea580c" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="2" y1="6" x2="0" y2="4" stroke="#ea580c" stroke-width="1.2" stroke-linecap="round"/>
      <line x1="2" y1="9" x2="0" y2="7" stroke="#ea580c" stroke-width="1.2" stroke-linecap="round"/>
    </g>
    <!-- Knife right -->
    <g transform="translate(19, 5)">
      <line x1="1" y1="0" x2="1" y2="13" stroke="#ea580c" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M1 0L-1 4h4L1 0z" fill="#ea580c"/>
    </g>
    <!-- Food on plate -->
    <circle cx="10" cy="13.5" r="1.5" fill="#22c55e" opacity="0.8"/>
    <circle cx="13" cy="14" r="1" fill="#ef4444" opacity="0.7"/>
    <circle cx="11.5" cy="15" r="0.8" fill="#fbbf24" opacity="0.8"/>
  </svg>`,

  // Snack - Cookie with Chocolate Chips
  snack: `<svg class="icon icon-snack" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cookieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ec4899"/>
        <stop offset="100%" style="stop-color:#db2777"/>
      </linearGradient>
    </defs>
    <!-- Cookie base -->
    <circle cx="12" cy="12" r="9" fill="#fef3c7" stroke="#fcd34d" stroke-width="1"/>
    <!-- Chocolate chips -->
    <circle cx="8" cy="9" r="1.8" fill="#78350f"/>
    <circle cx="15" cy="8" r="1.5" fill="#78350f"/>
    <circle cx="16" cy="14" r="1.6" fill="#78350f"/>
    <circle cx="10" cy="15" r="1.4" fill="#78350f"/>
    <circle cx="7" cy="13" r="1.2" fill="#78350f"/>
    <circle cx="13" cy="11" r="1.3" fill="#78350f"/>
    <!-- Bite mark -->
    <path d="M19 8a7 7 0 0 0-2 4" stroke="#fde68a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Crumbs -->
    <circle cx="3" cy="16" r="0.8" fill="#fcd34d"/>
    <circle cx="20" cy="18" r="0.6" fill="#fcd34d"/>
  </svg>`,

  // Checkmark - Success Tick
  check: `<svg class="icon icon-check" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#dcfce7" stroke="#22c55e" stroke-width="1.5"/>
    <polyline points="8,12 11,15 16,9" stroke="#16a34a" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Clock - Time Icon
  clock: `<svg class="icon icon-clock" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="clockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#06b6d4"/>
        <stop offset="100%" style="stop-color:#0891b2"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#clockGrad)"/>
    <circle cx="12" cy="12" r="7" fill="none" stroke="white" stroke-width="1.5" opacity="0.3"/>
    <polyline points="12,6 12,12 16,14" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="12" cy="12" r="1" fill="white"/>
  </svg>`,

  // Check Circle - Large Success
  checkCircle: `<svg class="icon icon-check-circle" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="successGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#22c55e"/>
        <stop offset="100%" style="stop-color:#16a34a"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="22" fill="url(#successGrad)" filter="url(#glow)"/>
    <circle cx="24" cy="24" r="16" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
    <polyline points="14,25 21,32 35,17" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Sparkles -->
    <circle cx="38" cy="10" r="2" fill="#fbbf24"/>
    <circle cx="8" cy="12" r="1.5" fill="#fbbf24"/>
    <circle cx="10" cy="38" r="1.5" fill="#fbbf24"/>
  </svg>`,

  // Arrow Right - Forward Navigation
  arrowRight: `<svg class="icon icon-arrow-right" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#2563eb"/>
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="10" fill="url(#arrowGrad)"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <polyline points="12,8 16,12 12,16" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Package/Box - Empty State
  package: `<svg class="icon icon-package" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#e2e8f0"/>
        <stop offset="100%" style="stop-color:#cbd5e1"/>
      </linearGradient>
    </defs>
    <!-- Box body -->
    <path d="M8 20h48v30a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V20z" fill="url(#boxGrad)" stroke="#94a3b8" stroke-width="1.5"/>
    <!-- Box top -->
    <path d="M8 20l24-12 24 12H8z" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="round"/>
    <!-- Tape -->
    <rect x="28" y="14" width="8" height="12" fill="#3b82f6" opacity="0.6"/>
    <rect x="26" y="28" width="12" height="18" rx="1" fill="#3b82f6" opacity="0.15"/>
    <!-- Flaps -->
    <path d="M8 20L4 24v26l4-4" stroke="#94a3b8" stroke-width="1" fill="none"/>
    <path d="M56 20l4 4v26-4-22" stroke="#94a3b8" stroke-width="1" fill="none"/>
  </svg>`,

  // Upload - File Upload Icon
  upload: `<svg class="icon icon-upload" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="uploadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#3b82f6"/>
        <stop offset="100%" style="stop-color:#1d4ed8"/>
      </linearGradient>
    </defs>
    <path d="M4 16v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" stroke="url(#uploadGrad)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="8,12 12,8 16,12" stroke="url(#uploadGrad)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="12" y1="8" x2="12" y2="16" stroke="url(#uploadGrad)" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="12" cy="20" r="1" fill="#3b82f6"/>
  </svg>`,

  // Bank - Building Icon for Payment
  bank: `<svg class="icon icon-bank" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bankGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" style="stop-color:#1e40af"/>
        <stop offset="100%" style="stop-color:#3b82f6"/>
      </linearGradient>
    </defs>
    <!-- Roof triangle -->
    <path d="M12 2L2 8h20L12 2z" fill="url(#bankGrad)"/>
    <!-- Building columns -->
    <rect x="4" y="8" width="16" height="12" rx="1" fill="#dbeafe" stroke="#3b82f6" stroke-width="1"/>
    <!-- Columns -->
    <line x1="8" y1="8" x2="8" y2="20" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="12" y1="8" x2="12" y2="20" stroke="#3b82f6" stroke-width="1.5"/>
    <line x1="16" y1="8" x2="16" y2="20" stroke="#3b82f6" stroke-width="1.5"/>
    <!-- Base -->
    <rect x="2" y="20" width="20" height="2" rx="0.5" fill="#1e40af"/>
    <!-- Door -->
    <rect x="10" y="15" width="4" height="5" rx="1" fill="#1e40af"/>
    <!-- Dollar sign -->
    <text x="12" y="17.5" text-anchor="middle" fill="#fbbf24" font-size="4" font-weight="bold">$</text>
  </svg>`,

  // ============ CATEGORY ICONS ============
  
  // Breakfast Category - Sunny Egg
  sunCategory: `<svg class="icon category-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="breakCatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#fbbf24"/>
        <stop offset="100%" style="stop-color:#f59e0b"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="#fef3c7" stroke="url(#breakCatGrad)" stroke-width="2"/>
    <!-- Sun rays inside -->
    <g stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round">
      <line x1="16" y1="5" x2="16" y2="8"/><line x1="16" y1="24" x2="16" y2="27"/>
      <line x1="7" y1="16" x2="10" y2="16"/><line x1="22" y1="16" x2="25" y2="16"/>
      <line x1="9.5" y1="9.5" x2="11.7" y2="11.7"/><line x1="20.3" y1="20.3" x2="22.5" y2="22.5"/>
      <line x1="22.5" y1="9.5" x2="20.3" y2="11.7"/><line x1="11.7" y1="20.3" x2="9.5" y2="22.5"/>
    </g>
    <!-- Egg in center -->
    <ellipse cx="16" cy="17" rx="5" ry="4" fill="white" stroke="#fcd34d" stroke-width="1"/>
    <circle cx="16" cy="17" r="2" fill="#fbbf24"/>
  </svg>`,

  // Main Courses Category - Chef Plate
  utensilsCategory: `<svg class="icon category-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mainCatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ea580c"/>
        <stop offset="100%" style="stop-color:#c2410c"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="#fff7ed" stroke="url(#mainCatGrad)" stroke-width="2"/>
    <!-- Plate -->
    <ellipse cx="16" cy="18" rx="9" ry="5" fill="white" stroke="#fed7aa" stroke-width="1"/>
    <!-- Food items -->
    <circle cx="13" cy="17" r="2" fill="#22c55e"/>
    <circle cx="18" cy="18" r="1.5" fill="#ef4444"/>
    <circle cx="15" cy="20" r="1.2" fill="#fbbf24"/>
    <!-- Utensils crossed -->
    <g transform="translate(10, 6) rotate(-45)">
      <ellipse cx="3" cy="6" rx="1.5" ry="5" fill="#ea580c"/>
      <rect x="2.5" y="0" width="1" height="6" rx="0.5" fill="#ea580c"/>
    </g>
    <g transform="translate(18, 8) rotate(45)">
      <path d="M0 0 L2 0 L2 8 C2 9 1 10 0 10 Z" fill="#ea580c"/>
    </g>
  </svg>`,

  // Snacks & Sides Category - Cookie
  cookieCategory: `<svg class="icon category-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="snackCatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ec4899"/>
        <stop offset="100%" style="stop-color:#db2777"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="#fdf2f8" stroke="url(#snackCatGrad)" stroke-width="2"/>
    <!-- Big cookie -->
    <circle cx="16" cy="17" r="9" fill="#fef3c7" stroke="#fcd34d" stroke-width="1.5"/>
    <!-- Chips -->
    <circle cx="11" cy="14" r="2.2" fill="#78350f"/>
    <circle cx="20" cy="13" r="1.8" fill="#78350f"/>
    <circle cx="21" cy="20" r="2" fill="#78350f"/>
    <circle cx="13" cy="21" r="1.6" fill="#78350f"/>
    <circle cx="9" cy="19" r="1.4" fill="#78350f"/>
    <circle cx="17" cy="16" r="1.7" fill="#78350f"/>
    <!-- Crumb -->
    <circle cx="25" cy="10" r="1" fill="#fcd34d"/>
  </svg>`,

  // Beverages Category - Drink Cup
  cupCategory: `<svg class="icon category-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="drinkCatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#06b6d4"/>
        <stop offset="100%" style="stop-color:#0891b2"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="#ecfeff" stroke="url(#drinkCatGrad)" stroke-width="2"/>
    <!-- Cup body -->
    <path d="M9 12h10v10a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V12z" fill="#cffafe" stroke="#0891b2" stroke-width="1.5"/>
    <!-- Handle -->
    <path d="M19 15h2a2.5 2.5 0 0 1 0 5h-2" stroke="#0891b2" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <!-- Liquid -->
    <path d="M10 16h8v5a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-5z" fill="#22d3ee" opacity="0.6"/>
    <!-- Straw -->
    <line x1="14" y1="8" x2="14" y2="14" stroke="#0891b2" stroke-width="2" stroke-linecap="round"/>
    <!-- Bubble -->
    <circle cx="12" cy="19" r="1" fill="white" opacity="0.8"/>
    <circle cx="15" cy="20" r="0.7" fill="white" opacity="0.6"/>
  </svg>`,

  // Healthy Options Category - Leaf
  leafCategory: `<svg class="icon category-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="healthCatGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#22c55e"/>
        <stop offset="100%" style="stop-color:#16a34a"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="#f0fdf4" stroke="url(#healthCatGrad)" stroke-width="2"/>
    <!-- Leaf shape -->
    <path d="M16 6c-4 0-8 4-8 10s4 10 8 10c-2-3-3-6-3-10s1-7 3-10z" fill="url(#healthCatGrad)"/>
    <path d="M16 6c4 0 8 4 8 10s-4 10-8 10c2-3 3-6 3-10s-1-7-3-10z" fill="#86efac"/>
    <!-- Vein -->
    <path d="M16 6v20" stroke="#15803d" stroke-width="1" fill="none"/>
    <!-- Side veins -->
    <path d="M16 12c2-1 4-1 5 0M16 16c2-1 4-1 5 0M16 20c2-1 3-1 4 0" stroke="#15803d" stroke-width="0.8" fill="none"/>
    <!-- Dew drop -->
    <circle cx="20" cy="10" r="1.5" fill="#86efac" opacity="0.8"/>
  </svg>`,

  // Desserts Category - Cake Slice
  cakeCategory: `<svg class="icon category-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="dessertCatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#a855f7"/>
        <stop offset="100%" style="stop-color:#9333ea"/>
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="#faf5ff" stroke="url(#dessertCatGrad)" stroke-width="2"/>
    <!-- Cake slice -->
    <path d="M8 18 L16 12 L24 18 L24 26 L8 26 Z" fill="#f3e8ff" stroke="#a855f7" stroke-width="1.5" stroke-linejoin="round"/>
    <!-- Frosting -->
    <path d="M8 18 Q12 15 16 18 Q20 15 24 18" fill="#faf5ff" stroke="#c084fc" stroke-width="1.5"/>
    <!-- Cherry on top -->
    <circle cx="16" cy="14" r="2.5" fill="#ef4444"/>
    <path d="M16 11.5 Q17 9 16 8" stroke="#dc2626" stroke-width="1" fill="none" stroke-linecap="round"/>
    <!-- Sprinkles -->
    <circle cx="11" cy="21" r="1" fill="#fbbf24"/>
    <circle cx="20" cy="22" r="1" fill="#3b82f6"/>
    <circle cx="15" cy="23" r="0.8" fill="#ec4899"/>
    <!-- Layers -->
    <line x1="10" y1="22" x2="22" y2="22" stroke="#e9d5ff" stroke-width="1"/>
  </svg>`
};

// Category icon mapping
const CATEGORY_ICONS = {
  'Breakfast': ICONS.sunCategory,
  'Main Courses': ICONS.utensilsCategory,
  'Snacks & Sides': ICONS.cookieCategory,
  'Beverages': ICONS.cupCategory,
  'Healthy Options': ICONS.leafCategory,
  'Desserts': ICONS.cakeCategory
};

// Food emoji replacements (SVG based on category)
const FOOD_ICONS = {
  'Breakfast': ICONS.sunCategory,
  'Main Courses': ICONS.utensilsCategory,
  'Snacks & Sides': ICONS.cookieCategory,
  'Beverages': ICONS.cupCategory,
  'Healthy Options': ICONS.leafCategory,
  'Desserts': ICONS.cakeCategory
};

// ============ API Functions ============

async function fetchMenu(category = 'all', search = '') {
  try {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search) params.set('search', search);
    
    const response = await fetch(`/api/menu?${params}`);
    const data = await response.json();
    
    if (data.success) {
      state.menuItems = data.data.items;
      state.categories = data.data.categories;
      renderMenu();
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
  } finally {
    state.isLoading = false;
  }
}

async function placeOrder() {
  if (state.cart.length === 0) return;
  
  state.isOrdering = true;
  updateUI();
  
  try {
    const orderData = {
      items: state.cart.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        mealDate: formatDate(item.mealDate),
        mealPeriod: 'lunch'  // Default to lunch for compatibility
      })),
      notes: `Weekly order`
    };
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      state.orderSuccess = data.data;
      state.showOrderConfirm = true;
      state.showPaymentModal = true; // Show payment modal after order
      state.cart = [];
      state.showCart = false;
      updateUI();
    } else {
      alert('Failed to place order: ' + data.error);
    }
  } catch (error) {
    console.error('Error placing order:', error);
    alert('An error occurred while placing your order');
  } finally {
    state.isOrdering = false;
    updateUI();
  }
}

async function uploadPaymentProof(orderId) {
  if (!state.uploadedFile) {
    alert('Please select a file to upload');
    return;
  }
  
  const formData = new FormData();
  formData.append('payment_proof', state.uploadedFile);
  formData.append('order_id', orderId);
  
  try {
    const response = await fetch('/api/upload-payment', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Payment proof uploaded successfully! Your order will be verified within 24 hours.');
      state.showPaymentModal = false;
      state.showOrderConfirm = false;
      state.uploadedFile = null;
      updateUI();
    } else {
      alert('Failed to upload: ' + data.error);
    }
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    alert('An error occurred while uploading');
  }
}

async function seedDatabase() {
  try {
    const response = await fetch('/api/seed', { method: 'POST' });
    const data = await response.json();
    if (data.success) {
      console.log('Database seeded:', data.message);
      fetchMenu();
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// ============ Cart Functions ============

function addToCart(menuItem) {
  const selectedDate = state.weekDates[state.selectedDayIndex];
  const dayInfo = DAYS_OF_WEEK[state.selectedDayIndex];
  
  // Check if item already exists for this date
  const existingIndex = state.cart.findIndex(item => 
    item.menuItemId === menuItem.id && 
    formatDate(item.mealDate) === formatDate(selectedDate)
  );
  
  if (existingIndex >= 0) {
    state.cart[existingIndex].quantity += 1;
  } else {
    state.cart.push({
      id: generateId(),
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: 1,
      category: menuItem.category_name,
      mealDate: selectedDate,
      dayName: dayInfo.fullLabel
    });
  }
  
  updateUI();
}

function removeFromCart(menuItemId, dateStr) {
  state.cart = state.cart.filter(item => 
    !(item.menuItemId === menuItemId && 
      formatDate(item.mealDate) === dateStr)
  );
  updateUI();
}

function updateQuantity(menuItemId, dateStr, delta) {
  state.cart = state.cart.map(item => {
    if (item.menuItemId === menuItemId && 
        formatDate(item.mealDate) === dateStr) {
      const newQty = item.quantity + delta;
      return newQty > 0 ? { ...item, quantity: newQty } : item;
    }
    return item;
  }).filter(item => item.quantity > 0);
  updateUI();
}

function clearDay(dateStr) {
  state.cart = state.cart.filter(item => formatDate(item.mealDate) !== dateStr);
  updateUI();
}

function getCartTotals() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return { totalItems, totalPrice };
}

function getItemsByDay() {
  return state.cart.reduce((acc, item) => {
    const dateKey = formatDate(item.mealDate);
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: item.mealDate,
        dayName: item.dayName,
        items: [],
        total: 0
      };
    }
    acc[dateKey].items.push(item);
    acc[dateKey].total += item.price * item.quantity;
    return acc;
  }, {});
}

// ============ UI Rendering ============

function calculateWeekDates() {
  // Fixed week: August 24-28, 2026 (Monday-Friday)
  // Update these dates manually each week
  const fixedWeekStart = new Date(2026, 7, 24); // August 24, 2026 (month is 0-indexed)
  
  state.weekDates = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(fixedWeekStart);
    date.setDate(fixedWeekStart.getDate() + i);
    return date;
  });
}

function renderHeader() {
  const header = document.getElementById('header');
  const { totalItems, totalPrice } = getCartTotals();
  
  header.innerHTML = `
    <div class="container">
      <div class="header-content">
        <div class="logo-section">
          <div class="logo-icon">
            ${ICONS.logo}
          </div>
          <div class="logo-text">
            <h1>School Cafe</h1>
            <p>Weekly Meal Ordering</p>
          </div>
        </div>
        <button class="cart-button" onclick="toggleCart()">
          ${ICONS.cart}
          ${totalItems > 0 ? `<span class="cart-badge">${totalItems}</span>` : ''}
          <span class="cart-total">$${totalPrice.toFixed(2)}</span>
        </button>
      </div>
    </div>
  `;
}

function renderWeekSelector() {
  const selector = document.getElementById('week-selector');
  const monday = state.weekDates[0];
  const friday = state.weekDates[4];
  
  selector.innerHTML = `
    <div class="week-selector">
      <div class="week-nav">
        <div class="week-info" style="flex: 1; text-align: center;">
          <h2 class="week-title">${ICONS.calendar} Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h2>
          <p class="week-subtitle">Select a day to order your meals</p>
        </div>
      </div>
      
      <div class="day-picker">
        ${DAYS_OF_WEEK.map((day, index) => {
          const date = state.weekDates[index];
          const isSelected = state.selectedDayIndex === index;
          const itemsByDay = getItemsByDay();
          const hasItems = Object.keys(itemsByDay).includes(formatDate(date));
          
          return `
            <button class="day-button ${isSelected ? 'active' : ''} ${hasItems ? 'has-items' : ''}" 
                    onclick="selectDay(${index})">
              <span class="day-label">${day.label}</span>
              <span class="day-date">${date.getDate()}</span>
              ${hasItems || isSelected ? `<span class="day-indicator">${ICONS.check}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderMealPeriodTabs() {
  // Meal period tabs removed - showing day info instead
  const tabsContainer = document.getElementById('meal-period-tabs');
  const selectedDate = state.weekDates[state.selectedDayIndex];
  const selectedDayInfo = DAYS_OF_WEEK[state.selectedDayIndex];
  
  tabsContainer.innerHTML = `
    <div class="day-info-banner">
      <span class="day-info-icon">${ICONS.calendar}</span>
      <span>Ordering for: <strong>${selectedDayInfo.fullLabel}, ${formatDisplayDate(selectedDate)}</strong></span>
    </div>
  `;
}

function renderSearchAndFilters() {
  const container = document.getElementById('search-filters');
  
  container.innerHTML = `
    <div class="search-container">
      <span class="search-icon">${ICONS.search}</span>
      <input type="text" class="search-input" id="search-input" placeholder="Search menu items..." 
             value="${document.getElementById('search-input')?.value || ''}"
             oninput="handleSearch(this.value)">
    </div>
    
    <div class="category-filters">
      <button class="category-filter ${!state.selectedCategory || state.selectedCategory === 'all' ? 'active' : ''}" 
              onclick="filterCategory('all')">
        All Items
      </button>
      ${state.categories.map(cat => `
        <button class="category-filter ${state.selectedCategory === cat.name ? 'active' : ''}" 
                onclick="filterCategory('${cat.name}')">
          ${CATEGORY_ICONS[cat.name] || ''}
          ${cat.name}
        </button>
      `).join('')}
    </div>
  `;
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  const searchQuery = document.getElementById('search-input')?.value || '';
  
  let filteredItems = state.menuItems;
  
  // Apply search filter
  if (searchQuery) {
    filteredItems = filteredItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }
  
  if (state.isLoading) {
    grid.innerHTML = `
      <div class="loading-grid">
        ${Array(8).fill(0).map(() => `
          <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-text short"></div>
            <div class="skeleton-text"></div>
          </div>
        `).join('')}
      </div>
    `;
    return;
  }
  
  if (filteredItems.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        ${ICONS.package}
        <h3>No items found</h3>
        <p>Try adjusting your search or filter criteria</p>
      </div>
    `;
    return;
  }
  
  const selectedDayInfo = DAYS_OF_WEEK[state.selectedDayIndex];
  
  grid.innerHTML = `
    <div class="menu-grid">
      ${filteredItems.map(item => `
        <div class="menu-card">
          <div class="card-image">
            ${FOOD_ICONS[item.category_name] || ICONS.package}
            <div class="card-overlay"></div>
            <span class="card-badge">Click to add</span>
          </div>
          <div class="card-header">
            <div class="card-title-row">
              <h4 class="card-title">${item.name}</h4>
              <span class="card-category-badge">
                ${CATEGORY_ICONS[item.category_name] || ''}
                ${item.category_icon || item.category_name}
              </span>
            </div>
          </div>
          <div class="card-body">
            <p class="card-description">${item.description || 'Delicious choice!'}</p>
          </div>
          <div class="card-footer">
            <span class="card-price">$${item.price.toFixed(2)}</span>
            <button class="add-button" onclick='addToCart(${JSON.stringify(item)})'>
              ${ICONS.plus}
              Add to<br>${selectedDayInfo.label}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderCart() {
  const overlay = document.getElementById('cart-overlay');
  const sidebar = document.getElementById('cart-sidebar');
  const body = document.getElementById('cart-body');
  const footer = document.getElementById('cart-footer');
  const { totalItems, totalPrice } = getCartTotals();
  const itemsByDay = getItemsByDay();
  
  // Show/hide overlay and sidebar
  overlay.classList.toggle('active', state.showCart);
  sidebar.classList.toggle('active', state.showCart);
  
  if (!state.showCart) return;
  
  // Cart title
  document.getElementById('cart-title').innerHTML = `
    ${ICONS.calendar} Your Weekly Order (${totalItems} items)
  `;
  
  // Empty state or items
  if (totalItems === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        ${ICONS.cart}
        <p>Your weekly cart is empty</p>
        <span>Select a day and add meals!</span>
      </div>
    `;
  } else {
    body.innerHTML = Object.entries(itemsByDay).map(([dateKey, dayGroup]) => `
      <div class="day-card">
        <div class="day-card-header">
          <span class="day-card-title">
            ${ICONS.calendar} ${dayGroup.dayName}, ${new Date(dayGroup.date).toLocaleDateString()}
          </span>
          <button class="clear-day-button" onclick="clearDay('${dateKey}')">Clear Day</button>
        </div>
        <div class="day-card-body">
          <div class="items-list">
            ${dayGroup.items.map(item => `
              <div class="cart-item">
                <div class="cart-item-info">
                  <div class="cart-item-name">${item.name}</div>
                  <div class="cart-item-price">$${item.price.toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                  <button class="control-button" onclick="updateQuantity('${item.menuItemId}', '${dateKey}', -1)">
                    ${ICONS.minus}
                  </button>
                  <span class="quantity-display">${item.quantity}</span>
                  <button class="control-button" onclick="updateQuantity('${item.menuItemId}', '${dateKey}', 1)">
                    ${ICONS.plus}
                  </button>
                  <button class="control-button delete" onclick="removeFromCart('${item.menuItemId}', '${dateKey}')">
                    ${ICONS.trash}
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="day-card-footer">
          <span class="day-total">Day Total: $${dayGroup.total.toFixed(2)}</span>
        </div>
      </div>
    `).join('');
  }
  
  // Footer
  footer.innerHTML = `
    <div class="cart-summary">
      <span>${ICONS.package} Weekly Total:</span>
      <span style="color: var(--primary-600);">$${totalPrice.toFixed(2)}</span>
    </div>
    ${totalItems > 0 ? `<p class="cart-stats">${totalItems} meals across ${Object.keys(itemsByDay).length} days</p>` : ''}
    <button class="order-button" onclick="placeOrder()" ${state.isOrdering || totalItems === 0 ? 'disabled' : ''}>
      ${state.isOrdering ? `
        ${ICONS.clock} Placing Weekly Order...
      ` : `
        Place Weekly Order
        ${ICONS.arrowRight}
      `}
    </button>
  `;
}

function renderOrderConfirmation() {
  const modal = document.getElementById('order-modal');
  const content = document.getElementById('order-modal-content');
  
  modal.classList.toggle('active', state.showOrderConfirm);
  
  if (!state.showOrderConfirm || !state.orderSuccess) return;
  
  const order = state.orderSuccess;
  
  content.innerHTML = `
    <div class="modal-content">
      <div class="modal-body">
        <div class="success-icon">
          ${ICONS.checkCircle}
        </div>
        <h2 class="modal-title">Weekly Order Placed!</h2>
        <p class="modal-subtitle">Your meals have been ordered for the entire week!</p>
        
        <div class="order-details">
          <div class="detail-row">
            <span class="detail-label">Order Number:</span>
            <span class="detail-value order-number">${order.order_number}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Week:</span>
            <span class="detail-value">${new Date(order.week_start_date).toLocaleDateString()} - ${new Date(order.week_end_date).toLocaleDateString()}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-pending">Awaiting Payment</span>
          </div>

          <div class="detail-divider"></div>
          
          <div class="detail-row" style="font-size: 1rem;">
            <span class="detail-label">Weekly Total:</span>
            <span class="detail-value total">$${parseFloat(order.total_amount).toFixed(2)}</span>
          </div>
          
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-200);">
            <p style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem;">Order Summary (${order.items.length} items):</p>
            <div class="order-summary-list">
              ${order.items.sort((a, b) => new Date(a.meal_date).getTime() - new Date(b.meal_date).getTime()).map(item => `
                <div class="summary-item">
                  <span>${new Date(item.meal_date).toLocaleDateString('en-US', { weekday: 'short' })} | ${item.meal_period.replace('_', ' ')} | ${item.menuItem.name} x${item.quantity}</span>
                  <span>$${(item.unit_price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Payment Section -->
        <div class="payment-section">
          <div class="payment-header">
            ${ICONS.bank}
            <h3>Payment Instructions</h3>
          </div>
          
          <div class="bank-details">
            <div class="bank-name">${BANK_DETAILS.bankName}</div>
            <div class="account-number">
              <span>Account:</span>
              <strong>${BANK_DETAILS.accountNumber}</strong>
              <button class="copy-btn" onclick="copyAccountNumber()" title="Copy account number">Copy</button>
            </div>
            <div class="account-name">A/N: ${BANK_DETAILS.accountName}</div>
          </div>

          <div class="payment-instructions">
            <ul>
              ${BANK_DETAILS.instructions.map(inst => `<li>${inst}</li>`).join('')}
            </ul>
          </div>

          <div class="upload-section">
            <label class="upload-label" for="payment-file">
              ${ICONS.upload}
              <span>Upload Payment Proof</span>
            </label>
            <input type="file" id="payment-file" accept="image/*,.pdf" onchange="handleFileSelect(event)" style="display: none;">
            <div id="file-preview" class="file-preview"></div>
          </div>

          <button class="upload-button" onclick="uploadPaymentProof('${order.id}')" ${!state.uploadedFile ? 'disabled' : ''}>
            ${ICONS.upload}
            Submit Payment Proof
          </button>
        </div>
        
        <button class="continue-button" onclick="closeOrderModal()">
          Close
        </button>
      </div>
    </div>
  `;
}

function renderFooter() {
  const footer = document.getElementById('footer');
  
  footer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-section">
            <h4>${ICONS.logo} School Cafe</h4>
            <p style="color: var(--gray-400); font-size: 0.875rem; margin-top: 0.5rem;">
              Plan your entire week of nutritious meals in advance!
            </p>
          </div>
          
          <div class="footer-section">
            <h4>${ICONS.clock} Order Deadlines</h4>
            <ul>
              <li>${ICONS.calendar} Weekly orders: By Sunday 9 PM</li>
              <li>${ICONS.breakfast} Breakfast served: 7:30 AM - 8:30 AM</li>
              <li>${ICONS.lunch} Lunch served: 11:30 AM - 12:30 PM</li>
              <li>${ICONS.snack} Snacks available: 2:30 PM - 3:30 PM</li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>Need Help?</h4>
            <ul>
              <li>${ICONS.cupCategory} cafeteria@school.edu</li>
              <li>(555) 123-4567</li>
              <li>Main Building, Room 102</li>
            </ul>
          </div>
        </div>
        
        <div class="footer-divider"></div>
        
        <div class="footer-bottom">
          <p>School Cafe - Weekly Meal Ordering System</p>
        </div>
      </div>
    </footer>
  `;
}

function updateUI() {
  renderHeader();
  renderWeekSelector();
  renderMealPeriodTabs();
  renderSearchAndFilters();
  renderMenu();
  renderCart();
  renderOrderConfirmation();
}

// ============ Event Handlers ============

function toggleCart() {
  state.showCart = !state.showCart;
  renderCart();
}

function selectDay(index) {
  state.selectedDayIndex = index;
  updateUI();
}

// Meal period selection removed - simplified system

// Week navigation removed - fixed week display

function filterCategory(category) {
  state.selectedCategory = category;
  fetchMenu(category, document.getElementById('search-input')?.value || '');
}

function handleSearch(query) {
  fetchMenu(state.selectedCategory || 'all', query);
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    state.uploadedFile = file;
    const preview = document.getElementById('file-preview');
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `
          <img src="${e.target.result}" alt="Preview" class="preview-image">
          <span class="file-name">${file.name}</span>
          <button class="remove-file" onclick="removeFile()">Remove</button>
        `;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = `
        ${ICONS.upload}
        <span class="file-name">${file.name}</span>
        <button class="remove-file" onclick="removeFile()">Remove</button>
      `;
    }
    updateUI();
  }
}

function removeFile() {
  state.uploadedFile = null;
  document.getElementById('payment-file').value = '';
  document.getElementById('file-preview').innerHTML = '';
  updateUI();
}

function copyAccountNumber() {
  navigator.clipboard.writeText(BANK_DETAILS.accountNumber).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => {
      btn.textContent = 'Copy';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

function closeOrderModal() {
  state.showOrderConfirm = false;
  state.showPaymentModal = false;
  state.orderSuccess = null;
  state.uploadedFile = null;
  updateUI();
}

// ============ Initialization ============

function init() {
  calculateWeekDates();
  state.selectedCategory = 'all';
  updateUI();

  fetchMenu();
  
  // Seed database if needed (for first run)
  seedDatabase();
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);

// Make functions globally available
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearDay = clearDay;
window.toggleCart = toggleCart;
window.selectDay = selectDay;
window.selectMealPeriod = selectMealPeriod;
window.changeWeek = changeWeek;
window.filterCategory = filterCategory;
window.handleSearch = handleSearch;
window.placeOrder = placeOrder;
window.closeOrderModal = closeOrderModal;
window.handleFileSelect = handleFileSelect;
window.removeFile = removeFile;
window.copyAccountNumber = copyAccountNumber;
window.uploadPaymentProof = uploadPaymentProof;
