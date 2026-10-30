import { ProductItem } from '@/types'
import product1Img from '@/assets/products/product-1.jpg'
import product2Img from '@/assets/products/product-2.jpg'
import product3Img from '@/assets/products/product-3.jpg'
import product4Img from '@/assets/products/product-4.png'
import product5Img from '@/assets/products/product-5.jpeg'

export const BENTLEY_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-tire-shine-gallon',
    title: 'Bentley 007 Tire Shine',
    subtitle: 'High Gloss Protection – 1 Gallon / 3.78 Litres',
    category: 'Tire & Wheel Care',
    price: '$65.00',
    priceNumeric: 65,
    originalPrice: '$75.00',
    rating: 4.9,
    reviewsCount: 142,
    image: product3Img,
    volume: '3.78 L (1 Gal)',
    badge: 'Best Seller',
    inStock: true,
    description:
      'The industry favorite formula engineered for deep, wet-look black tires without sling. Enriched with UV blockers to protect against rubber drying, cracking, and browning in harsh sun and weather conditions.',
    features: [
      'High-gloss ultra-deep wet look finish',
      'Anti-sling water-resistant formulation',
      'Advanced UV solar shield prevents dry rot',
      'Professional concentrated 1 gallon / 3.78L shop jug',
      'Long-lasting shine through rain and washes',
    ],
  },
  {
    id: 'prod-ceramic-combo-bundle',
    title: 'Bentley 007 & Glisten Bundle',
    subtitle: 'Tire Shine (1 Gal) + Ceramic Silica Coating (250ml)',
    category: 'Complete Bundle Pack',
    price: '$95.00',
    priceNumeric: 95,
    originalPrice: '$115.00',
    rating: 5.0,
    reviewsCount: 98,
    image: product4Img,
    volume: 'Combo Kit',
    badge: 'Best Value',
    inStock: true,
    description:
      'The ultimate exterior preservation bundle. Combines our signature 007 Tire Shine gallon jug with the revolutionary Bentley Glisten Ceramic Silica spray coating for deep paint gloss and hydrophobic water-beading.',
    features: [
      'Complete wheel & paint exterior protection suite',
      '1x Bentley 007 Tire Shine Gallon (3.78L)',
      '1x Bentley Glisten Ceramic Silica Coating (250ml)',
      'Extreme hydrophobic water-sheeting on paint and glass',
      'Saves over $20 compared to buying individually',
    ],
  },
  {
    id: 'prod-glisten-ceramic-spray',
    title: 'Bentley Glisten Ceramic Silica',
    subtitle: 'Ceramic Silica Spray Coating – 250ml / 8.45oz',
    category: 'Paint Protection',
    price: '$45.00',
    priceNumeric: 45,
    originalPrice: '$55.00',
    rating: 4.8,
    reviewsCount: 86,
    image: product5Img,
    volume: '250 ml (8.45 oz)',
    badge: 'Customer Choice',
    inStock: true,
    description:
      'Formulated with microscopic SiO2 silica nanoparticles that cross-link to vehicle clear coats. Delivers mirror-like reflection, smooth slickness, and months of repelling dirt, rain spots, and brake dust.',
    features: [
      'Genuine SiO2 ceramic silica infused formula',
      'Instant mirror-like reflection and slick gloss',
      'Ultra-hydrophobic surface repels water & dirt',
      'Safe on clear coats, vinyl wraps, glass & rims',
      'Easy spray-on, wipe-off application',
    ],
  },
  {
    id: 'prod-mascot-snapback-cap',
    title: 'Bentley Mascot Snapback Cap',
    subtitle: 'Official Embroidered High-Crown Royal Blue Cap',
    category: 'Official Apparel',
    price: '$35.00',
    priceNumeric: 35,
    rating: 4.9,
    reviewsCount: 64,
    image: product1Img,
    badge: 'Official Merch',
    inStock: true,
    description:
      'Rep the authentic Bentley Mobile Car Wash crew with the official team snapback. Crafted from premium breathable twill with high-density 3D mascot embroidery, flat visor, and adjustable rear snap closure.',
    features: [
      'High-definition full-color mascot 3D embroidery',
      'Premium structured 6-panel twill crown in Royal Blue',
      'Adjustable snapback strap fits all head sizes',
      'Moisture-wicking interior comfort sweatband',
      'Durable flat bill maintains crisp shape',
    ],
  },
  {
    id: 'prod-pro-chem-sprayer',
    title: 'Professional Chemical Sprayer',
    subtitle: 'Heavy-Duty Adjustable Mist & Jet Trigger Bottle',
    category: 'Tools & Accessories',
    price: '$18.00',
    priceNumeric: 18,
    rating: 4.7,
    reviewsCount: 42,
    image: product2Img,
    volume: '32 oz Bottle',
    badge: 'Pro Grade',
    inStock: true,
    description:
      'Commercial-grade chemical-resistant spray bottle equipped with a high-output comfort trigger and precision nozzle adjustable from a wide atomized mist to a concentrated pinpoint stream.',
    features: [
      'Chemical-resistant Viton seal for degreasers & cleaners',
      'Comfort ergonomic 3-finger trigger reduces hand fatigue',
      'Fully adjustable nozzle from wide mist to jet stream',
      'Embossed dilution ratio scale on side of bottle',
      'Non-tip wide weighted base',
    ],
  },
]

/**
 * Resolves a reliable, active bundled image asset for any product reference.
 * Prevents broken images caused by obsolete Vite development paths (e.g. "/src/assets/...")
 * or stale build hash fingerprints persisted in Firestore documents or localStorage.
 */
export function getSafeProductImage(product?: { id?: string; title?: string; image?: string } | null): string {
  if (!product) return product3Img

  // 1. Exact or normalized ID match
  if (product.id) {
    const match = BENTLEY_PRODUCTS.find((p) => p.id === product.id)
    if (match?.image) return match.image
  }

  // 2. Title matching (case-insensitive substring or exact match)
  if (product.title) {
    const targetTitle = product.title.trim().toLowerCase()
    const match = BENTLEY_PRODUCTS.find((p) => {
      const currentTitle = p.title.trim().toLowerCase()
      return (
        currentTitle === targetTitle ||
        currentTitle.includes(targetTitle) ||
        targetTitle.includes(currentTitle)
      )
    })
    if (match?.image) return match.image
  }

  // 3. Fallback to image string only if not a dev /src/ path and not empty
  if (product.image && typeof product.image === 'string') {
    if (!product.image.startsWith('/src/') && !product.image.includes('/src/assets/')) {
      return product.image
    }
  }

  // 4. Default fallback asset
  return product3Img
}

