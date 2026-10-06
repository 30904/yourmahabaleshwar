import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchMyAvailability, patchListingAvailability } from '../../api/endpoints';
import { Button, Card, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AVAILABILITY_ROLES, dateStatus, listingKey, monthCells, monthWindow, shiftMonth, todayKey } from '../../utils/vendorAvailability';

const WEEKDAYS = ['calMon', 'calTue', 'calWed', 'calThu', 'calFri', 'calSat', 'calSun'];

export default function VendorAvailabilityScreen() {
    const { t, i18n } = useTranslation();
    const navigation = useNavigation();
    const { user } = useAuth();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [listings, setListings] = useState([]);
    const [selectedKey, setSelectedKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [busyDate, setBusyDate] = useState('');
    const { from, to } = useMemo(() => monthWindow(year, month), [year, month]);
    const cells = useMemo(() => monthCells(year, month), [year, month]);
    const today = todayKey();
    const allowed = AVAILABILITY_ROLES.includes(user?.role);

    useEffect(() => {
        if (!allowed) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        setLoading(true);
        fetchMyAvailability(from, to)
            .then((data) => {
            if (cancelled)
                return;
            const next = data?.listings || [];
            setListings(next);
            setSelectedKey((prev) => (prev && next.some((item) => listingKey(item) === prev) ? prev : (next[0] ? listingKey(next[0]) : '')));
        })
            .catch(() => {
            if (!cancelled)
                setListings([]);
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [allowed, from, to]);

    const selected = listings.find((item) => listingKey(item) === selectedKey) || listings[0];
    const blocked = selected?.blockedDates || [];
    const booked = selected?.bookedDates || [];
    const monthLabel = new Date(year, month, 1).toLocaleDateString(i18n.language === 'mr' ? 'mr-IN' : 'en-IN', { month: 'long', year: 'numeric' });

    const onDay = async (key) => {
        if (!selected || !key || busyDate || loading)
            return;
        const status = dateStatus(key, blocked, booked);
        if (status === 'booked') {
            Alert.alert(t('vendor.bookedDateLocked'));
            return;
        }
        if (key < today) {
            Alert.alert(t('vendor.pastDateLocked'));
            return;
        }
        setBusyDate(key);
        try {
            const data = await patchListingAvailability(selected.type, selected.id, {
                blockedDates: [key],
                action: status === 'blocked' ? 'remove' : 'add',
            });
            const nextBlocked = data?.blockedDates || [];
            setListings((prev) => prev.map((item) => (listingKey(item) === listingKey(selected) ? { ...item, blockedDates: nextBlocked } : item)));
            Alert.alert(status === 'blocked' ? t('vendor.dateUnblocked') : t('vendor.dateBlocked'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || t('vendor.availabilitySaveFailed'));
        }
        finally {
            setBusyDate('');
        }
    };

    if (!allowed) {
        return (<Screen>
          <Text style={styles.hint}>{t('vendor.availabilityUnavailable')}</Text>
          <Button title={t('common.cancel')} variant="outline" onPress={() => navigation.goBack()}/>
        </Screen>);
    }
    if (loading && !listings.length)
        return <Loading />;

    return (
        <Screen>
            <ScrollView>
                <Text style={styles.pageTitle}>{t('vendor.availability')}</Text>
                <Text style={styles.hint}>{t('vendor.availabilityHint')}</Text>
                {!listings.length ? (
                    <Card style={styles.empty}>
                        <Text style={styles.emptyText}>{t('vendor.noAvailabilityListings')}</Text>
                        <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')} />
                    </Card>
                ) : (
                    <Card>
                        <Text style={styles.hint}>{t('vendor.selectListing')}</Text>
                        <View style={styles.chips}>
                            {listings.map((item) => {
                                const on = listingKey(item) === listingKey(selected);
                                return (
                                    <Pressable key={listingKey(item)} onPress={() => setSelectedKey(listingKey(item))} style={[styles.chip, on && styles.chipOn]}>
                                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.name}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <View style={styles.monthRow}>
                            <Button title="‹" variant="outline" onPress={() => {
                                const next = shiftMonth(year, month, -1);
                                setYear(next.year);
                                setMonth(next.month);
                            }} />
                            <Text style={styles.month}>{monthLabel}</Text>
                            <Button title="›" variant="outline" onPress={() => {
                                const next = shiftMonth(year, month, 1);
                                setYear(next.year);
                                setMonth(next.month);
                            }} />
                        </View>
                        <View style={styles.week}>
                            {WEEKDAYS.map((key) => <Text key={key} style={styles.weekday}>{t(`vendor.${key}`)}</Text>)}
                        </View>
                        <View style={styles.grid}>
                            {cells.map((key, index) => {
                                const status = dateStatus(key, blocked, booked);
                                const isPast = Boolean(key && key < today);
                                const backgroundColor = status === 'blocked' ? '#FEE2E2' : status === 'booked' ? '#E0F2FE' : 'transparent';
                                const color = status === 'blocked' ? '#991B1B' : status === 'booked' ? '#075985' : COLORS.text;
                                return (
                                    <Pressable key={key || `pad-${index}`} disabled={!key || busyDate === key} onPress={() => onDay(key)} style={[styles.day, { backgroundColor, opacity: isPast ? 0.4 : 1 }, key === today && styles.today]}>
                                        <Text style={[styles.dayText, { color }]}>{key ? Number(key.slice(-2)) : ''}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        <Text style={styles.hint}>{t('vendor.legendAvailable')} · {t('vendor.legendBlocked')} · {t('vendor.legendBooked')}</Text>
                    </Card>
                )}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 8, lineHeight: 20 },
    empty: { alignItems: 'center' },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center', marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
    chipOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    chipText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text },
    chipTextOn: { color: COLORS.primary },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
    month: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
    week: { flexDirection: 'row' },
    weekday: { width: '14.28%', textAlign: 'center', fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.muted },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    day: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    today: { borderWidth: 2, borderColor: COLORS.primary },
    dayText: { fontFamily: FONTS.semibold, fontSize: 14 },
});
