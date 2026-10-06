import React, { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { addWishlist, createBooking, getBySlug, getWishlist, removeWishlist } from '../../api/endpoints';
import DriverRateChart, { DRIVER_PACKAGES, driverPackagePrice } from '../../components/DriverRateChart';
import HorseRateChart, { HORSE_CHART_PACKAGES, horseChartPrice } from '../../components/HorseRateChart';
import GuideRateChart, { GUIDE_CHART_PACKAGES, guideChartPrice } from '../../components/GuideRateChart';
import TaxiRateChart, { taxiChartPrice } from '../../components/TaxiRateChart';
import { Button, Card, Field, Loading, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { formatTime12, listingPlace, listingPrice, mediaUrl, wishlistPath } from '../../utils/listing';
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
function FormSection({ title, children }) {
    return (<View style={styles.formSection}>
      <Text style={styles.formSectionTitle}>{title}</Text>
      {children}
    </View>);
}
function TotalBox({ lines, totalLabel, total }) {
    return (<View style={styles.totalBox}>
      {lines.filter(Boolean).map((line) => (<View key={line.label} style={styles.totalLine}>
          <Text style={styles.totalLineLabel}>{line.label}</Text>
          <Text style={styles.totalLineValue}>{line.value}</Text>
        </View>))}
      <View style={styles.totalFinal}>
        <Text style={styles.totalFinalLabel}>{totalLabel}</Text>
        <Text style={styles.totalFinalValue}>{formatCurrency(total || 0)}</Text>
      </View>
    </View>);
}
function Choice({ selected, onPress, title, detail }) {
    return (<Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <Text style={styles.choiceTitle}>{title}</Text>
      {detail ? <Muted>{detail}</Muted> : null}
    </Pressable>);
}
export default function ListingDetailScreen({ route, navigation }) {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { path, slug, type } = route.params;
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [checkIn, setCheckIn] = useState(type === 'COMBO' ? dayAfter() : tomorrow());
    const [checkOut, setCheckOut] = useState(dayAfter());
    const [guests, setGuests] = useState('2');
    const [productQty, setProductQty] = useState('1');
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
    const [saved, setSaved] = useState(false);
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
    useEffect(() => {
        if (!user || !item?._id || !wishlistPath(type))
            return;
        getWishlist()
            .then((rows) => {
            setSaved((rows || []).some((row) => String(row.item?._id) === String(item._id) && row.itemType === type));
        })
            .catch(() => setSaved(false));
    }, [user, item?._id, type]);
    const onSaveListing = async () => {
        if (!user) {
            Alert.alert(t('auth.signIn'), t('account.signInToSave'));
            navigation.navigate('Auth');
            return;
        }
        try {
            if (saved) {
                await removeWishlist(item._id, type);
                setSaved(false);
            }
            else {
                await addWishlist(item._id, type);
                setSaved(true);
            }
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
    };
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
        if (type === 'COMBO' && !checkIn) {
            Alert.alert(t('common.error'), t('booking.badDates'));
            return;
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
                const qty = Math.max(1, Number(productQty) || 1);
                const stock = Number(item.stock);
                if (Number.isFinite(stock) && stock < 1) {
                    Alert.alert(t('common.error'), t('shop.outOfStock'));
                    setBooking(false);
                    return;
                }
                if (Number.isFinite(stock) && qty > stock) {
                    Alert.alert(t('common.error'), t('shop.onlyStock', { count: stock }));
                    setBooking(false);
                    return;
                }
                body.productId = item._id;
                body.quantity = qty;
                body.deliveryAddress = {
                    phone: user.phone || '',
                    city: 'Mahabaleshwar',
                    note: 'Local pickup/delivery',
                };
            }
            else if (type === 'COMBO') {
                delete body.guests;
                delete body.checkOut;
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
                    : type === 'COMBO'
                        ? (Number(item.comboPrice) || 0)
                        : (selectedRoom?.basePrice ?? listingPrice(item));
    const typeLabel = (type === 'HOTEL' || type === 'RESORT')
        ? (type === 'RESORT' || item.type === 'RESORT' ? t('nav.resorts') : t('nav.hotels'))
        : type === 'HOMESTAY' ? t('nav.homestays')
            : type === 'TENT' ? t('nav.tents')
                : type === 'GUIDE' ? t('nav.guides')
                    : type === 'TAXI' ? t('nav.taxi')
                        : type === 'DRIVER' ? t('nav.drivers')
                            : type === 'HORSE' ? t('nav.horses')
                                : type === 'COMBO' ? t('nav.combos')
                                    : (item.vertical === 'MAPRO' ? t('nav.mapro') : t('nav.strawberries'));
    const score = item.score || item.rating;
    const cover = images[photoIndex] || images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200';
    const stay = type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY' || type === 'TENT';
    return (<Screen style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.article}>
          <View>
            <Image source={{ uri: cover }} style={styles.cover}/>
            {images.length > 1 ? (<>
              <Pressable style={[styles.photoBtn, styles.photoPrev]} onPress={() => setPhotoIndex((i) => (i - 1 + images.length) % images.length)}>
                <Text style={styles.photoBtnText}>‹</Text>
              </Pressable>
              <Pressable style={[styles.photoBtn, styles.photoNext]} onPress={() => setPhotoIndex((i) => (i + 1) % images.length)}>
                <Text style={styles.photoBtnText}>›</Text>
              </Pressable>
              <Text style={styles.photoCount}>{photoIndex + 1}/{images.length}</Text>
            </>) : null}
            {wishlistPath(type) ? (<Pressable style={styles.heart} onPress={onSaveListing}>
              <Text style={[styles.heartIcon, saved && styles.heartOn]}>{saved ? '♥' : '♡'}</Text>
            </Pressable>) : null}
          </View>
          <View style={styles.articleBody}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{item.name}</Text>
              {score ? (<View style={styles.score}>
                <Text style={styles.scoreText}>{Number(score).toFixed(1)}</Text>
              </View>) : null}
            </View>
            <Text style={styles.typeLabel}>{typeLabel}</Text>
            {type !== 'COMBO' && type !== 'PRODUCT' ? <Text style={styles.place}>{listingPlace(item, type)}</Text> : null}
            {type === 'GUIDE' && item.languages?.length > 0 ? <Text style={styles.place}>{t('guide.languages')}: {item.languages.join(', ')}</Text> : null}
            {type === 'TENT' ? <Text style={styles.place}>{t('listing.tentCapacity', { guests: item.capacity || 2, count: item.totalTents || 1 })}</Text> : null}
            {(type === 'HOTEL' || type === 'RESORT') && item.amenities?.length > 0 ? (<View style={styles.chips}>
              {item.amenities.slice(0, 6).map((amenity) => (<Text key={amenity} style={styles.chip}>{amenity}</Text>))}
            </View>) : null}
            <View style={styles.pricePanel}>
              <Text style={styles.from}>{t('listing.from')}</Text>
              {nightPrice != null ? (<Text style={styles.price}>
                {formatCurrency(nightPrice)}
                {(type === 'HOMESTAY' || type === 'TENT') ? <Text style={styles.priceSuffix}> {t('listing.perNight')}</Text> : null}
                {type === 'GUIDE' ? <Text style={styles.priceSuffix}> {t('guide.sixHourShort')}</Text> : null}
                {type === 'TAXI' ? <Text style={styles.priceSuffix}> {t('taxi.perTripShort')}</Text> : null}
                {type === 'PRODUCT' && item.unit ? <Text style={styles.priceSuffix}> / {item.unit}</Text> : null}
                {type === 'COMBO' && item.originalPrice != null ? <Text style={styles.struck}> {formatCurrency(item.originalPrice)}</Text> : null}
              </Text>) : <Text style={styles.price}>—</Text>}
              {(type === 'HOTEL' || type === 'RESORT') ? <Text style={styles.priceNote}>{t('listing.perNight')} · {t('property.inclTaxes')}</Text> : null}
              {(type === 'HOMESTAY' || type === 'TENT') ? <Text style={styles.priceNote}>{t('property.inclTaxes')}</Text> : null}
              {stay && type !== 'TENT' && selectedRoom?.name ? <Text style={styles.roomName}>{selectedRoom.name}</Text> : null}
            </View>
          </View>
        </View>
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
        {type === 'PRODUCT' && (item.description || item.shortDescription) ? <Muted>{item.description || item.shortDescription}</Muted> : null}
        {type === 'PRODUCT' && item.deliveryNote ? <Muted>{item.deliveryNote}</Muted> : null}
        {type === 'TAXI' ? <Muted>{item.description || t('taxi.description')}</Muted> : type !== 'PRODUCT' && (item.bio || item.description || item.horseDetails) ? <Muted>{item.bio || item.description || item.horseDetails}</Muted> : null}
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
        <Card>
          <Text style={styles.formTitle}>{type === 'PRODUCT' ? t('shop.orderNow') : type === 'COMBO' ? t('shop.bookCombo') : t('booking.bookNow')}</Text>
          {type === 'GUIDE' ? (<>
            <FormSection title={t('booking.sectionTrip')}>
              <Field label={t('guide.tourDate')} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD"/>
              {GUIDE_CHART_PACKAGES.map((pkg) => (<Choice key={pkg.id} selected={guidePackage === pkg.id} onPress={() => setGuidePackage(pkg.id)} title={t(pkg.nameKey)} detail={`${t(pkg.durationKey)} · ${formatCurrency(bikeAddon ? pkg.withBike : pkg.guideOnly)}`}/>))}
              <Choice selected={bikeAddon} onPress={() => setBikeAddon((value) => !value)} title={t('guide.bikeAddon', { price: formatCurrency(guideChartPrice(guidePackage, true) - guideChartPrice(guidePackage, false)) })}/>
            </FormSection>
            <FormSection title={t('booking.sectionGuest')}>
              <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
              <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            </FormSection>
            <FormSection title={t('booking.sectionPayment')}>
              <TotalBox lines={[{ label: t('booking.subtotal'), value: formatCurrency(guideChartPrice(guidePackage, bikeAddon)) }]} totalLabel={t('booking.total')} total={guideChartPrice(guidePackage, bikeAddon)}/>
            </FormSection>
            <FormSection title={t('booking.sectionTerms')}>
              <Pressable onPress={() => setAcceptTerms((value) => !value)}>
                <Text style={[styles.termsText, acceptTerms && styles.termsOn]}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
              </Pressable>
            </FormSection>
          </>) : type === 'TAXI' || type === 'DRIVER' ? (<>
            <FormSection title={t('booking.sectionTrip')}>
              <Field label={type === 'TAXI' ? t('taxi.tripDate') : t('driver.tripDate')} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD"/>
              <Field label={type === 'TAXI' ? t('taxi.pickup') : t('driver.pickup')} value={pickupLocation} onChangeText={setPickupLocation}/>
              <Field label={t('booking.adults')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            </FormSection>
            <FormSection title={t('booking.sectionGuest')}>
              <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
              <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            </FormSection>
            <FormSection title={t('booking.sectionPayment')}>
              <TotalBox lines={[{ label: t('booking.subtotal'), value: formatCurrency(type === 'TAXI' ? taxiChartPrice(taxiRoute) : driverPackagePrice(driverPackage)) }]} totalLabel={t('booking.total')} total={type === 'TAXI' ? taxiChartPrice(taxiRoute) : driverPackagePrice(driverPackage)}/>
            </FormSection>
            <FormSection title={t('booking.sectionTerms')}>
              <Pressable onPress={() => setAcceptTerms((value) => !value)}>
                <Text style={[styles.termsText, acceptTerms && styles.termsOn]}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
              </Pressable>
            </FormSection>
          </>) : type === 'HORSE' ? (<>
            <FormSection title={t('booking.sectionTrip')}>
              <Field label={t('horse.rideDate')} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD"/>
              <Field label={t('booking.adults')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            </FormSection>
            <FormSection title={t('booking.sectionGuest')}>
              <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
              <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            </FormSection>
            <FormSection title={t('booking.sectionPayment')}>
              <TotalBox lines={[{ label: t('booking.subtotal'), value: formatCurrency(horseChartPrice(horsePackage)) }]} totalLabel={t('booking.total')} total={horseChartPrice(horsePackage)}/>
            </FormSection>
            <FormSection title={t('booking.sectionTerms')}>
              <Pressable onPress={() => setAcceptSafety((value) => !value)} style={{ marginBottom: 8 }}>
                <Text style={[styles.termsText, acceptSafety && styles.termsOn]}>{acceptSafety ? '✓ ' : ''}{t('horse.acceptSafety')}</Text>
              </Pressable>
              <Pressable onPress={() => setAcceptTerms((value) => !value)}>
                <Text style={[styles.termsText, acceptTerms && styles.termsOn]}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
              </Pressable>
            </FormSection>
          </>) : type === 'PRODUCT' ? (<>
            <FormSection title={t('shop.orderNow')}>
              <Field label={t('shop.quantity')} value={productQty} onChangeText={setProductQty} keyboardType="numeric"/>
              {Number.isFinite(Number(item.stock)) ? <Muted>{t('shop.onlyStock', { count: item.stock })}</Muted> : null}
            </FormSection>
            <FormSection title={t('booking.sectionPayment')}>
              <TotalBox lines={[{ label: t('shop.quantity'), value: String(Math.max(1, Number(productQty) || 1)) }]} totalLabel={t('booking.total')} total={(Number(item.price) || 0) * Math.max(1, Number(productQty) || 1)}/>
            </FormSection>
          </>) : type === 'COMBO' ? (<>
            <FormSection title={t('booking.sectionDates')}>
              <Field label={t('booking.checkIn')} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD"/>
            </FormSection>
            <FormSection title={t('booking.sectionPayment')}>
              <TotalBox lines={[{ label: t('booking.subtotal'), value: formatCurrency(Number(item.comboPrice) || 0) }]} totalLabel={t('booking.total')} total={Number(item.comboPrice) || 0}/>
            </FormSection>
          </>) : (type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY' || type === 'TENT') ? (<>
            <FormSection title={t('booking.sectionDates')}>
              <Field label={t('booking.checkIn')} value={checkIn} onChangeText={setCheckIn} placeholder="YYYY-MM-DD"/>
              <Field label={t('booking.checkOut')} value={checkOut} onChangeText={setCheckOut} placeholder="YYYY-MM-DD"/>
              {type === 'TENT' ? <Field label={t('booking.tentQuantity')} value={tentQuantity} onChangeText={setTentQuantity} keyboardType="numeric"/> : null}
              {rooms.map((room) => (<Choice key={room._id} selected={String(room._id) === String(selectedRoom?._id)} onPress={() => setRoomId(room._id)} title={room.name} detail={room.basePrice != null ? formatCurrency(room.basePrice) : null}/>))}
            </FormSection>
            <FormSection title={t('booking.sectionGuest')}>
              <Field label={t('auth.name')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
              <Field label={t('auth.phone')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
            </FormSection>
            <FormSection title={t('booking.sectionId')}>
              <View style={styles.idRow}>
                {[['AADHAAR', 'booking.idAadhaar'], ['VOTER', 'booking.idVoter'], ['DRIVING_LICENSE', 'booking.idDriving'], ['PASSPORT', 'booking.idPassport']].map(([value, label]) => (<Pressable key={value} onPress={() => setIdType(value)} style={[styles.idChip, idType === value && styles.idChipOn]}>
                    <Text style={styles.idChipText}>{t(label)}</Text>
                  </Pressable>))}
              </View>
              <Field label={t('booking.idNumber')} value={idNumber} onChangeText={setIdNumber} autoCapitalize="characters"/>
            </FormSection>
            <FormSection title={t('booking.sectionParty')}>
              <Field label={t('booking.adults')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
              <Field label={t('booking.children')} value={children} onChangeText={setChildren} keyboardType="numeric"/>
            </FormSection>
            <FormSection title={t('booking.sectionPayment')}>
              {(() => {
                const nights = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
                const qty = type === 'TENT' ? Math.max(1, Number(tentQuantity) || 1) : 1;
                const ready = Number.isFinite(nights) && nights >= 1 && nightPrice != null;
                const amount = ready ? nightPrice * nights * qty : 0;
                return (<TotalBox lines={[
                    type !== 'TENT' && selectedRoom ? { label: t('booking.rooms'), value: selectedRoom.name } : null,
                    ready ? { label: t('booking.nightsCount', { count: nights }), value: String(nights) } : null,
                    nightPrice != null ? { label: t('booking.tariff'), value: formatCurrency(nightPrice) } : null,
                    ready ? { label: t('booking.subtotal'), value: formatCurrency(amount) } : null,
                ]} totalLabel={t('booking.total')} total={amount}/>);
            })()}
            </FormSection>
            <FormSection title={t('booking.sectionTerms')}>
              <Pressable onPress={() => setAcceptTerms((value) => !value)}>
                <Text style={[styles.termsText, acceptTerms && styles.termsOn]}>{acceptTerms ? '✓ ' : ''}{t('booking.acceptTerms')}</Text>
              </Pressable>
            </FormSection>
          </>) : (<Field label={t('booking.guests')} value={guests} onChangeText={setGuests} keyboardType="numeric"/>)}
          <Button title={type === 'PRODUCT' ? t('shop.orderNow') : type === 'COMBO' ? t('shop.bookCombo') : t('booking.bookNow')} onPress={onBook} loading={booking}/>
        </Card>
      </ScrollView>
    </Screen>);
}

const styles = StyleSheet.create({
    page: { padding: 16, paddingBottom: 28 },
    article: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        marginBottom: 16,
    },
    cover: { width: '100%', height: 220, backgroundColor: '#F1F5F9' },
    photoBtn: {
        position: 'absolute',
        top: 90,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPrev: { left: 10 },
    photoNext: { right: 10 },
    photoBtnText: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text, marginTop: -2 },
    photoCount: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        backgroundColor: 'rgba(15,23,42,0.7)',
        color: '#fff',
        fontFamily: FONTS.semibold,
        fontSize: 12,
        borderRadius: 999,
        overflow: 'hidden',
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    heart: {
        position: 'absolute',
        right: 12,
        top: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heartIcon: { fontSize: 18, color: '#475569' },
    heartOn: { color: '#EF4444' },
    articleBody: { padding: 16 },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    name: { flex: 1, fontFamily: FONTS.bold, fontSize: 26, color: COLORS.primary, letterSpacing: -0.4 },
    score: {
        minWidth: 36,
        backgroundColor: COLORS.primary,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignItems: 'center',
    },
    scoreText: { fontFamily: FONTS.bold, color: '#fff', fontSize: 14 },
    typeLabel: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.muted, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
    place: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', marginTop: 6, lineHeight: 20 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: {
        backgroundColor: '#EFF6FF',
        color: COLORS.primary,
        borderRadius: 999,
        overflow: 'hidden',
        paddingHorizontal: 10,
        paddingVertical: 4,
        fontFamily: FONTS.medium,
        fontSize: 12,
    },
    pricePanel: {
        marginTop: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: RADIUS.button,
        padding: 14,
    },
    from: { fontFamily: FONTS.medium, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B' },
    price: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.primary, marginTop: 4 },
    priceSuffix: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.muted },
    struck: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.muted, textDecorationLine: 'line-through' },
    priceNote: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 4 },
    roomName: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.body, marginTop: 8 },
    formTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: 12 },
    formSection: { marginBottom: 14, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    formSectionTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.primary, marginBottom: 8 },
    choice: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, backgroundColor: '#fff' },
    choiceOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    choiceTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    idRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    idChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, backgroundColor: '#fff' },
    idChipOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    idChipText: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.text },
    termsText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    termsOn: { color: COLORS.primary },
    totalBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
    totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: 12 },
    totalLineLabel: { fontFamily: FONTS.regular, fontSize: 13, color: '#475569', flex: 1 },
    totalLineValue: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.text },
    totalFinal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
    totalFinalLabel: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
    totalFinalValue: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.primary },
});
