/**
 * Mega-menu structure from Figma Make Header — links map to WooCommerce category slugs where applicable.
 */

export const productMegaMenu = {
  trucks: {
    title: 'Trucks',
    items: [
      { name: 'Heavy Duty Truck', path: '/products?category=heavy-duty-truck' },
      { name: 'Dump Truck', path: '/products?category=dump-truck' },
      { name: 'Tractor Truck', path: '/products?category=tractor-truck' },
      { name: 'Cargo Truck', path: '/products?category=cargo-truck' },
      { name: 'Refrigerated Truck', path: '/products?category=refrigerated-truck' },
      { name: 'Fuel Tanker Truck', path: '/products?category=fuel-tanker' },
      { name: 'Water Sprinkler Truck', path: '/products?category=water-truck' },
      { name: 'Concrete Mixer Truck', path: '/products?category=concrete-mixer' },
      { name: 'Concrete Pump Truck', path: '/products?category=concrete-pump' },
      { name: 'Mixer Pump Truck', path: '/products?category=mixer-pump' },
      { name: 'Aerial Work Truck', path: '/products?category=aerial-work' },
      { name: 'Crane Truck', path: '/products?category=crane-truck' },
      { name: 'Garbage Truck', path: '/products?category=garbage-truck' },
      { name: 'Flatbed Truck', path: '/products?category=flatbed-truck' },
      { name: 'Wrecker Truck', path: '/products?category=wrecker-truck' },
      { name: 'Fire Fighting Truck', path: '/products?category=fire-truck' },
      { name: 'Mining Truck', path: '/products?category=mining-truck' },
    ],
  },
  semiTrailers: {
    title: 'Semi-Trailers',
    items: [
      { name: 'Flatbed Semi-Trailer', path: '/products?category=flatbed-trailer' },
      { name: 'Lowboy Semi-Trailer', path: '/products?category=lowbed-trailer' },
      { name: 'Container Semi-Trailer', path: '/products?category=container-trailer' },
      { name: 'Fence Cargo Trailer', path: '/products?category=fence-trailer' },
      { name: 'Van Semi-Trailer', path: '/products?category=van-trailer' },
      { name: 'Skeleton Semi-Trailer', path: '/products?category=skeleton-trailer' },
      { name: 'Tipper Semi-Trailer', path: '/products?category=dump-trailer' },
      { name: 'Tank Semi-Trailer', path: '/products?category=tank-trailer' },
      { name: 'Refrigerated Semi-Trailer', path: '/products?category=reefer-trailer' },
    ],
  },
  engineParts: {
    title: 'Engine Assembly',
    items: [
      { name: 'Weichai Engine', path: '/products?category=weichai-engine' },
      { name: 'Sinotruk Engine', path: '/products?category=sinotruk-engine' },
      { name: 'Cummins Engine', path: '/products?category=cummins-engine' },
      { name: 'Yuchai Engine', path: '/products?category=yuchai-engine' },
      { name: 'Deutz Engine', path: '/products?category=deutz-engine' },
      { name: 'Shangchai Engine', path: '/products?category=shangchai-engine' },
      { name: 'FAW Engine', path: '/products?category=faw-engine' },
    ],
  },
} as const;
