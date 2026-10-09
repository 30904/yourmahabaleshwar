import React, { useEffect, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { listCatalog } from '../../api/endpoints';
import { loadPublic } from '../../api/publicCache';
import { DriverBookingIntro } from '../../components/DriverRateChart';
import HorseRateChart from '../../components/HorseRateChart';
import ListingCard from '../../components/ListingCard';
import TaxiRateChart from '../../components/TaxiRateChart';
import ServiceHubScreen from './ServiceHubScreen';
import { Loading, Muted, Screen, Title } from '../../components/ui';

export default function CatalogScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { path, title, type, query } = route.params;
    const shopVertical = type === 'PRODUCT' ? query?.vertical : null;
    const isShop = shopVertical === 'STRAWBERRY' || shopVertical === 'MAPRO';
    const isCombo = type === 'COMBO';
    const isOpenService = type === 'GUIDE' || type === 'TAXI' || type === 'DRIVER' || type === 'HORSE';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const queryKey = JSON.stringify(query || {});

    useEffect(() => {
        if (isOpenService) {
            setLoading(false);
            return undefined;
        }
        let alive = true;
        let showed = false;
        setLoading(true);
        const job = loadPublic(`catalog:${path}:${queryKey}`, () => listCatalog(path, query), (data) => {
            if (!alive) return;
            showed = true;
            setItems(Array.isArray(data) ? data : data?.items || []);
            setLoading(false);
        });
        job.catch(() => {
            if (alive && !showed) setItems([]);
        }).finally(() => {
            if (alive) setLoading(false);
        });
        return () => {
            alive = false;
            job.cancel();
        };
    }, [path, query, queryKey, isOpenService]);

    if (isOpenService) return <ServiceHubScreen type={type} navigation={navigation} />;

    if (loading) return <Loading />;

    const openListing = (item) => navigation.navigate('ListingDetail', { path, slug: item.slug, type });

    return (
        <Screen style={{ paddingTop: 8, paddingBottom: 0, paddingHorizontal: 0 }}>
            <FlatList
                data={items}
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
                ListFooterComponentStyle={{ width: '100%' }}
                keyExtractor={(item) => item._id || item.slug}
                ListHeaderComponent={(
                    <View>
                        <Title>{title}</Title>
                        {isShop ? <Muted>{t(shopVertical === 'MAPRO' ? 'shop.maproSub' : 'shop.strawberrySub')}</Muted> : null}
                        {isCombo ? <Muted>{t('shop.comboSub')}</Muted> : null}
                        {type === 'TAXI' ? <TaxiRateChart /> : null}
                        {type === 'DRIVER' ? <DriverBookingIntro /> : null}
                        {type === 'HORSE' ? <HorseRateChart /> : null}
                    </View>
                )}
                ListEmptyComponent={<Muted>{t('common.empty')}</Muted>}
                renderItem={({ item }) => (
                    <ListingCard item={item} type={type} onPress={() => openListing(item)} />
                )}
            />
        </Screen>
    );
}
