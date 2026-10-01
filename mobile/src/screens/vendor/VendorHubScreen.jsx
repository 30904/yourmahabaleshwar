import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getMyKyc, getMySubscription, getWallet, purchasePoints } from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
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
    return (<Screen>
      <ScrollView>
      <Title>{t('vendor.overview')}</Title>
      <Card>
        <Muted>{t('vendor.balance')}</Muted>
        <Text style={{ fontWeight: '800', fontSize: 20, color: COLORS.primary, marginTop: 4 }}>{formatCurrency(balance)}</Text>
        <Muted>{t('vendor.points')}</Muted>
        <Text style={{ fontWeight: '800', fontSize: 20, color: COLORS.text, marginTop: 4 }}>{points}</Text>
        {perBooking != null ? <Muted>{t('vendor.pointsPerBooking', { count: perBooking })}</Muted> : null}
        <Muted>{t('vendor.subscription')}</Muted>
        <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 4 }}>
          {planName}{sub?.subscription?.status ? ` · ${sub.subscription.status}` : ''}
        </Text>
        {endDate ? <Muted>{t('vendor.until', { date: new Date(endDate).toLocaleDateString('en-IN') })}</Muted> : null}
      </Card>
      <Card>
        <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('vendor.rechargePoints')}</Text>
        <Field label={t('vendor.points')} value={buyPoints} onChangeText={setBuyPoints} keyboardType="numeric"/>
        <Button title={t('vendor.purchasePoints')} onPress={onBuyPoints} loading={buying}/>
      </Card>
      <Card>
        <Text style={{ fontWeight: '800', color: COLORS.text }}>{t('vendor.recentTransactions')}</Text>
        {(wallet?.transactions || []).slice(0, 20).map((tx) => (<View key={tx._id} style={{ paddingVertical: 8 }}>
          <Text style={{ color: COLORS.text }}>{tx.type} · {tx.description || '—'}</Text>
          <Muted>
            {tx.amount ? formatCurrency(tx.amount) : ''}{tx.points ? `${tx.amount ? ' · ' : ''}${tx.points} ${t('vendor.points')}` : ''}
          </Muted>
        </View>))}
        {!wallet?.transactions?.length ? <Muted>{t('vendor.noTransactions')}</Muted> : null}
      </Card>
      <Card>
        <Muted>{t('vendor.kycHint')}</Muted>
        <Text style={{ fontWeight: '700', marginTop: 6 }}>KYC: {kyc?.status || 'PENDING'}</Text>
        <Button title={t('nav.kyc')} onPress={() => navigation.navigate('VendorKyc')}/>
      </Card>
      <Button title={t('vendor.listings')} variant="outline" onPress={() => navigation.navigate('VendorListings')}/>
      <Button title={t('vendor.pricing')} variant="outline" onPress={() => navigation.navigate('VendorPricing')}/>
      {AVAILABILITY_ROLES.includes(user?.role) ? <Button title={t('vendor.availability')} variant="outline" onPress={() => navigation.navigate('VendorAvailability')}/> : null}
      <Button title={t('vendor.reviews')} variant="outline" onPress={() => navigation.navigate('VendorReviews')}/>
      {(user?.role === 'HOTEL_VENDOR' || user?.role === 'HOMESTAY_VENDOR' || user?.role === 'GUIDE' || user?.role === 'TAXI_OPERATOR' || user?.role === 'DRIVER' || user?.role === 'TENT_OPERATOR' || user?.role === 'HORSE_OPERATOR') ? <Button title={user?.role === 'HOTEL_VENDOR' || user?.role === 'HOMESTAY_VENDOR' ? t('staySubscription.nav') : t('serviceSubscription.title')} variant="outline" onPress={() => navigation.navigate('VendorSubscription')}/> : null}
      {(user?.role === 'HOTEL_VENDOR' || user?.role === 'HOMESTAY_VENDOR' || user?.role === 'TENT_OPERATOR') ? <Button title={t('vendorAds.nav')} variant="outline" onPress={() => navigation.navigate('VendorAds')}/> : null}
      <Button title={t('nav.bookings')} onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}/>
      </ScrollView>
    </Screen>);
}
