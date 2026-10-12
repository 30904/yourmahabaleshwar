import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchMyVendorListings, fetchVendorReviews, getMyKyc, getMySubscription, getWallet, vendorBookings } from '../../api/endpoints';
import { useReconnect } from '../../api/useReconnect';
import HomeHeader from '../../components/home/HomeHeader';
import { Building2, Calendar, CalendarDays, Car, CreditCard, FileText, Home, Languages, Megaphone, ShoppingBag, Star, Tag, Tent, Trees, Wallet } from '../../components/home/icons';
import { Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { AVAILABILITY_ROLES } from '../../utils/vendorAvailability';
import { listingStatusOf } from '../../utils/vendorListingForm';

const LISTING_LABEL = {
    HOTEL_VENDOR: 'vendor.navHotels',
    HOMESTAY_VENDOR: 'vendor.navHomestays',
    TENT_OPERATOR: 'vendor.navTents',
    GUIDE: 'vendor.navGuides',
    TAXI_OPERATOR: 'vendor.navTaxi',
    DRIVER: 'vendor.navDriver',
    HORSE_OPERATOR: 'vendor.navHorses',
    PRODUCT_VENDOR: 'vendor.navProducts',
};

const LISTING_ICON = {
    HOTEL_VENDOR: Building2,
    HOMESTAY_VENDOR: Home,
    TENT_OPERATOR: Tent,
    GUIDE: Languages,
    TAXI_OPERATOR: Car,
    DRIVER: Car,
    HORSE_OPERATOR: Trees,
    PRODUCT_VENDOR: ShoppingBag,
};

const DASH_TITLE = {
    HOTEL_VENDOR: 'vendor.dashHotel',
    HOMESTAY_VENDOR: 'vendor.dashHomestay',
    TENT_OPERATOR: 'vendor.dashTent',
    GUIDE: 'vendor.dashGuide',
    TAXI_OPERATOR: 'vendor.dashTaxi',
    DRIVER: 'vendor.dashDriver',
    HORSE_OPERATOR: 'vendor.dashHorse',
    PRODUCT_VENDOR: 'vendor.dashProduct',
};

const STAY_SUBSCRIPTION = ['HOTEL_VENDOR', 'HOMESTAY_VENDOR'];
const SERVICE_SUBSCRIPTION = ['GUIDE', 'TAXI_OPERATOR', 'DRIVER', 'TENT_OPERATOR', 'HORSE_OPERATOR'];
const AD_ROLES = ['HOTEL_VENDOR', 'HOMESTAY_VENDOR', 'TENT_OPERATOR'];
const OPEN_STATUSES = ['PENDING', 'CONFIRMED'];
const CLOSED_STATUSES = ['CANCELLED', 'REFUNDED'];

function startOfDay(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function moneyOf(rows) {
    return rows.reduce((sum, booking) => sum + (Number(booking.total) || 0), 0);
}

function listingName(booking) {
    return booking.hotel?.name
        || booking.homestay?.name
        || booking.tent?.name
        || booking.guide?.name
        || booking.driver?.name
        || booking.horse?.name
        || booking.product?.name
        || booking.combo?.title
        || booking.combo?.name
        || '';
}

function guestName(booking, fallback) {
    return booking.guestRegistration?.leadGuest?.fullName || booking.customer?.name || fallback;
}

export default function VendorHubScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigation = useNavigation();
    const [bookings, setBookings] = useState([]);
    const [kyc, setKyc] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [listings, setListings] = useState([]);
    const [reviews, setReviews] = useState({ items: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const role = user?.role;

    const load = useCallback(() => {
        Promise.all([
            vendorBookings().catch(() => []),
            getMyKyc().catch(() => null),
            getWallet().catch(() => null),
            getMySubscription().catch(() => null),
            role ? fetchMyVendorListings(role).catch(() => []) : Promise.resolve([]),
            fetchVendorReviews({ page: 1, limit: 100 }).catch(() => ({ items: [], total: 0 })),
        ]).then(([rows, kycDoc, walletDoc, subDoc, listingRows, reviewDoc]) => {
            setBookings(Array.isArray(rows) ? rows : []);
            setKyc(kycDoc);
            setWallet(walletDoc);
            setSubscription(subDoc);
            setListings(Array.isArray(listingRows) ? listingRows : []);
            setReviews(reviewDoc && Array.isArray(reviewDoc.items) ? reviewDoc : { items: [], total: 0 });
        }).finally(() => setLoading(false));
    }, [role]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));
    useReconnect(load);

    if (loading) return <Loading />;

    const today = startOfDay(new Date());
    const month = today.getMonth();
    const year = today.getFullYear();
    const paid = bookings.filter((booking) => booking.paymentStatus === 'PAID' && !CLOSED_STATUSES.includes(booking.status));
    const paidThisMonth = paid.filter((booking) => {
        const created = new Date(booking.createdAt || booking.checkIn);
        return !Number.isNaN(created.getTime()) && created.getMonth() === month && created.getFullYear() === year;
    });
    const awaiting = bookings.filter((booking) => booking.paymentStatus === 'PENDING' && OPEN_STATUSES.includes(booking.status));
    const pending = bookings.filter((booking) => booking.status === 'PENDING');
    const confirmed = bookings.filter((booking) => booking.status === 'CONFIRMED');
    const completed = bookings.filter((booking) => booking.status === 'COMPLETED').length;
    const cancelled = bookings.filter((booking) => CLOSED_STATUSES.includes(booking.status)).length;
    const scheduled = bookings
        .map((booking) => ({ booking, day: startOfDay(booking.checkIn || booking.createdAt) }))
        .filter((row) => row.day && OPEN_STATUSES.includes(row.booking.status));
    const todayCount = scheduled.filter((row) => row.day.getTime() === today.getTime()).length;
    const upcomingCount = scheduled.filter((row) => row.day.getTime() > today.getTime()).length;
    const comingUp = scheduled
        .filter((row) => row.day.getTime() >= today.getTime())
        .sort((a, b) => a.day - b.day)
        .slice(0, 4);
    const liveListings = listings.filter((item) => listingStatusOf(item) === 'APPROVED').length;
    const waitingListings = listings.filter((item) => listingStatusOf(item) === 'PENDING').length;
    const reviewItems = reviews.items || [];
    const reviewTotal = Number(reviews.total) || reviewItems.length;
    const rating = reviewItems.length
        ? Math.round((reviewItems.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) / reviewItems.length) * 10) / 10
        : null;
    const balance = wallet?.user?.walletBalance ?? subscription?.walletBalance ?? 0;
    const points = wallet?.user?.pointBalance ?? subscription?.pointBalance ?? 0;
    const kycStatus = String(kyc?.status || 'PENDING').toUpperCase();
    const awaitingAmount = moneyOf(awaiting);

    const alerts = [
        pending.length ? { key: 'pending', text: t('vendor.pendingBookingsNote', { count: pending.length }), onPress: () => navigation.navigate('Bookings'), tone: 'warn' } : null,
        kycStatus === 'REJECTED' ? { key: 'kyc', text: t('vendor.kycRejectedNote'), onPress: () => navigation.navigate('VendorKyc'), tone: 'bad' } : null,
        kycStatus !== 'APPROVED' && kycStatus !== 'REJECTED' ? { key: 'kyc', text: t('vendor.kycPendingNote'), onPress: () => navigation.navigate('VendorKyc'), tone: 'warn' } : null,
        waitingListings ? { key: 'listings', text: t('vendor.listingsWaiting', { count: waitingListings }), onPress: () => navigation.navigate('VendorListings'), tone: 'info' } : null,
    ].filter(Boolean);

    const manage = [
        { title: t(LISTING_LABEL[role] || 'vendor.listings'), Icon: LISTING_ICON[role] || Building2, onPress: () => navigation.navigate('VendorListings') },
        { title: t('vendor.pricing'), Icon: Tag, onPress: () => navigation.navigate('VendorPricing') },
        { title: t('nav.bookings'), Icon: Calendar, onPress: () => navigation.navigate('Bookings') },
        AVAILABILITY_ROLES.includes(role) ? { title: t('vendor.availability'), Icon: CalendarDays, onPress: () => navigation.navigate('VendorAvailability') } : null,
        STAY_SUBSCRIPTION.includes(role) || SERVICE_SUBSCRIPTION.includes(role)
            ? { title: STAY_SUBSCRIPTION.includes(role) ? t('staySubscription.nav') : t('serviceSubscription.title'), Icon: CreditCard, onPress: () => navigation.navigate('VendorSubscription') }
            : null,
        AD_ROLES.includes(role) ? { title: t('vendorAds.nav'), Icon: Megaphone, onPress: () => navigation.navigate('VendorAds') } : null,
        { title: t('vendor.reviews'), Icon: Star, onPress: () => navigation.navigate('VendorReviews') },
        { title: t('nav.wallet'), Icon: Wallet, onPress: () => navigation.navigate('Wallet') },
        { title: t('nav.kyc'), Icon: FileText, onPress: () => navigation.navigate('VendorKyc') },
    ].filter(Boolean);

    const openBookings = () => navigation.navigate('Bookings');
    const openWallet = () => navigation.navigate('Wallet');
    const moneyTiles = [
        { key: 'all', label: t('vendor.allTime'), value: formatCurrency(moneyOf(paid)), onPress: openBookings },
        { key: 'wait', label: t('vendor.awaitingPayment'), value: formatCurrency(awaitingAmount), onPress: openBookings },
        { key: 'balance', label: t('vendor.balance'), value: formatCurrency(balance), onPress: openWallet },
        { key: 'points', label: t('vendor.pointsShort'), value: String(points), onPress: openWallet },
    ];
    const bookingStats = [
        { key: 'today', label: t('vendor.today'), value: String(todayCount), hint: `${t('vendor.upcoming')} · ${upcomingCount}` },
        { key: 'pending', label: t('vendor.pending'), value: String(pending.length), hot: pending.length > 0 },
        { key: 'confirmed', label: t('vendor.confirmed'), value: String(confirmed.length) },
        { key: 'completed', label: t('vendor.completed'), value: String(completed), hint: `${t('vendor.cancelled')} · ${cancelled}` },
    ];

    return (
        <Screen style={styles.screen}>
            <HomeHeader navigation={navigation}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
                <View style={styles.band}>
                    <Text style={styles.pageTitle}>{t(DASH_TITLE[role] || 'vendor.overview')}</Text>
                    <Text style={styles.monthLabel}>{t('vendor.thisMonth')} · {t('vendor.collected')}</Text>
                    <Text style={styles.monthValue}>{formatCurrency(moneyOf(paidThisMonth))}</Text>
                </View>

                <View style={styles.body}>
                    {alerts.length ? (
                        <View style={styles.listCard}>
                            <Text style={styles.cardTitle}>{t('vendor.needsAction')}</Text>
                            {alerts.map((alert, index) => (
                                <Pressable
                                    key={alert.key}
                                    onPress={alert.onPress}
                                    style={[styles.menu, index < alerts.length - 1 && styles.menuBorder]}
                                >
                                    <Text style={styles.menuText}>{alert.text}</Text>
                                    <Text style={styles.chevron}>›</Text>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}

                    <View style={styles.tileGrid}>
                        {moneyTiles.map((tile) => (
                            <Pressable key={tile.key} style={styles.tileWrap} onPress={tile.onPress}>
                                <View style={styles.tile}>
                                    <Text style={styles.tileLabel} numberOfLines={1}>{tile.label}</Text>
                                    <Text style={styles.tileValue} numberOfLines={1}>{tile.value}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.listCard}>
                        <Text style={styles.cardTitle}>{t('nav.bookings')}</Text>
                        <View style={styles.statRow}>
                            {bookingStats.map((stat) => (
                                <Pressable key={stat.key} style={[styles.stat, stat.hot && styles.statHot]} onPress={openBookings}>
                                    <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
                                    <Text style={[styles.statValue, stat.hot && styles.statValueHot]}>{stat.value}</Text>
                                    <Text style={styles.statHint} numberOfLines={2}>{stat.hint || ' '}</Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.listCard}>
                        <Text style={styles.cardTitle}>{t('vendor.business')}</Text>
                        <View style={styles.health}>
                            <Pressable style={styles.healthCell} onPress={() => navigation.navigate('VendorListings')}>
                                <Text style={styles.healthValue}>{liveListings}</Text>
                                <Text style={styles.healthLabel}>{t('vendor.liveListings')}</Text>
                            </Pressable>
                            <Pressable style={styles.healthCell} onPress={() => navigation.navigate('VendorReviews')}>
                                <Text style={styles.healthValue}>{rating == null ? '—' : rating.toFixed(1)}</Text>
                                <Text style={styles.healthLabel}>{rating == null ? t('vendor.noReviewsYet') : t('vendor.reviewsCount', { count: reviewTotal })}</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.listCard}>
                        <Text style={styles.cardTitle}>{t('vendor.nextUp')}</Text>
                        {!comingUp.length ? <Text style={styles.empty}>{t('vendor.noUpcoming')}</Text> : comingUp.map(({ booking, day }, index) => (
                            <Pressable key={booking._id} onPress={openBookings} style={[styles.row, index < comingUp.length - 1 && styles.menuBorder]}>
                                <View style={styles.dateBox}>
                                    <Text style={styles.dateDay}>{day.getDate()}</Text>
                                    <Text style={styles.dateMonth}>{day.toLocaleDateString('en-IN', { month: 'short' })}</Text>
                                </View>
                                <View style={styles.rowBody}>
                                    <Text style={styles.rowTitle} numberOfLines={1}>{guestName(booking, t('vendor.guest'))}</Text>
                                    <Text style={styles.rowMeta} numberOfLines={1}>{listingName(booking) || booking.type}</Text>
                                </View>
                                <View style={[styles.pill, booking.status === 'PENDING' ? styles.pillWarn : styles.pillOk]}>
                                    <Text style={[styles.pillText, booking.status === 'PENDING' ? styles.pillTextWarn : styles.pillTextOk]}>
                                        {t(booking.status === 'PENDING' ? 'vendor.pending' : 'vendor.confirmed')}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <View style={styles.listCard}>
                        <Text style={styles.cardTitle}>{t('vendor.manage')}</Text>
                        {Array.from({ length: Math.ceil(manage.length / 3) }, (_, rowIndex) => {
                            const row = manage.slice(rowIndex * 3, rowIndex * 3 + 3);
                            return (
                                <View key={row[0].title} style={[styles.manageRow, rowIndex > 0 && styles.manageTileTop]}>
                                    {row.map((item, index) => {
                                        const Icon = item.Icon;
                                        return (
                                            <Pressable
                                                key={item.title}
                                                onPress={item.onPress}
                                                style={[styles.manageTile, index < row.length - 1 && styles.manageTileRight]}
                                            >
                                                <Icon size={22} color={COLORS.primary} strokeWidth={2} />
                                                <Text style={styles.manageLabel} numberOfLines={2}>{item.title}</Text>
                                            </Pressable>
                                        );
                                    })}
                                    {Array.from({ length: 3 - row.length }, (_, spacer) => (
                                        <View key={`spacer-${spacer}`} style={styles.manageTile} />
                                    ))}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
            </HomeHeader>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    scroll: { flex: 1 },
    page: { paddingBottom: 16 },
    band: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 18 },
    pageTitle: { fontFamily: FONTS.bold, fontSize: 26, color: '#fff', letterSpacing: -0.4, marginTop: 4 },
    monthLabel: { fontFamily: FONTS.medium, fontSize: 13, color: '#DBEAFE', marginTop: 14 },
    monthValue: { fontFamily: FONTS.bold, fontSize: 32, color: '#fff', letterSpacing: -0.6, marginTop: 2 },
    body: { paddingHorizontal: 16, paddingTop: 16 },
    listCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 0, overflow: 'hidden', marginBottom: 16 },
    cardTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menu: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    menuText: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text, marginRight: 8 },
    chevron: { fontFamily: FONTS.semibold, fontSize: 22, color: COLORS.muted },
    tileGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 8 },
    tileWrap: { width: '50%', padding: 4 },
    tile: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 0, paddingHorizontal: 12, paddingVertical: 12, minHeight: 72 },
    tileLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.muted },
    tileValue: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.primary, marginTop: 4 },
    statRow: { flexDirection: 'row', gap: 6, padding: 12 },
    stat: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 0, paddingHorizontal: 6, paddingVertical: 10, minHeight: 84 },
    statHot: { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' },
    statLabel: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.muted },
    statValue: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.primary, marginTop: 2 },
    statValueHot: { color: COLORS.warning },
    statHint: { fontFamily: FONTS.regular, fontSize: 10, color: '#64748B', marginTop: 2 },
    health: { flexDirection: 'row', gap: 8, padding: 12 },
    healthCell: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 0, padding: 14 },
    healthValue: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
    healthLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 4 },
    empty: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
    dateBox: { width: 46, alignItems: 'center', marginRight: 10 },
    dateDay: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.primary, lineHeight: 20 },
    dateMonth: { fontFamily: FONTS.medium, fontSize: 11, color: '#64748B', textTransform: 'uppercase' },
    rowBody: { flex: 1, marginRight: 8 },
    rowTitle: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    rowMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 2 },
    pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
    pillWarn: { backgroundColor: '#FFEDD5' },
    pillOk: { backgroundColor: '#DCFCE7' },
    pillText: { fontFamily: FONTS.semibold, fontSize: 11 },
    pillTextWarn: { color: '#9A3412' },
    pillTextOk: { color: '#166534' },
    manageRow: { flexDirection: 'row' },
    manageTile: {
        flex: 1,
        minHeight: 96,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 14,
    },
    manageTileRight: { borderRightWidth: 1, borderRightColor: COLORS.border },
    manageTileTop: { borderTopWidth: 1, borderTopColor: COLORS.border },
    manageLabel: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text, textAlign: 'center', marginTop: 8 },
});
