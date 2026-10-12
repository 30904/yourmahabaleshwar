import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useReconnect } from '../../api/useReconnect';
import { useTranslation } from 'react-i18next';
import { fetchMyVendorListing, fetchMyVendorListings, patchVendorListingPrices } from '../../api/endpoints';
import { Button, Field, Loading, Muted, Screen } from '../../components/ui';
import { Hotel } from '../../components/home/icons';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { pricingDraftFromListing, pricingPayloadFromDraft, validatePricingDraft } from '../../utils/vendorPricing';
import { listingImage } from '../../utils/listing';

const listingKey = (item) => `${item.vertical}-${item.id}`;

function PricingFields({ vertical, draft, t, onField, onRow }) {
    const text = (value) => (value == null ? '' : String(value));
    if (vertical === 'HOTEL' || vertical === 'RESORT' || vertical === 'HOMESTAY') {
        if (!draft.rooms?.length)
            return <Muted>{t('vendor.pricingNeedRooms')}</Muted>;
        return draft.rooms.map((room, index) => (<Field key={room.id || index} label={`${room.name} (₹)`} value={text(room.basePrice)} keyboardType="numeric" onChangeText={(value) => onRow('rooms', index, { basePrice: value })}/>));
    }
    if (vertical === 'TENT') {
        return <Field label={t('vendor.pricePerNight')} value={text(draft.pricePerNight)} keyboardType="numeric" onChangeText={(value) => onField('pricePerNight', value)}/>;
    }
    if (vertical === 'GUIDE') {
        return (<>
          <Field label={t('vendor.package6hr')} value={text(draft.package6hr)} keyboardType="numeric" onChangeText={(value) => onField('package6hr', value)}/>
          <Field label={t('vendor.package12hr')} value={text(draft.package12hr)} keyboardType="numeric" onChangeText={(value) => onField('package12hr', value)}/>
          <Field label={t('vendor.bikeAddon')} value={text(draft.bikeAddonPrice)} keyboardType="numeric" onChangeText={(value) => onField('bikeAddonPrice', value)}/>
        </>);
    }
    if (vertical === 'TAXI' || vertical === 'DRIVER') {
        return (<>
          <Field label={t('vendor.perTrip')} value={text(draft.perTripPrice)} keyboardType="numeric" onChangeText={(value) => onField('perTripPrice', value)}/>
          <Field label={t('vendor.hourlyRate')} value={text(draft.hourlyRate)} keyboardType="numeric" onChangeText={(value) => onField('hourlyRate', value)}/>
        </>);
    }
    if (vertical === 'HORSE') {
        if (!draft.routes?.length)
            return <Muted>{t('vendor.pricingNeedRoutes')}</Muted>;
        return draft.routes.map((route, index) => (<Field key={route.id || index} label={`${route.name} (₹)`} value={text(route.price)} keyboardType="numeric" onChangeText={(value) => onRow('routes', index, { price: value })}/>));
    }
    return (<>
      <Field label={t('vendor.priceInr')} value={text(draft.price)} keyboardType="numeric" onChangeText={(value) => onField('price', value)}/>
      <Field label={t('vendor.stock')} value={text(draft.stock)} keyboardType="numeric" onChangeText={(value) => onField('stock', value)}/>
    </>);
}

export default function VendorPricingScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState({});
    const [loading, setLoading] = useState(true);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const load = useCallback(() => {
        if (!user?.role) {
            setRows([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchMyVendorListings(user.role)
            .then(async (list) => {
            const details = await Promise.all(list.map(async (item) => {
                try {
                    const detail = await fetchMyVendorListing(item.vertical, item.id);
                    return { ...item, detail };
                }
                catch {
                    return { ...item, detail: item };
                }
            }));
            const next = {};
            details.forEach((item) => {
                next[listingKey(item)] = pricingDraftFromListing(item.vertical, item.detail || item);
            });
            setRows(details);
            setDrafts(next);
        })
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, [user?.role]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));
    useReconnect(load);

    const setRowField = (key, field, value, index) => {
        setDrafts((prev) => {
            const current = prev[key] || {};
            if (field === 'rooms' || field === 'routes') {
                const list = [...(current[field] || [])];
                list[index] = { ...list[index], ...value };
                return { ...prev, [key]: { ...current, [field]: list } };
            }
            return { ...prev, [key]: { ...current, [field]: value } };
        });
    };

    const onSave = async (item) => {
        const key = listingKey(item);
        const draft = drafts[key] || {};
        const invalid = validatePricingDraft(item.vertical, draft);
        if (invalid) {
            Alert.alert(t('common.error'), invalid);
            return;
        }
        setSaving((prev) => ({ ...prev, [key]: true }));
        try {
            await patchVendorListingPrices(item.vertical, item.id, pricingPayloadFromDraft(item.vertical, draft));
            Alert.alert(t('vendor.pricingSaved'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || t('vendor.pricingSaveFailed'));
        }
        finally {
            setSaving((prev) => ({ ...prev, [key]: false }));
        }
    };

    if (loading)
        return <Loading />;

    const count = rows.length;

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.band}>
                    <View style={styles.bandRow}>
                        <Text style={styles.pageTitle}>{t('vendor.pricing')}</Text>
                        <View style={styles.countPill}>
                            <Text style={styles.countPillText}>{t(count === 1 ? 'vendor.pillListingOne' : 'vendor.pillListings', { count })}</Text>
                        </View>
                    </View>
                </View>
                <Text style={styles.note}>{t('vendor.pricingHint')}</Text>
                <View style={styles.content}>
                    {!rows.length ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>{t('vendor.noPricingListings')}</Text>
                        <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')} style={styles.saveBtn} />
                    </View>
                    ) : rows.map((item) => {
                    const key = listingKey(item);
                    const draft = drafts[key] || {};
                    const image = listingImage(item);
                    return (
                        <View key={key} style={styles.card}>
                            <View style={styles.cardMain}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.thumb} />
                                ) : (
                                    <View style={styles.thumbFallback}>
                                        <Hotel size={26} color={COLORS.primary} strokeWidth={2} />
                                    </View>
                                )}
                                <View style={styles.body}>
                                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.type} numberOfLines={1}>{t(item.labelKey)}</Text>
                                </View>
                            </View>
                            <PricingFields vertical={item.vertical} draft={draft} t={t} onField={(field, value) => setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))} onRow={(field, index, value) => setRowField(key, field, value, index)} />
                            <Button title={t('vendor.savePrices')} onPress={() => onSave(item)} loading={!!saving[key]} style={styles.saveBtn} />
                        </View>
                    );
                })}
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    page: { paddingBottom: 24 },
    band: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
    bandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pageTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 26, color: '#fff', letterSpacing: -0.4 },
    countPill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    countPillText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    note: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, lineHeight: 20, paddingHorizontal: 16, paddingTop: 12 },
    content: { paddingHorizontal: 16, paddingTop: 4 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginTop: 12,
    },
    cardMain: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: COLORS.primarySoft },
    thumbFallback: {
        width: 72,
        height: 72,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { flex: 1, justifyContent: 'center' },
    name: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    type: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 4 },
    saveBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        elevation: 0,
        shadowOpacity: 0,
        ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
    },
    empty: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, marginTop: 12, paddingHorizontal: 16 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center', marginBottom: 8 },
});
