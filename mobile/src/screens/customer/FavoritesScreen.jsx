import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getWishlist, removeWishlist } from '../../api/endpoints';
import { Button, Card, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';
import { listingPrice, wishlistPath } from '../../utils/listing';

export default function FavoritesScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const data = await getWishlist();
            setItems(Array.isArray(data) ? data : []);
        }
        catch {
            setItems([]);
        }
        finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        load();
    }, []));

    if (loading && !items.length)
        return <Loading />;

    return (
        <Screen>
            <Text style={styles.pageTitle}>{t('account.favorites')}</Text>
            <Text style={styles.hint}>{t('account.favoritesHint')}</Text>
            <FlatList
                style={styles.list}
                data={items}
                keyExtractor={(row) => `${row.itemType}-${row.item?._id}`}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                ListEmptyComponent={(
                    <Card style={styles.empty}>
                        <Text style={styles.emptyText}>{t('account.noFavorites')}</Text>
                    </Card>
                )}
                renderItem={({ item: row }) => {
                    const listing = row.item || {};
                    const path = wishlistPath(row.itemType);
                    const price = listingPrice(listing);
                    const open = () => {
                        if (!path || !listing.slug) return;
                        navigation.navigate('ListingDetail', { path, slug: listing.slug, type: row.itemType });
                    };
                    return (
                        <Card>
                            <View style={styles.row}>
                                <Pressable style={styles.main} onPress={open}>
                                    <Text style={styles.name}>{listing.name}</Text>
                                    <Text style={styles.meta}>
                                        {row.itemType}{price != null ? ` · ${formatCurrency(price)}` : ''}
                                    </Text>
                                </Pressable>
                                <Button
                                    title={t('account.removeListing')}
                                    variant="outline"
                                    onPress={async () => {
                                        await removeWishlist(listing._id, row.itemType);
                                        load();
                                    }}
                                />
                            </View>
                        </Card>
                    );
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    pageTitle: {
        fontFamily: FONTS.bold,
        fontSize: 22,
        color: COLORS.text,
        letterSpacing: -0.3,
    },
    hint: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: COLORS.muted,
        marginTop: 4,
        marginBottom: 12,
    },
    list: { flex: 1 },
    empty: { alignItems: 'center', paddingVertical: 28 },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 15,
        color: COLORS.muted,
        textAlign: 'center',
    },
    row: { gap: 8 },
    main: { marginBottom: 4 },
    name: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.primary },
    meta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 4 },
});
