import React, { useCallback, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getMyKyc, getMySubscription, getWallet } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
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
        <Muted>{t('vendor.kycHint')}</Muted>
        <Text style={{ fontWeight: '700', marginTop: 6 }}>KYC: {kyc?.status || 'PENDING'}</Text>
        <Button title={t('nav.kyc')} onPress={() => navigation.navigate('VendorKyc')}/>
      </Card>
      <Button title={t('vendor.listings')} variant="outline" onPress={() => navigation.navigate('VendorListings')}/>
      <Button title={t('vendor.pricing')} variant="outline" onPress={() => navigation.navigate('VendorPricing')}/>
      {AVAILABILITY_ROLES.includes(user?.role) ? <Button title={t('vendor.availability')} variant="outline" onPress={() => navigation.navigate('VendorAvailability')}/> : null}
      <Button title={t('nav.bookings')} onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}/>
      </ScrollView>
    </Screen>);
}
