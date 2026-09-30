import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getWishlist, removeWishlist } from '../../api/endpoints';
import { Button, Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
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

    return (<Screen>
      <Title>{t('account.favorites')}</Title>
      <Muted>{t('account.favoritesHint')}</Muted>
      <FlatList
        data={items}
        keyExtractor={(row) => `${row.itemType}-${row.item?._id}`}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Muted>{t('account.noFavorites')}</Muted>}
        renderItem={({ item: row }) => {
            const listing = row.item || {};
            const path = wishlistPath(row.itemType);
            const price = listingPrice(listing);
            return (<Card>
              <Pressable onPress={() => path && listing.slug && navigation.navigate('ListingDetail', { path, slug: listing.slug, type: row.itemType })}>
                <Text style={{ fontWeight: '800', color: COLORS.primary }}>{listing.name}</Text>
                <Muted>{row.itemType}{price != null ? ` · ${formatCurrency(price)}` : ''}</Muted>
              </Pressable>
              <Button title={t('account.removeListing')} variant="outline" onPress={async () => {
                await removeWishlist(listing._id, row.itemType);
                load();
              }} />
            </Card>);
        }}
      />
    </Screen>);
}
