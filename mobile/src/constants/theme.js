export const COLORS = {
    primary: '#003580',
    primaryLight: '#1E88E5',
    primarySoft: '#E8F0FE',
    action: '#0071C2',
    actionPressed: '#005999',
    accent: '#FFB700',
    warning: '#B45309',
    bg: '#F0F4F8',
    card: '#FFFFFF',
    text: '#0F172A',
    body: '#1E293B',
    muted: '#475569',
    border: '#E2E8F0',
    inputBorder: '#CBD5E1',
    focus: '#0071C2',
    danger: '#DC2626',
    success: '#16A34A',
};
export const RADIUS = {
    button: 8,
    input: 8,
    card: 12,
};
export const FONTS = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extrabold: 'Inter_800ExtraBold',
};
export const VENDOR_ROLES = [
    'HOTEL_VENDOR',
    'HOMESTAY_VENDOR',
    'TENT_OPERATOR',
    'GUIDE',
    'TAXI_OPERATOR',
    'DRIVER',
    'HORSE_OPERATOR',
    'PRODUCT_VENDOR',
];
export const CATEGORIES = [
    { key: 'hotels', path: '/hotels', labelKey: 'nav.hotels', type: 'HOTEL', query: { type: 'HOTEL' } },
    { key: 'resorts', path: '/hotels', labelKey: 'nav.resorts', type: 'RESORT', query: { type: 'RESORT' } },
    { key: 'homestays', path: '/homestays', labelKey: 'nav.homestays', type: 'HOMESTAY' },
    { key: 'tents', path: '/tents', labelKey: 'nav.tents', type: 'TENT' },
    { key: 'guides', path: '/guides', labelKey: 'nav.guides', type: 'GUIDE' },
    { key: 'drivers', path: '/drivers', labelKey: 'nav.drivers', type: 'DRIVER', query: { vendorType: 'DRIVER' } },
    { key: 'taxi', path: '/drivers', labelKey: 'nav.taxi', type: 'TAXI', query: { vendorType: 'TAXI' } },
    { key: 'horses', path: '/horses', labelKey: 'nav.horses', type: 'HORSE' },
    { key: 'strawberries', path: '/products', labelKey: 'nav.strawberries', type: 'PRODUCT', query: { vertical: 'STRAWBERRY' } },
    { key: 'mapro', path: '/products', labelKey: 'nav.mapro', type: 'PRODUCT', query: { vertical: 'MAPRO' } },
    { key: 'combos', path: '/combos', labelKey: 'nav.combos', type: 'COMBO' },
];
