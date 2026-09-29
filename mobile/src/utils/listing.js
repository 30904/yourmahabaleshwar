import { API_BASE } from '../api/client';

export function mediaUrl(path) {
    if (!path) return '';
    const value = String(path);
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    const origin = API_BASE.replace(/\/api\/?$/, '');
    if (value.startsWith('/uploads/')) return `${origin}${value}`;
    return `${origin}/uploads/${value.replace(/^\/+/, '')}`;
}

export function listingImage(item) {
    const raw = item?.images?.[0] || item?.photo || item?.imageUrl || item?.coverImage || '';
    return mediaUrl(raw);
}

export function listingPlace(item) {
    const address = item?.address;
    if (address && typeof address === 'object') {
        const line = [address.line1, address.city, address.state].filter(Boolean).join(', ');
        if (line) return line;
    }
    return item?.location || item?.vertical || 'Mahabaleshwar';
}

export function listingPrice(item) {
    const amount = item?.priceFrom
        ?? item?.pricePerNight
        ?? item?.rooms?.[0]?.basePrice
        ?? item?.pricePerRide
        ?? item?.package6hr
        ?? item?.price
        ?? item?.comboPrice;
    const n = Number(amount);
    return Number.isFinite(n) ? n : null;
}
