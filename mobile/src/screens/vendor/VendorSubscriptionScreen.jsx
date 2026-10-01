import React, { useCallback, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
    confirmServicePoints,
    confirmServiceUnlimited,
    confirmStayRenewal,
    fetchMyServiceMonetization,
    fetchMyStaySubscriptions,
    orderServicePoints,
    orderServiceUnlimited,
    orderStayRenewal,
} from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { checkoutHtml, openWebCheckout } from '../../services/razorpayCheckout';

const STAY_ROLES = new Set(['HOTEL_VENDOR', 'HOMESTAY_VENDOR']);
const SERVICE_ROLES = new Set(['GUIDE', 'TAXI_OPERATOR', 'DRIVER', 'TENT_OPERATOR', 'HORSE_OPERATOR']);

function when(value) {
    if (!value)
        return '—';
    return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function paymentIds(response, order) {
    return {
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id || order?.id,
        razorpaySignature: response.razorpay_signature,
    };
}

function mockIds(order) {
    return {
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpayOrderId: order?.id,
        razorpaySignature: `mock_sig_${Date.now()}`,
    };
}

export default function VendorSubscriptionScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const stay = STAY_ROLES.has(user?.role);
    const service = SERVICE_ROLES.has(user?.role);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [stays, setStays] = useState([]);
    const [amount, setAmount] = useState('500');
    const [busy, setBusy] = useState('');
    const [checkout, setCheckout] = useState(null);

    const load = useCallback(() => {
        if (!stay && !service) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const request = service
            ? fetchMyServiceMonetization().then(setStatus)
            : fetchMyStaySubscriptions().then(setStays);
        request.catch(() => {
            setStatus(null);
            setStays([]);
        }).finally(() => setLoading(false));
    }, [stay, service]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));

    const pay = async ({ orderResult, description, confirm }) => {
        const order = orderResult?.order;
        const keyId = orderResult?.keyId;
        if (!order || order.mock || keyId === 'mock_key' || !keyId) {
            await confirm(mockIds(order));
            return;
        }
        const details = { keyId, order, user, description };
        if (Platform.OS === 'web') {
            const response = await openWebCheckout(details);
            await confirm(paymentIds(response, order));
            return;
        }
        setCheckout({ ...details, confirm });
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
            await current.confirm(paymentIds(data.response, current.order));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
    };

    const recharge = async () => {
        const value = Number(amount);
        if (!Number.isFinite(value) || value <= 0) {
            Alert.alert(t('common.error'), t('serviceSubscription.invalidAmount'));
            return;
        }
        setBusy('points');
        try {
            const orderResult = await orderServicePoints(value);
            await pay({
                orderResult,
                description: 'Points recharge',
                confirm: async (ids) => {
                    await confirmServicePoints({ amount: value, ...ids });
                    Alert.alert(t('serviceSubscription.pointsRecharged'));
                    load();
                },
            });
        }
        catch (e) {
            if (e?.message !== 'CANCELLED')
                Alert.alert(t('common.error'), e.response?.data?.message || e.message || t('serviceSubscription.rechargeFailed'));
            else
                Alert.alert(t('booking.paymentCancelled'));
        }
        finally {
            setBusy('');
        }
    };

    const buyUnlimited = async () => {
        setBusy('unlimited');
        try {
            const orderResult = await orderServiceUnlimited();
            await pay({
                orderResult,
                description: 'Unlimited monthly bookings',
                confirm: async (ids) => {
                    await confirmServiceUnlimited(ids);
                    Alert.alert(t('serviceSubscription.unlimitedActivated'));
                    load();
                },
            });
        }
        catch (e) {
            if (e?.message !== 'CANCELLED')
                Alert.alert(t('common.error'), e.response?.data?.message || e.message || t('serviceSubscription.rechargeFailed'));
            else
                Alert.alert(t('booking.paymentCancelled'));
        }
        finally {
            setBusy('');
        }
    };

    const renewStay = async (item) => {
        setBusy(String(item.listingId));
        try {
            const orderResult = await orderStayRenewal(item.listingType, item.listingId);
            if (orderResult?.renewed) {
                Alert.alert(t('staySubscription.renewSuccess'));
                load();
                return;
            }
            await pay({
                orderResult,
                description: `Listing subscription renewal — ${item.name || 'Stay listing'}`,
                confirm: async (ids) => {
                    await confirmStayRenewal(item.listingType, item.listingId, ids);
                    Alert.alert(t('staySubscription.renewSuccess'));
                    load();
                },
            });
        }
        catch (e) {
            if (e?.message !== 'CANCELLED')
                Alert.alert(t('common.error'), e.response?.data?.message || e.message || t('staySubscription.renewFailed'));
            else
                Alert.alert(t('booking.paymentCancelled'));
        }
        finally {
            setBusy('');
        }
    };

    if (loading)
        return <Loading />;

    const pointsToGet = status?.rupeesPerPoint > 0 ? Math.floor(Number(amount || 0) / status.rupeesPerPoint) : 0;

    return (<Screen>
      <ScrollView>
        {!stay && !service ? <Muted>{t('serviceSubscription.notAvailable')}</Muted> : null}
        {service && !status ? <Muted>{t('serviceSubscription.loadFailed')}</Muted> : null}
        {service && status?.supported === false ? <Muted>{t('serviceSubscription.notAvailable')}</Muted> : null}
        {service && status?.supported !== false && status && (<>
          <Title>{t('serviceSubscription.title')}</Title>
          <Muted>{t('serviceSubscription.subtitle')}</Muted>
          {status.insufficientPoints && !status.hasUnlimited ? <Muted>{t('serviceSubscription.insufficientMessage', { required: status.pointsPerBooking })}</Muted> : null}
          {status.lowPoints && !status.hasUnlimited ? <Muted>{t('serviceSubscription.lowPointsMessage')}</Muted> : null}
          {status.endingSoon && status.hasUnlimited ? <Muted>{t('serviceSubscription.unlimitedEndingSoon', { days: status.unlimitedDaysRemaining })}</Muted> : null}
          <Card>
            <Muted>{t('serviceSubscription.pointBalance')}</Muted>
            <Text style={{ fontWeight: '800', fontSize: 22, color: COLORS.primary }}>{status.pointBalance}</Text>
            <Muted>{t('serviceSubscription.pointsPerBooking', { count: status.pointsPerBooking })}</Muted>
            <Muted>{t('serviceSubscription.unlimitedPlan')}</Muted>
            <Text style={{ fontWeight: '700', color: COLORS.text }}>{status.hasUnlimited ? t('serviceSubscription.active') : t('serviceSubscription.notActive')}</Text>
            {status.hasUnlimited ? <Muted>{t('serviceSubscription.until')} {when(status.unlimitedExpiresAt)}</Muted> : null}
            <Muted>{t('serviceSubscription.canAccept')}: {status.canAcceptBookings ? t('serviceSubscription.yes') : t('serviceSubscription.no')}</Muted>
            <Muted>{t('serviceSubscription.viewOnlyHint')}</Muted>
          </Card>
          <Card>
            <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('serviceSubscription.rechargePoints')}</Text>
            <Muted>{t('serviceSubscription.rechargeRate', { rate: status.rupeesPerPoint, tenant: status.tenantType })}</Muted>
            <Field label={t('serviceSubscription.amountInr')} value={amount} onChangeText={setAmount} keyboardType="numeric"/>
            <Muted>{pointsToGet} {t('serviceSubscription.points')}</Muted>
            <Button title={t('serviceSubscription.rechargeNow')} onPress={recharge} loading={busy === 'points'}/>
          </Card>
          <Card>
            <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('serviceSubscription.unlimitedMonthly')}</Text>
            <Muted>{t('serviceSubscription.unlimitedDesc')}</Muted>
            <Text style={{ fontWeight: '800', color: COLORS.primary, marginVertical: 6 }}>{formatCurrency(status.unlimitedMonthlyPrice)}/month</Text>
            <Button title={t('serviceSubscription.buyUnlimited')} onPress={buyUnlimited} loading={busy === 'unlimited'}/>
          </Card>
        </>)}
        {stay && (<>
          <Title>{t('staySubscription.title')}</Title>
          <Muted>{t('staySubscription.subtitle')}</Muted>
          {!stays.length ? <Muted>{t('staySubscription.empty')}</Muted> : stays.map((item) => {
            const canRenew = item.subscriptionStatus === 'EXPIRED' || item.subscriptionStatus === 'PENDING_PAYMENT' || (item.subscriptionStatus === 'ACTIVE' && item.endingSoon);
            return (<Card key={`${item.listingType}-${item.listingId}`}>
              <Text style={{ fontWeight: '800', color: COLORS.text }}>{item.name}</Text>
              <Muted>{item.listingType} · {t(`staySubscription.status.${item.subscriptionStatus}`, { defaultValue: item.subscriptionStatus })}</Muted>
              <Muted>{item.isVisible ? t('staySubscription.visibleOnSite') : t('staySubscription.hiddenFromSite')}</Muted>
              {item.endingSoon && item.subscriptionStatus === 'ACTIVE' ? <Muted>{t('staySubscription.endingSoon', { days: item.daysRemaining })}</Muted> : null}
              {item.subscriptionStatus === 'EXPIRED' ? <Muted>{t('staySubscription.expiredMessage')}</Muted> : null}
              <Muted>{t('staySubscription.startedOn')}: {when(item.subscriptionStartedAt)}</Muted>
              <Muted>{t('staySubscription.expiresOn')}: {when(item.subscriptionExpiresAt)}</Muted>
              <Muted>{t('staySubscription.daysRemaining')}: {item.daysRemaining != null ? item.daysRemaining : '—'}</Muted>
              <Muted>{t('staySubscription.nextRenewalPrice')}: {item.daysRemaining > 300 && item.subscriptionStatus === 'ACTIVE' ? t('staySubscription.firstYearFree') : formatCurrency(item.renewalPrice || 0)}</Muted>
              {canRenew ? <Button title={t('staySubscription.renewNow')} onPress={() => renewStay(item)} loading={busy === String(item.listingId)}/> : null}
            </Card>);
          })}
        </>)}
      </ScrollView>
      <Modal visible={!!checkout} animationType="slide" onRequestClose={() => setCheckout(null)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <Button title={t('common.cancel')} variant="outline" onPress={() => setCheckout(null)}/>
          {checkout ? <WebView originWhitelist={['*']} source={{ html: checkoutHtml(checkout) }} onMessage={onCheckoutMessage} javaScriptEnabled/> : null}
        </View>
      </Modal>
    </Screen>);
}
