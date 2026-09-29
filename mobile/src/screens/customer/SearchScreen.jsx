import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { globalSearch } from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';
import { listingPlace, listingPrice } from '../../utils/listing';

const SECTIONS = [
    { key: 'hotels', titleKey: 'nav.hotels', path: '/hotels', type: 'HOTEL', pick: (data) => (data.hotels || []).filter((item) => String(item.type || 'HOTEL').toUpperCase() !== 'RESORT') },
    { key: 'resorts', titleKey: 'nav.resorts', path: '/hotels', type: 'RESORT', pick: (data) => (data.hotels || []).filter((item) => String(item.type || '').toUpperCase() === 'RESORT') },
    { key: 'homestays', titleKey: 'nav.homestays', path: '/homestays', type: 'HOMESTAY', pick: (data) => data.homestays || [] },
    { key: 'tents', titleKey: 'nav.tents', path: '/tents', type: 'TENT', pick: (data) => data.tents || [] },
    { key: 'guides', titleKey: 'nav.guides', path: '/guides', type: 'GUIDE', pick: (data) => data.guides || [] },
    { key: 'drivers', titleKey: 'search.taxiDrivers', path: '/drivers', type: 'DRIVER', pick: (data) => data.drivers || [] },
    { key: 'horses', titleKey: 'nav.horses', path: '/horses', type: 'HORSE', pick: (data) => data.horses || [] },
];

export default function SearchScreen({ route, navigation }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState(route.params?.q || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState('');

    const runSearch = async (text = query) => {
        const q = String(text || '').trim();
        if (!q) return;
        setLoading(true);
        setSearched(q);
        try {
            setData(await globalSearch(q));
        }
        catch {
            setData({ hotels: [], tents: [], guides: [], drivers: [], homestays: [], horses: [] });
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (route.params?.q) runSearch(route.params.q);
    }, [route.params?.q]);

    const sections = data ? SECTIONS.map((section) => ({ ...section, items: section.pick(data) })).filter((section) => section.items.length) : [];
    const total = sections.reduce((sum, section) => sum + section.items.length, 0);

    return (<Screen>
      <ScrollView>
        <Field label={t('search.action')} value={query} onChangeText={setQuery} placeholder={t('search.placeholder')} autoCapitalize="sentences"/>
        <Button title={t('search.action')} onPress={() => runSearch()}/>
        {loading ? <Loading /> : null}
        {!loading && searched ? (<>
          <Title>{t('search.results', { count: total, q: searched })}</Title>
          <Muted>{total ? t('search.matches') : t('search.none')}</Muted>
          {sections.map((section) => (<Card key={section.key}>
              <Text style={{ fontWeight: '800', color: COLORS.text, marginBottom: 8 }}>{t(section.titleKey)}</Text>
              {section.items.map((item) => (<Pressable key={item._id || item.slug} onPress={() => navigation.navigate('ListingDetail', {
                    path: section.path,
                    slug: item.slug,
                    type: section.type,
                })} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>{item.name}</Text>
                  <Muted>{listingPlace(item, section.type)}</Muted>
                  {listingPrice(item) != null ? <Text style={{ fontWeight: '700', color: COLORS.primary }}>{formatCurrency(listingPrice(item))}</Text> : null}
                </Pressable>))}
            </Card>))}
        </>) : null}
      </ScrollView>
    </Screen>);
}
