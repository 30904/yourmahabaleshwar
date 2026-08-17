import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { getMyKyc, getMySubscription, getWallet } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';
export default function VendorHubScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [wallet, setWallet] = useState(null);
    const [sub, setSub] = useState(null);
    const [kyc, setKyc] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([getWallet().catch(() => null), getMySubscription().catch(() => null), getMyKyc().catch(() => null)])
            .then(([w, s, k]) => {
            setWallet(w);
            setSub(s);
            setKyc(k);
        })
            .finally(() => setLoading(false));
    }, []);
    if (loading)
        return <Loading />;
    return (<Screen>
      <Title>{t('vendor.overview')}</Title>
      <Card>
        <Muted>{t('vendor.walletHint')}</Muted>
        <Text style={{ fontWeight: '800', fontSize: 20, color: COLORS.primary, marginTop: 8 }}>
          {t('vendor.balance')}: {formatCurrency(wallet?.walletBalance ?? wallet?.balance ?? 0)}
        </Text>
        <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 4 }}>
          {t('vendor.points')}: {wallet?.pointBalance ?? wallet?.points ?? 0}
        </Text>
        {sub && <Muted>Subscription: {sub.status || sub.plan?.name || '—'}</Muted>}
      </Card>
      <Card>
        <Muted>{t('vendor.kycHint')}</Muted>
        <Text style={{ fontWeight: '700', marginTop: 6 }}>KYC: {kyc?.status || 'PENDING'}</Text>
        <Button title={t('nav.kyc')} onPress={() => navigation.navigate('VendorKyc')}/>
      </Card>
      <Button title={t('nav.bookings')} onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}/>
    </Screen>);
}
