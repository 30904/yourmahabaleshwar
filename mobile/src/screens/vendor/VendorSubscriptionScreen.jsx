import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useReconnect } from '../../api/useReconnect';
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
import { Button, Card, Field, Loading, Screen } from '../../components/ui';
import VendorPageBand from '../../components/VendorPageBand';
import { COLORS, FONTS } from '../../constants/theme';
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
    const navigation = useNavigation();
    const { user } = useAuth();
    const stay = STAY_ROLES.has(user?.role);
    const service = SERVICE_ROLES.has(user?.role);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    const [stays, setStays] = useState([]);
    const [amount, setAmount] = useState('500');
    const [busy, setBusy] = useState('');
    const [checkout, setCheckout] = useState(null);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

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
    useReconnect(load);

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
    const title = stay ? t('staySubscription.title') : t('serviceSubscription.title');
    let line = stay ? t('staySubscription.subtitle') : t('serviceSubscription.subtitle');
    let pill = null;
    if (!stay && !service)
        line = t('serviceSubscription.notAvailable');
    else if (service && !status)
        line = t('serviceSubscription.loadFailed');
    else if (service && status?.supported === false)
        line = t('serviceSubscription.notAvailable');
    else if (stay)
        pill = t(stays.length === 1 ? 'vendor.pillListingOne' : 'vendor.pillListings', { count: stays.length });
    else if (status)
        pill = `${status.pointBalance ?? 0} ${t('vendor.pointsShort')}`;

    return (<Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.page}>
        <VendorPageBand title={title} pill={pill} line={line} />
        <View style={styles.content}>
        {!stay && !service ? <Text style={styles.hint}>{t('serviceSubscription.notAvailable')}</Text> : null}
        {service && !status ? <Text style={styles.hint}>{t('serviceSubscription.loadFailed')}</Text> : null}
        {service && status?.supported === false ? <Text style={styles.hint}>{t('serviceSubscription.notAvailable')}</Text> : null}
        {service && status?.supported !== false && status && (<>
          {status.insufficientPoints && !status.hasUnlimited ? <View style={styles.danger}><Text style={styles.dangerText}>{t('serviceSubscription.insufficientMessage', { required: status.pointsPerBooking })}</Text></View> : null}
          {status.lowPoints && !status.hasUnlimited ? <View style={styles.warn}><Text style={styles.warnText}>{t('serviceSubscription.lowPointsMessage')}</Text></View> : null}
          {status.endingSoon && status.hasUnlimited ? <View style={styles.warn}><Text style={styles.warnText}>{t('serviceSubscription.unlimitedEndingSoon', { days: status.unlimitedDaysRemaining })}</Text></View> : null}
          <Card>
            <View style={styles.factGrid}>
              <View style={styles.fact}>
                <Text style={styles.factLabel}>{t('serviceSubscription.pointBalance')}</Text>
                <Text style={styles.balance}>{status.pointBalance}</Text>
                <Text style={styles.factHint}>{t('serviceSubscription.pointsPerBooking', { count: status.pointsPerBooking })}</Text>
              </View>
              <View style={styles.fact}>
                <Text style={styles.factLabel}>{t('serviceSubscription.unlimitedPlan')}</Text>
                <Text style={styles.value}>{status.hasUnlimited ? t('serviceSubscription.active') : t('serviceSubscription.notActive')}</Text>
                {status.hasUnlimited ? <Text style={styles.factHint}>{t('serviceSubscription.until')} {when(status.unlimitedExpiresAt)}</Text> : null}
              </View>
            </View>
            <Text style={styles.hint}>{t('serviceSubscription.canAccept')}: {status.canAcceptBookings ? t('serviceSubscription.yes') : t('serviceSubscription.no')}</Text>
            <Text style={styles.hint}>{t('serviceSubscription.viewOnlyHint')}</Text>
          </Card>
          <Card>
            <Text style={styles.cardTitle}>{t('serviceSubscription.rechargePoints')}</Text>
            <Text style={styles.hint}>{t('serviceSubscription.rechargeRate', { rate: status.rupeesPerPoint, tenant: status.tenantType })}</Text>
            <Field label={t('serviceSubscription.amountInr')} value={amount} onChangeText={setAmount} keyboardType="numeric"/>
            <Text style={styles.hint}>{pointsToGet} {t('serviceSubscription.points')}</Text>
            <Button title={t('serviceSubscription.rechargeNow')} onPress={recharge} loading={busy === 'points'}/>
          </Card>
          <Card>
            <Text style={styles.cardTitle}>{t('serviceSubscription.unlimitedMonthly')}</Text>
            <Text style={styles.hint}>{t('serviceSubscription.unlimitedDesc')}</Text>
            <Text style={styles.balance}>{formatCurrency(status.unlimitedMonthlyPrice)}/month</Text>
            <Button title={t('serviceSubscription.buyUnlimited')} onPress={buyUnlimited} loading={busy === 'unlimited'}/>
          </Card>
        </>)}
        {stay && (<>
          {!stays.length ? (
            <Card style={styles.empty}><Text style={styles.emptyText}>{t('staySubscription.empty')}</Text></Card>
          ) : stays.map((item) => {
            const canRenew = item.subscriptionStatus === 'EXPIRED' || item.subscriptionStatus === 'PENDING_PAYMENT' || (item.subscriptionStatus === 'ACTIVE' && item.endingSoon);
            const tone = item.subscriptionStatus === 'ACTIVE' ? styles.ok : item.subscriptionStatus === 'EXPIRED' ? styles.bad : styles.pending;
            return (<Card key={`${item.listingType}-${item.listingId}`}>
              <View style={styles.subHead}>
                <View style={styles.subCopy}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.typeLine}>{item.listingType}</Text>
                </View>
                <View style={[styles.badge, tone]}>
                  <Text style={[styles.badgeText, item.subscriptionStatus === 'ACTIVE' && styles.okText]}>{t(`staySubscription.status.${item.subscriptionStatus}`, { defaultValue: item.subscriptionStatus })}</Text>
                </View>
              </View>
              <Text style={styles.vis}>{item.isVisible ? t('staySubscription.visibleOnSite') : t('staySubscription.hiddenFromSite')}</Text>
              {item.endingSoon && item.subscriptionStatus === 'ACTIVE' ? <View style={styles.warn}><Text style={styles.warnText}>{t('staySubscription.endingSoon', { days: item.daysRemaining })}</Text></View> : null}
              {item.subscriptionStatus === 'EXPIRED' ? <View style={styles.danger}><Text style={styles.dangerText}>{t('staySubscription.expiredMessage')}</Text></View> : null}
              <View style={styles.factGrid}>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>{t('staySubscription.startedOn')}</Text>
                  <Text style={styles.factValue}>{when(item.subscriptionStartedAt)}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>{t('staySubscription.expiresOn')}</Text>
                  <Text style={styles.factValue}>{when(item.subscriptionExpiresAt)}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>{t('staySubscription.daysRemaining')}</Text>
                  <Text style={styles.factValue}>{item.daysRemaining != null ? item.daysRemaining : '—'}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={styles.factLabel}>{t('staySubscription.nextRenewalPrice')}</Text>
                  <Text style={styles.factValue}>{item.daysRemaining > 300 && item.subscriptionStatus === 'ACTIVE' ? t('staySubscription.firstYearFree') : formatCurrency(item.renewalPrice || 0)}</Text>
                </View>
              </View>
              {canRenew ? <Button title={t('staySubscription.renewNow')} onPress={() => renewStay(item)} loading={busy === String(item.listingId)} style={styles.renewBtn}/> : null}
            </Card>);
          })}
        </>)}
        </View>
      </ScrollView>
      <Modal visible={!!checkout} animationType="slide" onRequestClose={() => setCheckout(null)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <Button title={t('common.cancel')} variant="outline" onPress={() => setCheckout(null)}/>
          {checkout ? <WebView originWhitelist={['*']} source={{ html: checkoutHtml(checkout) }} onMessage={onCheckoutMessage} javaScriptEnabled/> : null}
        </View>
      </Modal>
    </Screen>);
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    page: { paddingBottom: 24 },
    content: { paddingHorizontal: 16, paddingTop: 14 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 8, lineHeight: 20 },
    label: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 10 },
    value: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text, marginTop: 2 },
    balance: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.primary, marginTop: 4 },
    cardTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
    subHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    subCopy: { flex: 1 },
    typeLine: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.muted, marginTop: 2 },
    vis: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 8 },
    factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    fact: { width: '47%', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10 },
    factLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted },
    factValue: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text, marginTop: 2 },
    factHint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.muted, marginTop: 4, lineHeight: 16 },
    renewBtn: {
        backgroundColor: COLORS.primary,
        elevation: 0,
        shadowOpacity: 0,
        ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
    },
    row: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', marginTop: 6 },
    warn: { backgroundColor: '#FFFBEB', borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', padding: 12, marginBottom: 10 },
    warnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.warning, lineHeight: 18 },
    danger: { backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 12, marginBottom: 10 },
    dangerText: { fontFamily: FONTS.medium, fontSize: 13, color: '#B91C1C', lineHeight: 18 },
    badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.text },
    ok: { backgroundColor: '#DCFCE7' },
    okText: { color: COLORS.success },
    bad: { backgroundColor: '#FEF2F2' },
    pending: { backgroundColor: '#FFFBEB' },
    empty: { alignItems: 'center', paddingVertical: 28 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center' },
});
