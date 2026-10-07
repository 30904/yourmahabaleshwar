import React, { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { createVendorListing, fetchFormSchema, fetchMyVendorListing, fetchMyVendorListings, updateVendorListing } from '../../api/endpoints';
import { Loading, Screen } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { canVendorEditListing, defaultsFor, toFormValues, toPayload, validateListingForm } from '../../utils/vendorListingForm';
import ListingFormView from './ListingFormView';

const ROLE_CREATE = {
    HOTEL_VENDOR: ['HOTEL', 'RESORT'],
    HOMESTAY_VENDOR: ['HOMESTAY'],
    TENT_OPERATOR: ['TENT'],
    GUIDE: ['GUIDE'],
    TAXI_OPERATOR: ['TAXI'],
    DRIVER: ['DRIVER'],
    HORSE_OPERATOR: ['HORSE'],
    PRODUCT_VENDOR: ['PRODUCT'],
};
const ROLE_DEFAULT = {
    HOTEL_VENDOR: 'HOTEL',
    HOMESTAY_VENDOR: 'HOMESTAY',
    TENT_OPERATOR: 'TENT',
    GUIDE: 'GUIDE',
    TAXI_OPERATOR: 'TAXI',
    DRIVER: 'DRIVER',
    HORSE_OPERATOR: 'HORSE',
    PRODUCT_VENDOR: 'PRODUCT',
};
const SINGLE_LISTING = new Set(Object.keys(ROLE_CREATE).filter((role) => role !== 'PRODUCT_VENDOR'));
export default function VendorListingFormScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useAuth();
    const listingId = route.params?.id;
    const isEdit = Boolean(listingId);
    const allowed = ROLE_CREATE[user?.role] || [];
    const requested = String(route.params?.vertical || ROLE_DEFAULT[user?.role] || '').toUpperCase();
    const [vertical, setVertical] = useState(allowed.includes(requested) ? requested : allowed[0]);
    const [form, setForm] = useState(() => defaultsFor(allowed.includes(requested) ? requested : allowed[0]));
    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [sections, setSections] = useState([]);
    const [custom, setCustom] = useState({});

    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    useEffect(() => {
        if (!vertical || ['PRODUCT'].includes(vertical)) {
            setSections([]);
            return;
        }
        fetchFormSchema(vertical)
            .then((doc) => {
            const next = {};
            (doc?.sections || []).forEach((section) => {
                (section.fields || []).forEach((field) => {
                    next[field.id] = field.type === 'checkbox' ? false : '';
                });
            });
            setSections(doc?.sections || []);
            setCustom(next);
        })
            .catch(() => {
            setSections([]);
            setCustom({});
        });
    }, [vertical]);

    useEffect(() => {
        if (isEdit || !user?.role || !SINGLE_LISTING.has(user.role))
            return;
        fetchMyVendorListings(user.role)
            .then((rows) => {
            if (!rows?.length)
                return;
            Alert.alert(t('vendor.singleListingOnly'));
            const first = rows[0];
            if (first?.id && canVendorEditListing(first)) {
                navigation.replace('VendorListingForm', { vertical: first.vertical, id: first.id });
            }
            else {
                navigation.goBack();
            }
        })
            .catch(() => {});
    }, [isEdit, user?.role, navigation, t]);

    useEffect(() => {
        if (!isEdit || !vertical || !listingId)
            return;
        setLoading(true);
        fetchMyVendorListing(vertical, listingId)
            .then((doc) => {
            if (!canVendorEditListing({ ...doc, vertical })) {
                Alert.alert(t('vendor.listingEditLocked'));
                navigation.goBack();
                return;
            }
            setForm(toFormValues(vertical, doc));
        })
            .catch(() => {
            Alert.alert(t('common.error'), t('vendor.listingLoadFailed'));
            navigation.goBack();
        })
            .finally(() => setLoading(false));
    }, [isEdit, vertical, listingId, navigation, t]);

    const onSave = async () => {
        const saveVertical = vertical === 'HOTEL' || vertical === 'RESORT'
            ? (form.type === 'RESORT' ? 'RESORT' : 'HOTEL')
            : vertical;
        const message = validateListingForm(saveVertical, form, { isCreate: !isEdit });
        if (message) {
            Alert.alert(t('common.error'), message);
            return;
        }
        for (const section of sections) {
            for (const field of section.fields || []) {
                if (!field.required)
                    continue;
                const value = custom[field.id];
                if (field.type === 'checkbox' ? !value : !String(value ?? '').trim()) {
                    Alert.alert(t('common.error'), `${field.label} is required`);
                    return;
                }
            }
        }
        const customFormData = {};
        Object.entries(custom).forEach(([key, value]) => {
            if (value === '' || value == null)
                return;
            customFormData[key] = value;
        });
        setSaving(true);
        try {
            const payload = { ...toPayload(saveVertical, form), customFormData };
            if (isEdit)
                await updateVendorListing(vertical, listingId, payload);
            else
                await createVendorListing(saveVertical, payload);
            Alert.alert(isEdit ? t('vendor.listingUpdated') : t('vendor.listingCreated'));
            navigation.goBack();
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || t('vendor.listingSaveFailed'));
        }
        finally {
            setSaving(false);
        }
    };

    if (!vertical)
        return (<Screen><Text>{t('vendor.listingsLoadFailed')}</Text></Screen>);
    if (loading)
        return <Loading />;
    return (
        <Screen>
            <ListingFormView
                t={t}
                form={form}
                setField={setField}
                vertical={vertical}
                user={user}
                listingId={listingId}
                navigation={navigation}
                sections={sections}
                custom={custom}
                setCustom={setCustom}
                onSave={onSave}
                saving={saving}
                isEdit={isEdit}
            />
        </Screen>
    );
}
