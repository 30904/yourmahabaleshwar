import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchMyAvailability, patchListingAvailability } from '../../api/endpoints';
import { useReconnect } from '../../api/useReconnect';
import VendorPageBand from '../../components/VendorPageBand';
import { Button, Card, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AVAILABILITY_ROLES, dateStatus, listingKey, monthCells, monthWindow, shiftMonth, todayKey } from '../../utils/vendorAvailability';

const WEEKDAYS = ['calMon', 'calTue', 'calWed', 'calThu', 'calFri', 'calSat', 'calSun'];

const webSelect = {
    width: '100%',
    marginTop: 6,
    border: '1px solid #E2E8F0',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: '10px 12px',
    fontSize: 14,
    color: '#0F172A',
    fontFamily: 'Inter, sans-serif',
};

function ListingPicker({ label, listings, value, onChange }) {
    const [open, setOpen] = useState(false);
    const current = listings.find((item) => listingKey(item) === value);
    if (Platform.OS === 'web') {
        return (
            <View>
                <Text style={styles.hint}>{label}</Text>
                {React.createElement('select', {
                    value: value || '',
                    onChange: (event) => onChange(event.target.value),
                    style: webSelect,
                }, listings.map((item) => React.createElement('option', {
                    key: listingKey(item),
                    value: listingKey(item),
                }, item.name)))}
            </View>
        );
    }
    return (
        <View>
            <Text style={styles.hint}>{label}</Text>
            <Pressable style={styles.selectBox} onPress={() => setOpen(true)}>
                <Text style={styles.selectText} numberOfLines={1}>{current?.name || ''}</Text>
            </Pressable>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
                    <View style={styles.modalCard}>
                        <ScrollView>
                            {listings.map((item) => (
                                <Pressable
                                    key={listingKey(item)}
                                    style={styles.modalRow}
                                    onPress={() => {
                                        onChange(listingKey(item));
                                        setOpen(false);
                                    }}
                                >
                                    <Text style={styles.selectText}>{item.name}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </View>
    );
}

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
    const [onlineTick, setOnlineTick] = useState(0);
    useReconnect(useCallback(() => setOnlineTick((n) => n + 1), []));
    const [busyDate, setBusyDate] = useState('');
    const { from, to } = useMemo(() => monthWindow(year, month), [year, month]);
    const cells = useMemo(() => monthCells(year, month), [year, month]);
    const today = todayKey();
    const allowed = AVAILABILITY_ROLES.includes(user?.role);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

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
    }, [allowed, from, to, onlineTick]);

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
        return (
            <Screen style={styles.screen}>
                <VendorPageBand title={t('vendor.availability')} line={t('vendor.availabilityUnavailable')} />
            </Screen>
        );
    }
    if (loading && !listings.length)
        return <Loading />;

    const count = listings.length;

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <VendorPageBand
                    title={t('vendor.availability')}
                    pill={t(count === 1 ? 'vendor.pillListingOne' : 'vendor.pillListings', { count })}
                    line={t('vendor.availabilityHint')}
                />
                <View style={styles.content}>
                {!listings.length ? (
                    <Card style={styles.empty}>
                        <Text style={styles.emptyText}>{t('vendor.noAvailabilityListings')}</Text>
                        <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')} />
                    </Card>
                ) : (
                    <Card>
                        <ListingPicker
                            label={t('vendor.selectListing')}
                            listings={listings}
                            value={listingKey(selected)}
                            onChange={setSelectedKey}
                        />
                        <View style={styles.monthRow}>
                            <Pressable style={styles.monthBtn} onPress={() => {
                                const next = shiftMonth(year, month, -1);
                                setYear(next.year);
                                setMonth(next.month);
                            }}>
                                <Text style={styles.monthBtnText}>‹</Text>
                            </Pressable>
                            <Text style={styles.month}>{monthLabel}</Text>
                            <Pressable style={styles.monthBtn} onPress={() => {
                                const next = shiftMonth(year, month, 1);
                                setYear(next.year);
                                setMonth(next.month);
                            }}>
                                <Text style={styles.monthBtnText}>›</Text>
                            </Pressable>
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
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    page: { paddingBottom: 24 },
    content: { paddingHorizontal: 16, paddingTop: 14 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 8, lineHeight: 20 },
    empty: { alignItems: 'center' },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center', marginBottom: 8 },
    selectBox: { marginTop: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 12 },
    selectText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 12, maxHeight: 420, overflow: 'hidden' },
    modalRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8, gap: 8 },
    monthBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    monthBtnText: { fontFamily: FONTS.semibold, fontSize: 20, color: COLORS.primary, lineHeight: 22 },
    month: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
    week: { flexDirection: 'row' },
    weekday: { width: '14.28%', textAlign: 'center', fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.muted },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    day: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
    today: { borderWidth: 2, borderColor: COLORS.primary },
    dayText: { fontFamily: FONTS.semibold, fontSize: 14 },
});
