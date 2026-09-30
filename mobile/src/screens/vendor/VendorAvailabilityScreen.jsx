import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchMyAvailability, patchListingAvailability } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
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
          <Muted>{t('vendor.availabilityUnavailable')}</Muted>
          <Button title={t('common.cancel')} variant="outline" onPress={() => navigation.goBack()}/>
        </Screen>);
    }
    if (loading && !listings.length)
        return <Loading />;

    return (<Screen>
      <ScrollView>
        <Title>{t('vendor.availability')}</Title>
        <Muted>{t('vendor.availabilityHint')}</Muted>
        {!listings.length ? (<Card>
          <Muted>{t('vendor.noAvailabilityListings')}</Muted>
          <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')}/>
        </Card>) : (<Card>
          <Muted>{t('vendor.selectListing')}</Muted>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
            {listings.map((item) => {
                const on = listingKey(item) === listingKey(selected);
                return (<Pressable key={listingKey(item)} onPress={() => setSelectedKey(listingKey(item))} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: on ? COLORS.primary : COLORS.primarySoft }}>
                  <Text style={{ color: on ? '#fff' : COLORS.primary, fontWeight: '700' }}>{item.name}</Text>
                </Pressable>);
            })}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Button title="‹" variant="outline" onPress={() => {
                const next = shiftMonth(year, month, -1);
                setYear(next.year);
                setMonth(next.month);
            }}/>
            <Text style={{ fontWeight: '800', color: COLORS.text }}>{monthLabel}</Text>
            <Button title="›" variant="outline" onPress={() => {
                const next = shiftMonth(year, month, 1);
                setYear(next.year);
                setMonth(next.month);
            }}/>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {WEEKDAYS.map((key) => (<Text key={key} style={{ width: '14.28%', textAlign: 'center', color: COLORS.muted, fontSize: 12, fontWeight: '700' }}>{t(`vendor.${key}`)}</Text>))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {cells.map((key, index) => {
                const status = dateStatus(key, blocked, booked);
                const isPast = Boolean(key && key < today);
                const backgroundColor = status === 'blocked' ? '#FEE2E2' : status === 'booked' ? '#E0F2FE' : 'transparent';
                const color = status === 'blocked' ? '#991B1B' : status === 'booked' ? '#075985' : COLORS.text;
                return (<Pressable key={key || `pad-${index}`} disabled={!key || busyDate === key} onPress={() => onDay(key)} style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor, opacity: isPast ? 0.4 : 1, borderWidth: key === today ? 2 : 0, borderColor: COLORS.primary }}>
                  <Text style={{ color, fontWeight: '700' }}>{key ? Number(key.slice(-2)) : ''}</Text>
                </Pressable>);
            })}
          </View>
          <Muted>{t('vendor.legendAvailable')} · {t('vendor.legendBlocked')} · {t('vendor.legendBooked')}</Muted>
        </Card>)}
      </ScrollView>
    </Screen>);
}
