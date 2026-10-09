import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { isNetworkError } from '../../api/network';
import { useReconnect } from '../../api/useReconnect';
import { useTranslation } from 'react-i18next';
import {
  createPaymentOrder,
  downloadInvoice,
  myBookings,
  requestRefund,
  refundPreview,
  vendorBookings,
  verifyPayment,
  updateBookingStatus,
  vendorMarkArrived,
  confirmServiceArrival,
  vendorProposeEnd,
  confirmServiceEnd,
} from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { bookingTitle } from '../../utils/listing';
import { checkoutHtml, openWebCheckout } from '../../services/razorpayCheckout';

const TRIP_TENANTS = ['GUIDE', 'TAXI', 'DRIVER', 'HORSE'];
const TRIP_TYPES = ['GUIDE', 'TAXI', 'HORSE'];
const OVERTIME_PER_HOUR = 150;

const isTrip = (b) =>
  (b.serviceTenant && TRIP_TENANTS.includes(b.serviceTenant)) || TRIP_TYPES.includes(b.type);
const hasArrived = (b) => !!(b.vendorArrivedAt || b.guideReachedConfirmed || b.arrivalConfirmed);
const arrivalOk = (b) => !!(b.arrivalConfirmed || b.guideReachedConfirmed);
const ended = (b) => !!(b.serviceEndedAt || b.guideEndedAt || b.status === 'COMPLETED');
const endProposed = (b) => !!(b.endProposedAt && !ended(b));
const activeTrip = (b) =>
  isTrip(b) &&
  b.assignmentStatus === 'ASSIGNED' &&
  b.vendor &&
  !ended(b) &&
  b.status !== 'CANCELLED' &&
  b.status !== 'REFUNDED';

function when(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function stayDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_TONE = {
  CONFIRMED: { bg: '#F0FDF4', fg: COLORS.success },
  PENDING: { bg: '#FFFBEB', fg: COLORS.warning },
  CANCELLED: { bg: '#FEF2F2', fg: '#B91C1C' },
  COMPLETED: { bg: COLORS.primarySoft, fg: COLORS.primary },
  REFUNDED: { bg: '#F1F5F9', fg: COLORS.muted },
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
  const { isVendor, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState(null);
  const [endBookingId, setEndBookingId] = useState(null);
  const [overtimeHours, setOvertimeHours] = useState('0');

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );
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
      if (order.mock || keyId === 'mock_key' || !keyId) {
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

  if (loading && !items.length) return <Loading />;

  return (
    <Screen style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: 16 }]}
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={(
          <View style={styles.header}>
            <Text style={styles.pageTitle}>{t('nav.bookings')}</Text>
            <Text style={styles.pageHint}>{t('booking.manageHint')}</Text>
          </View>
        )}
        ListEmptyComponent={(
          <Card style={styles.empty}>
            <Text style={styles.emptyText}>{t('booking.noBookings')}</Text>
          </Card>
        )}
        renderItem={({ item }) => {
          const dates = [stayDate(item.checkIn), stayDate(item.checkOut)].filter(Boolean).join(' – ');
          const guest = item.guestRegistration?.leadGuest;
          const guestBits = [
            guest?.mobile,
            item.guests?.adults != null ? `${item.guests.adults} ${t('booking.adults')}` : '',
            item.guests?.children ? `${item.guests.children} ${t('booking.children')}` : '',
          ].filter(Boolean);
          return (
          <Card>
            <View style={styles.cardTop}>
              <Text style={styles.bookingTitle}>{bookingTitle(item)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.ref} numberOfLines={1}>{item.bookingNumber || item._id}</Text>
            <Text style={styles.meta}>{[item.type, dates].filter(Boolean).join(' · ')}</Text>
            <Text style={styles.total}>{formatCurrency(item.total)}</Text>
            {guest?.fullName ? (
              <View style={styles.guestBox}>
                <Text style={styles.guestName}>{guest.fullName}</Text>
                {guestBits.length ? <Text style={styles.guestMeta}>{guestBits.join(' · ')}</Text> : null}
              </View>
            ) : null}
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
            <View style={{ gap: 4 }}>
              {!isVendor && item.paymentStatus === 'PENDING' && (
                <Button title={t('booking.payNow')} onPress={() => pay(item)} />
              )}
              {isVendor && activeTrip(item) && !hasArrived(item) && (
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
              )}
              {!isVendor && activeTrip(item) && hasArrived(item) && !arrivalOk(item) && (
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
              )}
              {isVendor && activeTrip(item) && arrivalOk(item) && !endProposed(item) && endBookingId !== item._id && (
                <Button
                  title={t('booking.proposeEndButton')}
                  variant="outline"
                  onPress={() => {
                    setEndBookingId(item._id);
                    setOvertimeHours('0');
                  }}
                />
              )}
              {isVendor && activeTrip(item) && arrivalOk(item) && !endProposed(item) && endBookingId === item._id && (
                <View>
                  <Muted>{t('booking.proposeEndTitle')}</Muted>
                  <Muted>{t('booking.proposeEndOvertimeHint', { rate: formatCurrency(OVERTIME_PER_HOUR) })}</Muted>
                  <Field label={t('booking.overtimeHours')} value={overtimeHours} onChangeText={setOvertimeHours} keyboardType="decimal-pad"/>
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
                  <Button title={t('common.cancel')} variant="outline" onPress={() => setEndBookingId(null)}/>
                </View>
              )}
              {!isVendor && activeTrip(item) && endProposed(item) && (
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
              )}
              {!isVendor && (item.paymentStatus === 'PAID' || item.invoiceUrl || item.invoiceNumber || item.status === 'COMPLETED') && (
                <Button title={t('booking.invoice')} variant="outline" onPress={() => openInvoice(item)} />
              )}
              {!isVendor && ['CONFIRMED', 'PENDING'].includes(item.status) && item.paymentStatus === 'PAID' && (
                <Button title={t('booking.refund')} variant="danger" onPress={() => askRefund(item)} />
              )}
              {isVendor && item.status === 'PENDING' && (
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
              )}
            </View>
          </Card>
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
  pageTitle: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  header: { marginBottom: 4 },
  pageHint: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 4,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 24 },
  empty: { alignItems: 'center', paddingVertical: 28 },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  bookingTitle: { flex: 1, fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
  ref: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.muted, marginTop: 8 },
  meta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 2 },
  badge: { flexShrink: 0, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: FONTS.semibold, fontSize: 11, letterSpacing: 0.3 },
  total: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginTop: 10 },
  guestBox: {
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  guestName: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text },
  guestMeta: { fontFamily: FONTS.regular, fontSize: 12, color: '#475569', marginTop: 2 },
});
