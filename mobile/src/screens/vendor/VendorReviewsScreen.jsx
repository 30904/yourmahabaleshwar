import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchVendorReviews } from '../../api/endpoints';
import { Button, Card, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';

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

    return (
        <Screen>
            <ScrollView>
                <Text style={styles.pageTitle}>{t('vendor.reviews')}</Text>
                <Text style={styles.hint}>{t('vendor.reviewsHint')}</Text>
                {!items.length ? (
                    <Card style={styles.empty}>
                        <Text style={styles.emptyText}>{t('vendor.noReviews')}</Text>
                    </Card>
                ) : items.map((item) => (
                    <Card key={item.id}>
                        <Text style={styles.name}>{item.listingName || '—'}</Text>
                        {item.listingType ? <Text style={styles.meta}>{t(`vendor.types.${item.listingType}`, { defaultValue: item.listingType })}</Text> : null}
                        <Text style={styles.stars}>{stars(item.rating)} {item.rating}/5</Text>
                        <Text style={styles.comment}>{item.comment || '—'}</Text>
                        <Text style={styles.meta}>{item.bookingRef || '—'}</Text>
                        {item.createdAt ? <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text> : null}
                        {item.listingId && item.listingType ? <Button title={t('vendor.viewListing')} variant="outline" onPress={() => navigation.navigate('VendorListingForm', { vertical: item.listingType, id: item.listingId })} /> : null}
                    </Card>
                ))}
                {pages > 1 ? (
                    <>
                        <Text style={styles.hint}>{t('vendor.reviewsPage', { page, pages, total })}</Text>
                        <Button title={t('vendor.reviewsPrev')} variant="outline" disabled={page <= 1} onPress={() => setPage((current) => current - 1)} />
                        <Button title={t('vendor.reviewsNext')} variant="outline" disabled={page >= pages} onPress={() => setPage((current) => current + 1)} />
                    </>
                ) : null}
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 12, lineHeight: 20 },
    empty: { alignItems: 'center', paddingVertical: 28 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center' },
    name: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
    meta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 4 },
    stars: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.warning, marginTop: 8 },
    comment: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text, marginTop: 8, lineHeight: 22 },
});
