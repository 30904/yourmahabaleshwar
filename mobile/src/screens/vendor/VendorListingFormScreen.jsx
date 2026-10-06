import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { createVendorListing, fetchFormSchema, fetchMyVendorListing, fetchMyVendorListings, updateVendorListing } from '../../api/endpoints';
import { Button, Card, Field, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AMENITY_OPTIONS, canVendorEditListing, defaultRoute, defaultsFor, toFormValues, toPayload, validateListingForm } from '../../utils/vendorListingForm';

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
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const YES_NO = ['yes', 'no'];
const LICENSES = ['LMV', 'COMMERCIAL', 'MCWOG'];
const VEHICLES = ['SEDAN', 'SUV', 'TEMPO', 'INNOVA', 'BIKE'];
const GUIDE_SKILLS = ['TWO_WHEELER', 'FOUR_WHEELER', 'BOTH'];
const GUIDE_LANGS = ['Marathi', 'Hindi', 'English'];
const STAY_AMENITIES = ['Swimming Pool', 'Restaurant', 'Safe Parking', 'Free Wi-Fi', '24-Hour Hot Water', 'Generator/Inverter Backup', 'Elevator/Lift'];
const UNITS = ['pack', 'kg', 'box', 'bottle', 'jar', 'piece'];

function Choices({ label, value, options, onChange }) {
    return (
        <View style={styles.choices}>
            <Text style={styles.choiceLabel}>{label}</Text>
            <View style={styles.chips}>
                {options.map((opt) => {
                    const id = typeof opt === 'string' ? opt : opt.value;
                    const text = typeof opt === 'string' ? opt : opt.label;
                    const on = value === id;
                    return (
                        <Pressable key={id} onPress={() => onChange(id)} style={[styles.chip, on && styles.chipOn]}>
                            <Text style={[styles.chipText, on && styles.chipTextOn]}>{text}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

function Check({ label, on, onPress }) {
    return (
        <Pressable onPress={onPress} style={styles.check}>
            <Text style={[styles.checkText, on && styles.checkOn]}>{on ? '✓ ' : '○ '}{label}</Text>
        </Pressable>
    );
}

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
    const text = (key) => (form[key] == null ? '' : String(form[key]));
    const label = (key) => t(`listingForm.${key}`);

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
        return (<Screen><Text style={styles.hint}>{t('vendor.listingsLoadFailed')}</Text></Screen>);
    if (loading)
        return <Loading />;

    const stay = vertical === 'HOTEL' || vertical === 'RESORT' || vertical === 'HOMESTAY';
    const person = vertical === 'GUIDE' || vertical === 'TAXI' || vertical === 'DRIVER' || vertical === 'HORSE';
    const kind = t(`vendor.types.${vertical}`);

    return (<Screen>
      <ScrollView>
        <Text style={styles.pageTitle}>{isEdit ? t('vendor.editListing', { kind }) : t('vendor.createListingKind', { kind })}</Text>
        {!isEdit && allowed.length > 1 && (<Choices label={label('type')} value={vertical} options={allowed.map((value) => ({ value, label: t(`vendor.types.${value}`) }))} onChange={(value) => {
            setVertical(value);
            setForm(defaultsFor(value));
        }}/>)}
        <Card>
          <Field label={label('name')} value={text('name')} onChangeText={(value) => setField('name', value)} autoCapitalize="words"/>
          {stay && (<>
            <Field label={label('ownerName')} value={text('ownerName')} onChangeText={(value) => setField('ownerName', value)} autoCapitalize="words"/>
            <Field label={label('managerName')} value={text('managerName')} onChangeText={(value) => setField('managerName', value)} autoCapitalize="words"/>
            <Field label={label('managerNumber')} value={text('managerNumber')} onChangeText={(value) => setField('managerNumber', value)} keyboardType="phone-pad"/>
            <Field label={label('extraMobileNumber')} value={text('extraMobileNumber')} onChangeText={(value) => setField('extraMobileNumber', value)} keyboardType="phone-pad"/>
            <Field label={label('addressLine1')} value={text('addressLine1')} onChangeText={(value) => setField('addressLine1', value)}/>
            <Field label={label('city')} value={text('city')} onChangeText={(value) => setField('city', value)} autoCapitalize="words"/>
            <Field label={label('pincode')} value={text('pincode')} onChangeText={(value) => setField('pincode', value)} keyboardType="numeric"/>
            <Field label={label('receptionPhone')} value={text('receptionPhone')} onChangeText={(value) => setField('receptionPhone', value)} keyboardType="phone-pad"/>
            <Field label={label('whatsapp')} value={text('whatsapp')} onChangeText={(value) => setField('whatsapp', value)} keyboardType="phone-pad"/>
            <Field label={label('propertyEmail')} value={text('propertyEmail')} onChangeText={(value) => setField('propertyEmail', value)} keyboardType="email-address" autoCapitalize="none"/>
            <Field label={label('website')} value={text('website')} onChangeText={(value) => setField('website', value)} autoCapitalize="none"/>
            <Field label={label('totalRooms')} value={text('totalRooms')} onChangeText={(value) => setField('totalRooms', value)} keyboardType="numeric"/>
            <Field label={label('nonAc')} value={text('nonAc')} onChangeText={(value) => setField('nonAc', value)} keyboardType="numeric"/>
            <Field label={label('deluxeAc')} value={text('deluxeAc')} onChangeText={(value) => setField('deluxeAc', value)} keyboardType="numeric"/>
            <Field label={label('suite')} value={text('suite')} onChangeText={(value) => setField('suite', value)} keyboardType="numeric"/>
            <Field label={label('familyDorm')} value={text('familyDorm')} onChangeText={(value) => setField('familyDorm', value)} keyboardType="numeric"/>
            <Choices label={label('driverAccommodation')} value={form.driverAccommodation ? 'yes' : 'no'} options={YES_NO} onChange={(value) => setField('driverAccommodation', value === 'yes')}/>
            <Choices label={label('amenities')} value="" options={(form.amenities || []).length ? STAY_AMENITIES.map((name) => ({ value: name, label: (form.amenities || []).includes(name) ? `✓ ${name}` : name })) : STAY_AMENITIES} onChange={(value) => setField('amenities', (form.amenities || []).includes(value) ? form.amenities.filter((item) => item !== value) : [...(form.amenities || []), value])}/>
            <Field label={label('priceRangeFrom')} value={text('priceRangeFrom')} onChangeText={(value) => setField('priceRangeFrom', value)} keyboardType="numeric"/>
            <Field label={label('priceRangeTo')} value={text('priceRangeTo')} onChangeText={(value) => setField('priceRangeTo', value)} keyboardType="numeric"/>
            <Field label={label('checkInTime')} value={text('checkInTime')} onChangeText={(value) => setField('checkInTime', value)}/>
            <Field label={label('checkOutTime')} value={text('checkOutTime')} onChangeText={(value) => setField('checkOutTime', value)}/>
            <Field label={label('description')} value={text('description')} onChangeText={(value) => setField('description', value)}/>
            <Field label={label('cancellationPolicyText')} value={text('cancellationPolicyText')} onChangeText={(value) => setField('cancellationPolicyText', value)}/>
          </>)}
          {vertical === 'TENT' && (<>
            <Field label={label('managerName')} value={text('managerName')} onChangeText={(value) => setField('managerName', value)} autoCapitalize="words"/>
            <Field label={label('managerNumber')} value={text('managerNumber')} onChangeText={(value) => setField('managerNumber', value)} keyboardType="phone-pad"/>
            <Field label={label('extraMobileNumber')} value={text('extraMobileNumber')} onChangeText={(value) => setField('extraMobileNumber', value)} keyboardType="phone-pad"/>
            <Field label={label('location')} value={text('location')} onChangeText={(value) => setField('location', value)}/>
            <Field label={label('pricePerNight')} value={text('pricePerNight')} onChangeText={(value) => setField('pricePerNight', value)} keyboardType="numeric"/>
            <Field label={label('capacity')} value={text('capacity')} onChangeText={(value) => setField('capacity', value)} keyboardType="numeric"/>
            <Field label={label('totalTents')} value={text('totalTents')} onChangeText={(value) => setField('totalTents', value)} keyboardType="numeric"/>
            <Field label={label('checkInTime')} value={text('checkInTime')} onChangeText={(value) => setField('checkInTime', value)}/>
            <Field label={label('checkOutTime')} value={text('checkOutTime')} onChangeText={(value) => setField('checkOutTime', value)}/>
            <Field label={label('description')} value={text('description')} onChangeText={(value) => setField('description', value)}/>
            <Choices label={label('amenities')} value="" options={AMENITY_OPTIONS.map((name) => ({ value: name, label: (form.amenities || []).includes(name) ? `✓ ${name}` : name }))} onChange={(value) => setField('amenities', (form.amenities || []).includes(value) ? form.amenities.filter((item) => item !== value) : [...(form.amenities || []), value])}/>
          </>)}
          {person && (<>
            {vertical !== 'DRIVER' && vertical !== 'GUIDE' ? <Field label={label('operatorName')} value={text('operatorName')} onChangeText={(value) => setField('operatorName', value)} autoCapitalize="words"/> : null}
            <Choices label={label('gender')} value={form.gender} options={GENDERS} onChange={(value) => setField('gender', value)}/>
            <Field label={label('fatherOrHusbandName')} value={text('fatherOrHusbandName')} onChangeText={(value) => setField('fatherOrHusbandName', value)} autoCapitalize="words"/>
            <Field label={label('dateOfBirth')} value={text('dateOfBirth')} onChangeText={(value) => setField('dateOfBirth', value)} placeholder="YYYY-MM-DD"/>
            <Field label={label('addressLine1')} value={text('addressLine1')} onChangeText={(value) => setField('addressLine1', value)}/>
            <Field label={label('pincode')} value={text('pincode')} onChangeText={(value) => setField('pincode', value)} keyboardType="numeric"/>
            <Field label={label('primaryMobile')} value={text('primaryMobile')} onChangeText={(value) => setField('primaryMobile', value)} keyboardType="phone-pad"/>
            <Field label={label('alternateMobile')} value={text('alternateMobile')} onChangeText={(value) => setField('alternateMobile', value)} keyboardType="phone-pad"/>
            <Field label={label('whatsapp')} value={text('whatsapp')} onChangeText={(value) => setField('whatsapp', value)} keyboardType="phone-pad"/>
            <Field label={label('email')} value={text('email')} onChangeText={(value) => setField('email', value)} keyboardType="email-address" autoCapitalize="none"/>
            <Field label={label('emergencyContactName')} value={text(vertical === 'HORSE' ? 'emergencyName' : 'emergencyContactName')} onChangeText={(value) => setField(vertical === 'HORSE' ? 'emergencyName' : 'emergencyContactName', value)} autoCapitalize="words"/>
            <Field label={label('emergencyMobile')} value={text(vertical === 'HORSE' ? 'emergencyMobile' : 'emergencyContactMobile')} onChangeText={(value) => setField(vertical === 'HORSE' ? 'emergencyMobile' : 'emergencyContactMobile', value)} keyboardType="phone-pad"/>
          </>)}
          {vertical === 'GUIDE' && (<>
            <Choices label={label('ownsTwoWheeler')} value={form.ownsTwoWheeler} options={YES_NO} onChange={(value) => setField('ownsTwoWheeler', value)}/>
            <Choices label={label('ownsFourWheeler')} value={form.ownsFourWheeler} options={YES_NO} onChange={(value) => setField('ownsFourWheeler', value)}/>
            <Choices label={label('drivingSkill')} value={form.drivingSkill} options={GUIDE_SKILLS} onChange={(value) => setField('drivingSkill', value)}/>
            <Choices label={label('licenseType')} value={form.licenseType} options={LICENSES} onChange={(value) => setField('licenseType', value)}/>
            <Field label={label('drivingLicenseNumber')} value={text('drivingLicenseNumber')} onChangeText={(value) => setField('drivingLicenseNumber', value)} autoCapitalize="characters"/>
            <Field label={label('experience')} value={text('experience')} onChangeText={(value) => setField('experience', value)} keyboardType="numeric"/>
            <Field label={label('mainTourismArea')} value={text('mainTourismArea')} onChangeText={(value) => setField('mainTourismArea', value)}/>
            <Field label={label('specialties')} value={text('specialties')} onChangeText={(value) => setField('specialties', value)}/>
            <Choices label={label('languages')} value="" options={GUIDE_LANGS.map((name) => ({ value: name, label: (form.languages || []).includes(name) ? `✓ ${name}` : name }))} onChange={(value) => setField('languages', (form.languages || []).includes(value) ? form.languages.filter((item) => item !== value) : [...(form.languages || []), value])}/>
            <Field label={label('otherLanguages')} value={text('otherLanguages')} onChangeText={(value) => setField('otherLanguages', value)}/>
            <Field label={label('bio')} value={text('bio')} onChangeText={(value) => setField('bio', value)}/>
            <Field label={label('package6hr')} value={text('package6hr')} onChangeText={(value) => setField('package6hr', value)} keyboardType="numeric"/>
            <Field label={label('package12hr')} value={text('package12hr')} onChangeText={(value) => setField('package12hr', value)} keyboardType="numeric"/>
            <Field label={label('bikeAddonPrice')} value={text('bikeAddonPrice')} onChangeText={(value) => setField('bikeAddonPrice', value)} keyboardType="numeric"/>
          </>)}
          {(vertical === 'TAXI' || vertical === 'DRIVER') && (<>
            <Choices label={label('vehicleType')} value={form.vehicleType} options={VEHICLES} onChange={(value) => setField('vehicleType', value)}/>
            <Field label={label('vehicleNumber')} value={text('vehicleNumber')} onChangeText={(value) => setField('vehicleNumber', value)} autoCapitalize="characters"/>
            <Choices label={label('licenseType')} value={form.licenseType} options={LICENSES} onChange={(value) => setField('licenseType', value)}/>
            <Field label={label('drivingLicenseNumber')} value={text('drivingLicenseNumber')} onChangeText={(value) => setField('drivingLicenseNumber', value)} autoCapitalize="characters"/>
            <Field label={label('experience')} value={text('experience')} onChangeText={(value) => setField('experience', value)} keyboardType="numeric"/>
            <Field label={label('serviceArea')} value={text('serviceArea')} onChangeText={(value) => setField('serviceArea', value)}/>
            <Field label={label('perTripPrice')} value={text('perTripPrice')} onChangeText={(value) => setField('perTripPrice', value)} keyboardType="numeric"/>
            <Field label={label('hourlyRate')} value={text('hourlyRate')} onChangeText={(value) => setField('hourlyRate', value)} keyboardType="numeric"/>
          </>)}
          {vertical === 'HORSE' && (<>
            <Field label={label('location')} value={text('location')} onChangeText={(value) => setField('location', value)}/>
            <Field label={label('serviceArea')} value={text('serviceArea')} onChangeText={(value) => setField('serviceArea', value)}/>
            <Field label={label('horseCount')} value={text('horseCount')} onChangeText={(value) => setField('horseCount', value)} keyboardType="numeric"/>
            <Field label={label('experience')} value={text('experience')} onChangeText={(value) => setField('experience', value)} keyboardType="numeric"/>
            <Field label={label('slotsPerDay')} value={text('slotsPerDay')} onChangeText={(value) => setField('slotsPerDay', value)} keyboardType="numeric"/>
            <Field label={label('description')} value={text('description')} onChangeText={(value) => setField('description', value)}/>
            <Text style={styles.sectionTitle}>{label('routes')}</Text>
            {(form.routes || []).map((routeRow, index) => (<View key={index}>
              <Field label={label('routeName')} value={routeRow.name || ''} onChangeText={(value) => setField('routes', form.routes.map((row, i) => i === index ? { ...row, name: value } : row))}/>
              <Field label={label('durationMinutes')} value={String(routeRow.durationMinutes ?? '')} onChangeText={(value) => setField('routes', form.routes.map((row, i) => i === index ? { ...row, durationMinutes: value } : row))} keyboardType="numeric"/>
              <Field label={label('routePrice')} value={String(routeRow.price ?? '')} onChangeText={(value) => setField('routes', form.routes.map((row, i) => i === index ? { ...row, price: value } : row))} keyboardType="numeric"/>
              {(form.routes || []).length > 1 ? <Button title={label('removeRoute')} variant="outline" onPress={() => setField('routes', form.routes.filter((_, i) => i !== index))}/> : null}
            </View>))}
            <Button title={label('addRoute')} variant="outline" onPress={() => setField('routes', [...(form.routes || []), defaultRoute()])}/>
          </>)}
          {vertical === 'PRODUCT' && (<>
            <Choices label={label('productVertical')} value={form.vertical} options={['STRAWBERRY', 'MAPRO']} onChange={(value) => setField('vertical', value)}/>
            <Choices label={label('unit')} value={form.unit} options={UNITS} onChange={(value) => setField('unit', value)}/>
            <Field label={label('price')} value={text('price')} onChangeText={(value) => setField('price', value)} keyboardType="numeric"/>
            <Field label={label('stock')} value={text('stock')} onChangeText={(value) => setField('stock', value)} keyboardType="numeric"/>
            <Field label={label('shortDescription')} value={text('shortDescription')} onChangeText={(value) => setField('shortDescription', value)}/>
          </>)}
          {form.imageUrl !== undefined && <Field label={label('imageUrl')} value={text('imageUrl')} onChangeText={(value) => setField('imageUrl', value)} autoCapitalize="none"/>}
          {(stay || person) && (<>
            <Field label={label('bankName')} value={text('bankName')} onChangeText={(value) => setField('bankName', value)} autoCapitalize="words"/>
            <Field label={label('bankBranch')} value={text('bankBranch')} onChangeText={(value) => setField('bankBranch', value)} autoCapitalize="words"/>
            <Field label={label('accountHolder')} value={text('accountHolder')} onChangeText={(value) => setField('accountHolder', value)} autoCapitalize="words"/>
            <Field label={label('accountNumber')} value={text('accountNumber')} onChangeText={(value) => setField('accountNumber', value)} keyboardType="numeric"/>
            <Field label={label('ifsc')} value={text('ifsc')} onChangeText={(value) => setField('ifsc', value.toUpperCase())} autoCapitalize="characters"/>
          </>)}
          {!isEdit && (<>
            <Check label={label('acceptTerms')} on={!!form.acceptTerms} onPress={() => setField('acceptTerms', !form.acceptTerms)}/>
            {(vertical === 'HOTEL' || vertical === 'RESORT' || vertical === 'TAXI' || vertical === 'DRIVER' || vertical === 'HORSE') && <Check label={label('acceptAgreement')} on={!!form.acceptAgreement} onPress={() => setField('acceptAgreement', !form.acceptAgreement)}/>}
            {(vertical === 'TAXI' || vertical === 'DRIVER') && <Check label={label('acceptRules')} on={!!form.acceptRules} onPress={() => setField('acceptRules', !form.acceptRules)}/>}
            {vertical !== 'TENT' && vertical !== 'PRODUCT' && <Check label={label('acceptDeclaration')} on={!!form.acceptDeclaration} onPress={() => setField('acceptDeclaration', !form.acceptDeclaration)}/>}
          </>)}
        </Card>
        {sections.map((section) => (<Card key={section.id}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {(section.fields || []).map((field) => field.type === 'checkbox' ? (<Check key={field.id} label={field.label} on={!!custom[field.id]} onPress={() => setCustom((prev) => ({ ...prev, [field.id]: !prev[field.id] }))}/>) : field.type === 'select' ? (<Choices key={field.id} label={field.label} value={custom[field.id] || ''} options={field.options || []} onChange={(value) => setCustom((prev) => ({ ...prev, [field.id]: value }))}/>) : (<Field key={field.id} label={field.label} value={custom[field.id] == null ? '' : String(custom[field.id])} onChangeText={(value) => setCustom((prev) => ({ ...prev, [field.id]: value }))} keyboardType={field.type === 'number' ? 'numeric' : 'default'}/>))}
        </Card>))}
        <Button title={t('common.save')} onPress={onSave} loading={saving}/>
        <Button title={t('common.cancel')} variant="outline" onPress={() => navigation.goBack()}/>
      </ScrollView>
    </Screen>);
}

const styles = StyleSheet.create({
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4, marginBottom: 12 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, lineHeight: 20 },
    sectionTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text, marginBottom: 8 },
    choices: { marginBottom: 12 },
    choiceLabel: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.body, marginBottom: 6 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
    chipOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    chipText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text },
    chipTextOn: { color: COLORS.primary },
    check: { paddingVertical: 8 },
    checkText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    checkOn: { color: COLORS.primary },
});
