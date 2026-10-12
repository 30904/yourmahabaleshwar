import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useReconnect } from '../../api/useReconnect';
import { useTranslation } from 'react-i18next';
import { fetchVendorReviews } from '../../api/endpoints';
import VendorPageBand from '../../components/VendorPageBand';
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

    useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

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
    useReconnect(load);

    if (loading && !items.length)
        return <Loading />;

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <VendorPageBand
                    title={t('vendor.reviews')}
                    pill={t(total === 1 ? 'vendor.pillReviewOne' : 'vendor.pillReviews', { count: total })}
                    line={t('vendor.reviewsHint')}
                />
                <View style={styles.content}>
                {!items.length ? (
                    <Card style={styles.empty}>
                        <Text style={styles.emptyText}>{t('vendor.noReviews')}</Text>
                    </Card>
                ) : items.map((item) => (
                    <Card key={item.id}>
                        <View style={styles.head}>
                            <View style={styles.copy}>
                                <Text style={styles.name} numberOfLines={2}>{item.listingName || '—'}</Text>
                                {item.listingType ? <Text style={styles.meta}>{t(`vendor.types.${item.listingType}`, { defaultValue: item.listingType })}</Text> : null}
                            </View>
                            <Text style={styles.stars}>{stars(item.rating)} {item.rating}/5</Text>
                        </View>
                        <Text style={styles.comment}>{item.comment || '—'}</Text>
                        <View style={styles.foot}>
                            <Text style={styles.meta}>{item.bookingRef || '—'}</Text>
                            {item.createdAt ? <Text style={styles.meta}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text> : null}
                        </View>
                        {item.listingId && item.listingType ? (
                            <Pressable
                                style={styles.viewBtn}
                                onPress={() => navigation.navigate('VendorListingForm', { vertical: item.listingType, id: item.listingId })}
                            >
                                <Text style={styles.viewText}>{t('vendor.viewListing')}</Text>
                            </Pressable>
                        ) : null}
                    </Card>
                ))}
                {pages > 1 ? (
                    <View style={styles.pager}>
                        <Text style={styles.hint}>{t('vendor.reviewsPage', { page, pages, total })}</Text>
                        <View style={styles.pagerRow}>
                            <Button title={t('vendor.reviewsPrev')} variant="outline" disabled={page <= 1} onPress={() => setPage((current) => current - 1)} style={styles.pageBtn} />
                            <Button title={t('vendor.reviewsNext')} variant="outline" disabled={page >= pages} onPress={() => setPage((current) => current + 1)} style={styles.pageBtn} />
                        </View>
                    </View>
                ) : null}
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0 },
    page: { paddingBottom: 24 },
    content: { paddingHorizontal: 16, paddingTop: 14 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 12, lineHeight: 20 },
    empty: { alignItems: 'center', paddingVertical: 28 },
    emptyText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.muted, textAlign: 'center' },
    head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
    copy: { flex: 1 },
    name: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text },
    meta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 2 },
    stars: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.warning },
    comment: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text, marginTop: 10, lineHeight: 22 },
    foot: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 10 },
    viewBtn: {
        alignSelf: 'flex-start',
        marginTop: 12,
        minHeight: 36,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.primary },
    pager: { marginTop: 4 },
    pagerRow: { flexDirection: 'row', gap: 8 },
    pageBtn: { flex: 1 },
});
