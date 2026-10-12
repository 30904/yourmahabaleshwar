import React, { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getWishlist, removeWishlist } from '../../api/endpoints';
import { isNetworkError } from '../../api/network';
import { useReconnect } from '../../api/useReconnect';
import { useConfirm } from '../../components/confirm';
import { Car, Heart, Home, Hotel, Tent, Trees, Users } from '../../components/home/icons';
import { Button, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { listingImage, listingPlace, listingPrice, wishlistPath } from '../../utils/listing';

const TYPE_ICON = {
    HOTEL: Hotel,
    RESORT: Hotel,
    HOMESTAY: Home,
    TENT: Tent,
    GUIDE: Users,
    TAXI: Car,
    DRIVER: Car,
    HORSE: Trees,
};

function typeLabel(type) {
    return String(type || '')
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FavoritesScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { isVendor } = useAuth();
    const confirm = useConfirm();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getWishlist();
            setItems(Array.isArray(data) ? data : []);
        }
        catch (error) {
            if (!isNetworkError(error)) setItems([]);
        }
        finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));
    useReconnect(load);

    const askRemove = (listing, itemType) => {
        confirm({
            title: t('account.removeListing'),
            message: t('account.removeSavedAsk'),
            cancelText: t('common.cancel'),
            confirmText: t('account.removeListing'),
            destructive: true,
            onConfirm: async () => {
                await removeWishlist(listing._id, itemType);
                load();
            },
        });
    };

    if (loading && !items.length) return <Loading />;

    const count = items.length;

    return (
        <Screen style={{ padding: 0 }}>
            <FlatList
                style={styles.list}
                contentContainerStyle={styles.listContent}
                data={items}
                keyExtractor={(row) => `${row.itemType}-${row.item?._id}`}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
                ListHeaderComponent={(
                    <View style={styles.band}>
                        <View style={styles.bandRow}>
                            <Text style={styles.pageTitle}>{t('account.favorites')}</Text>
                            <View style={styles.countPill}>
                                <Text style={styles.countPillText}>{t('account.savedCount', { count })}</Text>
                            </View>
                        </View>
                        <Text style={styles.countLine}>{t(count === 1 ? 'account.savedLineOne' : 'account.savedLine', { count })}</Text>
                    </View>
                )}
                ListEmptyComponent={(
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>{t('account.noFavorites')}</Text>
                        <Button title={t('account.browseHome')} onPress={() => navigation.navigate(isVendor ? 'Overview' : 'HomeTab')} style={styles.browse} />
                    </View>
                )}
                renderItem={({ item: row }) => {
                    const listing = row.item || {};
                    const path = wishlistPath(row.itemType);
                    const price = listingPrice(listing);
                    const image = listingImage(listing);
                    const Icon = TYPE_ICON[row.itemType] || Hotel;
                    const open = () => {
                        if (!path || !listing.slug) return;
                        navigation.navigate('ListingDetail', { path, slug: listing.slug, type: row.itemType });
                    };
                    return (
                        <View style={styles.card}>
                            <View style={styles.thumbWrap}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.thumb} />
                                ) : (
                                    <View style={styles.thumbFallback}>
                                        <Icon size={26} color={COLORS.primary} strokeWidth={2} />
                                    </View>
                                )}
                            </View>
                            <Pressable style={styles.body} onPress={open}>
                                <Text style={styles.name} numberOfLines={1}>{listing.name}</Text>
                                <View style={styles.typePill}>
                                    <Text style={styles.typeText}>{typeLabel(row.itemType)}</Text>
                                </View>
                                <View style={styles.metaRow}>
                                    <Text style={styles.place} numberOfLines={1}>{listingPlace(listing, row.itemType)}</Text>
                                    {price != null ? <Text style={styles.price}>{formatCurrency(price)}</Text> : null}
                                </View>
                            </Pressable>
                            <Pressable
                                style={styles.heart}
                                onPress={() => askRemove(listing, row.itemType)}
                                accessibilityLabel={t('account.removeListing')}
                            >
                                <Heart size={18} color="#EF4444" fill="#EF4444" strokeWidth={2} />
                            </Pressable>
                        </View>
                    );
                }}
            />
        </Screen>
    );
}

const styles = StyleSheet.create({
    list: { flex: 1 },
    listContent: { paddingBottom: 24 },
    band: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.primary,
    },
    bandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    pageTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 26, color: '#fff', letterSpacing: -0.4 },
    countPill: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    countPillText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.primary },
    countLine: { fontFamily: FONTS.regular, fontSize: 14, color: '#DBEAFE', marginTop: 4 },
    card: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginTop: 12,
        marginHorizontal: 16,
    },
    thumbWrap: { width: 72, height: 72 },
    thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: COLORS.primarySoft },
    thumbFallback: {
        width: 72,
        height: 72,
        borderRadius: 12,
        backgroundColor: COLORS.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heart: {
        alignSelf: 'flex-start',
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: { flex: 1, justifyContent: 'center', paddingRight: 4 },
    name: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text },
    typePill: {
        alignSelf: 'flex-start',
        marginTop: 6,
        backgroundColor: COLORS.primarySoft,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    typeText: { fontFamily: FONTS.semibold, fontSize: 11, color: COLORS.primary },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    place: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted },
    price: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
    empty: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 36 },
    emptyText: {
        fontFamily: FONTS.medium,
        fontSize: 15,
        color: COLORS.muted,
        textAlign: 'center',
    },
    browse: { alignSelf: 'center', marginTop: 16, paddingHorizontal: 18 },
});
