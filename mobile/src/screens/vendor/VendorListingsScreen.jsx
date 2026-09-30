import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchMyVendorListings } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
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

function statusColor(status) {
    if (status === 'APPROVED')
        return COLORS.success;
    if (status === 'REJECTED')
        return COLORS.danger;
    return COLORS.accent;
}

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

    return (<Screen>
      <Title>{t('vendor.listings')}</Title>
      <Muted>{singleLocked ? t('vendor.singleListingHint') : t('vendor.listingsHint')}</Muted>
      {!singleLocked ? <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')}/> : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${item.vertical}-${item.id}`}
        refreshing={loading}
        onRefresh={load}
        ListHeaderComponent={<Card>
          {STATUS_FILTERS.map((status) => (<Button key={status} title={statusLabel[status]} variant={statusFilter === status ? 'primary' : 'outline'} onPress={() => setStatusFilter((current) => (current === status ? null : status))}/>))}
        </Card>}
        ListEmptyComponent={<Muted>{items.length ? t('vendor.noListingsForFilter') : t('vendor.noListings')}</Muted>}
        renderItem={({ item }) => {
            const status = listingStatusOf(item);
            return (<Card>
              <Text style={{ fontWeight: '800', color: COLORS.text }}>{item.name}</Text>
              <Muted>{t(item.labelKey)}</Muted>
              <Muted>{item.slug || '—'}</Muted>
              <Text style={{ fontWeight: '800', color: COLORS.primary, marginTop: 6 }}>
                {item.prices?.from != null ? `${t('vendor.fromPrice')} ${formatCurrency(item.prices.from)}` : '—'}
              </Text>
              <Text style={{ fontWeight: '700', color: statusColor(status), marginTop: 4 }}>{statusLabel[status]}</Text>
              {canVendorEditListing(item) ? <Button title={t('vendor.editListing', { kind: t(item.labelKey) })} variant="outline" onPress={() => navigation.navigate('VendorListingForm', { vertical: item.vertical, id: item.id })}/> : <Muted>{t('vendor.listingEditLocked')}</Muted>}
            </Card>);
        }}
      />
    </Screen>);
}
