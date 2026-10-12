import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useReconnect } from '../../api/useReconnect';
import { useTranslation } from 'react-i18next';
import { fetchMyVendorListings } from '../../api/endpoints';
import { Button, Loading, Screen } from '../../components/ui';
import { Hotel } from '../../components/home/icons';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { listingImage } from '../../utils/listing';
import { canVendorEditListing, listingStatusOf } from '../../utils/vendorListingForm';

const STATUS_FILTERS = ['APPROVED', 'PENDING', 'REJECTED'];
const SINGLE_LISTING_ROLES = new Set([
    'HOTEL_VENDOR',
    'HOMESTAY_VENDOR',
    'TENT_OPERATOR',
    'GUIDE',
    'TAXI_OPERATOR',
    'DRIVER',
    'HORSE_OPERATOR',
]);

const STATUS_TONE = {
    APPROVED: { bg: '#F0FDF4', fg: COLORS.success },
    PENDING: { bg: '#FFFBEB', fg: COLORS.warning },
    REJECTED: { bg: '#FEF2F2', fg: COLORS.danger },
};

export default function VendorListingsScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(null);

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

    const load = useCallback(() => {
        if (!user?.role) {
            setItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchMyVendorListings(user.role)
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [user?.role]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));
    useReconnect(load);

    const filtered = useMemo(() => {
        if (!statusFilter)
            return items;
        return items.filter((item) => listingStatusOf(item) === statusFilter);
    }, [items, statusFilter]);

    if (loading && !items.length)
        return <Loading />;

    const singleLocked = SINGLE_LISTING_ROLES.has(user?.role) && items.length >= 1;
    const statusLabel = {
        APPROVED: t('vendor.listingApproved'),
        PENDING: t('vendor.listingPending'),
        REJECTED: t('vendor.listingRejected'),
    };
    const count = filtered.length;

    return (
        <Screen style={styles.screen}>
            <FlatList
                style={styles.list}
                contentContainerStyle={styles.page}
                data={filtered}
                keyExtractor={(item) => `${item.vertical}-${item.id}`}
                refreshing={loading}
                onRefresh={load}
                ListHeaderComponent={(
                    <View>
                        <View style={styles.band}>
                            <View style={styles.bandRow}>
                                <Text style={styles.pageTitle}>{t('vendor.listings')}</Text>
                                <View style={styles.countPill}>
                                    <Text style={styles.countPillText}>{t(count === 1 ? 'vendor.pillListingOne' : 'vendor.pillListings', { count })}</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.note}>{singleLocked ? t('vendor.singleListingHint') : t('vendor.listingsHint')}</Text>
                        <View style={styles.filters}>
                            {STATUS_FILTERS.map((status) => {
                                const on = statusFilter === status;
                                return (
                                    <Pressable
                                        key={status}
                                        onPress={() => setStatusFilter((current) => (current === status ? null : status))}
                                        style={[styles.chip, on && styles.chipOn]}
                                    >
                                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{statusLabel[status]}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        {!singleLocked ? (
                            <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')} style={styles.createBtn} />
                        ) : null}
                    </View>
                )}
                ListEmptyComponent={(
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>{items.length ? t('vendor.noListingsForFilter') : t('vendor.noListings')}</Text>
                    </View>
                )}
                renderItem={({ item }) => {
                    const status = listingStatusOf(item);
                    const tone = STATUS_TONE[status] || STATUS_TONE.PENDING;
                    const price = item.prices?.from != null ? `${t('vendor.fromPrice')} ${formatCurrency(item.prices.from)}` : '—';
                    const editable = canVendorEditListing(item);
                    const image = listingImage(item);
                    return (
                        <View style={styles.card}>
                            <View style={styles.cardMain}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.thumb} />
                                ) : (
                                    <View style={styles.thumbFallback}>
                                        <Hotel size={26} color={COLORS.primary} strokeWidth={2} />
                                    </View>
                                )}
                                <View style={styles.body}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                                        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                                            <Text style={[styles.badgeText, { color: tone.fg }]}>{statusLabel[status]}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.meta} numberOfLines={1}>{t(item.labelKey)}</Text>
                                        <Text style={styles.price}>{price}</Text>
                                    </View>
                                    {editable ? (
                                        <Pressable
                                            style={styles.editBtn}
                                            onPress={() => navigation.navigate('VendorListingForm', { vertical: item.vertical, id: item.id })}
                                        >
                                            <Text style={styles.editText}>{t('vendor.editListing', { kind: t(item.labelKey) })}</Text>
                                        </Pressable>
                                    ) : (
                                        <Text style={styles.locked} numberOfLines={1}>{t('vendor.listingEditLocked')}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    );
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    list: { flex: 1 },
    page: { paddingBottom: 24 },
    band: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
    bandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pageTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 26, color: '#fff', letterSpacing: -0.4 },
    countPill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    countPillText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    note: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, lineHeight: 20, paddingHorizontal: 16, paddingTop: 12 },
    filters: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 4, paddingHorizontal: 16 },
    chip: {
        borderRadius: 999,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.body },
    chipTextOn: { fontFamily: FONTS.semibold, color: '#fff' },
    createBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 0,
        marginTop: 12,
        marginHorizontal: 16,
        elevation: 0,
        shadowOpacity: 0,
        ...Platform.select({ web: { boxShadow: 'none' }, default: {} }),
    },
    empty: { alignItems: 'center', paddingVertical: 28, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, marginTop: 12, marginHorizontal: 16 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginTop: 12,
        marginHorizontal: 16,
    },
    cardMain: { flexDirection: 'row', gap: 12 },
    thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: COLORS.primarySoft },
    thumbFallback: {
        width: 72,
        height: 72,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { flex: 1, fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    meta: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
    price: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 10, letterSpacing: 0.2 },
    editBtn: {
        alignSelf: 'flex-start',
        marginTop: 8,
        minHeight: 32,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.primary },
    locked: { fontFamily: FONTS.regular, fontSize: 11, color: '#94A3B8', marginTop: 4 },
});
