import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createBooking } from '../../api/endpoints';
import DriverRateChart, { DRIVER_PACKAGES, driverPackagePrice } from '../../components/DriverRateChart';
import HorseRateChart, { HORSE_CHART_PACKAGES, horseChartPrice } from '../../components/HorseRateChart';
import GuideRateChart, { GUIDE_CHART_PACKAGES, GUIDE_TOURS, guideChartPrice } from '../../components/GuideRateChart';
import TaxiRateChart, { TAXI_CARS, TAXI_COASTAL, TAXI_ROUTES, TAXI_TOURS, taxiChartPrice } from '../../components/TaxiRateChart';
import { DateField, FormHeader, RadioChoices, SelectField, TermsCard, TimeField } from '../../components/booking/formChrome';
import { Button, Card, Field, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';

const SERVICE_NS = {
    GUIDE: 'guideGuestBooking',
    TAXI: 'taxiGuestBooking',
    DRIVER: 'driverGuestBooking',
    HORSE: 'horseGuestBooking',
};

function spotsOf(value) {
    return Array.isArray(value) ? value : [];
}

function RateChartToggle({ children }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    return (
        <View style={styles.chartWrap}>
            <Pressable onPress={() => setOpen((value) => !value)} style={styles.chartBtn}>
                <Text style={styles.chartBtnText}>{open ? t('serviceBooking.hideRateChart') : t('serviceBooking.seeRateChart')}</Text>
                <Text style={styles.chartBtnText}>{open ? '▴' : '▾'}</Text>
            </Pressable>
            {open ? <View style={styles.chartBody}>{children}</View> : null}
        </View>
    );
}

function Section({ title, children }) {
    return (
        <Card>
            <Text style={styles.section}>{title}</Text>
            {children}
        </Card>
    );
}

export default function ServiceBookScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const type = route.params?.type || 'GUIDE';
    const ns = SERVICE_NS[type] || SERVICE_NS.GUIDE;
    const [checkIn, setCheckIn] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [guidePackage, setGuidePackage] = useState(GUIDE_CHART_PACKAGES[0].id);
    const [tourId, setTourId] = useState(GUIDE_TOURS[0].id);
    const [bikeAddon, setBikeAddon] = useState('');
    const [taxiCar, setTaxiCar] = useState(TAXI_CARS[0].id);
    const [taxiRoute, setTaxiRoute] = useState(TAXI_TOURS[0].id);
    const [driverPackage, setDriverPackage] = useState(DRIVER_PACKAGES[0].id);
    const [horsePackage, setHorsePackage] = useState(HORSE_CHART_PACKAGES[0].id);
    const [count, setCount] = useState('1');
    const [leadName, setLeadName] = useState(user?.name || '');
    const [leadAge, setLeadAge] = useState('');
    const [leadGender, setLeadGender] = useState('');
    const [leadMobile, setLeadMobile] = useState(user?.phone || '');
    const [email, setEmail] = useState(user?.email || '');
    const [address, setAddress] = useState('');
    const [cityState, setCityState] = useState('Mahabaleshwar, Maharashtra');
    const [pincode, setPincode] = useState('');
    const [emergencyName, setEmergencyName] = useState('');
    const [emergencyMobile, setEmergencyMobile] = useState('');
    const [routeTripType, setRouteTripType] = useState('ROUND_TRIP');
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropLocation, setDropLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [advanceAmount, setAdvanceAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('ONLINE');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptSafety, setAcceptSafety] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const wantsBike = bikeAddon === 'yes';
    const guidePkg = GUIDE_CHART_PACKAGES.find((item) => item.id === guidePackage) || GUIDE_CHART_PACKAGES[0];
    const guideTour = GUIDE_TOURS.find((item) => item.id === tourId) || GUIDE_TOURS[0];
    const guideSpots = spotsOf(t(guidePackage === '8HR' ? guideTour.eightKey : guideTour.fourKey, { returnObjects: true }));
    const selectedTaxiTour = TAXI_TOURS.find((item) => item.id === taxiRoute);
    const taxiPoints = selectedTaxiTour ? spotsOf(t(`taxi.tours.${selectedTaxiTour.key}.points`, { returnObjects: true })) : [];
    const taxiNote = selectedTaxiTour ? t(`taxi.tours.${selectedTaxiTour.key}.note`, { defaultValue: '' }) : '';
    const needsDrop = (type === 'TAXI' || type === 'DRIVER') && (routeTripType === 'ONE_WAY' || routeTripType === 'DROP');
    const total = type === 'GUIDE'
        ? guideChartPrice(guidePackage, wantsBike)
        : type === 'TAXI'
            ? taxiChartPrice(taxiRoute)
            : type === 'DRIVER'
                ? driverPackagePrice(driverPackage)
                : horseChartPrice(horsePackage);

    const taxiOptions = [
        ...TAXI_TOURS.map((tour) => ({ value: tour.id, label: `${t(`taxi.tours.${tour.key}.name`)} — ${formatCurrency(tour.price)}` })),
        ...TAXI_ROUTES.flatMap((route) => [
            route.drop != null ? { value: route.dropId, label: `${t(route.nameKey)} · ${t('taxi.chartDrop')} — ${formatCurrency(route.drop)}` } : null,
            route.return != null ? { value: route.returnId, label: `${t(route.nameKey)} · ${t('taxi.chartReturn')} — ${formatCurrency(route.return)}` } : null,
        ].filter(Boolean)),
        ...TAXI_COASTAL.map((route) => ({ value: route.id, label: `${t(route.nameKey)} — ${formatCurrency(route.price)}` })),
    ];

    const submit = async () => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }
        if (!checkIn) {
            Alert.alert(t('common.error'), t('booking.badDates'));
            return;
        }
        if (type === 'GUIDE' && bikeAddon !== 'yes' && bikeAddon !== 'no') {
            Alert.alert(t('common.error'), t('guideGuestBooking.validation.bikeAddon'));
            return;
        }
        const needsDrop = (type === 'TAXI' || type === 'DRIVER') && (routeTripType === 'ONE_WAY' || routeTripType === 'DROP');
        if ((type === 'TAXI' || type === 'DRIVER') && !pickupLocation.trim()) {
            Alert.alert(t('common.error'), t(`${ns}.validation.pickupLocation`, { defaultValue: t(`${ns}.pickupLocation`) }));
            return;
        }
        if (needsDrop && !dropLocation.trim()) {
            Alert.alert(t('common.error'), t(`${ns}.validation.dropLocation`, { defaultValue: t(`${ns}.dropLocation`) }));
            return;
        }
        if (!leadName.trim() || !leadMobile.trim() || !email.trim()) {
            Alert.alert(t('common.error'), t('booking.needGuest'));
            return;
        }
        if (!acceptTerms || (type === 'HORSE' && !acceptSafety)) {
            Alert.alert(t('common.error'), t('booking.needTerms'));
            return;
        }
        const people = Math.max(1, Number(count) || 1);
        const emergencyNote = [emergencyName, emergencyMobile].filter(Boolean).join(' · ');
        const specialRequests = [notes.trim(), emergencyNote ? `Emergency: ${emergencyNote}` : ''].filter(Boolean).join('\n');
        const leadGuest = {
            fullName: leadName.trim(),
            mobile: leadMobile.trim(),
            email: email.trim(),
            address: address.trim(),
            cityState: cityState.trim(),
            pincode: pincode.trim(),
            age: leadAge ? Number(leadAge) : undefined,
            gender: leadGender || '',
            comingFrom: emergencyName.trim(),
            goingTo: needsDrop ? dropLocation.trim() : emergencyMobile.trim(),
            purpose: 'TOURISM',
        };
        const money = {
            formDate: new Date().toISOString(),
            checkInTime: startTime,
            advanceAmount: advanceAmount !== '' ? Number(advanceAmount) : total,
            paymentMode: paymentMode || 'ONLINE',
            acceptTerms: true,
            acceptedTermsAt: new Date().toISOString(),
            adults: people,
            leadGuest,
        };
        const body = { open: true, checkIn };
        if (type === 'GUIDE') {
            body.guidePackage = guidePackage;
            body.bikeAddon = wantsBike;
            body.guestRegistration = {
                ...money,
                tourDetails: {
                    packageType: guidePackage,
                    tourLocationId: tourId,
                    bikeAddon: wantsBike,
                    startTime,
                    touristCount: people,
                    pickupLocation: address.trim(),
                    packagePrice: total,
                    bikeAddonPrice: wantsBike ? guideChartPrice(guidePackage, true) - guideChartPrice(guidePackage, false) : 0,
                    specialRequests,
                },
            };
        }
        else if (type === 'TAXI' || type === 'DRIVER') {
            const pkg = DRIVER_PACKAGES.find((item) => item.id === driverPackage) || DRIVER_PACKAGES[0];
            body.serviceTenant = type;
            body.taxiType = 'PER_TRIP';
            body.guestRegistration = {
                ...money,
                taxiDetails: {
                    tripType: type === 'DRIVER' ? 'PACKAGE' : 'ROUTE',
                    routeId: type === 'TAXI' ? taxiRoute : undefined,
                    packageId: type === 'DRIVER' ? pkg.id : undefined,
                    packageName: type === 'DRIVER' ? t(pkg.nameKey) : undefined,
                    carType: type === 'TAXI' ? taxiCar : undefined,
                    startTime,
                    passengerCount: people,
                    pickupLocation: pickupLocation.trim(),
                    dropLocation: needsDrop ? dropLocation.trim() : '',
                    routeTripType,
                    tripPrice: total,
                    perTripPrice: total,
                    hourlyRate: 0,
                    specialRequests,
                },
            };
        }
        else {
            const pkg = HORSE_CHART_PACKAGES.find((item) => item.id === horsePackage) || HORSE_CHART_PACKAGES[0];
            body.guestRegistration = {
                ...money,
                horseDetails: {
                    routeId: pkg.id,
                    routeName: t(pkg.nameKey),
                    startTime,
                    riderCount: people,
                    safetyAcknowledged: true,
                    routePrice: total,
                    specialRequests,
                },
            };
        }
        setSubmitting(true);
        try {
            await createBooking(type, body);
            Alert.alert(t('serviceBooking.requestSubmitted'));
            navigation.navigate('MainTabs', { screen: 'Bookings' });
        }
        catch (error) {
            Alert.alert(t('common.error'), error.response?.data?.message || error.message);
        }
        finally {
            setSubmitting(false);
        }
    };

    const titleKey = type === 'TAXI' ? 'serviceBooking.taxiTitle' : type === 'DRIVER' ? 'serviceBooking.driverTitle' : type === 'HORSE' ? 'serviceBooking.horseTitle' : 'serviceBooking.guideTitle';
    const termsTitle = type === 'HORSE' || type === 'TAXI' || type === 'DRIVER' ? t(`${ns}.section6`) : t(`${ns}.section5`);
    const payTitle = type === 'HORSE' ? t(`${ns}.section5`) : t(`${ns}.section4`);

    return (
        <Screen style={styles.screen}>
            <ScrollView contentContainerStyle={styles.page}>
                <View style={styles.inner}>
                    <FormHeader title={t(titleKey)} subtitle={t('serviceBooking.openFormSubtitle')} dateLabel={t(`${ns}.formDate`)} />
                    <Section title={t(`${ns}.section1`)}>
                        <RateChartToggle>
                            {type === 'GUIDE' ? <GuideRateChart embedded /> : null}
                            {type === 'TAXI' ? <TaxiRateChart embedded /> : null}
                            {type === 'DRIVER' ? <DriverRateChart embedded /> : null}
                            {type === 'HORSE' ? <HorseRateChart embedded /> : null}
                        </RateChartToggle>
                        <DateField label={t(type === 'GUIDE' ? `${ns}.tourDate` : type === 'HORSE' ? `${ns}.rideDate` : `${ns}.tripDate`)} value={checkIn} onChange={setCheckIn} />
                        <TimeField label={t(type === 'GUIDE' || type === 'HORSE' ? `${ns}.startTime` : `${ns}.pickupTime`)} value={startTime} onChange={setStartTime} />
                        {type === 'GUIDE' ? (
                            <>
                                <SelectField
                                    label={t(`${ns}.packageLabel`)}
                                    value={guidePackage}
                                    onChange={setGuidePackage}
                                    options={GUIDE_CHART_PACKAGES.map((pkg) => ({
                                        value: pkg.id,
                                        label: `${t(pkg.nameKey)} — ${formatCurrency(wantsBike ? pkg.withBike : pkg.guideOnly)}`,
                                    }))}
                                />
                                <SelectField
                                    label={t(`${ns}.tourLocationLabel`)}
                                    value={tourId}
                                    onChange={setTourId}
                                    options={GUIDE_TOURS.map((tour) => ({ value: tour.id, label: t(tour.nameKey) }))}
                                />
                                {guideSpots.length ? (
                                    <View style={styles.points}>
                                        <Text style={styles.pointsTitle}>{t(`${ns}.pointsCoveredTitle`, { tour: t(guideTour.nameKey), package: t(guidePkg.nameKey) })}</Text>
                                        <Text style={styles.pointsHint}>{t(`${ns}.pointsCoveredHint`)}</Text>
                                        {guideSpots.map((spot) => <Text key={spot} style={styles.point}>•  {spot}</Text>)}
                                    </View>
                                ) : null}
                                <RadioChoices
                                    label={t(`${ns}.bikeAddonLabel`, { price: formatCurrency(guideChartPrice(guidePackage, true) - guideChartPrice(guidePackage, false)) })}
                                    value={bikeAddon}
                                    onChange={setBikeAddon}
                                    options={[['yes', t(`${ns}.bikeAddonYes`)], ['no', t(`${ns}.bikeAddonNo`)]]}
                                />
                                <Text style={styles.note}>{t(`${ns}.overtimeNote`, { rate: formatCurrency(150) })}</Text>
                            </>
                        ) : null}
                        {type === 'TAXI' ? (
                            <>
                                <SelectField label={t(`${ns}.carTypeLabel`)} value={taxiCar} onChange={setTaxiCar} options={TAXI_CARS.map((car) => ({ value: car.id, label: t(car.key) }))} />
                                <SelectField label={t(`${ns}.selectedRouteLabel`)} value={taxiRoute} onChange={setTaxiRoute} options={taxiOptions} />
                                <Text style={styles.fareLine}>
                                    {t(`${ns}.selectedFareLabel`)}: {formatCurrency(total)}
                                    {selectedTaxiTour ? ` · ${t(`taxi.tours.${selectedTaxiTour.key}.duration`)}` : ''}
                                </Text>
                                {taxiPoints.length ? (
                                    <View style={styles.points}>
                                        <Text style={styles.pointsTitle}>{t(`${ns}.pointsCoveredTitle`, { tour: t(`taxi.tours.${selectedTaxiTour.key}.name`), duration: t(`taxi.tours.${selectedTaxiTour.key}.duration`) })}</Text>
                                        <Text style={styles.pointsHint}>{t(`${ns}.pointsCoveredHint`)}</Text>
                                        {taxiPoints.map((spot) => <Text key={spot} style={styles.point}>•  {spot}</Text>)}
                                        {taxiNote ? <Text style={styles.pointsHint}>{taxiNote}</Text> : null}
                                    </View>
                                ) : null}
                            </>
                        ) : null}
                        {type === 'DRIVER' ? (
                            <SelectField
                                label={t(`${ns}.selectedPackageLabel`)}
                                value={driverPackage}
                                onChange={setDriverPackage}
                                options={DRIVER_PACKAGES.map((pkg) => ({ value: pkg.id, label: `${t(pkg.nameKey)} — ${formatCurrency(pkg.price)}` }))}
                            />
                        ) : null}
                        {type === 'HORSE' ? (
                            <SelectField
                                label={t(`${ns}.routeLabel`)}
                                value={horsePackage}
                                onChange={setHorsePackage}
                                options={HORSE_CHART_PACKAGES.map((pkg) => ({ value: pkg.id, label: `${t(pkg.nameKey)} — ${formatCurrency(pkg.price)}` }))}
                            />
                        ) : null}
                        {type !== 'GUIDE' ? <Field label={t(type === 'HORSE' ? `${ns}.riderCount` : `${ns}.passengerCount`)} value={count} onChangeText={setCount} keyboardType="numeric" /> : null}
                        {type === 'TAXI' ? <Text style={styles.note}>{t(`${ns}.tollExtraNote`)}</Text> : null}
                    </Section>
                    <Section title={t(`${ns}.section2`)}>
                        <Field label={t(`${ns}.fullName`)} value={leadName} onChangeText={setLeadName} autoCapitalize="words" />
                        {type === 'HORSE' ? (
                            <>
                                <Field label={t(`${ns}.age`)} value={leadAge} onChangeText={setLeadAge} keyboardType="numeric" />
                                <SelectField
                                    label={t(`${ns}.gender`)}
                                    value={leadGender}
                                    onChange={setLeadGender}
                                    options={[
                                        { value: '', label: t(`${ns}.selectGender`) },
                                        { value: 'M', label: t(`${ns}.genderMale`) },
                                        { value: 'F', label: t(`${ns}.genderFemale`) },
                                        { value: 'OTHER', label: t(`${ns}.genderOther`) },
                                    ]}
                                />
                            </>
                        ) : null}
                        <Field label={t(`${ns}.mobile`)} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad" />
                        <Field label={t(`${ns}.email`)} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                        <Field label={t(`${ns}.hotelOrPickupAddress`)} value={address} onChangeText={setAddress} />
                        <Field label={t(`${ns}.cityState`)} value={cityState} onChangeText={setCityState} />
                        <Field label={t(`${ns}.pinCode`)} value={pincode} onChangeText={setPincode} keyboardType="numeric" maxLength={6} autofillPincode />
                        <Field label={t(`${ns}.emergencyName`)} value={emergencyName} onChangeText={setEmergencyName} />
                        <Field label={t(`${ns}.emergencyMobile`)} value={emergencyMobile} onChangeText={setEmergencyMobile} keyboardType="phone-pad" />
                    </Section>
                    {type === 'TAXI' || type === 'DRIVER' ? (
                        <Section title={t(`${ns}.section3`)}>
                            <SelectField
                                label={t(`${ns}.routeTripTypeLabel`)}
                                value={routeTripType}
                                onChange={(value) => {
                                    setRouteTripType(value);
                                    if (value === 'ROUND_TRIP') setDropLocation('');
                                }}
                                options={[
                                    { value: 'ROUND_TRIP', label: t(`${ns}.routeTripTypes.roundTrip`) },
                                    { value: 'ONE_WAY', label: t(`${ns}.routeTripTypes.oneWay`) },
                                    { value: 'DROP', label: t(`${ns}.routeTripTypes.drop`) },
                                ]}
                            />
                            <Field label={t(`${ns}.pickupLocation`)} value={pickupLocation} onChangeText={setPickupLocation} />
                            {needsDrop ? <Field label={t(`${ns}.dropLocation`)} value={dropLocation} onChangeText={setDropLocation} /> : null}
                            <Field label={t(`${ns}.specialRequests`)} value={notes} onChangeText={setNotes} multiline />
                            {type === 'DRIVER' ? <Text style={styles.companyNote}>{t(`${ns}.companyRateContactNote`)}</Text> : null}
                        </Section>
                    ) : (
                        <Section title={t(`${ns}.section3`)}>
                            <Field label={t(`${ns}.specialRequests`)} value={notes} onChangeText={setNotes} multiline />
                        </Section>
                    )}
                    <Section title={payTitle}>
                        <View style={styles.totalBox}>
                            <View style={styles.totalLine}>
                                <Text style={styles.totalLabel}>{t(`${ns}.subtotalLabel`)}</Text>
                                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                            </View>
                            <View style={styles.totalFinal}>
                                <Text style={styles.totalFinalLabel}>{t(`${ns}.totalLabel`)}</Text>
                                <Text style={styles.totalFinalValue}>{formatCurrency(total)}</Text>
                            </View>
                        </View>
                        <Field label={t(`${ns}.advanceAmount`)} value={advanceAmount} onChangeText={setAdvanceAmount} keyboardType="numeric" placeholder={String(total || '')} />
                        <RadioChoices
                            label={t(`${ns}.paymentMode`)}
                            value={paymentMode}
                            onChange={setPaymentMode}
                            options={[['CASH', t(`${ns}.payCash`)], ['ONLINE', t(`${ns}.payOnline`)], ['CARD', t(`${ns}.payCard`)]]}
                        />
                    </Section>
                    <TermsCard
                        ns={ns}
                        title={termsTitle}
                        label={t(`${ns}.acceptTerms`)}
                        accepted={acceptTerms}
                        onToggle={() => setAcceptTerms((value) => !value)}
                        extra={type === 'HORSE' ? (
                            <Pressable onPress={() => setAcceptSafety((value) => !value)} style={styles.safety}>
                                <View style={[styles.check, acceptSafety && styles.checkOn]}>{acceptSafety ? <Text style={styles.tick}>✓</Text> : null}</View>
                                <Text style={styles.safetyText}>{t(`${ns}.acceptSafety`)}</Text>
                            </Pressable>
                        ) : null}
                    />
                    <Button title={t('serviceBooking.submitRequest')} onPress={submit} loading={submitting} />
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    screen: { padding: 0, backgroundColor: '#F5F7FA' },
    page: { paddingBottom: 0 },
    inner: { padding: 16 },
    section: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text, marginBottom: 12 },
    chartWrap: { marginBottom: 8 },
    chartBtn: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 53, 128, 0.3)',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    chartBtnText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary },
    chartBody: { marginTop: 12, borderWidth: 1, borderColor: 'rgba(0, 53, 128, 0.2)', borderRadius: 12, backgroundColor: 'rgba(0, 53, 128, 0.05)', padding: 12 },
    points: { backgroundColor: 'rgba(219, 234, 254, 0.7)', borderWidth: 1, borderColor: '#DBEAFE', borderRadius: 12, padding: 14, marginBottom: 12 },
    pointsTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    pointsHint: { marginTop: 4, marginBottom: 8, fontFamily: FONTS.regular, fontSize: 12, color: '#475569' },
    point: { fontFamily: FONTS.regular, fontSize: 14, color: '#334155', marginTop: 4 },
    fareLine: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', marginBottom: 12 },
    companyNote: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 18, color: '#475569' },
    note: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 20, color: '#334155', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 12, marginBottom: 8 },
    totalBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 12 },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between' },
    totalLabel: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569' },
    totalValue: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    totalFinal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    totalFinalLabel: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary },
    totalFinalValue: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary },
    safety: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
    check: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    checkOn: { backgroundColor: COLORS.action, borderColor: COLORS.action },
    tick: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
    safetyText: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.body },
});
