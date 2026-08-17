import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { createPaymentOrder, invoiceUrl, myBookings, requestRefund, vendorBookings, verifyPayment, updateBookingStatus, } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import * as SecureStore from 'expo-secure-store';
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
        }
        catch {
            setItems([]);
        }
        finally {
            setLoading(false);
        }
    };
    useFocusEffect(useCallback(() => {
        load();
    }, [isVendor]));
    const pay = async (b) => {
        try {
            const { order, payment, keyId } = await createPaymentOrder(b._id);
            // Mock / missing Razorpay native SDK — verify as mock when order.mock or mock key
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
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
    };
    const openInvoice = async (b) => {
        const token = await SecureStore.getItemAsync('accessToken');
        const url = invoiceUrl(b._id);
        // Prefer listing invoiceUrl if present
        if (b.invoiceUrl) {
            Linking.openURL(b.invoiceUrl.startsWith('http') ? b.invoiceUrl : url);
            return;
        }
        Linking.openURL(url + (token ? `?token=${token}` : ''));
    };
    if (loading && !items.length)
        return <Loading />;
    return (<Screen>
      <Title>{t('nav.bookings')}</Title>
      <Muted>{user?.name}</Muted>
      <FlatList data={items} keyExtractor={(item) => item._id} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>} ListEmptyComponent={<Muted>{t('booking.noBookings')}</Muted>} renderItem={({ item }) => (<Card>
            <Text style={{ fontWeight: '800', color: COLORS.text }}>{item.bookingNumber || item.type}</Text>
            <Muted>
              {t('booking.status')}: {item.status} · {t('booking.total')}: {formatCurrency(item.total)}
            </Muted>
            <View style={{ gap: 4 }}>
              {!isVendor && item.paymentStatus !== 'PAID' && item.status !== 'CANCELLED' && (<Button title={t('booking.payNow')} onPress={() => pay(item)}/>)}
              {!isVendor && item.paymentStatus === 'PAID' && (<>
                  <Button title={t('booking.invoice')} variant="outline" onPress={() => openInvoice(item)}/>
                  <Button title={t('booking.refund')} variant="danger" onPress={async () => {
                    try {
                        await requestRefund(item._id, 'Customer cancellation');
                        load();
                    }
                    catch (e) {
                        Alert.alert(t('common.error'), e.response?.data?.message || e.message);
                    }
                }}/>
                </>)}
              {isVendor && item.status === 'PENDING' && (<>
                  <Button title={t('booking.accept')} onPress={async () => {
                    await updateBookingStatus(item._id, 'CONFIRMED');
                    load();
                }}/>
                  <Button title={t('booking.reject')} variant="danger" onPress={async () => {
                    await updateBookingStatus(item._id, 'CANCELLED');
                    load();
                }}/>
                </>)}
            </View>
          </Card>)}/>
    </Screen>);
}
