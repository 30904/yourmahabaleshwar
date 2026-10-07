import { CATEGORIES } from '../../constants/theme';

export function categoryByKey(key) {
    return CATEGORIES.find((item) => item.key === key);
}

export function openCategory(navigation, t, key) {
    const category = categoryByKey(key);
    if (!category) return;
    navigation.navigate('Catalog', {
        path: category.path,
        title: t(category.labelKey),
        type: category.type,
        query: 'query' in category ? category.query : undefined,
    });
}

const AD_ROUTES = {
    HOTEL: { path: '/hotels', type: 'HOTEL' },
    RESORT: { path: '/hotels', type: 'RESORT' },
    HOMESTAY: { path: '/homestays', type: 'HOMESTAY' },
    TENT: { path: '/tents', type: 'TENT' },
};

export function openAdListing(navigation, ad) {
    const route = AD_ROUTES[String(ad?.listingType || '').toUpperCase()] || AD_ROUTES.HOTEL;
    if (!ad?.slug) return;
    navigation.navigate('ListingDetail', { path: route.path, slug: ad.slug, type: route.type });
}
