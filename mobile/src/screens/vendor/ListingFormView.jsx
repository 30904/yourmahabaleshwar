import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import DocumentUpload from '../../components/booking/DocumentUpload';
import { DateField, LanguageToggle, SelectField, TimeField } from '../../components/booking/formChrome';
import { Button, Card, Field } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { AMENITY_OPTIONS, defaultRoute } from '../../utils/vendorListingForm';

const LANGS = [
    { value: 'Marathi', labelKey: 'langMarathi' },
    { value: 'Hindi', labelKey: 'langHindi' },
    { value: 'English', labelKey: 'langEnglish' },
];

function Section({ title, children }) {
    return (
        <Card>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </Card>
    );
}

function Bullets({ lines }) {
    const items = Array.isArray(lines) ? lines : [];
    if (!items.length) return null;
    return items.map((line) => (
        <Text key={line} style={styles.bullet}>{`•  ${line}`}</Text>
    ));
}

function Chips({ options, selected, onToggle }) {
    return (
        <View style={styles.chips}>
            {options.map((option) => {
                const value = option.value || option;
                const label = option.label || option;
                const on = selected.includes(value);
                return (
                    <Pressable key={value} onPress={() => onToggle(value)} style={[styles.chip, on && styles.chipOn]}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function Check({ label, on, onPress }) {
    return (
        <Pressable onPress={onPress} style={styles.check}>
            <Text style={styles.box}>{on ? '☑' : '☐'}</Text>
            <Text style={styles.checkText}>{label}</Text>
        </Pressable>
    );
}

function LegalLinks({ links }) {
    const [open, setOpen] = useState(null);
    return (
        <>
            {links.map((link) => (
                <Pressable key={link.title} onPress={() => setOpen(link)}>
                    <Text style={styles.link}>{link.label}</Text>
                </Pressable>
            ))}
            <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
                <Pressable style={styles.backdrop} onPress={() => setOpen(null)}>
                    <Pressable style={styles.dialog} onPress={() => {}}>
                        <Text style={styles.dialogTitle}>{open?.title}</Text>
                        <ScrollView style={styles.dialogScroll}>
                            {(open?.sections || []).map((section) => (
                                <View key={section.heading || section.body} style={styles.dialogBlock}>
                                    {section.heading ? <Text style={styles.dialogHeading}>{section.heading}</Text> : null}
                                    <Text style={styles.dialogBody}>{section.body}</Text>
                                </View>
                            ))}
                        </ScrollView>
                        <Button title="Close" variant="outline" onPress={() => setOpen(null)} />
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

function asList(value) {
    return Array.isArray(value) ? value : [];
}

export default function ListingFormView({
    t, form, setField, vertical, user, listingId, navigation, sections, custom, setCustom, onSave, saving, isEdit,
}) {
    const text = (key) => (form[key] == null ? '' : String(form[key]));
    const photo = (label) => (
        <DocumentUpload
            label={label}
            hint="Drag & drop or click · JPG, PNG or WebP"
            value={form.imageUrl}
            onChange={(url) => setField('imageUrl', url)}
            category="listing-image"
            meta={{ tenant: String(vertical || 'listing').toLowerCase(), listingId: listingId || user?._id }}
            types={['image/*']}
        />
    );
    const bank = (ns) => (
        <Section title={t(`${ns}.section6`)}>
            <Field label={t(`${ns}.bankName`)} value={text('bankName')} onChangeText={(value) => setField('bankName', value)} autoCapitalize="words" />
            <Field label={t(`${ns}.bankBranch`)} value={text('bankBranch')} onChangeText={(value) => setField('bankBranch', value)} autoCapitalize="words" />
            <Field label={t(`${ns}.accountHolder`)} value={text('accountHolder')} onChangeText={(value) => setField('accountHolder', value)} autoCapitalize="words" />
            <Field label={t(`${ns}.accountNumber`)} value={text('accountNumber')} onChangeText={(value) => setField('accountNumber', value)} keyboardType="numeric" />
            <Field label={t(`${ns}.ifsc`)} value={text('ifsc')} onChangeText={(value) => setField('ifsc', value.toUpperCase())} autoCapitalize="characters" />
        </Section>
    );
    const stayBank = (
        <Section title={t('stayRegistration.section4')}>
            <Field label={t('stayRegistration.bankName')} value={text('bankName')} onChangeText={(value) => setField('bankName', value)} autoCapitalize="words" />
            <Field label={t('stayRegistration.bankBranch')} value={text('bankBranch')} onChangeText={(value) => setField('bankBranch', value)} autoCapitalize="words" />
            <Field label={t('stayRegistration.accountHolder')} value={text('accountHolder')} onChangeText={(value) => setField('accountHolder', value)} autoCapitalize="words" />
            <Field label={t('stayRegistration.accountNumber')} value={text('accountNumber')} onChangeText={(value) => setField('accountNumber', value)} keyboardType="numeric" />
            <Field label={t('stayRegistration.ifsc')} value={text('ifsc')} onChangeText={(value) => setField('ifsc', value.toUpperCase())} autoCapitalize="characters" />
        </Section>
    );
    const gender = (ns) => (
        <SelectField
            label={t(`${ns}.gender`)}
            value={form.gender || ''}
            onChange={(value) => setField('gender', value)}
            options={[
                { value: '', label: t(`${ns}.selectGender`) },
                { value: 'MALE', label: t(`${ns}.genderMale`) },
                { value: 'FEMALE', label: t(`${ns}.genderFemale`) },
                { value: 'OTHER', label: t(`${ns}.genderOther`) },
            ]}
        />
    );
    const documents = (ns) => (
        <Section title={t(`${ns}.section5`)}>
            <Text style={styles.note}>{t(`${ns}.documentsIntro`)}</Text>
            <Bullets lines={t(`${ns}.documents`, { returnObjects: true })} />
            <Button title={t('nav.kyc')} variant="outline" onPress={() => navigation.navigate('VendorKyc')} />
        </Section>
    );
    const toggleList = (key, value) => {
        const current = form[key] || [];
        setField(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
    };
    const stayAmenities = asList(t('stayRegistration.amenities', { returnObjects: true }));
    const hotel = vertical === 'HOTEL' || vertical === 'RESORT';
    const homestay = vertical === 'HOMESTAY';
    const ns = hotel ? 'hotelRegistration' : homestay ? 'homestayRegistration' : '';

    return (
        <ScrollView contentContainerStyle={styles.page}>
            <View style={styles.lang}><LanguageToggle /></View>
            <Text style={styles.pageTitle}>{t(vertical === 'HOTEL' || vertical === 'RESORT' ? 'vendor.dashHotel' : `vendor.types.${vertical}`)}</Text>

            {(hotel || homestay) && (
                <>
                    <Section title={t(`${ns}.section1`)}>
                        <Field label={t(`${ns}.officialName`)} value={text('name')} onChangeText={(value) => setField('name', value)} autoCapitalize="words" />
                        <Field label={t('stayRegistration.ownerName')} value={text('ownerName')} onChangeText={(value) => setField('ownerName', value)} autoCapitalize="words" />
                        <Field label={t('stayRegistration.managerName')} value={text('managerName')} onChangeText={(value) => setField('managerName', value)} autoCapitalize="words" />
                        <Field label={t('stayRegistration.managerNumber')} value={text('managerNumber')} onChangeText={(value) => setField('managerNumber', value)} keyboardType="phone-pad" />
                        <Field label={t('stayRegistration.extraMobileNumber')} value={text('extraMobileNumber')} onChangeText={(value) => setField('extraMobileNumber', value)} keyboardType="phone-pad" />
                        {hotel ? (
                            <SelectField
                                label={t('hotelRegistration.propertyType')}
                                value={form.type || 'HOTEL'}
                                onChange={(value) => setField('type', value)}
                                options={[
                                    { value: 'HOTEL', label: t('hotelRegistration.typeHotel') },
                                    { value: 'RESORT', label: t('hotelRegistration.typeResort') },
                                ]}
                            />
                        ) : null}
                        <Field label={t('stayRegistration.pinCode')} value={text('pincode')} onChangeText={(value) => setField('pincode', value)} keyboardType="numeric" autofillPincode />
                        <Field label={t('stayRegistration.fullAddress')} value={text('addressLine1')} onChangeText={(value) => setField('addressLine1', value)} />
                        <Field label={t('stayRegistration.cityDistrict')} value={text('city')} onChangeText={(value) => setField('city', value)} autoCapitalize="words" />
                        <Field label={t('stayRegistration.receptionPhone')} value={text('receptionPhone')} onChangeText={(value) => setField('receptionPhone', value)} keyboardType="phone-pad" />
                        <Field label={t('stayRegistration.whatsapp')} value={text('whatsapp')} onChangeText={(value) => setField('whatsapp', value)} keyboardType="phone-pad" />
                        <Field label={t('stayRegistration.officialEmail')} value={text('propertyEmail')} onChangeText={(value) => setField('propertyEmail', value)} keyboardType="email-address" autoCapitalize="none" />
                        <Field label={t('stayRegistration.websiteSocial')} value={text('website')} onChangeText={(value) => setField('website', value)} autoCapitalize="none" placeholder="https://" />
                        {homestay ? <Field label={t('vendor.location')} value={text('location')} onChangeText={(value) => setField('location', value)} /> : null}
                        {photo(t('stayRegistration.imageUrl'))}
                    </Section>
                    <Section title={t('stayRegistration.section2')}>
                        <Field label={t('stayRegistration.totalRooms')} value={text('totalRooms')} onChangeText={(value) => setField('totalRooms', value)} keyboardType="numeric" />
                        <Field label={t('stayRegistration.nonAcRooms')} value={text('nonAc')} onChangeText={(value) => setField('nonAc', value)} keyboardType="numeric" />
                        <Field label={t('stayRegistration.deluxeAcRooms')} value={text('deluxeAc')} onChangeText={(value) => setField('deluxeAc', value)} keyboardType="numeric" />
                        <Field label={t('stayRegistration.suiteRooms')} value={text('suite')} onChangeText={(value) => setField('suite', value)} keyboardType="numeric" />
                        <Field label={t('stayRegistration.familyDormRooms')} value={text('familyDorm')} onChangeText={(value) => setField('familyDorm', value)} keyboardType="numeric" />
                        <SelectField
                            label={t('stayRegistration.driverAccommodation')}
                            value={form.driverAccommodation ? 'yes' : 'no'}
                            onChange={(value) => setField('driverAccommodation', value === 'yes')}
                            options={[{ value: 'no', label: t('stayRegistration.no') }, { value: 'yes', label: t('stayRegistration.yes') }]}
                        />
                        <Text style={styles.choiceLabel}>{t('stayRegistration.amenitiesLabel')}</Text>
                        <Chips options={stayAmenities} selected={form.amenities || []} onToggle={(value) => toggleList('amenities', value)} />
                    </Section>
                    <Section title={t('stayRegistration.section3')}>
                        <Field label={t('stayRegistration.priceFrom')} value={text('priceRangeFrom')} onChangeText={(value) => setField('priceRangeFrom', value)} keyboardType="numeric" />
                        <Field label={t('stayRegistration.priceTo')} value={text('priceRangeTo')} onChangeText={(value) => setField('priceRangeTo', value)} keyboardType="numeric" />
                        <TimeField label={t('stayRegistration.checkInTime')} value={form.checkInTime || '14:00'} onChange={(value) => setField('checkInTime', value)} />
                        <TimeField label={t('stayRegistration.checkOutTime')} value={form.checkOutTime || '11:00'} onChange={(value) => setField('checkOutTime', value)} />
                        <Field label={t('stayRegistration.cancellationPolicy')} value={text('cancellationPolicyText')} onChangeText={(value) => setField('cancellationPolicyText', value)} multiline />
                        <Text style={styles.note}>{t('stayRegistration.commissionNote')}</Text>
                    </Section>
                    {stayBank}
                    <Section title={t(`${ns}.section5`)}>
                        <Bullets lines={t(`${ns}.termsSummary`, { returnObjects: true })} />
                        <LegalLinks links={[
                            { label: t('stayRegistration.readFullTerms'), title: t(`${ns}.fullTermsTitle`), sections: asList(t(`${ns}.fullTermsSections`, { returnObjects: true })) },
                            hotel ? { label: t('stayRegistration.readPartnerAgreement'), title: t('hotelRegistration.partnerAgreementTitle'), sections: asList(t('hotelRegistration.partnerAgreementSections', { returnObjects: true })) } : null,
                        ].filter(Boolean)} />
                        <Check label={t(`${ns}.acceptTerms`)} on={!!form.acceptTerms} onPress={() => setField('acceptTerms', !form.acceptTerms)} />
                        {hotel ? <Check label={t('hotelRegistration.acceptAgreement')} on={!!form.acceptAgreement} onPress={() => setField('acceptAgreement', !form.acceptAgreement)} /> : null}
                    </Section>
                    <Section title={t('stayRegistration.section6')}>
                        <Text style={styles.note}>{t('stayRegistration.declarationText')}</Text>
                        <Check label={t('stayRegistration.confirmDeclarationSubmit')} on={!!form.acceptDeclaration} onPress={() => setField('acceptDeclaration', !form.acceptDeclaration)} />
                    </Section>
                </>
            )}

            {vertical === 'TENT' && (
                <>
                    <Section title={t('vendor.types.tent')}>
                        <Field label={t('listingForm.name')} value={text('name')} onChangeText={(value) => setField('name', value)} autoCapitalize="words" />
                        <Field label={t('stayRegistration.managerName')} value={text('managerName')} onChangeText={(value) => setField('managerName', value)} autoCapitalize="words" />
                        <Field label={t('stayRegistration.managerNumber')} value={text('managerNumber')} onChangeText={(value) => setField('managerNumber', value)} keyboardType="phone-pad" />
                        <Field label={t('stayRegistration.extraMobileNumber')} value={text('extraMobileNumber')} onChangeText={(value) => setField('extraMobileNumber', value)} keyboardType="phone-pad" />
                        <Field label={t('listingForm.location')} value={text('location')} onChangeText={(value) => setField('location', value)} />
                        <Field label={t('listingForm.pricePerNight')} value={text('pricePerNight')} onChangeText={(value) => setField('pricePerNight', value)} keyboardType="numeric" />
                        <Field label={t('listingForm.capacity')} value={text('capacity')} onChangeText={(value) => setField('capacity', value)} keyboardType="numeric" />
                        <Field label={t('listingForm.totalTents')} value={text('totalTents')} onChangeText={(value) => setField('totalTents', value)} keyboardType="numeric" />
                        <TimeField label={t('stayRegistration.checkInTime')} value={form.checkInTime || '14:00'} onChange={(value) => setField('checkInTime', value)} />
                        <TimeField label={t('stayRegistration.checkOutTime')} value={form.checkOutTime || '11:00'} onChange={(value) => setField('checkOutTime', value)} />
                        <Field label={t('listingForm.description')} value={text('description')} onChangeText={(value) => setField('description', value)} multiline />
                        {photo(t('listingForm.imageUrl'))}
                    </Section>
                    <Section title={t('stayRegistration.amenitiesLabel')}>
                        <Chips options={AMENITY_OPTIONS} selected={form.amenities || []} onToggle={(value) => toggleList('amenities', value)} />
                    </Section>
                </>
            )}

            {vertical === 'GUIDE' && (
                <>
                    <Section title={t('guideRegistration.section1')}>
                        <Field label={t('guideRegistration.fullName')} value={text('name')} onChangeText={(value) => setField('name', value)} autoCapitalize="words" />
                        {gender('guideRegistration')}
                        <Field label={t('guideRegistration.fatherOrHusbandName')} value={text('fatherOrHusbandName')} onChangeText={(value) => setField('fatherOrHusbandName', value)} autoCapitalize="words" />
                        <DateField label={t('guideRegistration.dateOfBirth')} value={text('dateOfBirth')} onChange={(value) => setField('dateOfBirth', value)} />
                        <Field label={t('guideRegistration.pinCode')} value={text('pincode')} onChangeText={(value) => setField('pincode', value)} keyboardType="numeric" autofillPincode />
                        <Field label={t('guideRegistration.permanentAddress')} value={text('addressLine1')} onChangeText={(value) => setField('addressLine1', value)} />
                    </Section>
                    <Section title={t('guideRegistration.section2')}>
                        <Field label={t('guideRegistration.primaryMobile')} value={text('primaryMobile')} onChangeText={(value) => setField('primaryMobile', value)} keyboardType="phone-pad" />
                        <Field label={t('guideRegistration.alternateMobile')} value={text('alternateMobile')} onChangeText={(value) => setField('alternateMobile', value)} keyboardType="phone-pad" />
                        <Field label={t('guideRegistration.whatsapp')} value={text('whatsapp')} onChangeText={(value) => setField('whatsapp', value)} keyboardType="phone-pad" />
                        <Field label={t('guideRegistration.email')} value={text('email')} onChangeText={(value) => setField('email', value)} keyboardType="email-address" autoCapitalize="none" />
                        <Field label={t('guideRegistration.emergencyContactName')} value={text('emergencyContactName')} onChangeText={(value) => setField('emergencyContactName', value)} autoCapitalize="words" />
                        <Field label={t('guideRegistration.emergencyContactMobile')} value={text('emergencyContactMobile')} onChangeText={(value) => setField('emergencyContactMobile', value)} keyboardType="phone-pad" />
                    </Section>
                    <Section title={t('guideRegistration.section3')}>
                        <SelectField label={t('guideRegistration.ownTwoWheeler')} value={form.ownsTwoWheeler || ''} onChange={(value) => setField('ownsTwoWheeler', value)} options={[{ value: '', label: t('guideRegistration.select') }, { value: 'yes', label: t('guideRegistration.yes') }, { value: 'no', label: t('guideRegistration.no') }]} />
                        <SelectField label={t('guideRegistration.ownFourWheeler')} value={form.ownsFourWheeler || ''} onChange={(value) => setField('ownsFourWheeler', value)} options={[{ value: '', label: t('guideRegistration.select') }, { value: 'yes', label: t('guideRegistration.yes') }, { value: 'no', label: t('guideRegistration.no') }]} />
                        <SelectField label={t('guideRegistration.drivingSkill')} value={form.drivingSkill || ''} onChange={(value) => setField('drivingSkill', value)} options={[{ value: 'TWO_WHEELER', label: 'Two wheeler' }, { value: 'FOUR_WHEELER', label: 'Four wheeler' }, { value: 'BOTH', label: 'Both' }]} />
                        <SelectField label={t('guideRegistration.licenseType')} value={form.licenseType || ''} onChange={(value) => setField('licenseType', value)} options={[{ value: 'LMV', label: 'LMV' }, { value: 'COMMERCIAL', label: 'Commercial' }, { value: 'MCWOG', label: 'MCWOG' }]} />
                        <Field label={t('guideRegistration.drivingLicenseNumber')} value={text('drivingLicenseNumber')} onChangeText={(value) => setField('drivingLicenseNumber', value)} autoCapitalize="characters" />
                    </Section>
                    <Section title={t('guideRegistration.section4')}>
                        <Field label={t('guideRegistration.experience')} value={text('experience')} onChangeText={(value) => setField('experience', value)} keyboardType="numeric" />
                        <Field label={t('guideRegistration.mainTourismArea')} value={text('mainTourismArea')} onChangeText={(value) => setField('mainTourismArea', value)} />
                        <Field label={t('guideRegistration.specialties')} value={text('specialties')} onChangeText={(value) => setField('specialties', value)} />
                        <Text style={styles.choiceLabel}>{t('guideRegistration.languagesKnown')}</Text>
                        <Chips options={LANGS.map((item) => ({ value: item.value, label: t(`guideRegistration.${item.labelKey}`) }))} selected={form.languages || []} onToggle={(value) => toggleList('languages', value)} />
                        <Field label={t('guideRegistration.otherLanguages')} value={text('otherLanguages')} onChangeText={(value) => setField('otherLanguages', value)} />
                        <Field label={t('guideRegistration.bio')} value={text('bio')} onChangeText={(value) => setField('bio', value)} multiline />
                        <Field label={t('guideRegistration.package6hr')} value={text('package6hr')} onChangeText={(value) => setField('package6hr', value)} keyboardType="numeric" />
                        <Field label={t('guideRegistration.package12hr')} value={text('package12hr')} onChangeText={(value) => setField('package12hr', value)} keyboardType="numeric" />
                        <Field label={t('guideRegistration.bikeAddonPrice')} value={text('bikeAddonPrice')} onChangeText={(value) => setField('bikeAddonPrice', value)} keyboardType="numeric" />
                        {photo(t('guideRegistration.profilePhotoUrl'))}
                        <Text style={styles.note}>{t('guideRegistration.commissionNote')}</Text>
                    </Section>
                    {documents('guideRegistration')}
                    {bank('guideRegistration')}
                    <Section title={t('guideRegistration.section7')}>
                        <Bullets lines={t('guideRegistration.terms', { returnObjects: true })} />
                        <LegalLinks links={[{ label: t('stayRegistration.readFullTerms'), title: t('guideRegistration.termsTitle'), sections: asList(t('guideRegistration.terms', { returnObjects: true })).map((body, index) => ({ heading: `${index + 1}.`, body })) }]} />
                        <Check label={t('guideRegistration.acceptTerms')} on={!!form.acceptTerms} onPress={() => setField('acceptTerms', !form.acceptTerms)} />
                    </Section>
                    <Section title={t('guideRegistration.section8')}>
                        <Text style={styles.note}>{t('guideRegistration.declaration')}</Text>
                        <Check label={t(isEdit ? 'guideRegistration.confirmDeclaration' : 'guideRegistration.confirmDeclarationSubmit')} on={!!form.acceptDeclaration} onPress={() => setField('acceptDeclaration', !form.acceptDeclaration)} />
                    </Section>
                </>
            )}

            {(vertical === 'TAXI' || vertical === 'DRIVER') && (() => {
                const service = vertical === 'TAXI' ? 'taxiRegistration' : 'driverRegistration';
                const vehicles = asList(t(`${service}.vehicleTypes`, { returnObjects: true }));
                return (
                    <>
                        <Section title={t(`${service}.section1`)}>
                            <Field label={t(vertical === 'TAXI' ? 'taxiRegistration.fleetBusinessName' : 'driverRegistration.fullName')} value={text('name')} onChangeText={(value) => setField('name', value)} autoCapitalize="words" />
                            {vertical === 'TAXI' ? <Field label={t('taxiRegistration.proprietorName')} value={text('operatorName')} onChangeText={(value) => setField('operatorName', value)} autoCapitalize="words" /> : null}
                            {gender(service)}
                            <Field label={t(`${service}.fatherOrHusbandName`)} value={text('fatherOrHusbandName')} onChangeText={(value) => setField('fatherOrHusbandName', value)} autoCapitalize="words" />
                            <DateField label={t(`${service}.dateOfBirth`)} value={text('dateOfBirth')} onChange={(value) => setField('dateOfBirth', value)} />
                            <Field label={t(`${service}.pinCode`)} value={text('pincode')} onChangeText={(value) => setField('pincode', value)} keyboardType="numeric" autofillPincode />
                            <Field label={t(`${service}.permanentAddress`)} value={text('addressLine1')} onChangeText={(value) => setField('addressLine1', value)} />
                        </Section>
                        <Section title={t(`${service}.section2`)}>
                            <Field label={t(`${service}.primaryMobile`)} value={text('primaryMobile')} onChangeText={(value) => setField('primaryMobile', value)} keyboardType="phone-pad" />
                            <Field label={t(`${service}.alternateMobile`)} value={text('alternateMobile')} onChangeText={(value) => setField('alternateMobile', value)} keyboardType="phone-pad" />
                            <Field label={t(`${service}.whatsapp`)} value={text('whatsapp')} onChangeText={(value) => setField('whatsapp', value)} keyboardType="phone-pad" />
                            <Field label={t(`${service}.email`)} value={text('email')} onChangeText={(value) => setField('email', value)} keyboardType="email-address" autoCapitalize="none" />
                            <Field label={t(`${service}.emergencyContactName`)} value={text('emergencyContactName')} onChangeText={(value) => setField('emergencyContactName', value)} autoCapitalize="words" />
                            <Field label={t(`${service}.emergencyContactMobile`)} value={text('emergencyContactMobile')} onChangeText={(value) => setField('emergencyContactMobile', value)} keyboardType="phone-pad" />
                        </Section>
                        <Section title={t(`${service}.section3`)}>
                            {vertical === 'TAXI' ? <Text style={styles.note}>{t('taxiRegistration.primaryVehicleHint')}</Text> : null}
                            <SelectField label={t(`${service}.vehicleType`)} value={form.vehicleType || ''} onChange={(value) => setField('vehicleType', value)} options={vehicles.length ? vehicles : [{ value: 'SEDAN', label: 'Sedan' }, { value: 'SUV', label: 'SUV' }, { value: 'INNOVA', label: 'Innova' }, { value: 'TEMPO', label: 'Tempo' }, { value: 'BIKE', label: 'Bike' }]} />
                            <Field label={t(`${service}.vehicleNumber`)} value={text('vehicleNumber')} onChangeText={(value) => setField('vehicleNumber', value)} autoCapitalize="characters" />
                            <SelectField label={t(`${service}.licenseType`)} value={form.licenseType || ''} onChange={(value) => setField('licenseType', value)} options={[{ value: 'LMV', label: 'LMV' }, { value: 'COMMERCIAL', label: 'Commercial' }, { value: 'MCWOG', label: 'MCWOG' }]} />
                            <Field label={t(`${service}.drivingLicenseNumber`)} value={text('drivingLicenseNumber')} onChangeText={(value) => setField('drivingLicenseNumber', value)} autoCapitalize="characters" />
                        </Section>
                        <Section title={t(`${service}.section4`)}>
                            <Field label={t(`${service}.experience`)} value={text('experience')} onChangeText={(value) => setField('experience', value)} keyboardType="numeric" />
                            <Field label={t(`${service}.serviceArea`)} value={text('serviceArea')} onChangeText={(value) => setField('serviceArea', value)} />
                            <Field label={t(`${service}.perTripPrice`)} value={text('perTripPrice')} onChangeText={(value) => setField('perTripPrice', value)} keyboardType="numeric" />
                            <Field label={t(`${service}.hourlyRate`)} value={text('hourlyRate')} onChangeText={(value) => setField('hourlyRate', value)} keyboardType="numeric" />
                            {photo(t(`${service}.${vertical === 'TAXI' ? 'fleetPhotoUrl' : 'profilePhotoUrl'}`))}
                            <Text style={styles.note}>{t(`${service}.commissionNote`)}</Text>
                        </Section>
                        {documents(service)}
                        {bank(service)}
                        <Section title={t(`${service}.section7`)}>
                            <Bullets lines={t(`${service}.terms`, { returnObjects: true })} />
                            <Bullets lines={t(`${service}.agreementSummary`, { returnObjects: true })} />
                            <LegalLinks links={[
                                { label: t('stayRegistration.readFullTerms'), title: t(`${service}.termsTitle`), sections: asList(t(`${service}.terms`, { returnObjects: true })).map((body, index) => ({ heading: `${index + 1}.`, body })) },
                                { label: t('stayRegistration.readPartnerAgreement'), title: t(`${service}.partnerAgreementTitle`), sections: asList(t(`${service}.partnerAgreementSections`, { returnObjects: true })) },
                            ]} />
                            <Check label={t(`${service}.acceptTerms`)} on={!!form.acceptTerms} onPress={() => setField('acceptTerms', !form.acceptTerms)} />
                            <Check label={t(`${service}.acceptAgreement`)} on={!!form.acceptAgreement} onPress={() => setField('acceptAgreement', !form.acceptAgreement)} />
                        </Section>
                        <Section title={t(`${service}.section8`)}>
                            <Bullets lines={t(`${service}.rules`, { returnObjects: true })} />
                            <Check label={t(`${service}.acceptRules`)} on={!!form.acceptRules} onPress={() => setField('acceptRules', !form.acceptRules)} />
                        </Section>
                        <Section title={t(`${service}.section9`)}>
                            <Text style={styles.note}>{t(`${service}.declaration`)}</Text>
                            <Check label={t(isEdit ? `${service}.confirmDeclaration` : `${service}.confirmDeclarationSubmit`)} on={!!form.acceptDeclaration} onPress={() => setField('acceptDeclaration', !form.acceptDeclaration)} />
                        </Section>
                    </>
                );
            })()}

            {vertical === 'HORSE' && (
                <>
                    <Section title={t('horseRegistration.section1')}>
                        <Field label={t('horseRegistration.operatorName')} value={text('operatorName')} onChangeText={(value) => setField('operatorName', value)} autoCapitalize="words" />
                        {gender('horseRegistration')}
                        <Field label={t('horseRegistration.fatherOrHusbandName')} value={text('fatherOrHusbandName')} onChangeText={(value) => setField('fatherOrHusbandName', value)} autoCapitalize="words" />
                        <DateField label={t('horseRegistration.dateOfBirth')} value={text('dateOfBirth')} onChange={(value) => setField('dateOfBirth', value)} />
                        <Field label={t('horseRegistration.pinCode')} value={text('pincode')} onChangeText={(value) => setField('pincode', value)} keyboardType="numeric" autofillPincode />
                        <Field label={t('horseRegistration.permanentAddress')} value={text('addressLine1')} onChangeText={(value) => setField('addressLine1', value)} />
                    </Section>
                    <Section title={t('horseRegistration.section2')}>
                        <Field label={t('horseRegistration.primaryMobile')} value={text('primaryMobile')} onChangeText={(value) => setField('primaryMobile', value)} keyboardType="phone-pad" />
                        <Field label={t('horseRegistration.alternateMobile')} value={text('alternateMobile')} onChangeText={(value) => setField('alternateMobile', value)} keyboardType="phone-pad" />
                        <Field label={t('horseRegistration.whatsapp')} value={text('whatsapp')} onChangeText={(value) => setField('whatsapp', value)} keyboardType="phone-pad" />
                        <Field label={t('horseRegistration.email')} value={text('email')} onChangeText={(value) => setField('email', value)} keyboardType="email-address" autoCapitalize="none" />
                        <Field label={t('horseRegistration.emergencyName')} value={text('emergencyName')} onChangeText={(value) => setField('emergencyName', value)} autoCapitalize="words" />
                        <Field label={t('horseRegistration.emergencyMobile')} value={text('emergencyMobile')} onChangeText={(value) => setField('emergencyMobile', value)} keyboardType="phone-pad" />
                    </Section>
                    <Section title={t('horseRegistration.section3')}>
                        <Field label={t('horseRegistration.businessName')} value={text('name')} onChangeText={(value) => setField('name', value)} autoCapitalize="words" />
                        <Field label={t('horseRegistration.location')} value={text('location')} onChangeText={(value) => setField('location', value)} />
                        <Field label={t('horseRegistration.serviceArea')} value={text('serviceArea')} onChangeText={(value) => setField('serviceArea', value)} />
                        <Field label={t('horseRegistration.horseCount')} value={text('horseCount')} onChangeText={(value) => setField('horseCount', value)} keyboardType="numeric" />
                        <Field label={t('horseRegistration.experience')} value={text('experience')} onChangeText={(value) => setField('experience', value)} keyboardType="numeric" />
                        <Field label={t('horseRegistration.slotsPerDay')} value={text('slotsPerDay')} onChangeText={(value) => setField('slotsPerDay', value)} keyboardType="numeric" />
                        <Field label={t('horseRegistration.description')} value={text('description')} onChangeText={(value) => setField('description', value)} multiline />
                        <Field label={t('horseRegistration.horseDetails')} value={text('horseDetails')} onChangeText={(value) => setField('horseDetails', value)} multiline />
                        <SelectField label={t('horseRegistration.safetyGearProvided')} value={form.safetyGearProvided === false ? 'no' : 'yes'} onChange={(value) => setField('safetyGearProvided', value === 'yes')} options={[{ value: 'yes', label: t('stayRegistration.yes') }, { value: 'no', label: t('stayRegistration.no') }]} />
                        {photo(t('horseRegistration.profilePhotoUrl'))}
                    </Section>
                    <Section title={t('horseRegistration.section4')}>
                        {(form.routes || []).map((routeRow, index) => (
                            <View key={`${routeRow.name}-${index}`}>
                                <Field label={t('horseRegistration.routeName')} value={routeRow.name || ''} onChangeText={(value) => setField('routes', form.routes.map((row, i) => (i === index ? { ...row, name: value } : row)))} />
                                <Field label={t('horseRegistration.durationMinutes')} value={String(routeRow.durationMinutes ?? '')} onChangeText={(value) => setField('routes', form.routes.map((row, i) => (i === index ? { ...row, durationMinutes: value } : row)))} keyboardType="numeric" />
                                <Field label={t('horseRegistration.routePrice')} value={String(routeRow.price ?? '')} onChangeText={(value) => setField('routes', form.routes.map((row, i) => (i === index ? { ...row, price: value } : row)))} keyboardType="numeric" />
                                {(form.routes || []).length > 1 ? <Button title={t('listingForm.removeRoute')} variant="outline" onPress={() => setField('routes', form.routes.filter((_, i) => i !== index))} /> : null}
                            </View>
                        ))}
                        <Button title={t('listingForm.addRoute')} variant="outline" onPress={() => setField('routes', [...(form.routes || []), defaultRoute()])} />
                    </Section>
                    {documents('horseRegistration')}
                    {bank('horseRegistration')}
                    <Section title={t('horseRegistration.section7')}>
                        <Bullets lines={t('horseRegistration.terms', { returnObjects: true })} />
                        <LegalLinks links={[
                            { label: t('stayRegistration.readFullTerms'), title: t('horseRegistration.termsTitle'), sections: asList(t('horseRegistration.terms', { returnObjects: true })).map((body, index) => ({ heading: `${index + 1}.`, body })) },
                            { label: t('stayRegistration.readPartnerAgreement'), title: t('horseRegistration.partnerAgreementTitle'), sections: asList(t('horseRegistration.partnerAgreementSections', { returnObjects: true })) },
                        ]} />
                        <Check label={t('horseRegistration.acceptTerms')} on={!!form.acceptTerms} onPress={() => setField('acceptTerms', !form.acceptTerms)} />
                        <Check label={t('horseRegistration.acceptAgreement')} on={!!form.acceptAgreement} onPress={() => setField('acceptAgreement', !form.acceptAgreement)} />
                    </Section>
                    <Section title={t('horseRegistration.section8')}>
                        <Text style={styles.note}>{t('horseRegistration.declaration')}</Text>
                        <Check label={t(isEdit ? 'horseRegistration.confirmDeclaration' : 'horseRegistration.confirmDeclarationSubmit')} on={!!form.acceptDeclaration} onPress={() => setField('acceptDeclaration', !form.acceptDeclaration)} />
                    </Section>
                </>
            )}

            {vertical === 'PRODUCT' && (
                <Section title={t('vendor.types.product')}>
                    <SelectField label={t('listingForm.productVertical')} value={form.vertical || 'STRAWBERRY'} onChange={(value) => setField('vertical', value)} options={[{ value: 'STRAWBERRY', label: 'Strawberry' }, { value: 'MAPRO', label: 'Mapro' }]} />
                    <SelectField label={t('listingForm.unit')} value={form.unit || 'pack'} onChange={(value) => setField('unit', value)} options={['pack', 'kg', 'box', 'bottle', 'jar', 'piece'].map((value) => ({ value, label: value }))} />
                    <Field label={t('listingForm.price')} value={text('price')} onChangeText={(value) => setField('price', value)} keyboardType="numeric" />
                    <Field label={t('listingForm.stock')} value={text('stock')} onChangeText={(value) => setField('stock', value)} keyboardType="numeric" />
                    <Field label={t('listingForm.shortDescription')} value={text('shortDescription')} onChangeText={(value) => setField('shortDescription', value)} multiline />
                    {photo(t('listingForm.imageUrl'))}
                </Section>
            )}

            {sections.map((section) => (
                <Section key={section.id} title={section.title}>
                    {(section.fields || []).map((field) => (field.type === 'checkbox' ? (
                        <Check key={field.id} label={field.label} on={!!custom[field.id]} onPress={() => setCustom((prev) => ({ ...prev, [field.id]: !prev[field.id] }))} />
                    ) : field.type === 'select' ? (
                        <SelectField key={field.id} label={field.label} value={custom[field.id] || ''} options={(field.options || []).map((option) => (typeof option === 'string' ? { value: option, label: option } : option))} onChange={(value) => setCustom((prev) => ({ ...prev, [field.id]: value }))} />
                    ) : (
                        <Field key={field.id} label={field.label} value={custom[field.id] == null ? '' : String(custom[field.id])} onChangeText={(value) => setCustom((prev) => ({ ...prev, [field.id]: value }))} keyboardType={field.type === 'number' ? 'numeric' : 'default'} />
                    )))}
                </Section>
            ))}

            <Button title={t('common.save')} onPress={onSave} loading={saving} />
            <Button title={t('common.cancel')} variant="outline" onPress={() => navigation.goBack()} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { paddingBottom: 24 },
    lang: { alignItems: 'flex-start', marginBottom: 8 },
    pageTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, marginBottom: 12 },
    sectionTitle: { fontFamily: FONTS.semibold, fontSize: 15, color: COLORS.text, marginBottom: 10 },
    choiceLabel: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.body, marginBottom: 6, marginTop: 4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9' },
    chipOn: { backgroundColor: '#EFF6FF' },
    chipText: { fontFamily: FONTS.semibold, fontSize: 12, color: '#475569' },
    chipTextOn: { color: COLORS.primary },
    bullet: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 6 },
    note: { fontFamily: FONTS.regular, fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 8 },
    link: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.action, textDecorationLine: 'underline', marginBottom: 8 },
    check: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
    box: { fontSize: 16, color: COLORS.primary, marginTop: 1 },
    checkText: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, lineHeight: 20 },
    backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 16 },
    dialog: { backgroundColor: '#fff', borderRadius: 16, padding: 16, maxHeight: '80%' },
    dialogTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: 8 },
    dialogScroll: { marginBottom: 8 },
    dialogBlock: { marginBottom: 12 },
    dialogHeading: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    dialogBody: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', lineHeight: 20, marginTop: 4 },
});
