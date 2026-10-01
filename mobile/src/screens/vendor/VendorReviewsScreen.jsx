import React, { useCallback, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchVendorReviews } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';

function stars(rating) {
    const value = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    return `${'★'.repeat(value)}${'☆'.repeat(5 - value)}`;
}

export default function VendorReviewsScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        fetchVendorReviews({ page, limit: 20 })
            .then((data) => {
            setItems(data?.items || []);
            setPages(data?.pages || 0);
            setTotal(data?.total || 0);
        })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [page]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));

    if (loading && !items.length)
        return <Loading />;

    return (<Screen>
      <ScrollView>
        <Title>{t('vendor.reviews')}</Title>
        <Muted>{t('vendor.reviewsHint')}</Muted>
        {!items.length ? <Muted>{t('vendor.noReviews')}</Muted> : items.map((item) => (<Card key={item.id}>
          <Text style={{ fontWeight: '800', color: COLORS.text }}>{item.listingName || '—'}</Text>
          {item.listingType ? <Muted>{t(`vendor.types.${item.listingType}`, { defaultValue: item.listingType })}</Muted> : null}
          <Text style={{ color: '#B45309', fontWeight: '700', marginTop: 6 }}>{stars(item.rating)} {item.rating}/5</Text>
          <Text style={{ color: COLORS.text, marginTop: 6 }}>{item.comment || '—'}</Text>
          <Muted>{item.bookingRef || '—'}</Muted>
          {item.createdAt ? <Muted>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Muted> : null}
          {item.listingId && item.listingType ? <Button title={t('vendor.viewListing')} variant="outline" onPress={() => navigation.navigate('VendorListingForm', { vertical: item.listingType, id: item.listingId })}/> : null}
        </Card>))}
        {pages > 1 ? (<>
          <Muted>{t('vendor.reviewsPage', { page, pages, total })}</Muted>
          <Button title={t('vendor.reviewsPrev')} variant="outline" disabled={page <= 1} onPress={() => setPage((current) => current - 1)}/>
          <Button title={t('vendor.reviewsNext')} variant="outline" disabled={page >= pages} onPress={() => setPage((current) => current + 1)}/>
        </>) : null}
      </ScrollView>
    </Screen>);
}
