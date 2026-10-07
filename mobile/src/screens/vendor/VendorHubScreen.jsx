import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { fetchMyVendorListings, fetchVendorReviews, getMyKyc, getMySubscription, getWallet, vendorBookings } from '../../api/endpoints';
import HomeHeader from '../../components/home/HomeHeader';
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

function greetingKey(date = new Date()) {
    const hour = date.getHours();
    if (hour < 12) return 'vendor.goodMorning';
    if (hour < 17) return 'vendor.goodAfternoon';
    return 'vendor.goodEvening';
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
    const displayName = String(user?.name || '').trim();
    const awaitingAmount = moneyOf(awaiting);

    const alerts = [
        pending.length ? { key: 'pending', text: t('vendor.pendingBookingsNote', { count: pending.length }), onPress: () => navigation.navigate('Bookings'), tone: 'warn' } : null,
        kycStatus === 'REJECTED' ? { key: 'kyc', text: t('vendor.kycRejectedNote'), onPress: () => navigation.navigate('VendorKyc'), tone: 'bad' } : null,
        kycStatus !== 'APPROVED' && kycStatus !== 'REJECTED' ? { key: 'kyc', text: t('vendor.kycPendingNote'), onPress: () => navigation.navigate('VendorKyc'), tone: 'warn' } : null,
        waitingListings ? { key: 'listings', text: t('vendor.listingsWaiting', { count: waitingListings }), onPress: () => navigation.navigate('VendorListings'), tone: 'info' } : null,
    ].filter(Boolean);

    const manage = [
        { title: t(LISTING_LABEL[role] || 'vendor.listings'), onPress: () => navigation.navigate('VendorListings') },
        { title: t('vendor.pricing'), onPress: () => navigation.navigate('VendorPricing') },
        { title: t('nav.bookings'), onPress: () => navigation.navigate('Bookings') },
        AVAILABILITY_ROLES.includes(role) ? { title: t('vendor.availability'), onPress: () => navigation.navigate('VendorAvailability') } : null,
        STAY_SUBSCRIPTION.includes(role) || SERVICE_SUBSCRIPTION.includes(role)
            ? { title: STAY_SUBSCRIPTION.includes(role) ? t('staySubscription.nav') : t('serviceSubscription.title'), onPress: () => navigation.navigate('VendorSubscription') }
            : null,
        AD_ROLES.includes(role) ? { title: t('vendorAds.nav'), onPress: () => navigation.navigate('VendorAds') } : null,
        { title: t('vendor.reviews'), onPress: () => navigation.navigate('VendorReviews') },
        { title: t('nav.wallet'), onPress: () => navigation.navigate('Wallet') },
        { title: t('nav.kyc'), onPress: () => navigation.navigate('VendorKyc') },
    ].filter(Boolean);

    return (
        <Screen style={styles.screen}>
            <HomeHeader navigation={navigation}>
            <ScrollView style={styles.scroll} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
                <Text style={styles.hello}>{t(greetingKey())}{displayName ? `, ${displayName}` : ''}</Text>
                <Text style={styles.pageTitle}>{t(DASH_TITLE[role] || 'vendor.overview')}</Text>

                {alerts.length ? (
                    <View style={styles.alerts}>
                        <Text style={styles.section}>{t('vendor.needsAction')}</Text>
                        {alerts.map((alert) => (
                            <Pressable key={alert.key} onPress={alert.onPress} style={[styles.alert, styles[`alert_${alert.tone}`]]}>
                                <Text style={[styles.alertText, styles[`alertText_${alert.tone}`]]}>{alert.text}</Text>
                                <Text style={[styles.chevron, styles[`alertText_${alert.tone}`]]}>›</Text>
                            </Pressable>
                        ))}
                    </View>
                ) : null}

                <Pressable onPress={() => navigation.navigate('Wallet')} style={styles.hero}>
                    <Text style={styles.heroLabel}>{t('vendor.thisMonth')} · {t('vendor.collected')}</Text>
                    <Text style={styles.heroValue}>{formatCurrency(moneyOf(paidThisMonth))}</Text>
                    <Text style={styles.heroSub}>{t('vendor.allTime')} {formatCurrency(moneyOf(paid))}</Text>
                    {awaitingAmount > 0 ? <Text style={styles.heroWait}>{t('vendor.awaitingPayment')} {formatCurrency(awaitingAmount)}</Text> : null}
                    <View style={styles.heroSplit}>
                        <View style={styles.heroCell}>
                            <Text style={styles.heroCellLabel}>{t('vendor.balance')}</Text>
                            <Text style={styles.heroCellValue}>{formatCurrency(balance)}</Text>
                        </View>
                        <View style={styles.heroDivider} />
                        <View style={styles.heroCell}>
                            <Text style={styles.heroCellLabel}>{t('vendor.pointsShort')}</Text>
                            <Text style={styles.heroCellValue}>{points}</Text>
                        </View>
                    </View>
                </Pressable>

                <Text style={styles.section}>{t('nav.bookings')}</Text>
                <View style={styles.grid}>
                    <Kpi label={t('vendor.today')} value={String(todayCount)} hint={t('vendor.upcoming')} hintValue={String(upcomingCount)} onPress={() => navigation.navigate('Bookings')} />
                    <Kpi label={t('vendor.pending')} value={String(pending.length)} hot={pending.length > 0} onPress={() => navigation.navigate('Bookings')} />
                    <Kpi label={t('vendor.confirmed')} value={String(confirmed.length)} onPress={() => navigation.navigate('Bookings')} />
                    <Kpi label={t('vendor.completed')} value={String(completed)} hint={t('vendor.cancelled')} hintValue={String(cancelled)} onPress={() => navigation.navigate('Bookings')} />
                </View>

                <Text style={styles.section}>{t('vendor.business')}</Text>
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

                <Text style={styles.section}>{t('vendor.nextUp')}</Text>
                <View style={styles.listCard}>
                    {!comingUp.length ? <Text style={styles.empty}>{t('vendor.noUpcoming')}</Text> : comingUp.map(({ booking, day }) => (
                        <Pressable key={booking._id} onPress={() => navigation.navigate('Bookings')} style={styles.row}>
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

                <Text style={styles.section}>{t('vendor.manage')}</Text>
                <View style={styles.grid}>
                    {manage.map((item) => (
                        <Pressable key={item.title} onPress={item.onPress} style={styles.manageItem}>
                            <View style={styles.manageCard}>
                                <Text style={styles.manageText}>{item.title}</Text>
                                <Text style={styles.chevron}>›</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
            </HomeHeader>
        </Screen>
    );
}

function Kpi({ label, value, hint, hintValue, hot, onPress }) {
    return (
        <Pressable onPress={onPress} style={styles.kpi}>
            <View style={[styles.kpiCard, hot && styles.kpiCardHot]}>
                <Text style={styles.kpiLabel}>{label}</Text>
                <Text style={[styles.kpiValue, hot && styles.kpiValueHot]}>{value}</Text>
                {hint ? <Text style={styles.kpiHint}>{hint} · {hintValue}</Text> : <Text style={styles.kpiHint}> </Text>}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    scroll: { flex: 1 },
    page: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    hello: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.muted },
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4, marginTop: 2, marginBottom: 14 },
    section: { fontFamily: FONTS.semibold, fontSize: 13, color: '#64748B', letterSpacing: 0.3, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
    alerts: { marginBottom: 12 },
    alert: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
    alert_warn: { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' },
    alert_bad: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
    alert_info: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
    alertText: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, lineHeight: 20 },
    alertText_warn: { color: '#9A3412' },
    alertText_bad: { color: '#991B1B' },
    alertText_info: { color: '#1E40AF' },
    hero: { backgroundColor: '#DBEAFE', borderWidth: 1, borderColor: '#93C5FD', borderRadius: 18, padding: 18, marginBottom: 16 },
    heroLabel: { fontFamily: FONTS.medium, fontSize: 13, color: '#1E3A8A' },
    heroValue: { fontFamily: FONTS.bold, fontSize: 32, color: COLORS.text, marginTop: 4, letterSpacing: -0.6 },
    heroSub: { fontFamily: FONTS.regular, fontSize: 13, color: '#1E3A8A', marginTop: 4 },
    heroWait: { fontFamily: FONTS.semibold, fontSize: 13, color: '#B45309', marginTop: 8 },
    heroSplit: { flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#93C5FD' },
    heroCell: { flex: 1 },
    heroDivider: { width: 1, backgroundColor: '#93C5FD', marginHorizontal: 12 },
    heroCellLabel: { fontFamily: FONTS.regular, fontSize: 12, color: '#1E3A8A' },
    heroCellValue: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginTop: 2 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5, marginBottom: 8 },
    kpi: { width: '50%', padding: 5 },
    kpiCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, minHeight: 92 },
    kpiCardHot: { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' },
    kpiLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.muted },
    kpiValue: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.primary, marginTop: 2 },
    kpiValueHot: { color: COLORS.warning },
    kpiHint: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 2 },
    health: { flexDirection: 'row', marginHorizontal: -5, marginBottom: 12 },
    healthCell: { flex: 1, marginHorizontal: 5, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14 },
    healthValue: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
    healthLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 4 },
    listCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, marginBottom: 14, overflow: 'hidden' },
    empty: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, padding: 16 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
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
    manageItem: { width: '50%', padding: 5 },
    manageCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 16, minHeight: 64 },
    manageText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary, flex: 1 },
    chevron: { fontFamily: FONTS.semibold, fontSize: 20, color: COLORS.muted, marginLeft: 6 },
});
