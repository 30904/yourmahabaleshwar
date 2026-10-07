import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchMyVendorListings } from '../../api/endpoints';
import { Button, Card, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
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

    return (
        <Screen>
            <FlatList
                style={styles.list}
                data={filtered}
                keyExtractor={(item) => `${item.vertical}-${item.id}`}
                refreshing={loading}
                onRefresh={load}
                ListHeaderComponent={(
                    <View>
                        <Text style={styles.pageTitle}>{t('vendor.listings')}</Text>
                        <Text style={styles.hint}>{singleLocked ? t('vendor.singleListingHint') : t('vendor.listingsHint')}</Text>
                        <View style={styles.filters}>
                            {STATUS_FILTERS.map((status) => {
                                const on = statusFilter === status;
                                const tone = STATUS_TONE[status];
                                return (
                                    <Pressable key={status} onPress={() => setStatusFilter((current) => (current === status ? null : status))} style={[styles.filter, on && { backgroundColor: tone.fg, borderColor: tone.fg }]}>
                                        <Text style={[styles.filterText, on && styles.filterTextOn]}>{statusLabel[status]}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        {!singleLocked ? <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')} /> : null}
                    </View>
                )}
                ListEmptyComponent={(
                    <Card style={styles.empty}>
                        <Text style={styles.emptyText}>{items.length ? t('vendor.noListingsForFilter') : t('vendor.noListings')}</Text>
                    </Card>
                )}
                renderItem={({ item }) => {
                    const status = listingStatusOf(item);
                    const tone = STATUS_TONE[status] || STATUS_TONE.PENDING;
                    return (
                        <Card>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.meta}>{t(item.labelKey)}</Text>
                            <Text style={styles.meta}>{item.slug || '—'}</Text>
                            <Text style={styles.price}>
                                {item.prices?.from != null ? `${t('vendor.fromPrice')} ${formatCurrency(item.prices.from)}` : '—'}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                                <Text style={[styles.badgeText, { color: tone.fg }]}>{statusLabel[status]}</Text>
                            </View>
                            {canVendorEditListing(item) ? <Button title={t('vendor.editListing', { kind: t(item.labelKey) })} variant="outline" onPress={() => navigation.navigate('VendorListingForm', { vertical: item.vertical, id: item.id })} /> : <Text style={styles.meta}>{t('vendor.listingEditLocked')}</Text>}
                        </Card>
                    );
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    list: { flex: 1 },
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 12, lineHeight: 20 },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    filter: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    filterText: { fontFamily: FONTS.semibold, fontSize: 13, color: '#475569' },
    filterTextOn: { color: '#fff' },
    empty: { alignItems: 'center', paddingVertical: 28 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center' },
    name: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
    meta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 4 },
    price: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary, marginTop: 8 },
    badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 12 },
});
