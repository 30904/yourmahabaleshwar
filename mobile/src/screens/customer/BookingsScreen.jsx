import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { isNetworkError } from '../../api/network';
import { useReconnect } from '../../api/useReconnect';
import { useTranslation } from 'react-i18next';
import { createPaymentOrder, myBookings, vendorBookings, verifyPayment } from '../../api/endpoints';
import { Button, Loading, Screen } from '../../components/ui';
import { Car, Home, Hotel, Tent, Trees, Users } from '../../components/home/icons';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { bookingTitle } from '../../utils/listing';
import { checkoutHtml, openWebCheckout, usesMockRazorpay } from '../../services/razorpayCheckout';
import { STATUS_TONE, bookingGroup, bookingImage, stayDate } from './bookingModel';

const FILTERS = [
    { id: 'upcoming', labelKey: 'booking.upcoming' },
    { id: 'completed', labelKey: 'booking.completed' },
    { id: 'cancelled', labelKey: 'booking.cancelled' },
];

const TYPE_ICON = {
    HOTEL: Hotel,
    RESORT: Hotel,
    HOMESTAY: Home,
    TENT: Tent,
    GUIDE: Users,
    TAXI: Car,
    DRIVER: Car,
    HORSE: Trees,
};

function StatusBadge({ status }) {
    const tone = STATUS_TONE[status] || STATUS_TONE.REFUNDED;
    return (
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>{status}</Text>
        </View>
    );
}

export default function BookingsScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { isVendor, user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [checkout, setCheckout] = useState(null);
    const [filter, setFilter] = useState('upcoming');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = isVendor ? await vendorBookings() : await myBookings();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            if (!isNetworkError(error)) setItems([]);
        } finally {
            setLoading(false);
        }
    }, [isVendor]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));
    useReconnect(load);

    const recordPayment = async (payment, response) => {
        await verifyPayment({
            paymentId: payment._id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
        });
        Alert.alert(t('booking.paid'));
        load();
    };

    const pay = async (b) => {
        try {
            const { order, payment, keyId } = await createPaymentOrder(b._id);
            if (usesMockRazorpay({ order, keyId })) {
                if (!__DEV__) {
                    Alert.alert(t('common.error'), t('booking.paymentUnavailable'));
                    return;
                }
                await verifyPayment({
                    paymentId: payment._id,
                    razorpayPaymentId: `pay_mock_${Date.now()}`,
                    razorpayOrderId: order.id,
                    razorpaySignature: `mock_sig_${Date.now()}`,
                });
                Alert.alert(t('booking.mockPaid'));
                load();
                return;
            }
            const details = { keyId, order, bookingNumber: b.bookingNumber, user };
            if (Platform.OS === 'web') {
                const response = await openWebCheckout(details);
                await recordPayment(payment, response);
                return;
            }
            setCheckout({ ...details, payment });
        } catch (e) {
            if (e?.message === 'CANCELLED') {
                Alert.alert(t('booking.paymentCancelled'));
                return;
            }
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
    };

    const onCheckoutMessage = async (event) => {
        const current = checkout;
        setCheckout(null);
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (!data.ok) {
                Alert.alert(t('booking.paymentCancelled'));
                return;
            }
            await recordPayment(current.payment, data.response);
        } catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
    };

    const visible = items.filter((item) => bookingGroup(item) === filter);
    const count = visible.length;
    const countKey = filter === 'completed' ? 'Completed' : filter === 'cancelled' ? 'Cancelled' : 'Upcoming';

    if (loading && !items.length) return <Loading />;

    return (
        <Screen style={{ padding: 0 }}>
            <FlatList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                data={visible}
                keyExtractor={(item) => item._id}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                ListHeaderComponent={(
                    <View>
                        <View style={styles.band}>
                            <View style={styles.bandRow}>
                                <Text style={styles.pageTitle}>{t('nav.bookings')}</Text>
                                <View style={styles.countPill}>
                                    <Text style={styles.countPillText}>{t(`booking.pill${countKey}`, { count })}</Text>
                                </View>
                            </View>
                            <Text style={styles.countLine}>{t(count === 1 ? `booking.line${countKey}One` : `booking.line${countKey}`, { count })}</Text>
                        </View>
                        <View style={styles.filters}>
                            {FILTERS.map((item) => {
                                const on = item.id === filter;
                                return (
                                    <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.chip, on && styles.chipOn]}>
                                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{t(item.labelKey)}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                )}
                ListEmptyComponent={(
                    <Text style={styles.emptyText}>{items.length ? t('booking.emptyFilter') : t('booking.noBookings')}</Text>
                )}
                renderItem={({ item }) => {
                    const dates = [stayDate(item.checkIn), stayDate(item.checkOut)].filter(Boolean).join(' – ');
                    const image = bookingImage(item);
                    const Icon = TYPE_ICON[item.type] || Hotel;
                    return (
                        <View style={styles.card}>
                            <Pressable style={styles.cardMain} onPress={() => navigation.navigate('BookingDetail', { id: item._id })}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.thumb} />
                                ) : (
                                    <View style={styles.thumbFallback}>
                                        <Icon size={26} color={COLORS.primary} strokeWidth={2} />
                                    </View>
                                )}
                                <View style={styles.body}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.name} numberOfLines={1}>{bookingTitle(item)}</Text>
                                        <StatusBadge status={item.status} />
                                    </View>
                                    <View style={styles.dateRow}>
                                        <Text style={styles.dates} numberOfLines={1}>{dates || item.type}</Text>
                                        <Text style={styles.price}>{formatCurrency(item.total)}</Text>
                                    </View>
                                    <View style={styles.refRow}>
                                        <Text style={[styles.ref, !isVendor && item.paymentStatus === 'PENDING' && styles.refWithPay]} numberOfLines={1}>{item.bookingNumber || item._id}</Text>
                                    </View>
                                </View>
                            </Pressable>
                            {!isVendor && item.paymentStatus === 'PENDING' ? (
                                <Pressable style={styles.pay} onPress={() => pay(item)}>
                                    <Text style={styles.payText}>{t('booking.payNow')}</Text>
                                </Pressable>
                            ) : null}
                        </View>
                    );
                }}
            />
            <Modal visible={!!checkout} animationType="slide" onRequestClose={() => setCheckout(null)}>
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <Button title={t('common.cancel')} variant="outline" onPress={() => setCheckout(null)} />
                    {checkout ? (
                        <WebView
                            originWhitelist={['*']}
                            source={{ html: checkoutHtml(checkout) }}
                            onMessage={onCheckoutMessage}
                            javaScriptEnabled
                        />
                    ) : null}
                </View>
            </Modal>
        </Screen>
    );
}

const styles = StyleSheet.create({
    band: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.primary,
    },
    bandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pageTitle: {
        flex: 1,
        fontFamily: FONTS.bold,
        fontSize: 26,
        color: '#fff',
        letterSpacing: -0.4,
    },
    countPill: {
        backgroundColor: '#fff',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    countPillText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    countLine: { fontFamily: FONTS.regular, fontSize: 14, color: '#DBEAFE', marginTop: 4 },
    filters: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4, paddingHorizontal: 16 },
    chip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.body },
    chipTextOn: { fontFamily: FONTS.semibold, color: '#fff' },
    list: { flex: 1 },
    listContent: { paddingBottom: 24 },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 15,
        color: COLORS.muted,
        textAlign: 'center',
        marginTop: 28,
        paddingHorizontal: 16,
    },
    card: {
        position: 'relative',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginTop: 12,
        marginHorizontal: 16,
    },
    cardMain: { flexDirection: 'row', gap: 12 },
    thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: COLORS.primarySoft },
    thumbFallback: {
        width: 72,
        height: 72,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    dates: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
    price: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    refRow: { marginTop: 4 },
    ref: { fontFamily: FONTS.medium, fontSize: 11, color: '#94A3B8' },
    refWithPay: { marginRight: 118 },
    badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 10, letterSpacing: 0.2 },
    pay: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
    },
    payText: { fontFamily: FONTS.semibold, fontSize: 11, color: '#fff' },
});
