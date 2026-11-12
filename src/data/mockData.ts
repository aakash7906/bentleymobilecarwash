import {
  ServiceItem,
  VehicleCategory,
} from '@/types'

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  'Sedan',
  'SUV',
  'Truck',
  'Coupe',
  'Hatchback',
  'Van',
]

export const BRAND_MODELS_MAP: Record<string, string[]> = {
  Audi: ['A4', 'A6', 'Q5', 'Q7', 'R8 GT', 'RS5'],
  BMW: ['3 Series', '5 Series', '8 Series 840d', 'M4', 'X5', 'X7'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'Civic Type R'],
  Subaru: ['WRX', 'Crosstrek', 'Outback', 'Impreza', 'BRZ', 'Forester'],
  Ford: ['F-150', 'Mustang', 'Explorer', 'Bronco', 'Escape'],
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'GR Supra', 'Tacoma'],
  Mercedes: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'G-Wagon'],
  Porsche: ['911 Carrera', 'Cayenne', 'Macan', 'Taycan', 'Panamera'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'],
  Volkswagen: ['Golf R', 'GTI', 'Tiguan', 'Atlas', 'Jetta'],
  Nissan: ['GT-R', 'Z', 'Rogue', 'Altima', 'Pathfinder'],
  Hyundai: ['Elantra N', 'Ioniq 5', 'Tucson', 'Palisade', 'Santa Fe'],
  Lexus: ['IS 350', 'RX 350', 'ES 300h', 'LC 500', 'GX 550'],
}

export const VEHICLE_BRANDS = [
  'Honda',
  'Nissan',
  'Mazda',
  'Ford',
  'Jeep',
  'Volkswagen',
  'Subaru',
  'Chevrolet',
  'Audi',
  'Dodge',
  'Hyundai',
  'Lexus',
]

export const SUBARU_MODELS = [
  'WRX',
  'Crosstrek',
  'Outback',
  'Impreza',
  'Levorg',
]

export const WRX_VARIANTS = [
  'Base',
  'Type RA',
  'STI',
  'Wagon',
]

export const WRX_YEARS = [
  '2002 – 2003',
  '2004 – 2005',
  '2006 – 2007',
  '2008 – 2014',
  '2015 – 2021',
  '2022 – Present',
]

export const WRX_COLORS = [
  'WR Blue Pearl',
  'Sapphire Blue Pearl',
  'Ignition Red',
  'Ceramic White',
  'Ice Silver Metallic',
  'Magnetite Gray Metallic',
  'Crystal Black Silica',
]

export const SERVICES_CATALOG: ServiceItem[] = [
  {
    id: 'deluxe-package',
    title: 'Deluxe Package',
    category: 'Cleaning Packages',
    price: '$140.00',
    priceNumeric: 140,
    estTime: '50–60 Mins.',
    vehicleModel: 'All Vehicles',
    image: '/services_img/service1.jpeg',
    description:
      'Exterior Wash, Window Cleaning, Tire Shine, Fender Wash, Vacuuming, Mat Shampoo, Rain Repellant, Triple Shine, Spot Free Rinse, Dash & Console Wipe.',
    included: [
      'Exterior Wash',
      'Window Cleaning',
      'Tire Shine',
      'Fender Wash',
      'Vacuuming',
      'Mat Shampoo',
      'Rain Repellant',
      'Triple Shine',
      'Spot Free Rinse',
      'Dash & Console Wipe',
    ],
  },
  {
    id: 'supreme-package',
    title: 'Supreme Package',
    category: 'Cleaning Packages',
    price: '$170.00',
    priceNumeric: 170,
    estTime: '75–90 Mins.',
    vehicleModel: 'All Vehicles',
    image: '/services_img/service3.jpeg',
    description:
      'Exterior Wash, Window Cleaning, Tire Shine, Fender Wash, Vacuuming, Mat Shampoo, Rain Repellant, Triple Shine, Spot Free Rinse, Dash & Console Wipe, Undercarriage Spray, Door & Dash Dressing.',
    included: [
      'Exterior Wash',
      'Window Cleaning',
      'Tire Shine',
      'Fender Wash',
      'Vacuuming',
      'Mat Shampoo',
      'Rain Repellant',
      'Triple Shine',
      'Spot Free Rinse',
      'Dash & Console Wipe',
      'Undercarriage Spray',
      'Door & Dash Dressing',
    ],
  },
  {
    id: 'premium-detail',
    title: 'Premium Detail (Full Detail)',
    category: 'Cleaning Packages',
    price: '$190 - $280+',
    priceNumeric: 190,
    estTime: '2–3+ Hours',
    vehicleModel: 'Cars $190+ | SUVs $240+ | Trucks $280+',
    tieredPricing: {
      car: 190,
      suv: 240,
      truck: 280,
    },
    image: '/services_img/cw-interior-detailing.jpg',
    description:
      'Prices may vary depending on the vehicle. Bentley’s complete flagship restoration detailing with deep cleaning, clay treatment, hand wax, engine clean & headliner care.',
    included: [
      'Vacuuming',
      'Interior Shampoo',
      'Vent Cleaning',
      'Dash Dressing',
      'Console Dressing',
      'Window Polish',
      'Door Jambs',
      'Mat Shampoo & Scrub',
      'Exterior Wash',
      'Rim Cleaning',
      'Tire Dressing & Polish Paint Protection',
      'Hand Wax',
      'Car Polish (Includes Clay Treatment)',
      'Engine Clean & Headliner',
    ],
  },
  {
    id: 'rv-full-detail',
    title: 'RV Full Detail',
    category: 'Specialty',
    price: '$600.00',
    priceNumeric: 600,
    estTime: '2–3+ Hours',
    vehicleModel: 'RV & Motorhomes',
    isSpecialty: true,
    image: '/services_img/rv_cleaning.png',
    description:
      'Complete interior and exterior mobile detailing for RVs, travel trailers, and motorhomes. We bring all water, power, and industrial equipment directly to your site.',
    included: [
      'Exterior Washing & Cleaning',
      'Interior Washing & Cleaning'
    ],
  },
  {
    id: 'boat-full-detail',
    title: 'Boat Full Detail & Polish',
    category: 'Specialty',
    price: '$900.00',
    priceNumeric: 900,
    estTime: '3–4+ Hours',
    vehicleModel: 'Watercraft & Boats',
    isSpecialty: true,
    image: '/services_img/boat_cleaning.png',
    description:
      'Professional marine detailing and high-gloss gelcoat polish for speedboats, pontoons, and watercraft. Eliminates waterline stains, oxidization, and protects against lake elements.',
    included: [
      'Exterior Washing & Cleaning',
      'Interior Washing & Cleaning'
    ],
  },
  {
    id: 'exterior-hand-wash',
    title: 'Exterior Hand Wash',
    category: 'Exterior Cleaning',
    price: '$45.00',
    priceNumeric: 45,
    estTime: '30–45 mins',
    vehicleModel: 'Standard Hand Wash',
    image: '/services_img/service1.jpeg',
    description:
      'Applying a car-specific soap to a wash or sponge, and begin washing the car from the top down. This will help prevent any dirt or grime from being pushed down onto lower parts of the car.',
    included: [
   
    ],
  },
  {
    id: 'interior-detailing',
    title: 'Interior Detailing',
    category: 'Interior Cleaning',
    price: '$95.00',
    priceNumeric: 95,
    estTime: '1.5–2 hrs',
    vehicleModel: 'Interior Detailing',
    image: '/services_img/cw-interior-detailing.jpg',
    description:
      'Interior detailing involves thoroughly cleaning and restoring the interior surfaces of a car. Removing any trash or debris from the car, including floor mats and seat covers.',
    included: [
     
    ],
  },
  {
    id: 'exterior-interior',
    title: 'Exterior + Interior',
    category: 'Exterior Cleaning',
    price: '$110.00',
    priceNumeric: 110,
    estTime: '2.5–3 hrs',
    vehicleModel: 'Complete In & Out',
    image: '/services_img/service3.jpeg',
    description:
      'Exterior detailing involves cleaning and restoring the exterior surfaces of a car. Interior detailing involves thoroughly cleaning and restoring the interior surfaces of a car.',
    included: [

    ],
  },
  {
    id: 'interior-vacuuming',
    title: 'Interior Vacuuming',
    category: 'Interior Cleaning',
    price: '$35.00',
    priceNumeric: 35,
    estTime: '20–30 mins',
    vehicleModel: 'Express Vacuum',
    image: '/services_img/services-04.jpg',
    description:
      "Interior vacuuming is an important step in keeping your car's interior clean and free of debris. Vacuum the dashboard, center console, door panels, and other hard surfaces. Use a soft-bristled brush attachment to avoid scratching any surfaces.",
    included: [
      
    ],
  },
  {
    id: 'underbody-wash',
    title: 'Underbody Wash',
    category: 'Exterior Cleaning',
    price: '$30.00',
    priceNumeric: 30,
    estTime: '20–30 mins',
    vehicleModel: 'Chassis Wash',
    image: '/services_img/service5.jpeg',
    description:
      'The underbody wash is an important part of a car wash that involves cleaning the underside of the vehicle, which is often exposed to road salt, dirt, and debris.',
    included: [
     
    ],
  },
  {
    id: 'fleet-maintenance',
    title: 'Fleet Maintenance',
    category: 'Fleet Services',
    price: '$199.00',
    priceNumeric: 199,
    badge: 'Commercial Fleet',
    estTime: 'Custom Schedule',
    vehicleModel: 'Fleet Rate',
    image: '/services_img/service6.jpeg',
    description:
      'Fleet maintenance is a service provided by us to commercial vehicle owners and fleet managers. It involves the regular maintenance and cleaning of multiple vehicles in a fleet.',
    included: [
     
    ],
  },
  {
    id: 'paint-protected-film',
    title: 'Paint Protected Film',
    category: 'Paint Protection',
    price: '$899.00',
    priceNumeric: 899,
    badge: 'XPEL Film',
    estTime: '1–2 Days',
    vehicleModel: 'XPEL PPF',
    image: '/services_img/service7.jpeg',
    description:
      'Bentleymobilecarwash is proud to be an xpel certified installer of self healing paint protection film (PPF) mobile service in kelowna protect your entire vehicle or just its most vulnerable areas the choice is yours as xpel certified installers we provide industry leading paint protection film designed to shield your cars finish from chips scratches and environmental damage our team specializes in custom fitting PPF and window tinting to ensure maximum coverage for high impact areas like the hood bumper side mirrors and finders preserving your vehicles paint against rocks road debris and daily wear we us top -quality products and follow strict installation standards providing superior durability and clarity in every application xpel film are self healing which allows minor scratches to disappear over time with heat exposure keeping your vehicle looking freshly polished our PPF installations are nearly invisible giving you seamless protection without altering the aesthetics of your car bentleymobileautodetailcarwash offers a range of coverage options from partial to full vehicle wrap so you can choose the level of protection that suits your needs serving kelowna and the Okanagan valley',
    included: [

    ],
  },
  {
    id: 'ceramic-coating',
    title: 'Ceramic Coating',
    category: 'Paint Protection',
    price: '$499.00',
    priceNumeric: 499,
    badge: '9H Ceramic',
    estTime: '4–6 hrs',
    vehicleModel: 'Nano-Ceramic',
    image: '/services_img/service8.jpeg',
    description:
      "Ceramic coating is a liquid polymer applied to a car's exterior to create a protective layer that bonds with the paint. It enhances the vehicle's shine while providing long-term protection against UV rays, oxidation, dirt, water spots, and minor scratches. Unlike traditional wax, which wears off over time, ceramic coatings are more durable and hydrophobic, making it easier to clean the car and maintain its glossy finish. Although it doesn't make a car completely scratch-proof, it significantly reduces the risk of swirl marks and chemical damage. While professional application offers the best results, DIY ceramic coating kits are also available for car enthusiasts looking to enhance their vehicle's longevity and appearance.",
    included: [
    ],
  },
]

