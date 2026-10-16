import { ServiceItem, ModificationNotification } from '@/types'

export const USER_INFO = {
  name: 'Sarah',
  email: 'sarah@gmail.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  currentVehicle: 'Audi R8 GT',
}

export const USER_SAVED_VEHICLES = [
  'BMW 8 Series 840d',
  'Honda Civic Hybrid',
  'Mazda CX 3',
]

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
    id: 'exterior-hand-wash',
    title: 'Exterior Hand Wash',
    category: 'Exterior Cleaning',
    price: '$49.00',
    priceNumeric: 49,
    estTime: '30–45 mins',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/service1.jpeg',
    description:
      'Applying a car-specific soap to a wash or sponge, and begin washing the car from the top down. This will help prevent any dirt or grime from being pushed down onto lower parts of the car.',
    included: [
      'Car-specific foaming soap application',
      'Top-down gentle microfiber hand wash',
      'Gentle dirt and road grime removal',
      'Wheel, tire and rim cleaning',
      'Streak-free chamois hand dry',
    ],
  },
  {
    id: 'interior-detailing',
    title: 'Interior Detailing',
    category: 'Interior Cleaning',
    price: '$149.00',
    priceNumeric: 149,
    estTime: '1.5–2 hrs',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/cw-interior-detailing.jpg',
    description:
      'Interior detailing involves thoroughly cleaning and restoring the interior surfaces of a car. Removing any trash or debris from the car, including floor mats and seat covers.',
    included: [
      'Deep interior surface cleaning & restoration',
      'Trash and debris complete removal',
      'Floor mats and seat covers shampoo & extraction',
      'Dashboard, vents, and console wipe-down',
      'Odor elimination and interior refresh',
    ],
  },
  {
    id: 'exterior-interior',
    title: 'Exterior + Interior',
    category: 'Exterior Cleaning',
    price: '$189.00',
    priceNumeric: 189,
    estTime: '2.5–3 hrs',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/service3.jpeg',
    description:
      'Exterior detailing involves cleaning and restoring the exterior surfaces of a car. Interior detailing involves thoroughly cleaning and restoring the interior surfaces of a car.',
    included: [
      'Complete exterior 2-bucket hand wash & dry',
      'Full cabin vacuuming and crevice cleaning',
      'Interior dashboard and trim conditioning',
      'Crystal-clear window cleaning inside & out',
      'Tire shine and protective wheel finish',
    ],
  },
  {
    id: 'interior-vacuuming',
    title: 'Interior Vacuuming',
    category: 'Interior Cleaning',
    price: '$39.00',
    priceNumeric: 39,
    estTime: '20–30 mins',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/services-04.jpg',
    description:
      "Interior vacuuming is an important step in keeping your car's interior clean and free of debris. Vacuum the dashboard, center console, door panels, and other hard surfaces. Use a soft-bristled brush attachment to avoid scratching any surfaces.",
    included: [
      'High-power cabin and carpet vacuuming',
      'Dashboard, center console and vent dusting',
      'Door panels & seat crevice detailed suction',
      'Soft-bristled delicate scratch-free brush technique',
      'Trunk & rear cargo compartment vacuuming',
    ],
  },
  {
    id: 'underbody-wash',
    title: 'Underbody Wash',
    category: 'Exterior Cleaning',
    price: '$59.00',
    priceNumeric: 59,
    estTime: '20–30 mins',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/service5.jpeg',
    description:
      'The underbody wash is an important part of a car wash that involves cleaning the underside of the vehicle, which is often exposed to road salt, dirt, and debris.',
    included: [
      'High-pressure undercarriage chassis rinse',
      'Road salt, mud, and road film removal',
      'Wheel arch and suspension deep wash',
      'Corrosion and rust prevention treatment',
      'Complete undercarriage visual inspection',
    ],
  },
  {
    id: 'fleet-maintenance',
    title: 'Fleet Maintenance',
    category: 'Fleet Services',
    price: '$299.00',
    priceNumeric: 299,
    estTime: 'Custom Schedule',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/service6.jpeg',
    description:
      'Fleet maintenance is a service provided by us to commercial vehicle owners and fleet managers. It involves the regular maintenance and cleaning of multiple vehicles in a fleet.',
    included: [
      'Scheduled commercial multi-vehicle cleaning',
      'Complete exterior wash and interior sanitation',
      'Flexible on-site mobile wash service',
      'Volume fleet discount rates',
      'Dedicated fleet account manager & priority booking',
    ],
  },
  {
    id: 'paint-protected-film',
    title: 'Paint Protected Film',
    category: 'Paint Protection',
    price: '$899.00',
    priceNumeric: 899,
    estTime: '1–2 Days',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/service7.jpeg',
    description:
      'Bentleymobilecarwash is proud to be an xpel certified installer of self healing paint protection film (PPF) mobile service in kelowna protect your entire vehicle or just its most vulnerable areas the choice is yours as xpel certified installers we provide industry leading paint protection film designed to shield your cars finish from chips scratches and environmental damage our team specializes in custom fitting PPF and window tinting to ensure maximum coverage for high impact areas like the hood bumper side mirrors and finders preserving your vehicles paint against rocks road debris and daily wear we us top -quality products and follow strict installation standards providing superior durability and clarity in every application xpel film are self healing which allows minor scratches to disappear over time with heat exposure keeping your vehicle looking freshly polished our PPF installations are nearly invisible giving you seamless protection without altering the aesthetics of your car bentleymobileautodetailcarwash offers a range of coverage options from partial to full vehicle wrap so you can choose the level of protection that suits your needs serving kelowna and the Okanagan valley',
    included: [
      'XPEL certified self-healing PPF installation',
      'Full hood, bumper, mirrors & fender coverage options',
      'Protection against rock chips, scratches & environmental damage',
      'Heat-activated self-healing clear coat technology',
      'Precision custom computer-cut fitment with wrapped edges',
    ],
  },
  {
    id: 'ceramic-coating',
    title: 'Ceramic Coating',
    category: 'Paint Protection',
    price: '$599.00',
    priceNumeric: 599,
    estTime: '4–6 hrs',
    vehicleModel: 'Audi R8 GT',
    image: '/services_img/service8.jpeg',
    description:
      "Ceramic coating is a liquid polymer applied to a car's exterior to create a protective layer that bonds with the paint. It enhances the vehicle's shine while providing long-term protection against UV rays, oxidation, dirt, water spots, and minor scratches. Unlike traditional wax, which wears off over time, ceramic coatings are more durable and hydrophobic, making it easier to clean the car and maintain its glossy finish. Although it doesn't make a car completely scratch-proof, it significantly reduces the risk of swirl marks and chemical damage. While professional application offers the best results, DIY ceramic coating kits are also available for car enthusiasts looking to enhance their vehicle's longevity and appearance.",
    included: [
      'Multi-year ultra-hydrophobic nano-ceramic polymer',
      'Deep gloss and mirror-like shine enhancement',
      'Superior UV ray, chemical, and bird-drop resistance',
      'Significant reduction in swirl marks & water spots',
      'Effortless maintenance washing surface',
    ],
  },
]

export const NOTIFICATIONS_DATA: ModificationNotification[] = [
  {
    id: 'n1',
    date: 'May 30',
    time: '9:41',
    title: 'New Collection - Glare Tint',
    description: 'Latest collection "Glare Tint" added for Audi R8 GT...',
  },
  {
    id: 'n2',
    date: 'May 28',
    time: '14:20',
    title: 'Appointment Confirmed',
    description: 'Your Car Wash slot for Audi R8 GT is scheduled for 10:15 AM.',
  },
]
