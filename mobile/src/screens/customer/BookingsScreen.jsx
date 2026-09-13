import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  createPaymentOrder,
  invoiceUrl,
  myBookings,
  requestRefund,
  vendorBookings,
  verifyPayment,
  updateBookingStatus,
  vendorMarkArrived,
  confirmServiceArrival,
  vendorProposeEnd,
  confirmServiceEnd,
} from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import * as SecureStore from 'expo-secure-store';

const TRIP_TENANTS = ['GUIDE', 'TAXI', 'DRIVER', 'HORSE'];
const TRIP_TYPES = ['GUIDE', 'TAXI', 'HORSE'];

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

export default function BookingsScreen() {
  const { t } = useTranslation();
  const { isVendor, user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = isVendor ? await vendorBookings() : await myBookings();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [isVendor])
  );

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
      Alert.alert('Razorpay', 'Live checkout requires react-native-razorpay in a custom/dev build. Using mock verify for now.');
      await verifyPayment({
        paymentId: payment._id,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpayOrderId: order.id,
        razorpaySignature: `mock_sig_${Date.now()}`,
      });
      load();
    } catch (e) {
      Alert.alert(t('common.error'), e.response?.data?.message || e.message);
    }
  };

  const openInvoice = async (b) => {
    const token = await SecureStore.getItemAsync('accessToken');
    const url = invoiceUrl(b._id);
    if (b.invoiceUrl) {
      Linking.openURL(b.invoiceUrl.startsWith('http') ? b.invoiceUrl : url);
      return;
    }
    Linking.openURL(url + (token ? `?token=${token}` : ''));
  };

  if (loading && !items.length) return <Loading />;

  return (
    <Screen>
      <Title>{t('nav.bookings')}</Title>
      <Muted>{user?.name}</Muted>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Muted>{t('booking.noBookings')}</Muted>}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: '800', color: COLORS.text }}>{item.bookingNumber || item.type}</Text>
            <Muted>
              {t('booking.status')}: {item.status} · {t('booking.total')}: {formatCurrency(item.total)}
            </Muted>
            {isTrip(item) && hasArrived(item) && !arrivalOk(item) ? <Muted>Partner arrived — confirm</Muted> : null}
            {isTrip(item) && arrivalOk(item) && !endProposed(item) && !ended(item) ? <Muted>Arrival confirmed</Muted> : null}
            {isTrip(item) && endProposed(item) ? (
              <Muted>
                End requested
                {item.overtimeHours > 0 ? ` · OT ${item.overtimeHours}h (${formatCurrency(item.overtimeAmount || 0)})` : ''}
              </Muted>
            ) : null}
            {isTrip(item) && ended(item) ? (
              <Muted>
                Booking ended
                {item.overtimeHours > 0 ? ` · OT ${item.overtimeHours}h (${formatCurrency(item.overtimeAmount || 0)})` : ''}
              </Muted>
            ) : null}
            <View style={{ gap: 4 }}>
              {!isVendor && item.paymentStatus !== 'PAID' && item.status !== 'CANCELLED' && (
                <Button title={t('booking.payNow')} onPress={() => pay(item)} />
              )}
              {isVendor && activeTrip(item) && !hasArrived(item) && (
                <Button
                  title="I have arrived"
                  onPress={() => {
                    Alert.alert('Arrival', 'Mark that you have reached the customer?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        onPress: async () => {
                          try {
                            await vendorMarkArrived(item._id);
                            load();
                          } catch (e) {
                            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                          }
                        },
                      },
                    ]);
                  }}
                />
              )}
              {!isVendor && activeTrip(item) && hasArrived(item) && !arrivalOk(item) && (
                <Button
                  title="Confirm partner arrived"
                  onPress={() => {
                    Alert.alert('Confirm', 'Confirm that your partner has reached you?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Confirm',
                        onPress: async () => {
                          try {
                            await confirmServiceArrival(item._id);
                            load();
                          } catch (e) {
                            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                          }
                        },
                      },
                    ]);
                  }}
                />
              )}
              {isVendor && activeTrip(item) && arrivalOk(item) && !endProposed(item) && (
                <Button
                  title="End booking"
                  onPress={() => {
                    Alert.alert('End booking', 'Any overtime? (₹150/hr)', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'No overtime',
                        onPress: async () => {
                          try {
                            await vendorProposeEnd(item._id, 0);
                            Alert.alert('Sent', 'Waiting for customer confirmation.');
                            load();
                          } catch (e) {
                            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                          }
                        },
                      },
                      {
                        text: '1 hour OT',
                        onPress: async () => {
                          try {
                            await vendorProposeEnd(item._id, 1);
                            Alert.alert('Sent', 'Waiting for customer confirmation.');
                            load();
                          } catch (e) {
                            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                          }
                        },
                      },
                    ]);
                  }}
                />
              )}
              {!isVendor && activeTrip(item) && endProposed(item) && (
                <Button
                  title="Confirm end booking"
                  onPress={() => {
                    Alert.alert(
                      'Confirm end',
                      item.overtimeHours > 0
                        ? `Confirm ending with ${item.overtimeHours} hr overtime (${formatCurrency(item.overtimeAmount || 0)})?`
                        : 'Confirm ending with no overtime?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Confirm',
                          onPress: async () => {
                            try {
                              await confirmServiceEnd(item._id);
                              Alert.alert('Done', 'Booking ended. Invoice available.');
                              load();
                            } catch (e) {
                              Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                            }
                          },
                        },
                      ]
                    );
                  }}
                />
              )}
              {!isVendor && (item.paymentStatus === 'PAID' || item.status === 'COMPLETED' || item.invoiceUrl) && (
                <>
                  <Button title={t('booking.invoice')} variant="outline" onPress={() => openInvoice(item)} />
                  {item.status !== 'COMPLETED' && (
                    <Button
                      title={t('booking.refund')}
                      variant="danger"
                      onPress={async () => {
                        try {
                          await requestRefund(item._id, 'Customer cancellation');
                          load();
                        } catch (e) {
                          Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                        }
                      }}
                    />
                  )}
                </>
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
        )}
      />
    </Screen>
  );
}
