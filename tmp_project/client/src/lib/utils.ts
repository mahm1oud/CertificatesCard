import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function hexToRgba(hex: string, alpha = 1): string {
  // Remove the hash if it exists
  hex = hex.replace('#', '')

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Return the rgba value
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function rgbaToHex(rgba: string): string {
  // Extract the r, g, b values from the rgba string
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)/)
  if (!match) return '#000000'

  const r = parseInt(match[1])
  const g = parseInt(match[2])
  const b = parseInt(match[3])

  // Convert to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// Format date to a readable string (e.g., "25 Apr 2025")
export function formatDate(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleDateString('ar-SA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format time to a readable string (e.g., "03:45 PM")
export function formatTime(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Download an image from a URL
export function downloadImage(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'image'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // تأخير قصير للتأكد من أن المتصفح أخذ وقته للاستجابة لنقرة التنزيل
      setTimeout(() => {
        resolve()
      }, 100)
    } catch (error) {
      reject(error)
    }
  })
}

// Get category name based on ID or slug
export function getCategoryName(categoryId: number | string, categories: any[]): string {
  if (!categories || !categories.length) return '';
  
  const category = categories.find(cat => 
    (typeof categoryId === 'number' && cat.id === categoryId) || 
    (typeof categoryId === 'string' && cat.slug === categoryId)
  );
  
  return category ? category.name : '';
}