import React, { useCallback, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { fetchMyVendorListing, fetchMyVendorListings, patchVendorListingPrices } from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { pricingDraftFromListing, pricingPayloadFromDraft, validatePricingDraft } from '../../utils/vendorPricing';

const listingKey = (item) => `${item.vertical}-${item.id}`;

function PricingFields({ vertical, draft, t, onField, onRow }) {
    const text = (value) => (value == null ? '' : String(value));
    if (vertical === 'HOTEL' || vertical === 'RESORT' || vertical === 'HOMESTAY') {
        if (!draft.rooms?.length)
            return <Muted>{t('vendor.pricingNeedRooms')}</Muted>;
        return draft.rooms.map((room, index) => (<Field key={room.id || index} label={`${room.name} (₹)`} value={text(room.basePrice)} keyboardType="numeric" onChangeText={(value) => onRow('rooms', index, { basePrice: value })}/>));
    }
    if (vertical === 'TENT') {
        return <Field label={t('vendor.pricePerNight')} value={text(draft.pricePerNight)} keyboardType="numeric" onChangeText={(value) => onField('pricePerNight', value)}/>;
    }
    if (vertical === 'GUIDE') {
        return (<>
          <Field label={t('vendor.package6hr')} value={text(draft.package6hr)} keyboardType="numeric" onChangeText={(value) => onField('package6hr', value)}/>
          <Field label={t('vendor.package12hr')} value={text(draft.package12hr)} keyboardType="numeric" onChangeText={(value) => onField('package12hr', value)}/>
          <Field label={t('vendor.bikeAddon')} value={text(draft.bikeAddonPrice)} keyboardType="numeric" onChangeText={(value) => onField('bikeAddonPrice', value)}/>
        </>);
    }
    if (vertical === 'TAXI' || vertical === 'DRIVER') {
        return (<>
          <Field label={t('vendor.perTrip')} value={text(draft.perTripPrice)} keyboardType="numeric" onChangeText={(value) => onField('perTripPrice', value)}/>
          <Field label={t('vendor.hourlyRate')} value={text(draft.hourlyRate)} keyboardType="numeric" onChangeText={(value) => onField('hourlyRate', value)}/>
        </>);
    }
    if (vertical === 'HORSE') {
        if (!draft.routes?.length)
            return <Muted>{t('vendor.pricingNeedRoutes')}</Muted>;
        return draft.routes.map((route, index) => (<Field key={route.id || index} label={`${route.name} (₹)`} value={text(route.price)} keyboardType="numeric" onChangeText={(value) => onRow('routes', index, { price: value })}/>));
    }
    return (<>
      <Field label={t('vendor.priceInr')} value={text(draft.price)} keyboardType="numeric" onChangeText={(value) => onField('price', value)}/>
      <Field label={t('vendor.stock')} value={text(draft.stock)} keyboardType="numeric" onChangeText={(value) => onField('stock', value)}/>
    </>);
}

export default function VendorPricingScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { user } = useAuth();
    const [rows, setRows] = useState([]);
    const [drafts, setDrafts] = useState({});
    const [saving, setSaving] = useState({});
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        if (!user?.role) {
            setRows([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetchMyVendorListings(user.role)
            .then(async (list) => {
            const details = await Promise.all(list.map(async (item) => {
                try {
                    const detail = await fetchMyVendorListing(item.vertical, item.id);
                    return { ...item, detail };
                }
                catch {
                    return { ...item, detail: item };
                }
            }));
            const next = {};
            details.forEach((item) => {
                next[listingKey(item)] = pricingDraftFromListing(item.vertical, item.detail || item);
            });
            setRows(details);
            setDrafts(next);
        })
            .catch(() => setRows([]))
            .finally(() => setLoading(false));
    }, [user?.role]);

    useFocusEffect(useCallback(() => {
        load();
    }, [load]));

    const setRowField = (key, field, value, index) => {
        setDrafts((prev) => {
            const current = prev[key] || {};
            if (field === 'rooms' || field === 'routes') {
                const list = [...(current[field] || [])];
                list[index] = { ...list[index], ...value };
                return { ...prev, [key]: { ...current, [field]: list } };
            }
            return { ...prev, [key]: { ...current, [field]: value } };
        });
    };

    const onSave = async (item) => {
        const key = listingKey(item);
        const draft = drafts[key] || {};
        const invalid = validatePricingDraft(item.vertical, draft);
        if (invalid) {
            Alert.alert(t('common.error'), invalid);
            return;
        }
        setSaving((prev) => ({ ...prev, [key]: true }));
        try {
            await patchVendorListingPrices(item.vertical, item.id, pricingPayloadFromDraft(item.vertical, draft));
            Alert.alert(t('vendor.pricingSaved'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || t('vendor.pricingSaveFailed'));
        }
        finally {
            setSaving((prev) => ({ ...prev, [key]: false }));
        }
    };

    if (loading)
        return <Loading />;

    return (<Screen>
      <ScrollView>
        <Title>{t('vendor.pricing')}</Title>
        <Muted>{t('vendor.pricingHint')}</Muted>
        {!rows.length ? (<Card>
          <Muted>{t('vendor.noPricingListings')}</Muted>
          <Button title={t('vendor.createListing')} onPress={() => navigation.navigate('VendorListingForm')}/>
        </Card>) : rows.map((item) => {
            const key = listingKey(item);
            const draft = drafts[key] || {};
            return (<Card key={key}>
              <Title>{item.name}</Title>
              <Muted>{t(item.labelKey)}</Muted>
              <PricingFields vertical={item.vertical} draft={draft} t={t} onField={(field, value) => setDrafts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }))} onRow={(field, index, value) => setRowField(key, field, value, index)}/>
              <Button title={t('vendor.savePrices')} onPress={() => onSave(item)} loading={!!saving[key]}/>
            </Card>);
        })}
      </ScrollView>
    </Screen>);
}
