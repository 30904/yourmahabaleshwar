import React, { useCallback, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
    confirmServiceArrival,
    confirmServiceEnd,
    createPaymentOrder,
    downloadInvoice,
    myBookings,
    refundPreview,
    requestRefund,
    updateBookingStatus,
    vendorBookings,
    vendorMarkArrived,
    vendorProposeEnd,
    verifyPayment,
} from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { checkoutHtml, openWebCheckout, usesMockRazorpay } from '../../services/razorpayCheckout';
import { formatCurrency } from '../../utils/format';
import { bookingTitle } from '../../utils/listing';
import { canCustomerEditBooking } from '../../utils/bookingEdit';
import {
    OVERTIME_PER_HOUR,
    STATUS_TONE,
    activeTrip,
    arrivalOk,
    bookingImage,
    endProposed,
    ended,
    hasArrived,
    isTrip,
    stayDate,
    when,
} from './bookingModel';

function StatusBadge({ status }) {
    const tone = STATUS_TONE[status] || STATUS_TONE.REFUNDED;
    return (
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
            <Text style={[styles.badgeText, { color: tone.fg }]}>{status}</Text>
        </View>
    );
}

export default function BookingDetailScreen({ route }) {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { isVendor, user } = useAuth();
    const id = route.params?.id;
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkout, setCheckout] = useState(null);
    const [endBookingId, setEndBookingId] = useState(null);
    const [overtimeHours, setOvertimeHours] = useState('0');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = isVendor ? await vendorBookings() : await myBookings();
            const list = Array.isArray(data) ? data : [];
            setItem(list.find((row) => String(row._id) === String(id)) || null);
        } catch {
            setItem(null);
        } finally {
            setLoading(false);
        }
    }, [id, isVendor]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));

    const openEdit = (b) => {
        const serviceType = b.serviceTenant && ['GUIDE', 'TAXI', 'DRIVER', 'HORSE'].includes(b.serviceTenant)
            ? b.serviceTenant
            : (['GUIDE', 'TAXI', 'HORSE'].includes(b.type) ? b.type : null);
        if (serviceType && !b.guide && !b.horse && !(b.serviceTenant === 'TAXI' && b.driver) && !(b.serviceTenant === 'DRIVER' && b.driver)) {
            navigation.navigate('ServiceBook', { type: serviceType, editBooking: b });
            return;
        }
        if (serviceType) {
            navigation.navigate('ServiceBook', { type: serviceType, editBooking: b });
            return;
        }
        const listing = b.hotel || b.homestay || b.tent;
        const path = b.homestay ? '/homestays' : b.tent ? '/tents' : '/hotels';
        if (!listing?.slug) {
            Alert.alert(t('common.error'), t('booking.editUnavailable'));
            return;
        }
        navigation.navigate('ListingDetail', { path, slug: listing.slug, type: b.type, editBooking: b });
    };

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

    const openInvoice = async (b) => {
        try {
            await downloadInvoice(b._id);
        } catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message || t('booking.invoiceFailed'));
        }
    };

    const askRefund = async (b) => {
        try {
            const preview = await refundPreview(b._id);
            Alert.alert(
                t('booking.refund'),
                t('booking.refundPreview', { amount: formatCurrency(preview.amount), type: preview.type }),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('common.continue'),
                        onPress: async () => {
                            try {
                                await requestRefund(b._id, 'Customer cancellation');
                                Alert.alert(t('booking.refundSent'));
                                load();
                            } catch (e) {
                                Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                            }
                        },
                    },
                ]
            );
        } catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
    };

    if (loading && !item) return <Loading />;
    if (!item) {
        return (
            <Screen>
                <Text style={styles.empty}>{t('booking.noBookings')}</Text>
            </Screen>
        );
    }

    const dates = [stayDate(item.checkIn), stayDate(item.checkOut)].filter(Boolean).join(' – ');
    const guest = item.guestRegistration?.leadGuest;
    const guestBits = [
        guest?.mobile,
        item.guests?.adults != null ? `${item.guests.adults} ${t('booking.adults')}` : '',
        item.guests?.children ? `${item.guests.children} ${t('booking.children')}` : '',
    ].filter(Boolean);
    const image = bookingImage(item);

    return (
        <Screen style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
            <ScrollView contentContainerStyle={styles.page}>
                {image ? <Image source={{ uri: image }} style={styles.hero} /> : null}
                <View style={styles.top}>
                    <Text style={styles.title}>{bookingTitle(item)}</Text>
                    <StatusBadge status={item.status} />
                </View>
                <Text style={styles.meta}>{[item.type, dates].filter(Boolean).join(' · ')}</Text>
                <Text style={styles.ref}>{item.bookingNumber || item._id}</Text>
                <Text style={styles.total}>{formatCurrency(item.total)}</Text>

                {item.refundStatus && item.refundStatus !== 'NONE' ? (
                    <Muted>
                        {t('booking.refundStatus')}: {item.refundStatus}
                        {item.refundAmount ? ` · ${formatCurrency(item.refundAmount)}` : ''}
                    </Muted>
                ) : null}
                {isTrip(item) && hasArrived(item) && !arrivalOk(item) ? <Muted>{t('booking.statusVendorArrived')}</Muted> : null}
                {isTrip(item) && arrivalOk(item) && !endProposed(item) && !ended(item) ? (
                    <Muted>
                        {t('booking.statusArrivalConfirmed')}
                        {(item.arrivalConfirmedAt || item.guideReachedAt) ? ` · ${when(item.arrivalConfirmedAt || item.guideReachedAt)}` : ''}
                    </Muted>
                ) : null}
                {isTrip(item) && endProposed(item) ? (
                    <Muted>
                        {t('booking.statusEndProposed')}
                        {item.overtimeHours > 0
                            ? ` · ${t('booking.overtimeSummary', { hours: item.overtimeHours, amount: formatCurrency(item.overtimeAmount || 0) })}`
                            : ` · ${t('booking.noOvertime')}`}
                    </Muted>
                ) : null}
                {isTrip(item) && ended(item) ? (
                    <Muted>
                        {t('booking.statusEnded')}
                        {(item.serviceEndedAt || item.guideEndedAt) ? ` · ${when(item.serviceEndedAt || item.guideEndedAt)}` : ''}
                        {item.overtimeHours > 0
                            ? ` · ${t('booking.overtimeSummary', { hours: item.overtimeHours, amount: formatCurrency(item.overtimeAmount || 0) })}`
                            : ''}
                    </Muted>
                ) : null}

                {guest?.fullName ? (
                    <Card style={styles.guestCard}>
                        <Text style={styles.section}>{t('booking.guest')}</Text>
                        <Text style={styles.guestName}>{guest.fullName}</Text>
                        {guestBits.length ? <Text style={styles.guestMeta}>{guestBits.join(' · ')}</Text> : null}
                    </Card>
                ) : null}

                <View style={styles.actions}>
                    {!isVendor && canCustomerEditBooking(item) ? (
                        <Button title={t('booking.editBooking')} variant="outline" onPress={() => openEdit(item)} />
                    ) : null}
                    {!isVendor && item.paymentStatus === 'PENDING' ? (
                        <Button title={t('booking.payNow')} onPress={() => pay(item)} style={styles.pay} />
                    ) : null}
                    {isVendor && activeTrip(item) && !hasArrived(item) ? (
                        <Button
                            title={t('booking.vendorArrivedButton')}
                            onPress={() => {
                                Alert.alert(t('booking.vendorArrivedButton'), t('booking.vendorArrivedAsk'), [
                                    { text: t('common.cancel'), style: 'cancel' },
                                    {
                                        text: t('common.continue'),
                                        onPress: async () => {
                                            try {
                                                await vendorMarkArrived(item._id);
                                                Alert.alert(t('booking.vendorArrivedSuccess'));
                                                load();
                                            } catch (e) {
                                                Alert.alert(t('common.error'), e.response?.data?.message || t('booking.vendorArrivedFailed'));
                                            }
                                        },
                                    },
                                ]);
                            }}
                        />
                    ) : null}
                    {!isVendor && activeTrip(item) && hasArrived(item) && !arrivalOk(item) ? (
                        <Button
                            title={t('booking.confirmArrivalButton')}
                            onPress={() => {
                                Alert.alert(t('booking.confirmArrivalButton'), t('booking.confirmArrivalAsk'), [
                                    { text: t('common.cancel'), style: 'cancel' },
                                    {
                                        text: t('common.continue'),
                                        onPress: async () => {
                                            try {
                                                await confirmServiceArrival(item._id);
                                                Alert.alert(t('booking.confirmArrivalSuccess'));
                                                load();
                                            } catch (e) {
                                                Alert.alert(t('common.error'), e.response?.data?.message || t('booking.confirmArrivalFailed'));
                                            }
                                        },
                                    },
                                ]);
                            }}
                        />
                    ) : null}
                    {isVendor && activeTrip(item) && arrivalOk(item) && !endProposed(item) && endBookingId !== item._id ? (
                        <Button
                            title={t('booking.proposeEndButton')}
                            variant="outline"
                            onPress={() => {
                                setEndBookingId(item._id);
                                setOvertimeHours('0');
                            }}
                        />
                    ) : null}
                    {isVendor && activeTrip(item) && arrivalOk(item) && !endProposed(item) && endBookingId === item._id ? (
                        <View>
                            <Muted>{t('booking.proposeEndTitle')}</Muted>
                            <Muted>{t('booking.proposeEndOvertimeHint', { rate: formatCurrency(OVERTIME_PER_HOUR) })}</Muted>
                            <Field label={t('booking.overtimeHours')} value={overtimeHours} onChangeText={setOvertimeHours} keyboardType="decimal-pad" />
                            <Muted>{t('booking.overtimeChargePreview', { amount: formatCurrency(Math.round((Number(overtimeHours) || 0) * OVERTIME_PER_HOUR)) })}</Muted>
                            <Button
                                title={t('booking.proposeEndConfirm')}
                                onPress={() => {
                                    const hours = Math.max(0, Number(overtimeHours) || 0);
                                    const amount = formatCurrency(Math.round(hours * OVERTIME_PER_HOUR));
                                    Alert.alert(
                                        t('booking.proposeEndButton'),
                                        hours > 0
                                            ? t('booking.proposeEndWithOvertime', { hours, amount })
                                            : t('booking.proposeEndAsk'),
                                        [
                                            { text: t('common.cancel'), style: 'cancel' },
                                            {
                                                text: t('common.continue'),
                                                onPress: async () => {
                                                    try {
                                                        await vendorProposeEnd(item._id, hours);
                                                        setEndBookingId(null);
                                                        setOvertimeHours('0');
                                                        Alert.alert(t('booking.proposeEndSuccess'));
                                                        load();
                                                    } catch (e) {
                                                        Alert.alert(t('common.error'), e.response?.data?.message || t('booking.proposeEndFailed'));
                                                    }
                                                },
                                            },
                                        ]
                                    );
                                }}
                            />
                            <Button title={t('common.cancel')} variant="outline" onPress={() => setEndBookingId(null)} />
                        </View>
                    ) : null}
                    {!isVendor && activeTrip(item) && endProposed(item) ? (
                        <Button
                            title={t('booking.confirmEndButton')}
                            onPress={() => {
                                Alert.alert(
                                    t('booking.confirmEndButton'),
                                    item.overtimeHours > 0
                                        ? t('booking.confirmEndWithOvertime', {
                                            hours: item.overtimeHours,
                                            amount: formatCurrency(item.overtimeAmount || 0),
                                        })
                                        : t('booking.confirmEndAsk'),
                                    [
                                        { text: t('common.cancel'), style: 'cancel' },
                                        {
                                            text: t('common.continue'),
                                            onPress: async () => {
                                                try {
                                                    await confirmServiceEnd(item._id);
                                                    Alert.alert(t('booking.confirmEndSuccess'));
                                                    load();
                                                } catch (e) {
                                                    Alert.alert(t('common.error'), e.response?.data?.message || t('booking.confirmEndFailed'));
                                                }
                                            },
                                        },
                                    ]
                                );
                            }}
                        />
                    ) : null}
                    {!isVendor && (item.paymentStatus === 'PAID' || item.invoiceUrl || item.invoiceNumber || item.status === 'COMPLETED') ? (
                        <Button title={t('booking.invoice')} variant="outline" onPress={() => openInvoice(item)} />
                    ) : null}
                    {!isVendor && ['CONFIRMED', 'PENDING'].includes(item.status) && item.paymentStatus === 'PAID' ? (
                        <Button title={t('booking.refund')} variant="danger" onPress={() => askRefund(item)} />
                    ) : null}
                    {isVendor && item.status === 'PENDING' ? (
                        <>
                            <Button
                                title={t('booking.accept')}
                                onPress={async () => {
                                    await updateBookingStatus(item._id, 'CONFIRMED');
                                    load();
                                }}
                            />
                            <Button
                                title={t('booking.reject')}
                                variant="danger"
                                onPress={async () => {
                                    await updateBookingStatus(item._id, 'CANCELLED');
                                    load();
                                }}
                            />
                        </>
                    ) : null}
                </View>
            </ScrollView>
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
    page: { padding: 16, paddingBottom: 32 },
    hero: { width: '100%', height: 160, borderRadius: 16, backgroundColor: COLORS.primarySoft, marginBottom: 14 },
    top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    title: { flex: 1, fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text },
    meta: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 8 },
    ref: { fontFamily: FONTS.medium, fontSize: 12, color: '#94A3B8', marginTop: 4 },
    total: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, marginTop: 10, marginBottom: 8 },
    badge: { flexShrink: 0, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 11, letterSpacing: 0.3 },
    guestCard: { marginTop: 12 },
    section: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.muted, marginBottom: 6 },
    guestName: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
    guestMeta: { fontFamily: FONTS.regular, fontSize: 13, color: '#475569', marginTop: 2 },
    actions: { marginTop: 16, gap: 8 },
    pay: {
        backgroundColor: COLORS.primary,
        elevation: 0,
        shadowOpacity: 0,
        ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
    },
    empty: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center' },
});
