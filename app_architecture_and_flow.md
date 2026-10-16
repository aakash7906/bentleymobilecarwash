# Bentley Mobile Auto Detail Car Wash Ltd. — Application Architecture & Flow

## 1. Executive Overview
The **Bentley Mobile Auto Detail Car Wash Ltd.** web application is an on-demand mobile detailing platform serving Kelowna, West Kelowna, Lake Country, Peachland, and the greater Okanagan region in British Columbia, Canada.

The application has been built from scratch according to the official brand design system, featuring the signature crimson red brand accents, crisp light surface cards, smooth typography, and an interactive online reservation dialog.

---

## 2. Technology Stack
- **Framework & Engine**: React 19 (`react`, `react-dom`) + Vite 8
- **Language**: TypeScript 6 with strict typing
- **Styling**: Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) with custom theme tokens
- **Typography & Icons**: Plus Jakarta Sans, Google Material Symbols Outlined & Lucide React
- **Component Primitives**: shadcn UI architecture (Button, Dialog, Input)
- **Routing**: React Router DOM v7 (Single-page flow with section anchor navigation)
- **Media Assets**: Enhanced 300 DPI high-definition brand logo (`src/assets/bentley-mobile-logo.png`)

---

## 3. Directory Structure
```
bentleymobilecarwash/
├── public/                       # Static public assets
│   ├── favicon.png               # High-resolution brand favicon
│   └── favicon.svg               # Vector icon
├── src/
│   ├── assets/                   # Media assets
│   │   ├── bentley-mobile-logo.png           # 4x 300 DPI enhanced brand mascot logo
│   │   └── bentley-mobile-logo-original.png  # Original reference logo
│   ├── components/
│   │   ├── hero/                 # Modular HeroSection component
│   │   └── ui/                   # shadcn UI components (Button, Dialog, Input, Card, Badge)
│   ├── data/
│   │   └── mockData.ts           # Kelowna BC pricing packages, services, reviews, memberships
│   ├── hooks/
│   │   └── useBooking.ts         # Hook to access booking store
│   ├── layouts/
│   │   ├── MainLayout.tsx        # Top-level shell with Navbar, Outlet, and Footer
│   │   ├── Navbar.tsx            # Sticky navigation with hotline, cart counter, and booking CTA
│   │   └── Footer.tsx            # 4-col footer + full-width signature red copyright bar
│   ├── lib/
│   │   └── utils.ts              # cn utility (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── HomePage.tsx          # Full-featured Home page containing all sections & booking dialog
│   │   └── NotFoundPage.tsx      # 404 fallback page
│   ├── services/
│   │   ├── bookingService.ts     # Booking creation & persistence
│   │   └── authService.ts        # Client session handling
│   ├── store/
│   │   └── bookingStore.tsx      # Global state for cart, selected package, and reservation modal
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces for packages, services, reviews, bookings
│   ├── App.tsx                   # Root component with providers
│   ├── index.css                 # Tailwind v4 theme definitions and base styles
│   ├── main.tsx                  # React DOM mount point
│   └── router.tsx                # React Router DOM configuration
├── .env                          # Local environment variables
├── .firebaserc                   # Firebase project config
├── .gitignore                    # Git exclusions
├── .prettierignore               # Prettier exclusions
├── .prettierrc                   # Prettier formatting rules
├── app_architecture_and_flow.md  # System architecture & workflow documentation
├── index.html                    # Root HTML with Google Fonts & Material Symbols
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript compiler references
├── tsconfig.app.json             # TypeScript browser configuration
└── vite.config.ts                # Vite config with Tailwind CSS v4 & path aliases
```

---

## 4. Homepage Sections & Features
1. **Top Bar**: Contact phone (`+1 250-351-9155`), email (`bentleymobilecarwash@gmail.com`), location (`Kelowna, BC, Canada`), and operating hours.
2. **Hero Section (`#home`)**: Bold headline *"A Clean Car Is A Happy Car"*, animated fleet status badge, eco-friendly trust badges, and primary action buttons.
3. **About Section (`#about`)**: Company history since 2018/2019, 100% self-sustained clean rig details, and eco-tech formulas.
4. **Signature Services (`#services`)**:
   - Exterior Hand Wash ($50)
   - Interior Detailing ($75)
   - Exterior + Interior ($140)
   - 6 Specialized Automotive Treatments (Tire Shine, Dash & Console, Deep Vacuuming, Ceramic Coating, PPF, Underbody Wash).
5. **Pricing & Packages (`#pricing`)**:
   - Basic Clean ($50)
   - Protection ($75 - Signature Red "Most Popular" card)
   - Deluxe ($140)
   - Specialty rates (Supreme Detail $170, Premium Detail $190+, Boat Marine $900, RV $600, Ceramic $670).
6. **VIP Memberships (`#memberships`)**:
   - Gold Tier (5 washes - $1,200)
   - Platinum Elite (8 washes - $1,500)
   - Flex Pass (Flexible scheduling).
7. **Client Reviews (`#reviews`)**: 6 authentic testimonials from Kelowna vehicle owners with 5-star ratings.
8. **Final Conversion Banner (`#contact`)**: Call-to-action for online reservation and direct hotline dialing.
9. **Signature Red Footer**: Full-width red copyright banner:
   `Copyright © 2026 Bentley Mobile Car Wash | Powered by Bentley Mobile Car Wash` matching the reference design.
10. **Interactive Reservation Dialog**: Modal that allows customers to reserve their mobile wash slot with vehicle info and immediate confirmation reference.
