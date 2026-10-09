import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { getMySubscription, getWallet, purchasePoints } from '../../api/endpoints';
import { useReconnect } from '../../api/useReconnect';
import { Button, Card, Field, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';

export default function VendorWalletScreen() {
    const { t } = useTranslation();
    const [wallet, setWallet] = useState(null);
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [buyPoints, setBuyPoints] = useState('50');
    const [buying, setBuying] = useState(false);

    const load = useCallback(() => {
        Promise.all([getWallet().catch(() => null), getMySubscription().catch(() => null)])
            .then(([w, s]) => {
                setWallet(w);
                setSub(s);
            })
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));
    useReconnect(load);

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

    if (loading) return <Loading />;

    const balance = wallet?.user?.walletBalance ?? sub?.walletBalance ?? 0;
    const points = wallet?.user?.pointBalance ?? sub?.pointBalance ?? 0;
    const plan = sub?.subscription?.plan;
    const planName = plan?.name || t('vendor.noPlan');
    const endDate = sub?.subscription?.endDate;
    const perBooking = sub?.monetization?.pointsPerBooking;

    return (
        <Screen>
            <ScrollView>
                <Text style={styles.pageTitle}>{t('nav.wallet')}</Text>
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
                    <Text style={styles.plan}>{planName}{sub?.subscription?.status ? ` · ${sub.subscription.status}` : ''}</Text>
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
});
