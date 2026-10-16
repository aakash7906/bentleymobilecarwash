import {
  ServicePackage,
  SpecialtyService,
  MembershipPlan,
  Testimonial,
  Treatment,
} from '@/types'

export const BUSINESS_INFO = {
  name: 'Bentley Mobile Auto Detail Car Wash Ltd.',
  foundedYear: '2018',
  phone: '+1 250-351-9155',
  phoneTel: '+12503519155',
  email: 'bentleymobilecarwash@gmail.com',
  location: 'Kelowna, BC, Canada',
  hours: 'Mon-Sat: 9:00 am – 5:00 pm | Sunday: Closed',
  coverageAreas: 'Kelowna, West Kelowna, Lake Country, Peachland & surrounding Okanagan areas',
  copyright: 'Copyright © 2026 Bentley Mobile Car Wash | Powered by Bentley Mobile Car Wash',
}

export const SIGNATURE_SERVICES = [
  {
    id: 'exterior',
    title: 'Exterior Hand Wash',
    price: 'From $50',
    description:
      'Gentle two-bucket wash technique, hand dry with ultra-plush microfiber, wheel decarb, bug elimination, and streak-free windows.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDX9KmyF8sGIe3IvYfvIs8suseP65HZa7slwz1sM5teTvD7PpoA2mMwaN0TFXlirD1MfKZxq-AdaPDSi_ajw6P9uUqGzemtqgYIbmH78_PcidJx5sjmTatlAyfyVuCAKEi_Y6zNMSqWqeoY-S9_7YOmgtazysEWieOfKOvRVpt5hwVJJ-rpRq7TaYHXV74UII_3C4MTRhE-ktLVSHXUmcM31WES2jGYDnzMEQNv3pV-NDLbAlyqLvWI',
    ctaText: 'Book Exterior',
  },
  {
    id: 'interior',
    title: 'Interior Detailing',
    price: 'From $75',
    description:
      'Deep compressed-air purge, shampooing of carpets and mats, premium leather conditioning, vents sanitized, and UV cabin defense.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDJj0W6wsVRmjmjL3vuntWLN2CbdTyJ7BsElfMq51mZuGXs8xWdSHcbYKTnAydJHdAzrRjihydYwuo-dTqY_IEma2RYwJtkVnVmjhrlkmmC1u_Gw0zOxqRIoBWCpZ54dtFGsf3BSGr55bU47cG1IaqUd4mN8k5Td__WGbKhToP_P-zsgX7mYmxUyOuKQzgZl3ocPdiE4Xf954uhpWQXpAcuaYV7Uj8Vk2rWkqEP3cxSPLWXxOco7t8V',
    ctaText: 'Book Interior',
  },
  {
    id: 'complete',
    title: 'Exterior + Interior',
    price: 'From $140',
    description:
      'Our ultimate total rejuvenation combo. Complete exterior wash, triple shine wax, spot-free rinse, dash console scrub, and cabin refresh.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBfp0Td2R0JumsQSP2AeOj3zTZXhiut9--ZGDNgEp-A3PBmJG5zcsSGTlk5O4sIIwQGaTJVPQ2T-Hl_9OOSuKIC0Njtzrp-9KMtXT8JF7xxd7QaxntG6113d8Ftn8YXGNdAndbY7eZ0MPihSY1jarFoR40iY_CV9pZ1vwJSrnaV1hsBiLr10O2gV4kcZ2RsKxIP52OmGRyEtGL-Vf9SU-YWTyJcsvfg1p0oH6JaTrmZL_934X-2xS8m',
    ctaText: 'Book Complete',
    highlighted: true,
  },
]

export const SPECIALIZED_TREATMENTS: Treatment[] = [
  { title: 'Tire Shine', subtitle: 'Deep UV satin finish', icon: 'tire_repair' },
  { title: 'Dash & Console', subtitle: 'Non-greasy interior seal', icon: 'cleaning_services' },
  { title: 'Deep Vacuuming', subtitle: 'Crevice & trunk detail', icon: 'vacuum' },
  { title: 'Ceramic Coating', subtitle: 'Hydrophobic 9H armor', icon: 'shield' },
  { title: 'Paint Film (PPF)', subtitle: 'Rock chip defense', icon: 'layers' },
  { title: 'Underbody Wash', subtitle: 'Salt & grime removal', icon: 'water' },
]

export const PRICING_PACKAGES: ServicePackage[] = [
  {
    id: 'basic-clean',
    name: 'Basic Clean',
    price: 50,
    unit: '/ per wash',
    features: [
      'Exterior Wash',
      'Window Cleaning',
      'Tire Shine',
      'Fender Wash',
      'Extra Dirty ($5-$15 extra)',
    ],
    excludedFeatures: ['Vacuuming', 'Mat Shampoo', 'Rain Repellant'],
    ctaText: 'Book Now',
  },
  {
    id: 'protection',
    name: 'Protection',
    price: 75,
    unit: '/ per wash',
    popular: true,
    features: [
      'Exterior Wash',
      'Window Cleaning',
      'Tire Shine',
      'Fender Wash',
      'Extra Dirty ($5-$15 extra)',
      'Cabin Vacuuming',
      'Mat Shampoo',
      'Rain Repellant Glass Shield',
    ],
    ctaText: 'Book Protection Now',
  },
  {
    id: 'deluxe',
    name: 'Deluxe',
    price: 140,
    unit: '/ per wash',
    features: [
      'Exterior Wash',
      'Window Cleaning',
      'Tire Shine & Dressing',
      'Fender & Arch Detail',
      'Complete Deep Vacuum',
      'Mat Shampoo Extraction',
      'Rain Repellant Glass Shield',
      'Triple Shine Ceramic Wax',
      'Spot Free Deionized Rinse',
      'Dash & Console Sanitizing Wipe',
    ],
    ctaText: 'Book Deluxe',
  },
]

export const SPECIALTY_RATES: SpecialtyService[] = [
  { name: 'Supreme Detail', price: '$170', description: 'Complete gloss correction' },
  { name: 'Premium Detail', price: '$190+', description: 'Cars $190 | SUV $240 | Trucks $280' },
  { name: 'Boat Marine Detail', price: '$900', description: 'Full compound & hull polish' },
  { name: 'RV Detail & Polish', price: '$600', description: 'Full exterior oxidation strip' },
  { name: 'Ceramic Coating', price: '$670', description: 'Per car | Multi-year warranty' },
]

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'gold-tier',
    name: '5-Wash Package',
    tier: 'Gold Tier',
    price: '$1,200',
    duration: 'Valid for up to 4 months',
    features: [
      'Priority calendar dispatch',
      '5 Full Exterior + Interior washes',
      '2 Complimentary leather treatments',
      'Transferable between household cars',
    ],
    ctaText: 'Select Gold',
  },
  {
    id: 'platinum-elite',
    name: '8-Wash Package',
    tier: 'Platinum Elite',
    price: '$1,500',
    duration: 'Best value for car enthusiasts & executives',
    popular: true,
    features: [
      'Guaranteed 24-hr priority scheduling',
      '8 Complete Deluxe detail washes',
      'Free engine bay detailing session',
      'Ceramic booster spray every visit',
    ],
    ctaText: 'Select Platinum',
  },
  {
    id: 'flex-pass',
    name: 'General Membership',
    tier: 'Flex Pass',
    price: 'Flexible',
    duration: 'Up to 4 months of flexible scheduling',
    features: [
      'Choose any service when needed',
      '15% discount on all standalone add-ons',
      'Multiple vehicle support on same plan',
      'Free cancel / reschedule with 12h notice',
    ],
    ctaText: 'Inquire For Flex Pass',
  },
]

export const CLIENT_REVIEWS: Testimonial[] = [
  {
    id: 'rev-1',
    author: 'Toya Allure',
    locationOrType: 'Kelowna, BC',
    rating: 5,
    comment:
      "Excellent service! Prompt, professional, hardworking guys. Would highly recommend. I've used their services multiple times.",
    avatarInitial: 'TA',
  },
  {
    id: 'rev-2',
    author: 'Jolene Stehr',
    locationOrType: 'Verified Customer (5/5)',
    rating: 5,
    comment:
      "All around awesome! Friendly, hardworking, reasonably priced, and excellent results. Having them come to me makes it so much easier to add to my day. I'll definitely be using them again!",
    avatarInitial: 'JS',
  },
  {
    id: 'rev-3',
    author: 'Honda CRV Owner',
    locationOrType: 'Exterior + Interior Complete',
    rating: 5,
    comment:
      'Thanks so much for working so hard and making my SUV shine. The CRV looks like a brand new vehicle. I just love how shiny it is.',
    avatarInitial: 'H',
  },
  {
    id: 'rev-4',
    author: 'Commercial Fleet Client',
    locationOrType: 'Kelowna, BC',
    rating: 5,
    comment:
      'Truck looks good thank you! Prompt arrival right at my worksite and spotless fenders and glass.',
    avatarInitial: 'CF',
  },
  {
    id: 'rev-5',
    author: 'Toya',
    locationOrType: 'Repeat Customer',
    rating: 5,
    comment:
      'Hey Bentley! My car looks great thanks for the refresh. Meant to message you yesterday but it was too late to text.',
    avatarInitial: 'T',
  },
  {
    id: 'rev-6',
    author: 'Rachel',
    locationOrType: 'West Kelowna, BC',
    rating: 5,
    comment:
      'Thanks again Bentley feels soo good. The interior feels fresh and clean like the day we drove it off the lot.',
    avatarInitial: 'R',
  },
]
