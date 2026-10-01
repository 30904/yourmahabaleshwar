import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { confirmHomepageAd, fetchMyHomepageAds, fetchMyVendorListings, fetchVendorAdCatalog, orderHomepageAd } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { checkoutHtml, openWebCheckout } from '../../services/razorpayCheckout';

const AD_ROLES = new Set(['HOTEL_VENDOR', 'HOMESTAY_VENDOR', 'TENT_OPERATOR']);

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

export default function VendorAdsScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const allowed = AD_ROLES.has(user?.role);
    const [catalog, setCatalog] = useState(null);
    const [listings, setListings] = useState([]);
    const [ads, setAds] = useState([]);
    const [packageId, setPackageId] = useState('');
    const [listingKey, setListingKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [checkout, setCheckout] = useState(null);

    const load = useCallback(() => {
        if (!allowed) {
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all([fetchVendorAdCatalog(), fetchMyVendorListings(user.role), fetchMyHomepageAds()])
            .then(([cat, mine, myAds]) => {
            setCatalog(cat);
            setListings((mine || []).filter((item) => String(item.approvalStatus || '').toUpperCase() === 'APPROVED'));
            setAds(myAds || []);
            setPackageId((current) => current || cat?.packages?.[0]?._id || '');
        })
            .catch(() => {
            setCatalog(null);
            setListings([]);
            setAds([]);
        })
            .finally(() => setLoading(false));
    }, [allowed, user?.role]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));

    const options = useMemo(() => listings.map((item) => ({
        key: `${item.vertical}:${item.id || item._id}`,
        listingType: item.vertical,
        listingId: item.id || item._id,
        name: item.name,
    })), [listings]);

    const purchase = async () => {
        if (!packageId) {
            Alert.alert(t('common.error'), t('vendorAds.selectPackage'));
            return;
        }
        const option = options.find((item) => item.key === listingKey);
        if (!option) {
            Alert.alert(t('common.error'), t('vendorAds.selectListing'));
            return;
        }
        setBusy(true);
        try {
            const orderResult = await orderHomepageAd({
                packageId,
                listingType: option.listingType,
                listingId: option.listingId,
            });
            const order = orderResult?.order;
            const keyId = orderResult?.keyId;
            const confirm = async (ids) => {
                await confirmHomepageAd({
                    packageId,
                    listingType: option.listingType,
                    listingId: option.listingId,
                    ...ids,
                });
                Alert.alert(t('vendorAds.purchaseSuccess'));
                setListingKey('');
                load();
            };
            if (!order || order.mock || keyId === 'mock_key' || !keyId) {
                await confirm({
                    razorpayPaymentId: `pay_mock_${Date.now()}`,
                    razorpayOrderId: order?.id,
                    razorpaySignature: `mock_sig_${Date.now()}`,
                });
                return;
            }
            const details = {
                keyId,
                order,
                user,
                description: `Homepage spotlight — ${orderResult.listing?.name || option.name}`,
                confirm,
            };
            if (Platform.OS === 'web') {
                const response = await openWebCheckout(details);
                await confirm(paymentIds(response, order));
                return;
            }
            setCheckout(details);
        }
        catch (e) {
            if (e?.message === 'CANCELLED')
                Alert.alert(t('booking.paymentCancelled'));
            else
                Alert.alert(t('common.error'), e.response?.data?.message || e.message || t('vendorAds.purchaseFailed'));
        }
        finally {
            setBusy(false);
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
            await current.confirm(paymentIds(data.response, current.order));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message || t('vendorAds.purchaseFailed'));
        }
    };

    if (!allowed)
        return (<Screen><Muted>{t('vendorAds.notAvailable')}</Muted></Screen>);
    if (loading)
        return <Loading />;

    const slotsRemaining = catalog?.slotsRemaining ?? 0;
    const maxSlots = catalog?.maxSlots ?? 3;

    return (<Screen>
      <ScrollView>
        <Title>{t('vendorAds.title')}</Title>
        <Muted>{t('vendorAds.subtitle')}</Muted>
        <Card>
          <Muted>{t('vendorAds.slotsOpen')}</Muted>
          <Text style={{ fontWeight: '800', fontSize: 22, color: COLORS.primary }}>{slotsRemaining}/{maxSlots}</Text>
          <Muted>{t('vendorAds.slotsHint')}</Muted>
        </Card>
        <Card>
          <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('vendorAds.buyTitle')}</Text>
          {!options.length ? <Muted>{t('vendorAds.noApprovedListings')}</Muted> : (<>
            <Muted>{t('vendorAds.package')}</Muted>
            {(catalog?.packages || []).map((pkg) => (<Pressable key={pkg._id} onPress={() => setPackageId(pkg._id)} style={{ paddingVertical: 8 }}>
              <Text style={{ fontWeight: '700', color: packageId === pkg._id ? COLORS.primary : COLORS.text }}>
                {packageId === pkg._id ? '✓ ' : ''}{pkg.name} — {formatCurrency(pkg.price)} / {pkg.durationDays} {t('vendorAds.days')}
              </Text>
            </Pressable>))}
            <Muted>{t('vendorAds.listing')}</Muted>
            {options.map((opt) => (<Pressable key={opt.key} onPress={() => setListingKey(opt.key)} style={{ paddingVertical: 8 }}>
              <Text style={{ fontWeight: '700', color: listingKey === opt.key ? COLORS.primary : COLORS.text }}>
                {listingKey === opt.key ? '✓ ' : ''}{opt.name} ({opt.listingType})
              </Text>
            </Pressable>))}
            <Button title={slotsRemaining <= 0 ? t('vendorAds.slotsFull') : t('vendorAds.payAndPromote')} onPress={purchase} loading={busy} disabled={slotsRemaining <= 0}/>
          </>)}
        </Card>
        <Card>
          <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('vendorAds.historyTitle')}</Text>
          {!ads.length ? <Muted>{t('vendorAds.historyEmpty')}</Muted> : ads.map((ad) => (<View key={ad._id} style={{ paddingVertical: 8 }}>
            <Text style={{ fontWeight: '700', color: COLORS.text }}>{ad.title}</Text>
            <Muted>{ad.listingType} · {when(ad.startDate)} → {when(ad.endDate)} · {formatCurrency(ad.amountPaid || 0)}</Muted>
            <Muted>{ad.status}</Muted>
          </View>))}
        </Card>
      </ScrollView>
      <Modal visible={!!checkout} animationType="slide" onRequestClose={() => setCheckout(null)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <Button title={t('common.cancel')} variant="outline" onPress={() => setCheckout(null)}/>
          {checkout ? <WebView originWhitelist={['*']} source={{ html: checkoutHtml(checkout) }} onMessage={onCheckoutMessage} javaScriptEnabled/> : null}
        </View>
      </Modal>
    </Screen>);
}
