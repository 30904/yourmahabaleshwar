import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { confirmHomepageAd, fetchMyHomepageAds, fetchMyVendorListings, fetchVendorAdCatalog, orderHomepageAd } from '../../api/endpoints';
import { Button, Card, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
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
        return (<Screen><Text style={styles.hint}>{t('vendorAds.notAvailable')}</Text></Screen>);
    if (loading)
        return <Loading />;

    const slotsRemaining = catalog?.slotsRemaining ?? 0;
    const maxSlots = catalog?.maxSlots ?? 3;

    return (<Screen>
      <ScrollView>
        <Text style={styles.pageTitle}>{t('vendorAds.title')}</Text>
        <Text style={styles.hint}>{t('vendorAds.subtitle')}</Text>
        <Card>
          <Text style={styles.label}>{t('vendorAds.slotsOpen')}</Text>
          <Text style={styles.balance}>{slotsRemaining}/{maxSlots}</Text>
          <Text style={styles.hint}>{t('vendorAds.slotsHint')}</Text>
        </Card>
        <Card>
          <Text style={styles.cardTitle}>{t('vendorAds.buyTitle')}</Text>
          {!options.length ? <Text style={styles.hint}>{t('vendorAds.noApprovedListings')}</Text> : (<>
            <Text style={styles.label}>{t('vendorAds.package')}</Text>
            <View style={styles.chips}>
              {(catalog?.packages || []).map((pkg) => {
                const on = packageId === pkg._id;
                return (
                  <Pressable key={pkg._id} onPress={() => setPackageId(pkg._id)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{pkg.name} — {formatCurrency(pkg.price)} / {pkg.durationDays} {t('vendorAds.days')}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>{t('vendorAds.listing')}</Text>
            <View style={styles.chips}>
              {options.map((opt) => {
                const on = listingKey === opt.key;
                return (
                  <Pressable key={opt.key} onPress={() => setListingKey(opt.key)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.name} ({opt.listingType})</Text>
                  </Pressable>
                );
              })}
            </View>
            <Button title={slotsRemaining <= 0 ? t('vendorAds.slotsFull') : t('vendorAds.payAndPromote')} onPress={purchase} loading={busy} disabled={slotsRemaining <= 0}/>
          </>)}
        </Card>
        <Card>
          <Text style={styles.cardTitle}>{t('vendorAds.historyTitle')}</Text>
          {!ads.length ? <Text style={styles.hint}>{t('vendorAds.historyEmpty')}</Text> : ads.map((ad) => (
            <View key={ad._id} style={styles.ad}>
              <Text style={styles.adTitle}>{ad.title}</Text>
              <Text style={styles.hint}>{ad.listingType} · {when(ad.startDate)} → {when(ad.endDate)} · {formatCurrency(ad.amountPaid || 0)}</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>{ad.status}</Text></View>
            </View>
          ))}
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

const styles = StyleSheet.create({
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 8, lineHeight: 20 },
    label: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.body, marginTop: 8, marginBottom: 6 },
    balance: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.primary, marginTop: 4 },
    cardTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text, marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
    chipOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    chipText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text },
    chipTextOn: { color: COLORS.primary },
    ad: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    adTitle: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    badge: { alignSelf: 'flex-start', backgroundColor: COLORS.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
});
