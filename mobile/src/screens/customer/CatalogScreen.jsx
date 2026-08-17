import React, { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { listCatalog } from '../../api/endpoints';
import { Card, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';
export default function CatalogScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { path, title, type, query } = route.params;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setLoading(true);
        listCatalog(path, query)
            .then((data) => setItems(Array.isArray(data) ? data : data?.items || []))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [path, query]);
    if (loading)
        return <Loading />;
    return (<Screen style={{ paddingTop: 8 }}>
      <Title>{title}</Title>
      <FlatList data={items} keyExtractor={(item) => item._id || item.slug} ListEmptyComponent={<Muted>{t('common.error')}</Muted>} renderItem={({ item }) => (<Pressable onPress={() => navigation.navigate('ListingDetail', {
                path,
                slug: item.slug,
                type,
            })}>
            <Card>
              {item.images?.[0] ? (<Image source={{ uri: item.images[0] }} style={{ height: 140, borderRadius: 10, marginBottom: 10 }}/>) : null}
              <Text style={{ fontWeight: '800', color: COLORS.text, fontSize: 16 }}>{item.name}</Text>
              <Muted>
                {item.address?.city || item.location || item.vertical || 'Mahabaleshwar'}
                {item.pricePerNight || item.pricePerRide || item.package6hr || item.price || item.comboPrice
                ? ` · ${formatCurrency(item.pricePerNight || item.pricePerRide || item.package6hr || item.price || item.comboPrice)}`
                : ''}
              </Muted>
            </Card>
          </Pressable>)}/>
    </Screen>);
}
