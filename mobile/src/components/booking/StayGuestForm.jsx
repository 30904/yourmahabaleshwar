import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import DocumentUpload from './DocumentUpload';
import { Button, Card, Field } from '../ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { formatCurrency } from '../../utils/format';
import { formatTime12, listingPrice } from '../../utils/listing';

const ID_TYPES = [
    ['AADHAAR', 'idAadhaar'],
    ['VOTER', 'idVoter'],
    ['DRIVING_LICENSE', 'idDrivingLicense'],
    ['PASSPORT', 'idPassport'],
];
const PURPOSES = [
    ['TOURISM', 'purposeTourism'],
    ['BUSINESS', 'purposeBusiness'],
    ['PERSONAL', 'purposePersonal'],
];
const PAYMENTS = [
    ['CASH', 'payCash'],
    ['ONLINE', 'payOnline'],
    ['CARD', 'payCard'],
];
const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

function to24(hour12, minute, period) {
    let hour = Number(hour12) % 12;
    if (period === 'PM') hour += 12;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function from24(value) {
    const [rawHour, rawMinute] = String(value || '14:00').split(':').map(Number);
    const hour = Number.isFinite(rawHour) ? rawHour : 14;
    const minute = Number.isFinite(rawMinute) ? Math.min(59, Math.max(0, rawMinute)) : 0;
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return { hour12, minute, period };
}

function DateField({ label, value, onChange }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            {Platform.OS === 'web' ? React.createElement('input', {
                type: 'date',
                value,
                onChange: (event) => onChange(event.target.value),
                style: webInput,
            }) : (
                <TextInput value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.muted} style={styles.input} />
            )}
        </View>
    );
}

function TimeField({ label, value, onChange }) {
    const parsed = from24(value);
    const emit = (next) => onChange(to24(next.hour12, next.minute, next.period));
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.timeRow}>
                {Platform.OS === 'web' ? (
                    <>
                        {React.createElement('select', {
                            value: parsed.hour12,
                            onChange: (event) => emit({ ...parsed, hour12: Number(event.target.value) }),
                            style: webTimeSelect,
                        }, HOURS.map((hour) => React.createElement('option', { key: hour, value: hour }, String(hour).padStart(2, '0'))))}
                        <Text style={styles.colon}>:</Text>
                        {React.createElement('select', {
                            value: parsed.minute,
                            onChange: (event) => emit({ ...parsed, minute: Number(event.target.value) }),
                            style: webTimeSelect,
                        }, MINUTES.map((minute) => React.createElement('option', { key: minute, value: minute }, String(minute).padStart(2, '0'))))}
                    </>
                ) : (
                    <TextInput value={value} onChangeText={onChange} placeholder="HH:MM" style={[styles.input, { flex: 1 }]} />
                )}
                <View style={styles.periodGroup}>
                    {['AM', 'PM'].map((period, index) => (
                        <Pressable key={period} onPress={() => emit({ ...parsed, period })} style={[styles.period, index > 0 && styles.periodSplit, parsed.period === period && styles.periodOn]}>
                            <Text style={[styles.periodText, parsed.period === period && styles.periodTextOn]}>{period}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
}

function LanguageToggle() {
    const { i18n } = useTranslation();
    const current = i18n.language?.startsWith('mr') ? 'mr' : 'en';
    const pick = (lng) => {
        i18n.changeLanguage(lng);
        if (typeof localStorage !== 'undefined') localStorage.setItem('lang', lng);
    };
    return (
        <View style={styles.langRow}>
            {[['en', 'EN'], ['mr', 'मर']].map(([code, label]) => (
                <Pressable key={code} onPress={() => pick(code)} style={[styles.langBtn, current === code && styles.langBtnOn]}>
                    <Text style={[styles.langText, current === code && styles.langTextOn]}>{label}</Text>
                </Pressable>
            ))}
        </View>
    );
}

function WebSelect({ label, value, onChange, options }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            {Platform.OS === 'web' ? React.createElement('select', {
                value: value || '',
                onChange: (event) => onChange(event.target.value),
                style: webInput,
            }, options.map(([id, text]) => React.createElement('option', { key: id || 'blank', value: id }, text))) : (
                <ChoiceRow label="" options={options} value={value} onChange={onChange} />
            )}
        </View>
    );
}

function ChoiceRow({ label, options, value, onChange }) {
    return (
        <View style={styles.field}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.choices}>
                {options.map(([id, text]) => (
                    <Pressable key={id} onPress={() => onChange(id)} style={styles.choice}>
                        {Platform.OS === 'web' ? React.createElement('input', {
                            type: 'radio',
                            checked: value === id,
                            onChange: () => onChange(id),
                            style: nativeRadio,
                        }) : (
                            <View style={[styles.radio, value === id && styles.radioOn]}>
                                {value === id ? <View style={styles.radioDot} /> : null}
                            </View>
                        )}
                        <Text style={styles.choiceText}>{text}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
}

export default function StayGuestForm({ type, item, user, onConfirm, submitting, roomId, onRoomChange }) {
    const { t, i18n } = useTranslation();
    const rooms = item.rooms || [];
    const isTent = type === 'TENT';
    const [form, setForm] = useState({
        checkIn: '',
        checkOut: '',
        checkInTime: item.checkInTime || '14:00',
        checkOutTime: item.checkOutTime || '11:00',
        roomId: roomId || rooms[0]?._id || '',
        tentQuantity: '1',
        adults: '2',
        children: '0',
        leadFullName: user?.name || '',
        leadAge: '',
        leadGender: '',
        leadMobile: user?.phone || '',
        leadEmail: user?.email || '',
        leadAddress: '',
        leadCityState: 'Mahabaleshwar, Maharashtra',
        leadPincode: '',
        comingFrom: '',
        goingTo: '',
        purpose: 'TOURISM',
        idType: 'AADHAAR',
        idNumber: '',
        idProofDocumentUrl: '',
        nationality: 'INDIAN',
        coTravellers: [],
        paymentMode: 'ONLINE',
        advanceAmount: '',
        acceptTerms: false,
        specialRequests: '',
    });
    const [error, setError] = useState('');
    const [legalOpen, setLegalOpen] = useState(false);
    const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    useEffect(() => {
        if (roomId && String(roomId) !== String(form.roomId)) setField('roomId', roomId);
    }, [roomId]);

    const room = rooms.find((entry) => String(entry._id) === String(form.roomId)) || rooms[0];
    const nights = Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000);
    const ready = Number.isFinite(nights) && nights >= 1;
    const qty = isTent ? Math.max(1, Number(form.tentQuantity) || 1) : 1;
    const tariff = isTent ? (listingPrice(item) || 0) : (Number(room?.basePrice) || 0);
    const total = ready ? tariff * nights * qty : 0;
    const termsNs = type === 'HOMESTAY' ? 'homestayGuestBooking' : type === 'TENT' ? 'tentGuestBooking' : 'hotelGuestBooking';
    const fullTermsNs = type === 'HOMESTAY' ? 'homestayRegistration' : type === 'TENT' ? 'tentGuestBooking' : 'hotelRegistration';
    const summaryLines = useMemo(() => {
        const lines = t(`${termsNs}.termsSummary`, { returnObjects: true });
        return Array.isArray(lines) ? lines : [];
    }, [t, i18n.language, termsNs]);
    const fullSections = useMemo(() => {
        const sections = t(`${fullTermsNs}.fullTermsSections`, { returnObjects: true });
        return Array.isArray(sections) ? sections : [];
    }, [t, i18n.language, fullTermsNs]);
    const fullTermsTitle = t(`${fullTermsNs}.fullTermsTitle`);
    const titleKey = type === 'HOMESTAY'
        ? 'homestayGuestBooking.formTitle'
        : type === 'TENT'
            ? 'tentGuestBooking.formTitle'
            : type === 'RESORT' || item.type === 'RESORT'
                ? 'hotelGuestBooking.formTitleResort'
                : 'hotelGuestBooking.formTitleHotel';
    const subtitleKey = type === 'HOMESTAY'
        ? 'homestayGuestBooking.formSubtitle'
        : type === 'TENT'
            ? 'tentGuestBooking.formSubtitle'
            : 'hotelGuestBooking.formSubtitle';
    const termsKey = type === 'HOMESTAY'
        ? 'homestayGuestBooking.acceptTerms'
        : type === 'TENT'
            ? 'tentGuestBooking.acceptTerms'
            : 'hotelGuestBooking.acceptTerms';

    const travellerCount = Math.max(0, (Number(form.adults) || 1) + (Number(form.children) || 0) - 1);
    const travellers = useMemo(() => {
        const current = form.coTravellers || [];
        return Array.from({ length: travellerCount }, (_, index) => current[index] || { fullName: '', age: '', gender: '', relationship: '' });
    }, [form.coTravellers, travellerCount]);

    const setTraveller = (index, key, value) => {
        const next = travellers.map((entry, itemIndex) => (itemIndex === index ? { ...entry, [key]: value } : entry));
        setField('coTravellers', next);
    };

    const submit = () => {
        if (!form.checkIn || !form.checkOut || !ready) {
            setError(t('stayGuestBooking.validation.datesRequired'));
            return;
        }
        if (!isTent && !room?._id) {
            setError(t('stayGuestBooking.validation.selectRoom'));
            return;
        }
        if (isTent) {
            const available = Number(item.totalTents) || qty;
            if (qty > available) {
                setError(t('booking.tooManyTents', { count: available }));
                return;
            }
        }
        if (!form.leadFullName.trim()) {
            setError(t('stayGuestBooking.validation.fullName'));
            return;
        }
        if (!form.leadMobile.trim()) {
            setError(t('stayGuestBooking.validation.mobile'));
            return;
        }
        if (!form.idType || !form.idNumber.trim()) {
            setError(t('stayGuestBooking.validation.idProof'));
            return;
        }
        if ((Number(form.adults) || 0) < 1) {
            setError(t('stayGuestBooking.validation.adults'));
            return;
        }
        if (!form.acceptTerms) {
            setError(t('stayGuestBooking.validation.acceptTerms'));
            return;
        }
        setError('');
        const adultCount = Number(form.adults) || 1;
        const childCount = Number(form.children) || 0;
        const guestRegistration = {
            formDate: new Date().toISOString(),
            checkInTime: form.checkInTime,
            checkOutTime: form.checkOutTime,
            adults: adultCount,
            children: childCount,
            leadGuest: {
                fullName: form.leadFullName.trim(),
                age: form.leadAge ? Number(form.leadAge) : undefined,
                gender: form.leadGender || '',
                mobile: form.leadMobile.trim(),
                email: form.leadEmail.trim(),
                address: form.leadAddress.trim(),
                cityState: form.leadCityState.trim(),
                pincode: form.leadPincode.trim(),
                comingFrom: form.comingFrom.trim(),
                goingTo: form.goingTo.trim(),
                purpose: form.purpose || '',
            },
            idProof: {
                type: form.idType,
                number: form.idNumber.trim(),
                nationality: form.nationality || 'INDIAN',
                documentUrl: form.idProofDocumentUrl || undefined,
            },
            coTravellers: travellers.filter((entry) => String(entry.fullName || '').trim()),
            totalNights: nights,
            tariff,
            advanceAmount: form.advanceAmount !== '' ? Number(form.advanceAmount) : total,
            paymentMode: form.paymentMode || 'ONLINE',
            acceptTerms: true,
            acceptedTermsAt: new Date().toISOString(),
            specialRequests: form.specialRequests.trim(),
        };
        const body = {
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            guests: { adults: adultCount, children: childCount },
            guestRegistration,
        };
        if (isTent) {
            body.tentId = item._id;
            body.tentQuantity = qty;
            guestRegistration.tentLabel = item.name;
        }
        else if (type === 'HOMESTAY') {
            body.homestayId = item._id;
            body.roomId = room._id;
            guestRegistration.roomLabel = room.name;
        }
        else {
            body.hotelId = item._id;
            body.roomId = room._id;
            guestRegistration.roomLabel = room.name;
        }
        onConfirm(body);
    };

    const pickRoom = (value) => {
        setField('roomId', value);
        onRoomChange?.(value);
    };
    const genderOptions = [['', t('stayGuestBooking.selectGender')], ['M', t('stayGuestBooking.genderMale')], ['F', t('stayGuestBooking.genderFemale')], ['OTHER', t('stayGuestBooking.genderOther')]];

    return (
        <View>
            <View style={styles.head}>
                <Text style={styles.title}>{t(titleKey)}</Text>
                <Text style={styles.subtitle}>{t(subtitleKey, { name: item.name })}</Text>
                <View style={styles.headSide}>
                    <LanguageToggle />
                    <Text style={styles.dateLine}>{t('stayGuestBooking.formDate')}: {new Date().toLocaleDateString('en-IN')}</Text>
                </View>
            </View>

            <Card>
                <Text style={styles.section}>{isTent ? t('tentGuestBooking.sectionStay') : t('stayGuestBooking.sectionStayDates')}</Text>
                <DateField label={t('stayGuestBooking.checkInDate')} value={form.checkIn} onChange={(value) => setField('checkIn', value)} />
                <TimeField label={t('stayGuestBooking.checkInTime')} value={form.checkInTime} onChange={(value) => setField('checkInTime', value)} />
                <DateField label={t('stayGuestBooking.checkOutDate')} value={form.checkOut} onChange={(value) => setField('checkOut', value)} />
                <TimeField label={t('stayGuestBooking.checkOutTime')} value={form.checkOutTime} onChange={(value) => setField('checkOutTime', value)} />
                {isTent ? (
                    <Field label={t('tentGuestBooking.tentQuantity')} value={form.tentQuantity} onChangeText={(value) => setField('tentQuantity', value)} keyboardType="numeric" />
                ) : (
                    <WebSelect
                        label={t('stayGuestBooking.room')}
                        value={String(form.roomId || '')}
                        onChange={pickRoom}
                        options={rooms.map((entry) => [String(entry._id), `${entry.name} — ${formatCurrency(entry.basePrice || 0)} ${t('stayGuestBooking.perNight')}`])}
                    />
                )}
                <Text style={styles.note}>{t('stayGuestBooking.timesRangeHint', { checkIn: formatTime12(item.checkInTime || '14:00'), checkOut: formatTime12(item.checkOutTime || '11:00') })}</Text>
            </Card>

            <Card>
                <Text style={styles.section}>{t('stayGuestBooking.sectionLeadGuest')}</Text>
                <Field label={t('stayGuestBooking.fullName')} value={form.leadFullName} onChangeText={(value) => setField('leadFullName', value)} autoCapitalize="words" />
                <Field label={t('stayGuestBooking.age')} value={form.leadAge} onChangeText={(value) => setField('leadAge', value)} keyboardType="numeric" />
                <WebSelect label={t('stayGuestBooking.gender')} value={form.leadGender} onChange={(value) => setField('leadGender', value)} options={genderOptions} />
                <Field label={t('stayGuestBooking.mobile')} value={form.leadMobile} onChangeText={(value) => setField('leadMobile', value)} keyboardType="phone-pad" />
                <Field label={t('stayGuestBooking.email')} value={form.leadEmail} onChangeText={(value) => setField('leadEmail', value)} keyboardType="email-address" />
                <Field label={t('stayGuestBooking.permanentAddress')} value={form.leadAddress} onChangeText={(value) => setField('leadAddress', value)} />
                <Field label={t('stayGuestBooking.cityState')} value={form.leadCityState} onChangeText={(value) => setField('leadCityState', value)} />
                <Field label={t('stayGuestBooking.pinCode')} value={form.leadPincode} onChangeText={(value) => setField('leadPincode', value)} keyboardType="numeric" maxLength={6} autofillPincode />
                <Field label={t('stayGuestBooking.comingFrom')} value={form.comingFrom} onChangeText={(value) => setField('comingFrom', value)} />
                <Field label={t('stayGuestBooking.goingTo')} value={form.goingTo} onChangeText={(value) => setField('goingTo', value)} />
                <ChoiceRow label={t('stayGuestBooking.purposeOfVisit')} value={form.purpose} onChange={(value) => setField('purpose', value)} options={PURPOSES.map(([id, key]) => [id, t(`stayGuestBooking.${key}`)])} />
            </Card>

            <Card>
                <Text style={styles.section}>{t('stayGuestBooking.sectionIdProof')}</Text>
                <ChoiceRow label={t('stayGuestBooking.idType')} value={form.idType} onChange={(value) => setField('idType', value)} options={ID_TYPES.map(([id, key]) => [id, t(`stayGuestBooking.${key}`)])} />
                <Field label={t('stayGuestBooking.idNumber')} value={form.idNumber} onChangeText={(value) => setField('idNumber', value)} autoCapitalize="characters" />
                <DocumentUpload
                    label={t('stayGuestBooking.idProofUpload')}
                    hint={t('stayGuestBooking.idProofUploadHint')}
                    value={form.idProofDocumentUrl}
                    onChange={(value) => setField('idProofDocumentUrl', value)}
                    category="booking-id-proof"
                    userId={user?._id}
                />
                <WebSelect label={t('stayGuestBooking.nationality')} value={form.nationality} onChange={(value) => setField('nationality', value)} options={[['INDIAN', t('stayGuestBooking.nationalityIndian')], ['OTHER', t('stayGuestBooking.nationalityOther')]]} />
            </Card>

            <Card>
                <Text style={styles.section}>{isTent ? t('tentGuestBooking.sectionGuests') : t('stayGuestBooking.sectionCoTravellers')}</Text>
                <Field label={t('stayGuestBooking.adults')} value={form.adults} onChangeText={(value) => setField('adults', value)} keyboardType="numeric" />
                <Field label={t('stayGuestBooking.children')} value={form.children} onChangeText={(value) => setField('children', value)} keyboardType="numeric" />
                {travellers.map((entry, index) => (
                    <View key={index} style={styles.guestCard}>
                        <Field label={t('stayGuestBooking.guestFullName', { n: index + 1 })} value={entry.fullName} onChangeText={(value) => setTraveller(index, 'fullName', value)} autoCapitalize="words" />
                        <Field label={t('stayGuestBooking.age')} value={entry.age} onChangeText={(value) => setTraveller(index, 'age', value)} keyboardType="numeric" />
                        <WebSelect label={t('stayGuestBooking.gender')} value={entry.gender} onChange={(value) => setTraveller(index, 'gender', value)} options={[['', t('stayGuestBooking.selectGender')], ['M', t('stayGuestBooking.genderShortMale')], ['F', t('stayGuestBooking.genderShortFemale')], ['OTHER', t('stayGuestBooking.genderOther')]]} />
                        <Field label={t('stayGuestBooking.relationship')} value={entry.relationship} onChangeText={(value) => setTraveller(index, 'relationship', value)} />
                    </View>
                ))}
                {isTent ? <Field label={t('tentGuestBooking.specialRequests')} value={form.specialRequests} onChangeText={(value) => setField('specialRequests', value)} /> : null}
            </Card>

            <Card>
                <Text style={styles.section}>{isTent ? t('tentGuestBooking.sectionPayment') : t('stayGuestBooking.sectionPayment')}</Text>
                <View style={styles.payGrid}>
                    {!isTent ? (
                        <View style={styles.payCell}>
                            <Text style={styles.payCaption}>{t('stayGuestBooking.roomSummary')}</Text>
                            <Text style={styles.payValue}>{room?.name || '—'}</Text>
                        </View>
                    ) : null}
                    <View style={styles.payCell}>
                        <Text style={styles.payCaption}>{t('stayGuestBooking.totalNights')}</Text>
                        <Text style={styles.payValue}>{ready ? String(nights) : '—'}</Text>
                    </View>
                    <View style={styles.payCell}>
                        <Text style={styles.payCaption}>{t('stayGuestBooking.tariffPerNight')}</Text>
                        <Text style={styles.payValue}>{formatCurrency(tariff)}</Text>
                    </View>
                </View>
                <Field label={t('stayGuestBooking.advanceAmount')} value={form.advanceAmount} onChangeText={(value) => setField('advanceAmount', value)} keyboardType="numeric" placeholder={total ? String(total) : ''} />
                <ChoiceRow label={t('stayGuestBooking.paymentMode')} value={form.paymentMode} onChange={(value) => setField('paymentMode', value)} options={PAYMENTS.map(([id, key]) => [id, t(`stayGuestBooking.${key}`)])} />
                <Text style={styles.note}>{t('stayGuestBooking.paymentHint')}</Text>
                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>{t(nights === 1 ? 'stayGuestBooking.subtotalNights_one' : 'stayGuestBooking.subtotalNights_other', { count: ready ? nights : 0 })}</Text>
                    <Text style={styles.payValue}>{formatCurrency(total)}</Text>
                </View>
                <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>{t('stayGuestBooking.totalLabel')}</Text>
                    <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
            </Card>

            <Card>
                <Text style={styles.section}>{t('stayGuestBooking.sectionTerms')}</Text>
                <View style={styles.termList}>
                    {summaryLines.map((line) => (
                        <View key={line} style={styles.termItem}>
                            <Text style={styles.termDot}>•</Text>
                            <Text style={styles.bullet}>{line}</Text>
                        </View>
                    ))}
                </View>
                <Pressable onPress={() => setLegalOpen(true)} style={styles.linkHit}>
                    <Text style={styles.link}>{t('stayGuestBooking.readFullTerms')}</Text>
                </Pressable>
                <Pressable onPress={() => setField('acceptTerms', !form.acceptTerms)} style={styles.terms}>
                    <View style={[styles.box, form.acceptTerms && styles.boxOn]}>{form.acceptTerms ? <Text style={styles.tick}>✓</Text> : null}</View>
                    <Text style={styles.termsText}>{t(termsKey)}</Text>
                </Pressable>
            </Card>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title={submitting ? t('common.loading') : t('stayGuestBooking.confirmBooking')} onPress={submit} loading={submitting} />
            <Modal visible={legalOpen} transparent animationType="fade" onRequestClose={() => setLegalOpen(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setLegalOpen(false)}>
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                        <View style={styles.modalHead}>
                            <Text style={styles.modalTitle}>{fullTermsTitle}</Text>
                            <Pressable onPress={() => setLegalOpen(false)}><Text style={styles.link}>{t('stayGuestBooking.close')}</Text></Pressable>
                        </View>
                        <ScrollView style={styles.modalScroll}>
                            {fullSections.map((section) => (
                                <View key={section.heading} style={{ marginBottom: 12 }}>
                                    <Text style={styles.payValue}>{section.heading}</Text>
                                    <Text style={styles.bullet}>{section.body}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const webInput = {
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 14,
    lineHeight: '20px',
    color: '#1e293b',
    backgroundColor: '#fff',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
    boxSizing: 'border-box',
};

const webSelect = {
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 14,
    color: '#1e293b',
    background: '#fff',
    fontFamily: 'Segoe UI, system-ui, sans-serif',
};

const nativeRadio = {
    width: 16,
    height: 16,
    margin: 0,
    accentColor: '#0071c2',
};

const webTimeSelect = {
    ...webSelect,
    width: 72,
    maxWidth: 72,
};

const styles = StyleSheet.create({
    head: { alignItems: 'flex-start', marginBottom: 16 },
    headSide: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    title: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
    subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B', marginTop: 4 },
    dateLine: { fontFamily: FONTS.regular, fontSize: 14, color: '#64748B' },
    langRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 2, backgroundColor: '#fff' },
    langBtn: { borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
    langBtnOn: { backgroundColor: COLORS.primary },
    langText: { fontFamily: FONTS.bold, fontSize: 12, color: '#475569' },
    langTextOn: { color: '#fff' },
    section: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text, marginBottom: 12 },
    colon: { fontFamily: FONTS.medium, fontSize: 16, color: COLORS.body },
    payGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    payCell: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, minWidth: 120, flexGrow: 1 },
    payCaption: { fontFamily: FONTS.regular, fontSize: 13, color: '#64748B' },
    payValue: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text, marginTop: 2 },
    termList: { marginTop: 2 },
    termItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    termDot: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, color: '#475569' },
    bullet: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: '#475569', lineHeight: 22 },
    linkHit: { alignSelf: 'flex-start', marginTop: 4, marginBottom: 12 },
    link: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary, textDecorationLine: 'underline' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 16 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '85%' },
    modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    modalTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    modalScroll: { flexGrow: 0 },
    field: { marginBottom: 12 },
    label: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.body, marginBottom: 6 },
    input: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: RADIUS.input,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: COLORS.body,
        backgroundColor: '#fff',
    },
    timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    periodGroup: { flexDirection: 'row', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
    period: { minWidth: 44, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#fff', alignItems: 'center' },
    periodSplit: { borderLeftWidth: 1, borderLeftColor: '#CBD5E1' },
    periodOn: { backgroundColor: 'rgba(0, 113, 194, 0.16)' },
    periodText: { fontFamily: FONTS.semibold, fontSize: 14, color: '#475569' },
    periodTextOn: { color: COLORS.action },
    choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    choice: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    choiceText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.body },
    radio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#94A3B8', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    radioOn: { borderColor: '#0071C2' },
    radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0071C2' },
    note: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginBottom: 8 },
    room: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, backgroundColor: '#fff' },
    roomOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    roomTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    roomPrice: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.muted, marginTop: 2 },
    guestCard: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 10 },
    summary: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, marginBottom: 8 },
    summaryLine: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.body, marginBottom: 4 },
    totalBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, marginTop: 8 },
    totalLabel: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.primary },
    totalValue: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary },
    terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
    box: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    boxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tick: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
    termsText: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.body, lineHeight: 20 },
    error: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.danger, marginTop: 10 },
});
