import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compresses an image File to a lightweight base64 JPEG string (<60KB)
 * to prevent exceeding Firestore's 1,048,576 bytes document limit.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to parse image.'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(reader.result as string)
        }

        // Fill white background in case of transparency in PNG/WEBP
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        try {
          const compressed = canvas.toDataURL('image/jpeg', quality)
          resolve(compressed)
        } catch {
          resolve(reader.result as string)
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Validates email with standard email regex
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return re.test(email.trim())
}

/**
 * Validates phone numbers (strips punctuation and requires at least 10 digits)
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 15
}

/**
 * Validates postal code (Canadian format A1A 1A1 or US 5-digit zip code)
 */
export function isValidPostalCode(postal: string): boolean {
  if (!postal || typeof postal !== 'string') return false
  const clean = postal.trim().toUpperCase()
  const caRegex = /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/
  const usRegex = /^\d{5}(-\d{4})?$/
  return caRegex.test(clean) || usRegex.test(clean)
}

/**
 * Validates vehicle license plate format (alphanumeric, 2 to 10 characters)
 */
export function isValidLicensePlate(plate: string): boolean {
  if (!plate || typeof plate !== 'string') return false
  const clean = plate.trim().replace(/[\s-]/g, '')
  return /^[A-Za-z0-9]{2,10}$/.test(clean)
}

/**
 * Sanitizes user input string against HTML/Script injection
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"`]/g, '')
    .trim()
}

/**
 * Validates credit card expiry MM/YY and ensures it is in the future
 */
export function isValidCardExpiry(expiry: string): boolean {
  if (!expiry || typeof expiry !== 'string') return false
  const match = expiry.trim().match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false

  const month = parseInt(match[1], 10)
  const year = parseInt(match[2], 10) + 2000

  if (month < 1 || month > 12) return false

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // 1-12

  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false
  if (year > currentYear + 25) return false

  return true
}

/**
 * Validates geographical coordinates [-90, 90] and [-180, 180]
 */
export function isValidCoords(lat: number, lon: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  )
}
