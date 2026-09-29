import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createBooking, getBySlug } from '../../api/endpoints';
import DriverRateChart, { DRIVER_PACKAGES, driverPackagePrice } from '../../components/DriverRateChart';
import HorseRateChart, { HORSE_CHART_PACKAGES, horseChartPrice } from '../../components/HorseRateChart';
import GuideRateChart, { GUIDE_CHART_PACKAGES, guideChartPrice } from '../../components/GuideRateChart';
import TaxiRateChart, { taxiChartPrice } from '../../components/TaxiRateChart';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { formatTime12, listingPlace, listingPrice, mediaUrl } from '../../utils/listing';
function tomorrow() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}
function dayAfter() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
}
export default function ListingDetailScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { path, slug, type } = route.params;
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [checkIn, setCheckIn] = useState(tomorrow());
    const [checkOut, setCheckOut] = useState(dayAfter());
    const [guests, setGuests] = useState('2');
    const [adults, setAdults] = useState('2');
    const [children, setChildren] = useState('0');
    const [leadName, setLeadName] = useState('');
    const [leadMobile, setLeadMobile] = useState('');
    const [idType, setIdType] = useState('AADHAAR');
    const [idNumber, setIdNumber] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptSafety, setAcceptSafety] = useState(false);
    const [tentQuantity, setTentQuantity] = useState('1');
    const [pickupLocation, setPickupLocation] = useState('');
    const [roomId, setRoomId] = useState(null);
    const [guidePackage, setGuidePackage] = useState('4HR');
    const [bikeAddon, setBikeAddon] = useState(false);
    const [taxiCar, setTaxiCar] = useState('AC_4_SEATER');
    const [taxiRoute, setTaxiRoute] = useState('tour_mahabaleshwar_1');
    const [driverPackage, setDriverPackage] = useState('local_4hr');
    const [horsePackage, setHorsePackage] = useState('sightseeing');
    const [photoIndex, setPhotoIndex] = useState(0);
    useEffect(() => {
        getBySlug(path, slug)
            .then((data) => {
            const stay = data?.hotel ? { ...data.hotel, rooms: data.rooms || data.hotel.rooms || [] } : data;
            setItem(stay);
            const firstRoom = stay?.rooms?.[0];
            if (firstRoom?._id) setRoomId(firstRoom._id);
        })
            .catch(() => setItem(null))
            .finally(() => setLoading(false));
    }, [path, slug]);
    const onBook = async () => {
        if (!user) {
            Alert.alert(t('auth.signIn'), 'Please sign in to book');
            navigation.navigate('Auth');
            return;
        }
        const stayNights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
        if (type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY' || type === 'TENT') {
            if (!Number.isFinite(stayNights) || stayNights < 1) {
                Alert.alert(t('common.error'), t('booking.badDates'));
                return;
            }
            if (!leadName.trim() || !leadMobile.trim() || !idNumber.trim()) {
                Alert.alert(t('common.error'), t('booking.needGuest'));
                return;
            }
            if (!acceptTerms) {
                Alert.alert(t('common.error'), t('booking.needTerms'));
                return;
            }
        }
        if (type === 'GUIDE' || type === 'TAXI' || type === 'DRIVER' || type === 'HORSE') {
            if (!checkIn) {
                Alert.alert(t('common.error'), t('booking.badDates'));
                return;
            }
            if (!leadName.trim() || !leadMobile.trim()) {
                Alert.alert(t('common.error'), t('booking.needContact'));
                return;
            }
            if ((type === 'TAXI' || type === 'DRIVER') && !pickupLocation.trim()) {
                Alert.alert(t('common.error'), t('booking.needPickup'));
                return;
            }
            if (type === 'HORSE' && !acceptSafety) {
                Alert.alert(t('common.error'), t('horse.needSafety'));
                return;
            }
            if (!acceptTerms) {
                Alert.alert(t('common.error'), t('booking.needTerms'));
                return;
            }
        }
        setBooking(true);
        try {
            const body = {
                checkIn,
                checkOut,
                guests: Number(guests) || 2,
            };
            if (type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY') {
                if (type === 'HOMESTAY') body.homestayId = item._id;
                else body.hotelId = item._id;
                const chosen = (item.rooms || []).find((room) => String(room._id) === String(roomId)) || item.rooms?.[0];
                if (!chosen?._id) {
                    Alert.alert(t('common.error'), t('booking.selectRoom'));
                    setBooking(false);
                    return;
                }
                body.roomId = chosen._id;
                const adultCount = Number(adults) || 1;
                const childCount = Number(children) || 0;
                body.guests = { adults: adultCount, children: childCount };
                body.guestRegistration = {
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: adultCount,
                    children: childCount,
                    leadGuest: {
                        fullName: leadName.trim(),
                        mobile: leadMobile.trim(),
                        email: user.email || '',
                    },
                    idProof: { type: idType, number: idNumber.trim(), nationality: 'INDIAN' },
                    roomLabel: chosen.name,
                };
            }
            else if (type === 'TENT') {
                body.tentId = item._id;
                const qty = Math.max(1, Number(tentQuantity) || 1);
                const available = Number(item.totalTents) || qty;
                if (qty > available) {
                    Alert.alert(t('common.error'), t('booking.tooManyTents', { count: available }));
                    setBooking(false);
                    return;
                }
                const adultCount = Number(adults) || 1;
                const childCount = Number(children) || 0;
                body.tentQuantity = qty;
                body.guestRegistration = {
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: adultCount,
                    children: childCount,
                    checkInTime: item.checkInTime || '14:00',
                    checkOutTime: item.checkOutTime || '11:00',
                    leadGuest: {
                        fullName: leadName.trim(),
                        mobile: leadMobile.trim(),
                        email: user.email || '',
                    },
                    idProof: { type: idType, number: idNumber.trim(), nationality: 'INDIAN' },
                    tentLabel: item.name,
                };
            }
            else if (type === 'GUIDE') {
                const pkg = guidePackage === '8HR' ? '8HR' : '4HR';
                const packagePrice = guideChartPrice(pkg, bikeAddon);
                body.open = true;
                body.guidePackage = pkg;
                body.bikeAddon = bikeAddon;
                body.checkIn = checkIn;
                body.guestRegistration = {
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: 1,
                    checkInTime: '09:00',
                    leadGuest: {
                        fullName: leadName.trim(),
                        mobile: leadMobile.trim(),
                        email: user.email || '',
                    },
                    tourDetails: {
                        packageType: pkg,
                        bikeAddon,
                        startTime: '09:00',
                        touristCount: 1,
                        packagePrice,
                        bikeAddonPrice: bikeAddon ? packagePrice - guideChartPrice(pkg, false) : 0,
                        specialRequests: item.name || '',
                    },
                };
            }
            else if (type === 'TAXI') {
                const tripPrice = taxiChartPrice(taxiRoute);
                const passengers = Math.max(1, Number(adults) || 1);
                body.open = true;
                body.serviceTenant = 'TAXI';
                body.taxiType = 'PER_TRIP';
                body.checkIn = checkIn;
                body.guestRegistration = {
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: passengers,
                    checkInTime: '09:00',
                    leadGuest: {
                        fullName: leadName.trim(),
                        mobile: leadMobile.trim(),
                        email: user.email || '',
                        comingFrom: pickupLocation.trim(),
                    },
                    taxiDetails: {
                        tripType: 'ROUTE',
                        routeId: taxiRoute,
                        carType: taxiCar,
                        startTime: '09:00',
                        passengerCount: passengers,
                        pickupLocation: pickupLocation.trim(),
                        tripPrice,
                        perTripPrice: tripPrice,
                        hourlyRate: 0,
                        specialRequests: item.name || '',
                    },
                };
            }
            else if (type === 'DRIVER') {
                const pkg = DRIVER_PACKAGES.find((entry) => entry.id === driverPackage) || DRIVER_PACKAGES[0];
                const tripPrice = driverPackagePrice(pkg.id);
                const passengers = Math.max(1, Number(adults) || 1);
                body.open = true;
                body.serviceTenant = 'DRIVER';
                body.taxiType = 'PER_TRIP';
                body.checkIn = checkIn;
                body.guestRegistration = {
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: passengers,
                    checkInTime: '09:00',
                    leadGuest: {
                        fullName: leadName.trim(),
                        mobile: leadMobile.trim(),
                        email: user.email || '',
                        comingFrom: pickupLocation.trim(),
                    },
                    taxiDetails: {
                        tripType: 'PACKAGE',
                        packageId: pkg.id,
                        packageName: t(pkg.nameKey),
                        startTime: '09:00',
                        passengerCount: passengers,
                        pickupLocation: pickupLocation.trim(),
                        tripPrice,
                        perTripPrice: tripPrice,
                        hourlyRate: 0,
                        specialRequests: item.name || '',
                    },
                };
            }
            else if (type === 'HORSE') {
                const pkg = HORSE_CHART_PACKAGES.find((entry) => entry.id === horsePackage) || HORSE_CHART_PACKAGES[0];
                const riders = Math.max(1, Number(adults) || 1);
                const routePrice = horseChartPrice(pkg.id);
                body.open = true;
                body.checkIn = checkIn;
                body.guestRegistration = {
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: riders,
                    checkInTime: '09:00',
                    leadGuest: {
                        fullName: leadName.trim(),
                        mobile: leadMobile.trim(),
                        email: user.email || '',
                    },
                    horseDetails: {
                        routeId: pkg.id,
                        routeName: t(pkg.nameKey),
                        startTime: '09:00',
                        riderCount: riders,
                        safetyAcknowledged: true,
                        routePrice,
                        specialRequests: item.name || '',
                    },
                };
            }
            else if (type === 'PRODUCT') {
                body.productId = item._id;
                body.quantity = Number(guests) || 1;
            }
            else if (type === 'COMBO') {
                body.comboId = item._id;
                body.checkIn = checkIn;
            }
            const created = await createBooking(type, body);
            Alert.alert('Booked', created.bookingNumber || 'Booking created');
            navigation.navigate('MainTabs', { screen: 'Bookings' });
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setBooking(false);
        }
    };
    if (loading)
        return <Loading />;
    if (!item) {
        return (<Screen>
        <Muted>{t('common.error')}</Muted>
      </Screen>);
    }
    const photoSource = item.images?.length
        ? item.images
        : (item.rooms || []).flatMap((room) => room.images || []);
    const images = photoSource.map(mediaUrl).filter(Boolean);
    const rooms = item.rooms || [];
    const selectedRoom = rooms.find((room) => String(room._id) === String(roomId)) || rooms[0];
    const horseRoutes = item.routes || [];
    const nightPrice = type === 'GUIDE'
        ? (Number(item.package6hr) || 0)
        : type === 'TAXI'
            ? (Number(item.perTripPrice) || 0)
            : type === 'DRIVER'
                ? driverPackagePrice(driverPackage)
                : type === 'HORSE'
                    ? horseChartPrice(horsePackage)
                    : (selectedRoom?.basePrice ?? listingPrice(item));
    return (<Screen>
      <ScrollView>
        {images[0] ? (<Pressable onPress={() => images.length > 1 && setPhotoIndex((i) => (i + 1) % images.length)}>
            <Image source={{ uri: images[photoIndex] || images[0] }} style={{ height: 220, borderRadius: 14, marginBottom: 8 }}/>
            {images.length > 1 ? <Muted>{photoIndex + 1}/{images.length}</Muted> : null}
          </Pressable>) : null}
        <Title>{item.name}</Title>
        {(type === 'HOTEL' || type === 'RESORT') && (<Muted>{type === 'RESORT' || item.type === 'RESORT' ? t('nav.resorts') : t('nav.hotels')}</Muted>)}
        {type === 'HOMESTAY' && <Muted>{t('nav.homestays')}</Muted>}
        {type === 'TENT' && <Muted>{t('nav.tents')}</Muted>}
        {type === 'GUIDE' && <Muted>{t('nav.guides')}</Muted>}
        {type === 'TAXI' && <Muted>{t('nav.taxi')}</Muted>}
        {type === 'DRIVER' && <Muted>{t('nav.drivers')}</Muted>}
        {type === 'HORSE' && <Muted>{t('nav.horses')}</Muted>}
        {type === 'COMBO' && <Muted>{t('nav.combos')}</Muted>}
        {type !== 'COMBO' && <Muted>{listingPlace(item, type)}</Muted>}
        {type === 'GUIDE' && item.languages?.length > 0 && <Muted>{t('guide.languages')}: {item.languages.join(', ')}</Muted>}
        {type === 'TENT' && (<Muted>{t('listing.tentCapacity', { guests: item.capacity || 2, count: item.totalTents || 1 })}</Muted>)}
        {nightPrice != null ? (<Text style={{ marginTop: 8, fontWeight: '800', fontSize: 20, color: COLORS.primary }}>
            {formatCurrency(nightPrice)}
            {(type === 'HOMESTAY' || type === 'TENT') ? <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted }}> {t('listing.perNight')}</Text> : null}
            {type === 'GUIDE' ? <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted }}> {t('guide.sixHourShort')}</Text> : null}
            {type === 'TAXI' ? <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted }}> {t('taxi.perTripShort')}</Text> : null}
            {type === 'COMBO' && item.originalPrice != null ? <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.muted, textDecorationLine: 'line-through' }}> {formatCurrency(item.originalPrice)}</Text> : null}
          </Text>) : null}
        {type === 'COMBO' && item.originalPrice > item.comboPrice ? <Muted>{t('shop.save')} {formatCurrency(item.originalPrice - item.comboPrice)}</Muted> : null}
        {type === 'COMBO' && item.items?.length > 0 && (<Card>
            {item.items.map((part, index) => (<Muted key={`${part.itemType}-${part.label || index}`}>
                {t(`vendor.types.${part.itemType}`, { defaultValue: part.itemType })} — {part.label || part.itemType}
                {part.quantity > 1 ? ` × ${part.quantity}` : ''}
                {part.nights ? ` · ${part.nights} ${t('shop.nights')}` : ''}
              </Muted>))}
          </Card>)}
        {(type === 'HOMESTAY' || type === 'TENT') && item.amenities?.length > 0 && (<View style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('listing.amenities')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {item.amenities.map((amenity) => (<Text key={amenity} style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '600' }}>{amenity}</Text>))}
            </View>
          </View>)}
        {type === 'GUIDE' && item.specialties?.length > 0 && (<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {item.specialties.map((specialty) => (<Text key={specialty} style={{ backgroundColor: COLORS.primarySoft, color: COLORS.primary, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, fontWeight: '600' }}>{specialty}</Text>))}
          </View>)}
        {type === 'TAXI' && item.serviceArea ? <Muted>{t('taxi.serviceArea')}: {item.serviceArea}</Muted> : null}
        {type === 'HORSE' && item.stable?.serviceArea ? <Muted>{t('horse.serviceArea')}: {item.stable.serviceArea}</Muted> : null}
        {type === 'HORSE' && item.stable?.safetyGearProvided ? <Muted>{t('horse.safetyGear')}</Muted> : null}
        {type === 'TAXI' ? <Muted>{item.description || t('taxi.description')}</Muted> : (item.bio || item.description || item.horseDetails) ? <Muted>{item.bio || item.description || item.horseDetails}</Muted> : null}
        {(type === 'HOMESTAY' || type === 'TENT') && (<Card>
            <Muted>{t('listing.checkTimes', { in: formatTime12(item.checkInTime || '14:00'), out: formatTime12(item.checkOutTime || '11:00') })}</Muted>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 10 }}>{t('listing.cancellation')}</Text>
            <Muted>{(typeof item.cancellationPolicyText === 'string' && item.cancellationPolicyText)
            || (typeof item.cancellationPolicy === 'string' && item.cancellationPolicy)
            || t(type === 'TENT' ? 'listing.freeCancellationRates' : 'listing.freeCancellation')}</Muted>
            {type === 'HOMESTAY' && item.houseRules?.length > 0 && (<>
                <Text style={{ fontWeight: '700', color: COLORS.text, marginTop: 10 }}>{t('listing.houseRules')}</Text>
                {item.houseRules.map((rule) => <Muted key={rule}>{rule}</Muted>)}
              </>)}
          </Card>)}
        {type === 'GUIDE' && (<Card>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('guide.thisGuide')}</Text>
            <Muted>{t('guide.package6hr')} · {formatCurrency(item.package6hr || 0)}</Muted>
            <Muted>{t('guide.package12hr')} · {formatCurrency(item.package12hr || 0)}</Muted>
            <Muted>{t('guide.bikeAddon', { price: formatCurrency(item.bikeAddonPrice || 0) })}</Muted>
          </Card>)}
        {type === 'GUIDE' && <GuideRateChart />}
        {type === 'TAXI' && (<Card>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('taxi.thisTaxi')}</Text>
            <Muted>{t('taxi.perTrip')} · {formatCurrency(item.perTripPrice || 0)}</Muted>
            <Muted>{t('taxi.hourly')} · {formatCurrency(item.hourlyRate || 0)}{t('taxi.hourlyShort')}</Muted>
          </Card>)}
        {type === 'TAXI' && <TaxiRateChart selectedCar={taxiCar} onSelectCar={setTaxiCar} selectedRoute={taxiRoute} onSelectRoute={setTaxiRoute} />}
        {type === 'DRIVER' && <DriverRateChart selectedPackage={driverPackage} onSelectPackage={setDriverPackage} />}
        {type === 'HORSE' && horseRoutes.length > 0 && (<Card>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('horse.routesTitle')}</Text>
            {horseRoutes.map((route) => (<Muted key={route._id || route.name}>{route.name} · {route.durationMinutes || 30} {t('horse.minutes')} · {formatCurrency(route.price)}</Muted>))}
          </Card>)}
        {type === 'HORSE' && <HorseRateChart selectedPackage={horsePackage} onSelectPackage={setHorsePackage} />}
        {rooms.length > 0 && (<Card>
            <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('booking.rooms')}</Text>
            {rooms.map((room) => {
                const selected = String(room._id) === String(selectedRoom?._id);
                return (<Pressable key={room._id} onPress={() => setRoomId(room._id)} style={{
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.border,
                    marginBottom: 8,
                    backgroundColor: selected ? COLORS.primarySoft : '#fff',
                }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>{room.name}</Text>
                  {room.basePrice != null ? <Muted>{formatCurrency(room.basePrice)}</Muted> : null}
                </Pressable>);
            })}
          </Card>)}
        <Card>
          <Text style={{ fontWeight: '700', color: COLORS.text, marginBottom: 8 }}>{t('booking.bookNow')}</Text>
          <Field label={type === 'GUIDE' ? t('guide.tourDate') : type === 'TAXI' ? t('taxi.tripDate') : type === 'DRIVER' ? t('driver.tripDate') : type === 'HORSE' ? t('horse.rideDate') : t('booking.checkIn')} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD"/>
          {(type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY' || type === 'TENT') && (<Field label={t('booking.checkOut')} value={checkOut} onChangeText={setCheckOut} placeholder="YYYY-MM-DD"/>)}
          {type === 'GUIDE' ? (<>
            {GUIDE_CHART_PACKAGES.map((pkg) => {
                const selected = guidePackage === pkg.id;
                const amount = bikeAddon ? pkg.withBike : pkg.guideOnly;
                return (<Pressable key={pkg.id} onPress={() => setGuidePackage(pkg.id)} style={{
                    padding: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selected ? COLORS.primary : COLORS.border,
                    marginBottom: 8,
                    backgroundColor: selected ? COLORS.primarySoft : '#fff',
                }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>{t(pkg.nameKey)}</Text>
                  <Muted>{t(pkg.durationKey)} · {formatCurrency(amount)}</Muted>
                </Pressable>);
            })}
            <Pressable onPress={() => setBikeAddon((value) => !value)} style={{
                padding: 10,
                borderRadius: 10,
                borderWidth: 1,
                marginBottom: 8,
                borderColor: bikeAddon ? COLORS.primary : COLORS.border,
                backgroundColor: bikeAddon ? COLORS.primarySoft : '#fff',
            }}>
              <Text style={{ fontWeight: '700', color: COLORS.text }}>{t('guide.bikeAddon', { price: formatCurrency(guideChartPrice(guidePackage, true) - guideChartPrice(guidePackage, false)) })}</Text>
            </Pressable>
            <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
            <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            <Pressable onPress={() => setAcceptTerms((value) => !value)} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: acceptTerms ? COLORS.primary : COLORS.text }}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
            </Pressable>
            <Text style={{ fontWeight: '800', color: COLORS.primary, marginTop: 8 }}>{formatCurrency(guideChartPrice(guidePackage, bikeAddon))}</Text>
          </>) : type === 'TAXI' ? (<>
            <Field label={t('taxi.pickup')} value={pickupLocation} onChangeText={setPickupLocation}/>
            <Field label={t('booking.adults')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
            <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            <Pressable onPress={() => setAcceptTerms((value) => !value)} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: acceptTerms ? COLORS.primary : COLORS.text }}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
            </Pressable>
            <Text style={{ fontWeight: '800', color: COLORS.primary, marginTop: 8 }}>{formatCurrency(taxiChartPrice(taxiRoute))}</Text>
          </>) : type === 'DRIVER' ? (<>
            <Field label={t('driver.pickup')} value={pickupLocation} onChangeText={setPickupLocation}/>
            <Field label={t('booking.adults')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
            <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            <Pressable onPress={() => setAcceptTerms((value) => !value)} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: acceptTerms ? COLORS.primary : COLORS.text }}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
            </Pressable>
            <Text style={{ fontWeight: '800', color: COLORS.primary, marginTop: 8 }}>{formatCurrency(driverPackagePrice(driverPackage))}</Text>
          </>) : type === 'HORSE' ? (<>
            <Field label={t('booking.adults')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
            <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            <Pressable onPress={() => setAcceptSafety((value) => !value)} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: acceptSafety ? COLORS.primary : COLORS.text }}>{acceptSafety ? '✓ ' : ''}{t('horse.acceptSafety')}</Text>
            </Pressable>
            <Pressable onPress={() => setAcceptTerms((value) => !value)} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: acceptTerms ? COLORS.primary : COLORS.text }}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
            </Pressable>
            <Text style={{ fontWeight: '800', color: COLORS.primary, marginTop: 8 }}>{formatCurrency(horseChartPrice(horsePackage))}</Text>
          </>) : (type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY' || type === 'TENT') ? (<>
            {type === 'TENT' ? <Field label={t('booking.tentQuantity')} value={tentQuantity} onChangeText={setTentQuantity} keyboardType="numeric"/> : null}
            <Field label={t('booking.adults')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            <Field label={t('booking.children')} value={children} onChangeText={setChildren} keyboardType="numeric"/>
            <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
            <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {[['AADHAAR', 'booking.idAadhaar'], ['VOTER', 'booking.idVoter'], ['DRIVING_LICENSE', 'booking.idDriving'], ['PASSPORT', 'booking.idPassport']].map(([value, label]) => (<Pressable key={value} onPress={() => setIdType(value)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: idType === value ? COLORS.primary : COLORS.border, backgroundColor: idType === value ? COLORS.primarySoft : '#fff' }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text, fontSize: 12 }}>{t(label)}</Text>
                </Pressable>))}
            </View>
            <Field label={t('booking.idNumber')} value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters"/>
            <Pressable onPress={() => setAcceptTerms((value) => !value)} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: '700', color: acceptTerms ? COLORS.primary : COLORS.text }}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
            </Pressable>
            {type !== 'TENT' && selectedRoom ? <Muted>{selectedRoom.name}</Muted> : null}
            {(() => {
                const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
                const qty = type === 'TENT' ? Math.max(1, Number(tentQuantity) || 1) : 1;
                if (!Number.isFinite(nights) || nights < 1 || nightPrice == null) return null;
                return <Text style={{ fontWeight: '800', color: COLORS.primary, marginTop: 8 }}>{t('booking.nightsCount', { count: nights })} · {formatCurrency(nightPrice * nights * qty)}</Text>;
            })()}
          </>) : <Field label={t('booking.guests')} value={guests} onChangeText={setGuests} keyboardType="numeric"/>}
          <Button title={t('booking.bookNow')} onPress={onBook} loading={booking}/>
        </Card>
      </ScrollView>
    </Screen>);
}
