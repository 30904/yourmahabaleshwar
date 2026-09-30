const pad2 = (n) => String(n).padStart(2, '0');

export const toDateKey = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(x.getTime()))
        return '';
    return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
};

export const todayKey = () => toDateKey(new Date());

export const listingKey = (listing) => `${listing.type}-${listing.id}`;

export const monthWindow = (year, month) => ({
    from: toDateKey(new Date(year, month, 1)),
    to: toDateKey(new Date(year, month + 1, 1)),
});

export const shiftMonth = (year, month, delta) => {
    const next = new Date(year, month + delta, 1);
    return { year: next.getFullYear(), month: next.getMonth() };
};

export const monthCells = (year, month) => {
    const first = new Date(year, month, 1);
    const leading = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= daysInMonth; day += 1) {
        cells.push(toDateKey(new Date(year, month, day)));
    }
    while (cells.length % 7 !== 0)
        cells.push(null);
    return cells;
};

export const dateStatus = (key, blockedDates = [], bookedDates = []) => {
    if (!key)
        return 'empty';
    if (bookedDates.includes(key))
        return 'booked';
    if (blockedDates.includes(key))
        return 'blocked';
    return 'open';
};

export const AVAILABILITY_ROLES = [
    'HOTEL_VENDOR',
    'HOMESTAY_VENDOR',
    'TENT_OPERATOR',
    'HORSE_OPERATOR',
    'TAXI_OPERATOR',
    'DRIVER',
];
