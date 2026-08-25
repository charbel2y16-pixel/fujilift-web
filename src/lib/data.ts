/**
 * Content model.
 *
 * Company facts, project records and product copy are taken from fujilift.com
 * (about, contact and the /pf/ product + project pages). Where the live site
 * publishes no figures — product capacities, speeds, travel heights — the
 * values below are typical for the product class and are marked in the README
 * as needing sign-off from sales before launch.
 */

export type Spec = { label: string; value: string };

export type Product = {
  slug: string;
  name: string;
  /** short name for the mega-menu */
  menu: string;
  tagline: string;
  description: string;
  image: string;
  wide?: string;
  specs: Spec[];
  /** shown on the homepage Products section, in this order */
  featured?: number;
  featuredTitle?: string;
  featuredBlurb?: string;
};

export type Project = {
  slug: string;
  name: string;
  location: string;
  buildingType: string;
  units: string;
  completion: string;
  description: string;
  image: string;
  install?: string;
  wide?: string;
  specs: Spec[];
};

/* ------------------------------------------------------------------ company */

export const COMPANY = {
  name: 'Fujilift',
  founded: 1983,
  since: 'Since 1983',
  lebanon: {
    label: 'Hazmieh, Lebanon',
    address: 'R. Maroun Bldg., Zhayma Street, Hazmieh, Lebanon',
    phone: '+961 3 303 061',
    phoneHref: '+9613303061',
    office: '+961 5 951 676/7',
    officeHref: '+9615951676',
  },
  kinshasa: {
    label: 'Kinshasa, DRC',
    phones: ['+243 900 001 059', '+243 975 624 390'],
    phoneHrefs: ['+243900001059', '+243975624390'],
  },
  email: 'sales@fujilift.com',
  support: 'support@fujilift.com',
  social: {
    facebook: 'https://www.facebook.com/FujiLiftPage/',
    instagram: 'https://www.instagram.com/fujilift.lb/',
    linkedin: 'https://www.linkedin.com/company/fujilift/',
  },
} as const;

/** Years in vertical transport, kept current instead of hard-coded. */
export const yearsActive = () => new Date().getFullYear() - COMPANY.founded;

/* ----------------------------------------------------------------- process */

export const PROCESS = [
  {
    key: 'design',
    label: 'Design',
    heading: 'Design',
    body: 'Traffic analysis, shaft drawings and cabin specification, produced against your architect’s plans before anything is cut.',
  },
  {
    key: 'manufacture',
    label: 'Manufacture',
    heading: 'Built in Hazmieh, not just assembled',
    body: 'Cabins, frames and doors are cut, folded and finished in our own certified factory, running Fuji Electric drives and controllers under FUJI international guidelines.',
  },
  {
    key: 'install',
    label: 'Install & maintain',
    heading: 'Install & maintain',
    body: 'Installation by our own crews, then a maintenance contract with 24/7 callout across Lebanon and Central Africa.',
  },
] as const;

/* ---------------------------------------------------------------- products */

const CERT = 'EN 81-20 / EN 81-50';

export const PRODUCTS: Product[] = [
  {
    slug: 'passenger-elevators',
    name: 'Passenger elevators',
    menu: 'Passenger',
    tagline: 'Residential & commercial',
    description:
      'Smooth, quiet rides for apartment blocks and offices. Running current is 2.5 amps, so the lift stays usable on generator and standby load stays low. The motor carries a lifetime warranty.',
    image: '/media/products/passenger.webp',
    wide: '/media/products/passenger-wide.webp',
    featured: 1,
    featuredTitle: 'Passenger elevators',
    featuredBlurb:
      'Gearless traction at a 2.5 amp running current, so the lift stays live on generator power.',
    specs: [
      { label: 'Capacity', value: '320 – 1,600 kg' },
      { label: 'Speed', value: '1.0 – 1.75 m/s' },
      { label: 'Travel height', value: 'Up to 60 m' },
      { label: 'Drive system', value: 'Gearless traction, Fuji Electric' },
      { label: 'Running current', value: '2.5 A' },
      { label: 'Certification', value: CERT },
      { label: 'Building type', value: 'Residential, commercial' },
    ],
  },
  {
    slug: 'hospital-bed-elevators',
    name: 'Hospital bed elevators',
    menu: 'Hospital Bed',
    tagline: 'Hospitals & clinics',
    description:
      'Sized around a stretcher and the team pushing it. Deep cars, wide two-speed doors and levelling accurate enough that a trolley does not catch on the sill.',
    image: '/media/products/hospital-bed.webp',
    specs: [
      { label: 'Capacity', value: '1,600 – 2,500 kg' },
      { label: 'Speed', value: '1.0 – 1.6 m/s' },
      { label: 'Car depth', value: 'From 2,400 mm' },
      { label: 'Drive system', value: 'Gearless traction' },
      { label: 'Certification', value: CERT },
      { label: 'Building type', value: 'Hospitals, clinics' },
    ],
  },
  {
    slug: 'high-rise',
    name: 'High-rise elevators',
    menu: 'High-Rise',
    tagline: 'Towers above 15 floors',
    description:
      'Built for long travel and heavy traffic: regenerative gearless drives, compensation ropes and destination-aware dispatch across a group of cars.',
    image: '/media/products/high-rise.webp',
    specs: [
      { label: 'Capacity', value: '630 – 1,600 kg' },
      { label: 'Speed', value: '1.75 – 4.0 m/s' },
      { label: 'Travel height', value: 'Up to 150 m' },
      { label: 'Drive system', value: 'Gearless traction, regenerative' },
      { label: 'Certification', value: CERT },
      { label: 'Building type', value: 'Towers, mixed-use' },
    ],
  },
  {
    slug: 'mid-rise',
    name: 'Mid-rise elevators',
    menu: 'Mid-Rise',
    tagline: '5 – 15 floors',
    description:
      'The workhorse for mid-height residential and office buildings. Machine-room-less, so the shaft head stays shallow and the roof stays clear.',
    image: '/media/products/mid-rise.webp',
    specs: [
      { label: 'Capacity', value: '450 – 1,000 kg' },
      { label: 'Speed', value: '1.0 – 1.75 m/s' },
      { label: 'Travel height', value: 'Up to 45 m' },
      { label: 'Drive system', value: 'Gearless traction, machine-room-less' },
      { label: 'Certification', value: CERT },
      { label: 'Building type', value: 'Residential, office' },
    ],
  },
  {
    slug: 'panoramic-elevator',
    name: 'Panoramic elevators',
    menu: 'Panoramic',
    tagline: 'Glass atriums, hotels, malls',
    description:
      'A glass car in a glass shaft, detailed so the structure reads as part of the building rather than a machine bolted into it. Laminated safety glazing throughout.',
    image: '/media/products/panoramic.webp',
    wide: '/media/products/panoramic-wide.webp',
    featured: 2,
    featuredTitle: 'Panoramic elevators',
    featuredBlurb:
      'Glass car, glass shaft, exposed steel — detailed so the hoistway reads as structure, not plant.',
    specs: [
      { label: 'Capacity', value: '450 – 1,000 kg' },
      { label: 'Speed', value: '1.0 – 1.6 m/s' },
      { label: 'Travel height', value: 'Up to 45 m' },
      { label: 'Glazing', value: 'Laminated safety glass' },
      { label: 'Drive system', value: 'Gearless traction' },
      { label: 'Certification', value: CERT },
      { label: 'Building type', value: 'Atriums, hotels, retail' },
    ],
  },
  {
    slug: 'vacuum-elevator',
    name: 'Vacuum elevators',
    menu: 'Vacuum',
    tagline: 'Retrofit, no pit',
    description:
      'A pneumatic tube lift from PVE. No pit, no machine room and no shaft to build — it drops into an existing house on a flat slab.',
    image: '/media/products/vacuum.webp',
    specs: [
      { label: 'Capacity', value: '160 – 240 kg (1 – 3 people)' },
      { label: 'Speed', value: '0.15 m/s' },
      { label: 'Travel height', value: 'Up to 15 m, 5 stops' },
      { label: 'Drive system', value: 'Pneumatic, PVE' },
      { label: 'Pit required', value: 'None' },
      { label: 'Building type', value: 'Villas, retrofit' },
    ],
  },
  {
    slug: 'escalators',
    name: 'Escalators & moving walks',
    menu: 'Escalators',
    tagline: 'Retail, transit, airports',
    description:
      'Heavy-duty trusses for continuous public traffic, with skirt deflectors, comb-plate safety switches and variable-speed standby to cut running cost off-peak.',
    image: '/media/products/escalators.webp',
    wide: '/media/products/escalators-wide.webp',
    featured: 4,
    featuredTitle: 'Escalators & moving walks',
    featuredBlurb:
      'Public-duty trusses with variable-speed standby, so they cost less to run off-peak.',
    specs: [
      { label: 'Rise', value: '3 – 8 m' },
      { label: 'Step width', value: '600 / 800 / 1,000 mm' },
      { label: 'Speed', value: '0.5 m/s' },
      { label: 'Inclination', value: '30° / 35°' },
      { label: 'Capacity', value: 'Up to 9,000 persons/hour' },
      { label: 'Certification', value: 'EN 115-1' },
      { label: 'Building type', value: 'Retail, transit, airports' },
    ],
  },
  {
    slug: 'freight-elevators',
    name: 'Freight elevators',
    menu: 'Freight',
    tagline: 'Industrial & warehouse',
    description:
      'Goods lifts built around load rather than comfort: reinforced platforms, bumper rails, chequer-plate floors and doors sized for a pallet truck.',
    image: '/media/products/freight.webp',
    wide: '/media/products/freight-wide.webp',
    featured: 3,
    featuredTitle: 'Freight & car elevators',
    featuredBlurb:
      'Load-first engineering up to 3,500 kg, with platforms detailed for pallet trucks and vehicles.',
    specs: [
      { label: 'Capacity', value: '1,000 – 3,000 kg' },
      { label: 'Speed', value: '0.25 – 1.0 m/s' },
      { label: 'Travel height', value: 'Up to 30 m' },
      { label: 'Drive system', value: 'Geared traction or hydraulic' },
      { label: 'Certification', value: CERT },
      { label: 'Building type', value: 'Industrial, warehouse' },
    ],
  },
  {
    slug: 'homelift',
    name: 'Home elevators',
    menu: 'Home',
    tagline: 'Villas & private homes',
    description:
      'Shafted or self-supporting, with low overhead and no pit. Sized to fit a stairwell void or an external wall without rebuilding the house around it.',
    image: '/media/products/home.webp',
    specs: [
      { label: 'Capacity', value: '250 – 400 kg' },
      { label: 'Speed', value: '0.15 – 0.30 m/s' },
      { label: 'Stops', value: 'Up to 4' },
      { label: 'Drive system', value: 'Screw or hydraulic' },
      { label: 'Pit required', value: 'None — low overhead' },
      { label: 'Building type', value: 'Villas, private homes' },
    ],
  },
  {
    slug: 'car-elevators',
    name: 'Car elevators',
    menu: 'Car',
    tagline: 'Parking structures',
    description:
      'Vehicle lifts for sites where a ramp costs more floor area than it is worth. Platforms take a full-size SUV, with drive-through doors where the layout needs them.',
    image: '/media/products/car.webp',
    specs: [
      { label: 'Capacity', value: '2,500 – 3,500 kg' },
      { label: 'Speed', value: '0.25 – 0.50 m/s' },
      { label: 'Platform', value: 'From 2,600 × 5,400 mm' },
      { label: 'Drive system', value: 'Hydraulic or traction' },
      { label: 'Certification', value: CERT },
      { label: 'Building type', value: 'Parking, showrooms' },
    ],
  },
  {
    slug: 'chairlifts',
    name: 'Chairlifts',
    menu: 'Chairlifts',
    tagline: 'Accessibility, straight or curved',
    description:
      'European-made stair lifts for straight and curved flights, fitted to the existing staircase. For homes and for public buildings that have to stay accessible.',
    image: '/media/products/chairlifts.webp',
    specs: [
      { label: 'Capacity', value: '125 kg' },
      { label: 'Speed', value: '0.15 m/s' },
      { label: 'Rail', value: 'Straight or curved' },
      { label: 'Origin', value: 'Made in Europe' },
      { label: 'Building type', value: 'Homes, public buildings' },
    ],
  },
];

export const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.featured).sort(
  (a, b) => (a.featured ?? 0) - (b.featured ?? 0),
);

export const productBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

/* ---------------------------------------------------------------- projects */

export const PROJECTS: Project[] = [
  {
    slug: 'platine-tower',
    name: 'Platine Tower',
    location: 'Dbayeh, Lebanon',
    buildingType: 'Residential tower, 20 floors',
    units: '4 elevators',
    completion: '2022',
    description:
      'Three passenger cars and a dedicated freight lift. The group runs at 1.75 m/s across nineteen floors, which keeps the morning peak moving.',
    image: '/media/projects/platine-tower.webp',
    install: '/media/projects/platine-tower-install.webp',
    wide: '/media/projects/platine-tower-wide.webp',
    specs: [
      { label: 'Location', value: 'Dbayeh, Lebanon' },
      { label: 'Building type', value: 'Residential tower' },
      { label: 'Units installed', value: '3 passenger + 1 freight' },
      { label: 'Passenger cars', value: '19 floors, 850 kg, 1.75 m/s' },
      { label: 'Freight car', value: '20 floors, 1,600 kg, 1.75 m/s' },
      { label: 'Completion', value: '2022' },
    ],
  },
  {
    slug: 'rabieh-villa',
    name: 'Rabieh Villa',
    location: 'Rabieh, Lebanon',
    buildingType: 'Private residence, 5 stops',
    units: '1 elevator',
    completion: '2023',
    description:
      'A house that needed a lift it would not hear. One custom car across five stops, detailed to the architecture.',
    image: '/media/projects/rabieh-villa.webp',
    wide: '/media/projects/rabieh-villa-wide.webp',
    specs: [
      { label: 'Location', value: 'Rabieh, Lebanon' },
      { label: 'Building type', value: 'Private residence' },
      { label: 'Units installed', value: '1 passenger elevator' },
      { label: 'Specification', value: '5 stops, 450 kg, 1.75 m/s' },
      { label: 'Completion', value: '2023' },
    ],
  },
  {
    slug: 'iveco',
    name: 'Iveco',
    location: 'Dora seaside, Lebanon',
    buildingType: 'Transport & logistics facility',
    units: '1 elevator',
    completion: '2019',
    description:
      'A working logistics facility on the Dora seafront. One passenger car over three levels, specified for industrial traffic.',
    image: '/media/projects/iveco.webp',
    install: '/media/projects/iveco-install.webp',
    wide: '/media/projects/iveco-wide.webp',
    specs: [
      { label: 'Location', value: 'Dora seaside, Lebanon' },
      { label: 'Building type', value: 'Transport & logistics' },
      { label: 'Units installed', value: '1 passenger elevator' },
      { label: 'Specification', value: '3 floors, 800 kg, 1.75 m/s' },
      { label: 'Completion', value: '2019' },
    ],
  },
  {
    slug: 'sodicar',
    name: 'Sodicar',
    location: 'Bsalim, Lebanon',
    buildingType: 'Industrial, automotive',
    units: '1 freight elevator',
    completion: '2019',
    description:
      'A six-stop freight lift rated to 2,000 kg, sized to move heavy parts between floors without splitting loads.',
    image: '/media/projects/sodicar.webp',
    install: '/media/projects/sodicar-install.webp',
    wide: '/media/projects/sodicar-wide.webp',
    specs: [
      { label: 'Location', value: 'Bsalim, Lebanon' },
      { label: 'Building type', value: 'Industrial, automotive' },
      { label: 'Units installed', value: '1 freight elevator' },
      { label: 'Specification', value: '6 floors, 2,000 kg, 1.0 m/s' },
      { label: 'Completion', value: '2019' },
    ],
  },
];

export const projectBySlug = (slug: string) => PROJECTS.find((p) => p.slug === slug);

/* ---------------------------------------------------------------- partners */

export const PARTNERS = [
  { name: 'Fuji Electric', file: 'fuji-electric' },
  { name: 'Fuji Hi-Tech', file: 'fuji-hi-tech' },
  { name: 'Montanari', file: 'montanari' },
  { name: 'Wittur', file: 'wittur' },
  { name: 'SICOR', file: 'sicor' },
  { name: 'Arkel', file: 'arkel' },
  { name: 'Omarlift', file: 'omarlift' },
  { name: 'Henning', file: 'henning' },
  { name: 'INVT', file: 'invt' },
  { name: 'Hpmont', file: 'hpmont' },
  { name: 'PVE', file: 'pve' },
  { name: 'Lehner', file: 'lehner' },
] as const;

/* --------------------------------------------------------------- navigation */

export type NavItem = { label: string; href: string; mega?: boolean };

export const NAV: readonly NavItem[] = [
  { label: 'About', href: '/#about' },
  { label: 'Products', href: '/#products', mega: true },
  { label: 'Projects', href: '/#projects' },
  { label: 'Maintenance', href: '/#maintenance' },
  { label: 'Contact', href: '/#contact' },
];

export const FOOTER_LINKS = [
  {
    title: 'Products',
    links: PRODUCTS.slice(0, 6).map((p) => ({ label: p.name, href: `/products/${p.slug}` })),
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/#about' },
      { label: 'Our factory', href: '/#factory' },
      { label: 'Projects', href: '/#projects' },
      { label: 'Maintenance', href: '/#maintenance' },
      { label: 'Contact', href: '/#contact' },
    ],
  },
] as const;
