export const COLORS = {
    primary: '#0B3D2E',
    primarySoft: '#E8F2EE',
    accent: '#C45C26',
    bg: '#F7F5F2',
    card: '#FFFFFF',
    text: '#14201B',
    muted: '#5C6B64',
    border: '#D9E0DC',
    danger: '#B42318',
    success: '#067647',
};
export const VENDOR_ROLES = [
    'HOTEL_VENDOR',
    'HOMESTAY_VENDOR',
    'TENT_OPERATOR',
    'GUIDE',
    'TAXI_OPERATOR',
    'DRIVER',
    'HORSE_OPERATOR',
];
export const CATEGORIES = [
    { key: 'hotels', path: '/hotels', labelKey: 'nav.hotels', type: 'HOTEL' },
    { key: 'resorts', path: '/hotels', labelKey: 'nav.resorts', type: 'RESORT', query: { type: 'RESORT' } },
    { key: 'homestays', path: '/homestays', labelKey: 'nav.homestays', type: 'HOMESTAY' },
    { key: 'tents', path: '/tents', labelKey: 'nav.tents', type: 'TENT' },
    { key: 'guides', path: '/guides', labelKey: 'nav.guides', type: 'GUIDE' },
    { key: 'taxi', path: '/taxi', labelKey: 'nav.taxi', type: 'TAXI' },
    { key: 'horses', path: '/horses', labelKey: 'nav.horses', type: 'HORSE' },
    { key: 'strawberries', path: '/products', labelKey: 'nav.strawberries', type: 'PRODUCT', query: { vertical: 'STRAWBERRY' } },
    { key: 'mapro', path: '/products', labelKey: 'nav.mapro', type: 'PRODUCT', query: { vertical: 'MAPRO' } },
    { key: 'combos', path: '/combos', labelKey: 'nav.combos', type: 'COMBO' },
];
