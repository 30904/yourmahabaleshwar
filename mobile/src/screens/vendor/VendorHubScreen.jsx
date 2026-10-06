import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getMyKyc, getMySubscription, getWallet, purchasePoints } from '../../api/endpoints';
import { Button, Card, Field, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { AVAILABILITY_ROLES } from '../../utils/vendorAvailability';
export default function VendorHubScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigation = useNavigation();
    const [wallet, setWallet] = useState(null);
    const [sub, setSub] = useState(null);
    const [kyc, setKyc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [buyPoints, setBuyPoints] = useState('50');
    const [buying, setBuying] = useState(false);
    const load = useCallback(() => {
        Promise.all([getWallet().catch(() => null), getMySubscription().catch(() => null), getMyKyc().catch(() => null)])
            .then(([w, s, k]) => {
            setWallet(w);
            setSub(s);
            setKyc(k);
        })
            .finally(() => setLoading(false));
    }, []);
    useFocusEffect(useCallback(() => {
        load();
    }, [load]));
    const onBuyPoints = async () => {
        const count = Number(buyPoints);
        if (!Number.isFinite(count) || count < 1) {
            Alert.alert(t('common.error'), t('vendor.pointsRequired'));
            return;
        }
        const rate = sub?.monetization?.pointRechargeRate || 1;
        setBuying(true);
        try {
            await purchasePoints({ points: count, amountPaid: count * rate });
            Alert.alert(t('vendor.pointsAdded'));
            load();
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || t('vendor.pointsFailed'));
        }
        finally {
            setBuying(false);
        }
    };
    if (loading)
        return <Loading />;
    const balance = wallet?.user?.walletBalance ?? sub?.walletBalance ?? 0;
    const points = wallet?.user?.pointBalance ?? sub?.pointBalance ?? 0;
    const plan = sub?.subscription?.plan;
    const planName = plan?.name || t('vendor.noPlan');
    const endDate = sub?.subscription?.endDate;
    const perBooking = sub?.monetization?.pointsPerBooking;
    const menu = [
        { title: t('vendor.listings'), onPress: () => navigation.navigate('VendorListings') },
        { title: t('vendor.pricing'), onPress: () => navigation.navigate('VendorPricing') },
        AVAILABILITY_ROLES.includes(user?.role) ? { title: t('vendor.availability'), onPress: () => navigation.navigate('VendorAvailability') } : null,
        { title: t('vendor.reviews'), onPress: () => navigation.navigate('VendorReviews') },
        (user?.role === 'HOTEL_VENDOR' || user?.role === 'HOMESTAY_VENDOR' || user?.role === 'GUIDE' || user?.role === 'TAXI_OPERATOR' || user?.role === 'DRIVER' || user?.role === 'TENT_OPERATOR' || user?.role === 'HORSE_OPERATOR')
            ? { title: user?.role === 'HOTEL_VENDOR' || user?.role === 'HOMESTAY_VENDOR' ? t('staySubscription.nav') : t('serviceSubscription.title'), onPress: () => navigation.navigate('VendorSubscription') }
            : null,
        (user?.role === 'HOTEL_VENDOR' || user?.role === 'HOMESTAY_VENDOR' || user?.role === 'TENT_OPERATOR')
            ? { title: t('vendorAds.nav'), onPress: () => navigation.navigate('VendorAds') }
            : null,
        { title: t('nav.bookings'), onPress: () => navigation.navigate('MainTabs', { screen: 'Bookings' }) },
    ].filter(Boolean);

    return (
        <Screen>
            <ScrollView>
                <Text style={styles.pageTitle}>{t('vendor.overview')}</Text>
                <Card>
                    <Text style={styles.statLabel}>{t('vendor.balance')}</Text>
                    <Text style={styles.balance}>{formatCurrency(balance)}</Text>
                </Card>
                <Card>
                    <Text style={styles.statLabel}>{t('vendor.points')}</Text>
                    <Text style={styles.statValue}>{points}</Text>
                    {perBooking != null ? <Text style={styles.statHint}>{t('vendor.pointsPerBooking', { count: perBooking })}</Text> : null}
                </Card>
                <Card>
                    <Text style={styles.statLabel}>{t('vendor.subscription')}</Text>
                    <Text style={styles.plan}>
                        {planName}{sub?.subscription?.status ? ` · ${sub.subscription.status}` : ''}
                    </Text>
                    {endDate ? <Text style={styles.statHint}>{t('vendor.until', { date: new Date(endDate).toLocaleDateString('en-IN') })}</Text> : null}
                </Card>
                <Card>
                    <Text style={styles.cardTitle}>{t('vendor.rechargePoints')}</Text>
                    <Field label={t('vendor.points')} value={buyPoints} onChangeText={setBuyPoints} keyboardType="numeric" />
                    <Button title={t('vendor.purchasePoints')} onPress={onBuyPoints} loading={buying} />
                </Card>
                <Card>
                    <Text style={styles.cardTitle}>{t('vendor.recentTransactions')}</Text>
                    {(wallet?.transactions || []).slice(0, 20).map((tx) => (
                        <View key={tx._id} style={styles.tx}>
                            <Text style={styles.txTitle}>{tx.type} · {tx.description || '—'}</Text>
                            <Text style={styles.txMeta}>
                                {tx.amount ? formatCurrency(tx.amount) : ''}{tx.points ? `${tx.amount ? ' · ' : ''}${tx.points} ${t('vendor.points')}` : ''}
                            </Text>
                        </View>
                    ))}
                    {!wallet?.transactions?.length ? <Text style={styles.statHint}>{t('vendor.noTransactions')}</Text> : null}
                </Card>
                <Card>
                    <Text style={styles.statHint}>{t('vendor.kycHint')}</Text>
                    <View style={styles.kycBadge}>
                        <Text style={styles.kycText}>KYC: {kyc?.status || 'PENDING'}</Text>
                    </View>
                    <Button title={t('nav.kyc')} onPress={() => navigation.navigate('VendorKyc')} />
                </Card>
                {menu.map((item) => (
                    <Pressable key={item.title} onPress={item.onPress} style={styles.menu}>
                        <Text style={styles.menuText}>{item.title}</Text>
                        <Text style={styles.chevron}>›</Text>
                    </Pressable>
                ))}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4, marginBottom: 12 },
    statLabel: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
    balance: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.primary, marginTop: 4 },
    statValue: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.text, marginTop: 4 },
    plan: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginTop: 4 },
    statHint: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 4, lineHeight: 18 },
    cardTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text, marginBottom: 8 },
    tx: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    txTitle: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    txMeta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 2 },
    kycBadge: { alignSelf: 'flex-start', backgroundColor: COLORS.primarySoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
    kycText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    menu: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 10,
    },
    menuText: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.primary, flex: 1 },
    chevron: { fontFamily: FONTS.semibold, fontSize: 22, color: COLORS.muted },
});
