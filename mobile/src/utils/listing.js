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
    const roomPhoto = item?.rooms?.find((room) => room?.images?.[0])?.images?.[0];
    const raw = item?.images?.[0] || roomPhoto || item?.photo || item?.imageUrl || item?.coverImage || '';
    return mediaUrl(raw);
}

export function formatTime12(value) {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return value || '';
    let hour = Number(match[1]);
    const minute = match[2];
    const period = hour >= 12 ? 'PM' : 'AM';
    hour %= 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${period}`;
}

export function listingPlace(item, type) {
    if (type === 'GUIDE') return item?.mainTourismArea || 'Mahabaleshwar';
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
