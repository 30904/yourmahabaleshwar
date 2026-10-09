import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useReconnect } from '../../api/useReconnect';
import { useTranslation } from 'react-i18next';
import { confirmHomepageAd, fetchMyHomepageAds, fetchMyVendorListings, fetchVendorAdCatalog, orderHomepageAd } from '../../api/endpoints';
import { Button, Card, Loading, Screen } from '../../components/ui';
import { Megaphone } from '../../components/home/icons';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { checkoutHtml, openWebCheckout } from '../../services/razorpayCheckout';

const AD_ROLES = new Set(['HOTEL_VENDOR', 'HOMESTAY_VENDOR', 'TENT_OPERATOR']);

function when(value) {
    if (!value)
        return '—';
    return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const webSelect = {
    width: '100%',
    marginTop: 6,
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: '8px 12px',
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
};

function statusTone(status) {
    if (status === 'ACTIVE') return { box: styles.badgeOk, text: styles.badgeOkText };
    if (status === 'EXPIRED') return { box: styles.badgeBad, text: styles.badgeBadText };
    if (status === 'PENDING') return { box: styles.badgeWait, text: styles.badgeWaitText };
    return { box: styles.badgeNeutral, text: styles.badgeNeutralText };
}

function AdsSelect({ label, value, onChange, options }) {
    const [open, setOpen] = useState(false);
    const current = options.find((option) => option.value === value);
    return (
        <View style={styles.field}>
            <Text style={styles.fieldLabel}>{label}</Text>
            {Platform.OS === 'web' ? React.createElement('select', {
                value: value || '',
                onChange: (event) => onChange(event.target.value),
                style: webSelect,
            }, options.map((option) => React.createElement('option', { key: String(option.value), value: option.value }, option.label))) : (
                <>
                    <Pressable style={styles.selectBox} onPress={() => setOpen(true)}>
                        <Text style={[styles.selectText, !current && styles.placeholder]}>{current?.label || ''}</Text>
                    </Pressable>
                    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
                            <View style={styles.modalCard}>
                                {options.map((option) => (
                                    <Pressable key={String(option.value)} style={styles.modalRow} onPress={() => { onChange(option.value); setOpen(false); }}>
                                        <Text style={styles.selectText}>{option.label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </Pressable>
                    </Modal>
                </>
            )}
        </View>
    );
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
    useReconnect(load);

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

    const packageOptions = (catalog?.packages || []).map((pkg) => ({
        value: pkg._id,
        label: `${pkg.name} — ${formatCurrency(pkg.price)} / ${pkg.durationDays} ${t('vendorAds.days')}`,
    }));
    const listingOptions = [
        { value: '', label: t('vendorAds.chooseListing') },
        ...options.map((opt) => ({ value: opt.key, label: `${opt.name} (${opt.listingType})` })),
    ];

    return (<Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>{t('vendorAds.title')}</Text>
        <Text style={styles.subtitle}>{t('vendorAds.subtitle')}</Text>
        <Card>
          <Text style={styles.slotsLabel}>{t('vendorAds.slotsOpen')}</Text>
          <Text style={styles.slotsValue}>{slotsRemaining}/{maxSlots}</Text>
        </Card>
        <Card>
          <Text style={styles.slotsHint}>{t('vendorAds.slotsHint')}</Text>
        </Card>
        <Card>
          <View style={styles.buyHead}>
            <Megaphone size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>{t('vendorAds.buyTitle')}</Text>
          </View>
          {!options.length ? <Text style={styles.slotsHint}>{t('vendorAds.noApprovedListings')}</Text> : (<>
            <AdsSelect label={t('vendorAds.package')} value={packageId} onChange={setPackageId} options={packageOptions} />
            <AdsSelect label={t('vendorAds.listing')} value={listingKey} onChange={setListingKey} options={listingOptions} />
            <Button
              title={slotsRemaining <= 0 ? t('vendorAds.slotsFull') : t('vendorAds.payAndPromote')}
              onPress={purchase}
              loading={busy}
              disabled={slotsRemaining <= 0}
              style={styles.payButton}
            />
          </>)}
        </Card>
        <Card>
          <Text style={styles.cardTitle}>{t('vendorAds.historyTitle')}</Text>
          {!ads.length ? <Text style={styles.empty}>{t('vendorAds.historyEmpty')}</Text> : ads.map((ad, index) => {
            const tone = statusTone(ad.status);
            return (
              <View key={ad._id} style={[styles.ad, index === ads.length - 1 && styles.adLast]}>
                <View style={styles.adCopy}>
                  <Text style={styles.adTitle}>{ad.title}</Text>
                  <Text style={styles.adMeta}>{ad.listingType} · {when(ad.startDate)} → {when(ad.endDate)} · {formatCurrency(ad.amountPaid || 0)}</Text>
                </View>
                <View style={tone.box}><Text style={tone.text}>{ad.status}</Text></View>
              </View>
            );
          })}
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
    scroll: { paddingBottom: 24 },
    pageTitle: { fontFamily: FONTS.bold, fontSize: 20, color: '#0F172A' },
    subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 16, lineHeight: 20 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 8, lineHeight: 20 },
    slotsLabel: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B' },
    slotsValue: { fontFamily: FONTS.bold, fontSize: 30, color: COLORS.primary, marginTop: 8 },
    slotsHint: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', lineHeight: 20 },
    buyHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    cardTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: '#0F172A' },
    field: { marginBottom: 12 },
    fieldLabel: { fontFamily: FONTS.medium, fontSize: 14, color: '#334155' },
    selectBox: { marginTop: 6, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: RADIUS.input, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10 },
    selectText: { fontFamily: FONTS.regular, fontSize: 14, color: '#0F172A' },
    placeholder: { color: '#64748B' },
    payButton: { alignSelf: 'flex-start', paddingHorizontal: 20 },
    empty: { fontFamily: FONTS.regular, fontSize: 14, color: '#94A3B8', marginTop: 8 },
    ad: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    adLast: { borderBottomWidth: 0, paddingBottom: 0 },
    adCopy: { flexGrow: 1, flexShrink: 1, minWidth: 180 },
    adTitle: { fontFamily: FONTS.medium, fontSize: 16, color: '#0F172A' },
    adMeta: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 18 },
    badgeOk: { alignSelf: 'flex-start', backgroundColor: '#F0FDF4', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
    badgeOkText: { fontFamily: FONTS.semibold, fontSize: 12, color: '#15803D' },
    badgeBad: { alignSelf: 'flex-start', backgroundColor: '#FEF2F2', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
    badgeBadText: { fontFamily: FONTS.semibold, fontSize: 12, color: '#B91C1C' },
    badgeWait: { alignSelf: 'flex-start', backgroundColor: '#FFFBEB', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
    badgeWaitText: { fontFamily: FONTS.semibold, fontSize: 12, color: '#B45309' },
    badgeNeutral: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
    badgeNeutralText: { fontFamily: FONTS.semibold, fontSize: 12, color: '#475569' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
    modalRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
});
