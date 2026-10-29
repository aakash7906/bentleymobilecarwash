import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { BookingRecord, DriverProfile, InvoiceRecord, InvoiceItem, PaymentCollectionData, ShopOrder } from '@/types'

/**
 * Remove undefined values from object before writing to Firestore
 */
function cleanUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {}
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = val
    }
  }
  return result
}

/**
 * Creates or retrieves an existing official invoice for a completed Car Wash Booking.
 * Deterministic ID `inv_bkg_${booking.id}` prevents duplicate records.
 */
export async function createBookingInvoice(
  booking: BookingRecord,
  paymentData?: PaymentCollectionData,
  driverProfile?: DriverProfile
): Promise<{ id: string; invoiceNumber: string }> {
  const invoiceDocId = `inv_bkg_${booking.id}`
  const invoiceRef = doc(db, 'invoices', invoiceDocId)

  try {
    const existingSnap = await getDoc(invoiceRef)
    if (existingSnap.exists()) {
      const data = existingSnap.data()
      return {
        id: invoiceDocId,
        invoiceNumber: data.invoiceNumber || invoiceDocId,
      }
    }
  } catch (err) {
    console.warn('Could not verify existing invoice in Firestore, generating fresh:', err)
  }

  const invoiceYear = new Date().getFullYear()
  const cleanId = (booking.id || 'REC')
    .replace(/^bkg-/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase()
  const invoiceNumber = `INV-BW-${cleanId}-${invoiceYear}`

  // Financial calculation (Canadian Standard 5% GST)
  const total =
    booking.totalNumeric ||
    parseFloat(String(booking.price || '0').replace(/[^0-9.]/g, '')) ||
    0
  const subtotal = Number((total / 1.05).toFixed(2))
  const taxAmount = Number((total - subtotal).toFixed(2))

  // Build itemized invoice lines
  const items: InvoiceItem[] = []

  // 1. Primary Car Wash Service
  const shopItemsSum = Array.isArray(booking.shopItems)
    ? booking.shopItems.reduce(
        (sum, item) => sum + (Number(item.product?.priceNumeric) || 0) * (item.quantity || 1),
        0
      )
    : 0
  const addonsCount = Array.isArray(booking.addons) ? booking.addons.length : 0
  const baseServicePrice = Math.max(0, subtotal - shopItemsSum - addonsCount * 15)

  items.push({
    title: booking.title,
    category: booking.category || 'Mobile Wash',
    quantity: 1,
    unitPrice: baseServicePrice,
    totalPrice: baseServicePrice,
  })

  // 2. Add-ons
  if (Array.isArray(booking.addons)) {
    booking.addons.forEach((addon) => {
      items.push({
        title: `Add-on: ${addon}`,
        category: 'Service Add-on',
        quantity: 1,
        unitPrice: 15,
        totalPrice: 15,
      })
    })
  }

  // 3. Bundled Shop Products
  if (Array.isArray(booking.shopItems)) {
    booking.shopItems.forEach((item) => {
      const unit = Number(item.product?.priceNumeric) || 0
      const qty = item.quantity || 1
      items.push({
        title: `Shop Item: ${item.product?.title || 'Product'}`,
        category: 'Product Add-on',
        quantity: qty,
        unitPrice: unit,
        totalPrice: Number((unit * qty).toFixed(2)),
      })
    })
  }

  const invoicePayload: InvoiceRecord = {
    id: invoiceDocId,
    invoiceNumber,
    referenceType: 'carwash_booking',
    referenceId: booking.id,
    customerName: booking.customerName || 'Valued Customer',
    customerPhone: booking.customerPhone || '',
    customerEmail: booking.customerEmail || '',
    serviceAddress: booking.address || '',
    items,
    subtotal,
    taxAmount,
    totalAmount: total,
    currency: 'CAD',
    paymentMethod:
      paymentData?.paymentCollectedMethod
        ? `Cash on Delivery (${paymentData.paymentCollectedMethod} Collected)`
        : booking.paymentMethod || 'Cash on Delivery (COD)',
    paymentStatus: (paymentData?.paymentStatus as any) || 'paid',
    paymentCollectedBy:
      paymentData?.paymentCollectedBy ||
      booking.driverName ||
      driverProfile?.name ||
      booking.technicianName ||
      'Mobile Technician',
    paymentCollectedAt: paymentData?.paymentCollectedAt || new Date().toISOString(),
    paymentCollectedMethod: paymentData?.paymentCollectedMethod || 'Cash',
    driverId: booking.driverId || driverProfile?.phone || '',
    driverName: booking.driverName || driverProfile?.name || booking.technicianName || '',
    driverPhone: booking.driverPhone || driverProfile?.phone || '',
    driverVanNumber: booking.driverVanNumber || driverProfile?.vanModel || '',
    vehicleDetails: {
      model: booking.vehicle || '',
      licensePlate: booking.licensePlate || '',
      vehicleType: booking.vehicleType || '',
    },
    issuedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }

  try {
    await setDoc(invoiceRef, cleanUndefined(invoicePayload))
  } catch (err) {
    console.error('Failed to write booking invoice to Firestore:', err)
  }

  return { id: invoiceDocId, invoiceNumber }
}

/**
 * Creates or retrieves an existing official invoice for a delivered Bentley Shop Order.
 * Deterministic ID `inv_ord_${order.id}` prevents duplicate records.
 */
export async function createShopOrderInvoice(
  order: ShopOrder,
  driverProfile?: DriverProfile
): Promise<{ id: string; invoiceNumber: string }> {
  const invoiceDocId = `inv_ord_${order.id}`
  const invoiceRef = doc(db, 'invoices', invoiceDocId)

  try {
    const existingSnap = await getDoc(invoiceRef)
    if (existingSnap.exists()) {
      const data = existingSnap.data()
      return {
        id: invoiceDocId,
        invoiceNumber: data.invoiceNumber || invoiceDocId,
      }
    }
  } catch (err) {
    console.warn('Could not verify existing shop invoice in Firestore, generating fresh:', err)
  }

  const invoiceYear = new Date().getFullYear()
  const cleanId = (order.id || 'ORD')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase()
  const invoiceNumber = `INV-SH-${cleanId}-${invoiceYear}`

  const grandTotal = Number(order.grandTotal) || 0
  const subtotal = Number((grandTotal / 1.05).toFixed(2))
  const taxAmount = Number((grandTotal - subtotal).toFixed(2))

  const items: InvoiceItem[] = []
  if (Array.isArray(order.items)) {
    order.items.forEach((item) => {
      const unit =
        Number(item.product?.priceNumeric) ||
        Number(String(item.product?.price || '').replace(/[^0-9.]/g, '')) ||
        0
      const qty = item.quantity || 1
      items.push({
        title: item.product?.title || (item as any).title || 'Bentley Shop Product',
        category: 'Shop Delivery',
        quantity: qty,
        unitPrice: unit,
        totalPrice: Number((unit * qty).toFixed(2)),
      })
    })
  }

  const invoicePayload: InvoiceRecord = {
    id: invoiceDocId,
    invoiceNumber,
    referenceType: 'shop_order',
    referenceId: order.id,
    customerName: order.recipientName || order.customerName || 'Customer',
    customerPhone: order.recipientPhone || order.customerPhone || '',
    customerEmail: order.customerEmail || '',
    serviceAddress: `${order.deliveryAddress || order.shippingAddress || ''}${order.deliveryCity ? `, ${order.deliveryCity}` : ''}`,
    items,
    subtotal,
    taxAmount,
    totalAmount: grandTotal,
    currency: 'CAD',
    paymentMethod: order.paymentMethod === 'cod' ? 'Cash on Delivery (Cash Collected)' : (order.paymentMethod || 'Cash on Delivery'),
    paymentStatus: 'paid',
    paymentCollectedBy: driverProfile?.name || order.driverName || 'Delivery Driver',
    paymentCollectedAt: new Date().toISOString(),
    paymentCollectedMethod: order.paymentMethod === 'cod' ? 'Cash' : 'Prepaid',
    driverId: order.driverId || '',
    driverName: driverProfile?.name || order.driverName || '',
    driverPhone: driverProfile?.phone || order.driverPhone || '',
    driverVanNumber: driverProfile?.vanModel || '',
    issuedAt: serverTimestamp(),
    completedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }

  try {
    await setDoc(invoiceRef, cleanUndefined(invoicePayload))
  } catch (err) {
    console.error('Failed to write shop order invoice to Firestore:', err)
  }

  return { id: invoiceDocId, invoiceNumber }
}

