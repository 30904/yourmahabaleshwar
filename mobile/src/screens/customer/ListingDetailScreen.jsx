import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { addWishlist, createBooking, fetchReviews, getBySlug, getWishlist, removeWishlist } from '../../api/endpoints';
import { loadPublic } from '../../api/publicCache';
import DriverRateChart, { DRIVER_PACKAGES, driverPackagePrice } from '../../components/DriverRateChart';
import HorseRateChart, { HORSE_CHART_PACKAGES, horseChartPrice } from '../../components/HorseRateChart';
import GuideRateChart, { GUIDE_CHART_PACKAGES, guideChartPrice } from '../../components/GuideRateChart';
import TaxiRateChart, { taxiChartPrice } from '../../components/TaxiRateChart';
import StayGuestForm from '../../components/booking/StayGuestForm';
import { DateField, FormHeader, RadioChoices, TermsCard, TimeField } from '../../components/booking/formChrome';
import { useConfirm } from '../../components/confirm';
import { Button, Card, Field, Loading, Muted, Screen } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/format';
import { formatTime12, listingPlace, listingPrice, mediaUrl, scoreFromRating, scoreLabelFromRating, wishlistPath } from '../../utils/listing';
import { MapPin } from '../../components/home/icons';
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
    return (<Card>
      <Text style={styles.formSectionTitle}>{title}</Text>
      {children}
    </Card>);
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
function ContactFields({ contact, setContact, t, ns, showDrop, timeLabel, showAge }) {
    const set = (key) => (value) => setContact((prev) => ({ ...prev, [key]: value }));
    return (<>
      {showAge ? <Field label={t(`${ns}.age`)} value={contact.leadAge} onChangeText={set('leadAge')} keyboardType="numeric"/> : null}
      <Field label={t(`${ns}.email`)} value={contact.email} onChangeText={set('email')} keyboardType="email-address"/>
      <Field label={t(`${ns}.hotelOrPickupAddress`)} value={contact.address} onChangeText={set('address')}/>
      <Field label={t(`${ns}.cityState`)} value={contact.cityState} onChangeText={set('cityState')}/>
      <Field label={t(`${ns}.pinCode`)} value={contact.pincode} onChangeText={set('pincode')} keyboardType="numeric" maxLength={6} autofillPincode/>
      <Field label={t(`${ns}.emergencyName`)} value={contact.emergencyName} onChangeText={set('emergencyName')}/>
      <Field label={t(`${ns}.emergencyMobile`)} value={contact.emergencyMobile} onChangeText={set('emergencyMobile')} keyboardType="phone-pad"/>
      <TimeField label={timeLabel} value={contact.startTime} onChange={set('startTime')}/>
      {showDrop ? <Field label={t(`${ns}.dropLocation`)} value={contact.dropLocation} onChangeText={set('dropLocation')}/> : null}
      <Field label={t(`${ns}.specialRequests`)} value={contact.specialRequests} onChangeText={set('specialRequests')}/>
      <Field label={t(`${ns}.advanceAmount`)} value={contact.advanceAmount} onChangeText={set('advanceAmount')} keyboardType="numeric"/>
      <RadioChoices label={t(`${ns}.paymentMode`)} value={contact.paymentMode} onChange={set('paymentMode')} options={[['CASH', t(`${ns}.payCash`)], ['ONLINE', t(`${ns}.payOnline`)], ['CARD', t(`${ns}.payCard`)]]}/>
    </>);
}
function Choice({ selected, onPress, title, detail }) {
    return (<Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceOn]}>
      <Text style={styles.choiceTitle}>{title}</Text>
      {detail ? <Muted>{detail}</Muted> : null}
    </Pressable>);
}
export default function ListingDetailScreen({ route, navigation }) {
    const { t } = useTranslation();
    const confirm = useConfirm();
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
    const [showForm, setShowForm] = useState(false);
    const [detailTab, setDetailTab] = useState('overview');
    const [reviews, setReviews] = useState([]);
    const scrollRef = useRef(null);
    const scrollToForm = useRef(false);
    const [contact, setContact] = useState({
        email: '',
        address: '',
        cityState: 'Mahabaleshwar, Maharashtra',
        pincode: '',
        emergencyName: '',
        emergencyMobile: '',
        startTime: '09:00',
        paymentMode: 'ONLINE',
        specialRequests: '',
        dropLocation: '',
        advanceAmount: '',
        leadAge: '',
    });
    const openService = type === 'GUIDE' || type === 'TAXI' || type === 'DRIVER' || type === 'HORSE';
    useEffect(() => {
        if (openService) {
            navigation.replace('ServiceBook', { type });
            return;
        }
        let alive = true;
        const job = loadPublic(`listing:${path}:${slug}`, () => getBySlug(path, slug), (data) => {
            if (!alive) return;
            const stay = data?.hotel ? { ...data.hotel, rooms: data.rooms || data.hotel.rooms || [] } : data;
            setItem(stay);
            const firstRoom = stay?.rooms?.[0];
            if (firstRoom?._id) setRoomId((current) => current || firstRoom._id);
            setLoading(false);
        });
        job.catch(() => {
            if (alive) setItem(null);
        }).finally(() => {
            if (alive) setLoading(false);
        });
        return () => {
            alive = false;
            job.cancel();
        };
    }, [path, slug, openService, navigation, type]);
    useEffect(() => {
        setShowForm(false);
        setPhotoIndex(0);
        setDetailTab('overview');
        setReviews([]);
        setRoomId('');
    }, [slug]);
    useEffect(() => {
        if (!item?._id || !['HOTEL', 'RESORT', 'HOMESTAY', 'TENT'].includes(type)) return;
        const listingType = type === 'HOMESTAY' ? 'HOMESTAY' : type === 'TENT' ? 'TENT' : (item.type === 'RESORT' || type === 'RESORT' ? 'RESORT' : 'HOTEL');
        let alive = true;
        const job = loadPublic(`reviews:${listingType}:${item._id}`, () => fetchReviews(listingType, item._id), (rows) => {
            if (alive) setReviews(rows || []);
        });
        job.catch(() => {
            if (alive) setReviews([]);
        });
        return () => {
            alive = false;
            job.cancel();
        };
    }, [item?._id, item?.type, type]);
    useEffect(() => {
        if (!user) return;
        setContact((prev) => ({
            ...prev,
            email: prev.email || user.email || '',
        }));
    }, [user]);
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
                confirm({
                    title: t('account.removeListing'),
                    message: t('account.removeSavedAsk'),
                    cancelText: t('common.cancel'),
                    confirmText: t('account.removeListing'),
                    destructive: true,
                    onConfirm: async () => {
                        try {
                            await removeWishlist(item._id, type);
                            setSaved(false);
                        }
                        catch (error) {
                            Alert.alert(t('common.error'), error.response?.data?.message || error.message);
                        }
                    },
                });
                return;
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
    const submitStay = async (body) => {
        setBooking(true);
        try {
            const created = await createBooking(type, body);
            Alert.alert(t('stayGuestBooking.bookingCreated'), created.bookingNumber || '');
            navigation.navigate('MainTabs', { screen: 'Bookings' });
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setBooking(false);
        }
    };
    const startTime = contact.startTime || '09:00';
    const serviceLead = (pickup = '') => ({
        fullName: leadName.trim(),
        age: contact.leadAge ? Number(contact.leadAge) : undefined,
        mobile: leadMobile.trim(),
        email: contact.email.trim() || user?.email || '',
        address: contact.address.trim(),
        cityState: contact.cityState.trim(),
        pincode: contact.pincode.trim(),
        comingFrom: contact.emergencyName.trim() || pickup,
        goingTo: contact.dropLocation.trim() || contact.emergencyMobile.trim(),
        purpose: 'TOURISM',
    });
    const serviceNotes = (fallback) => {
        const emergencyNote = [contact.emergencyName, contact.emergencyMobile].filter(Boolean).join(' · ');
        return [contact.specialRequests.trim(), emergencyNote ? `Emergency: ${emergencyNote}` : ''].filter(Boolean).join('\n') || fallback;
    };
    const serviceMoney = (total) => ({
        formDate: new Date().toISOString(),
        checkInTime: startTime,
        advanceAmount: contact.advanceAmount !== '' ? Number(contact.advanceAmount) : total,
        paymentMode: contact.paymentMode || 'ONLINE',
    });
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
            if (!contact.email.trim()) {
                Alert.alert(t('common.error'), t('guideGuestBooking.validation.email'));
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
                    ...serviceMoney(packagePrice),
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: 1,
                    leadGuest: serviceLead(),
                    tourDetails: {
                        packageType: pkg,
                        bikeAddon,
                        startTime,
                        touristCount: 1,
                        pickupLocation: contact.address.trim(),
                        packagePrice,
                        bikeAddonPrice: bikeAddon ? packagePrice - guideChartPrice(pkg, false) : 0,
                        specialRequests: serviceNotes(item.name || ''),
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
                    ...serviceMoney(tripPrice),
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: passengers,
                    leadGuest: serviceLead(pickupLocation.trim()),
                    taxiDetails: {
                        tripType: 'ROUTE',
                        routeId: taxiRoute,
                        carType: taxiCar,
                        startTime,
                        passengerCount: passengers,
                        pickupLocation: pickupLocation.trim(),
                        dropLocation: contact.dropLocation.trim(),
                        tripPrice,
                        perTripPrice: tripPrice,
                        hourlyRate: 0,
                        specialRequests: serviceNotes(item.name || ''),
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
                    ...serviceMoney(tripPrice),
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: passengers,
                    leadGuest: serviceLead(pickupLocation.trim()),
                    taxiDetails: {
                        tripType: 'PACKAGE',
                        packageId: pkg.id,
                        packageName: t(pkg.nameKey),
                        startTime,
                        passengerCount: passengers,
                        pickupLocation: pickupLocation.trim(),
                        dropLocation: contact.dropLocation.trim(),
                        tripPrice,
                        perTripPrice: tripPrice,
                        hourlyRate: 0,
                        specialRequests: serviceNotes(item.name || ''),
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
                    ...serviceMoney(routePrice),
                    acceptTerms: true,
                    acceptedTermsAt: new Date().toISOString(),
                    adults: riders,
                    leadGuest: serviceLead(),
                    horseDetails: {
                        routeId: pkg.id,
                        routeName: t(pkg.nameKey),
                        startTime,
                        riderCount: riders,
                        safetyAcknowledged: true,
                        routePrice,
                        specialRequests: serviceNotes(item.name || ''),
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
    const cover = images[photoIndex] || images[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200';
    const stay = type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY' || type === 'TENT';
    const rating = item.rating ?? (stay ? 4 : null);
    const score = item.score ?? (rating != null ? scoreFromRating(rating) : null);
    const scoreLabel = item.scoreLabel || (rating != null ? scoreLabelFromRating(rating) : '');
    const reviewCount = item.reviewCount ?? (score ? 0 : null);
    const place = type === 'COMBO' || type === 'PRODUCT' ? '' : listingPlace(item, type);
    const priceNote = stay
        ? `${t('listing.perNight')} · ${t('listing.taxesAtCheckout')}`
        : type === 'GUIDE'
            ? `${t('guide.sixHourShort').replace(/^\//, '').trim()} · ${t('listing.taxesAtCheckout')}`
            : type === 'TAXI' || type === 'DRIVER'
                ? `${t('taxi.perTripShort')} · ${t('listing.taxesAtCheckout')}`
                : type === 'HORSE'
                    ? `${t('horse.perRoute')} · ${t('listing.taxesAtCheckout')}`
                    : t('listing.taxesAtCheckout');
    const actionTitle = type === 'PRODUCT' ? t('shop.orderNow') : type === 'COMBO' ? t('shop.bookCombo') : t('listing.bookNow');
    const serviceNs = type === 'TAXI' ? 'taxiGuestBooking' : type === 'DRIVER' ? 'driverGuestBooking' : type === 'HORSE' ? 'horseGuestBooking' : type === 'GUIDE' ? 'guideGuestBooking' : '';
    const serviceTitle = type === 'PRODUCT' ? t('shop.orderNow') : type === 'COMBO' ? t('shop.bookCombo') : serviceNs ? t(`${serviceNs}.formTitle`) : t('booking.bookNow');
    const serviceSubtitle = serviceNs ? t(`${serviceNs}.formSubtitle`, { name: item.name }) : '';
    const serviceDateLabel = serviceNs ? t(`${serviceNs}.formDate`) : t('stayGuestBooking.formDate');
    const needsRoom = type === 'HOTEL' || type === 'RESORT' || type === 'HOMESTAY';
    const openForm = () => {
        if (!user) {
            navigation.navigate('Auth');
            return;
        }
        if (needsRoom && !rooms.length) return;
        scrollToForm.current = true;
        setShowForm(true);
    };
    const onFormLayout = (event) => {
        if (!scrollToForm.current) return;
        scrollToForm.current = false;
        const y = event.nativeEvent.layout.y;
        setTimeout(() => {
            if (Platform.OS === 'web' && typeof document !== 'undefined') {
                document.getElementById('guest-booking-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
        }, 60);
    };
    const stayTabs = type === 'TENT'
        ? [['overview', 'Overview'], ['reviews', 'Reviews'], ['policies', 'Policies']]
        : [['overview', 'Overview'], ['rooms', 'Rooms'], ['reviews', 'Reviews'], ['policies', 'Policies']];
    return (<Screen style={{ padding: 0 }}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.page}>
        <View style={styles.detail}>
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
              {score ? (
                <View style={styles.scoreWrap}>
                  <View style={styles.score}>
                    <Text style={styles.scoreText}>{Number(score).toFixed(1)}</Text>
                  </View>
                  <View>
                    {scoreLabel ? <Text style={styles.scoreLabel}>{scoreLabel}</Text> : null}
                    {reviewCount != null ? <Text style={styles.reviews}>{Number(reviewCount).toLocaleString('en-IN')} {t('property.reviews')}</Text> : null}
                  </View>
                </View>
              ) : null}
            </View>
            {place ? (
              <View style={styles.placeRow}>
                <MapPin size={16} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.place}>{place}</Text>
              </View>
            ) : null}
            {type === 'GUIDE' && item.languages?.length > 0 ? <Text style={styles.place}>{t('guide.languages')}: {item.languages.join(', ')}</Text> : null}
            {type === 'TENT' ? <Text style={styles.place}>{t('listing.tentCapacity', { guests: item.capacity || 2, count: item.totalTents || 1 })}</Text> : null}
            {(type === 'HOTEL' || type === 'RESORT') && item.amenities?.length > 0 ? (<View style={styles.chips}>
              {item.amenities.slice(0, 6).map((amenity) => (<Text key={amenity} style={styles.chip}>{amenity}</Text>))}
            </View>) : null}
            {stay && rooms.length > 0 ? (
              <Text style={styles.roomLine}>
                {t(rooms.length === 1 ? 'listing.roomTypeOne' : 'listing.roomTypeMany', { count: rooms.length })}
                {selectedRoom?.name ? ` · ${t('listing.selectedRoom', { name: selectedRoom.name })}` : ''}
              </Text>
            ) : null}
            <View style={styles.pricePanel}>
              <Text style={styles.from}>{t('listing.from')}</Text>
              <Text style={styles.price}>{nightPrice != null ? formatCurrency(nightPrice) : '—'}</Text>
              {type === 'COMBO' && item.originalPrice != null ? <Text style={styles.struck}>{formatCurrency(item.originalPrice)}</Text> : null}
              {type === 'PRODUCT' && item.unit ? <Text style={styles.priceNote}>/ {item.unit}</Text> : <Text style={styles.priceNote}>{priceNote}</Text>}
              {stay && selectedRoom?.name ? <Text style={styles.roomName}>{selectedRoom.name}</Text> : null}
              <Text style={styles.formHint}>
                {!user ? t('listing.signInToBook') : showForm ? t('listing.formOpenHint') : t('listing.formClosedHint')}
              </Text>
              <View style={styles.formAction}>
                {!user ? (
                  <Button title={t('listing.signInToBook')} onPress={() => navigation.navigate('Auth')} />
                ) : showForm ? (
                  <Button title={t('listing.hideBookingForm')} variant="outline" onPress={() => setShowForm(false)} />
                ) : (
                  <Button title={actionTitle} onPress={openForm} disabled={needsRoom && !rooms.length} />
                )}
              </View>
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
        {stay ? (
          <View style={styles.tabsWrap}>
            <View style={styles.tabs}>
              {stayTabs.map(([id, label]) => (
                <Pressable key={id} onPress={() => setDetailTab(id)} style={styles.tabBtn}>
                  <Text style={[styles.tabText, detailTab === id && styles.tabTextOn]}>{label}</Text>
                  {detailTab === id ? <View style={styles.tabLine} /> : <View style={styles.tabLineOff} />}
                </Pressable>
              ))}
            </View>
            {detailTab === 'overview' ? (
              <View style={styles.tabBody}>
                {item.description ? <Text style={styles.overviewText}>{item.description}</Text> : null}
                {item.amenities?.length > 0 ? (
                  <View>
                    <Text style={styles.tabHeading}>Most popular facilities</Text>
                    <View style={styles.facilityGrid}>
                      {item.amenities.map((amenity) => <Text key={amenity} style={styles.facility}>{amenity}</Text>)}
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}
            {detailTab === 'rooms' ? (
              <View style={styles.tabBody}>
                <Text style={styles.tabHeading}>Select your room</Text>
                {rooms.map((room) => {
                  const selected = String(room._id) === String(selectedRoom?._id);
                  return (
                    <View key={room._id} style={[styles.roomCard, selected && styles.roomCardOn]}>
                      <Text style={styles.roomCardTitle}>{room.name}</Text>
                      <Text style={styles.roomCardMeta}>{[room.type, room.capacity ? `${room.capacity} guests` : ''].filter(Boolean).join(' · ')}</Text>
                      {room.freeCancellation !== false ? <Text style={styles.roomFree}>{t('property.freeCancellation')}</Text> : null}
                      <View style={styles.roomCardFoot}>
                        <Text style={styles.roomCardPrice}>{room.basePrice != null ? `${formatCurrency(room.basePrice)}/night` : ''}</Text>
                        <Pressable onPress={() => setRoomId(room._id)} style={[styles.roomPick, selected && styles.roomPickOn]}>
                          <Text style={[styles.roomPickText, selected && styles.roomPickTextOn]}>{selected ? 'Selected' : 'Select rooms'}</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
            {detailTab === 'reviews' ? (
              <Card>
                {score ? <Text style={styles.tabHeading}>{Number(score).toFixed(1)} {scoreLabel} · {(reviews.length || reviewCount || 0).toLocaleString('en-IN')} {t('property.reviews')}</Text> : null}
                {reviews.length > 0 ? reviews.slice(0, 5).map((review) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <Text style={styles.reviewName}>{review.user?.name || 'Guest'} · {review.rating}/5</Text>
                    {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}
                  </View>
                )) : <Muted>{t('property.noReviewsYet', { defaultValue: 'No guest reviews yet. Complete a booking to be the first to review.' })}</Muted>}
              </Card>
            ) : null}
            {detailTab === 'policies' ? (
              <Card>
                <Text style={styles.policyText}><Text style={styles.policyStrong}>Check-in:</Text> {formatTime12(item.checkInTime || '14:00')} · <Text style={styles.policyStrong}>Check-out:</Text> {formatTime12(item.checkOutTime || '11:00')}</Text>
                <Text style={styles.policyText}>{(typeof item.cancellationPolicyText === 'string' && item.cancellationPolicyText) || (typeof item.cancellationPolicy === 'string' && item.cancellationPolicy) || t('listing.freeCancellation')}</Text>
                {item.houseRules?.length > 0 ? (
                  <View>
                    <Text style={styles.tabHeading}>{t('listing.houseRules')}</Text>
                    {item.houseRules.map((rule) => <Text key={rule} style={styles.policyText}>{`•  ${rule}`}</Text>)}
                  </View>
                ) : null}
              </Card>
            ) : null}
          </View>
        ) : null}
        {!stay && (type === 'HOMESTAY' || type === 'TENT') && item.amenities?.length > 0 && (<View style={{ marginTop: 10 }}>
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
        {type === 'TAXI' ? <Muted>{item.description || t('taxi.description')}</Muted> : !stay && type !== 'PRODUCT' && (item.bio || item.description || item.horseDetails) ? <Muted>{item.bio || item.description || item.horseDetails}</Muted> : null}
        {!stay && (type === 'HOMESTAY' || type === 'TENT') && (<Card>
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
        {showForm ? (
          <View nativeID="guest-booking-form" onLayout={onFormLayout}>
          {stay ? (
            <StayGuestForm type={type} item={item} user={user} roomId={roomId} onRoomChange={setRoomId} onConfirm={submitStay} submitting={booking} />
          ) : (<>
          <FormHeader title={serviceTitle} subtitle={serviceSubtitle} dateLabel={serviceDateLabel} />
          {type === 'GUIDE' ? (<>
            <FormSection title={t('guideGuestBooking.section1')}>
              <DateField label={t('guideGuestBooking.tourDate')} value={checkIn} onChange={setCheckIn}/>
              {GUIDE_CHART_PACKAGES.map((pkg) => (<Choice key={pkg.id} selected={guidePackage === pkg.id} onPress={() => setGuidePackage(pkg.id)} title={t(pkg.nameKey)} detail={`${t(pkg.durationKey)} · ${formatCurrency(bikeAddon ? pkg.withBike : pkg.guideOnly)}`}/>))}
              <Choice selected={bikeAddon} onPress={() => setBikeAddon((value) => !value)} title={t('guide.bikeAddon', { price: formatCurrency(guideChartPrice(guidePackage, true) - guideChartPrice(guidePackage, false)) })}/>
            </FormSection>
            <FormSection title={t('guideGuestBooking.section2')}>
              <Field label={t('guideGuestBooking.fullName')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
              <Field label={t('guideGuestBooking.mobile')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
              <ContactFields contact={contact} setContact={setContact} t={t} ns="guideGuestBooking" timeLabel={t('guideGuestBooking.startTime')}/>
            </FormSection>
            <FormSection title={t('guideGuestBooking.section4')}>
              <TotalBox lines={[{ label: t('guideGuestBooking.subtotalLabel'), value: formatCurrency(guideChartPrice(guidePackage, bikeAddon)) }]} totalLabel={t('guideGuestBooking.totalLabel')} total={guideChartPrice(guidePackage, bikeAddon)}/>
            </FormSection>
            <TermsCard ns="guideGuestBooking" title={t('guideGuestBooking.section5')} label={t('guideGuestBooking.acceptTerms')} accepted={acceptTerms} onToggle={() => setAcceptTerms((value) => !value)} />
          </>) : type === 'TAXI' || type === 'DRIVER' ? (<>
            <FormSection title={t(serviceNs + '.section1')}>
              <DateField label={t(`${serviceNs}.tripDate`)} value={checkIn} onChange={setCheckIn}/>
              <Field label={t(`${serviceNs}.pickupLocation`)} value={pickupLocation} onChangeText={setPickupLocation}/>
              <Field label={t(`${serviceNs}.passengerCount`)} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            </FormSection>
            <FormSection title={t(`${serviceNs}.section2`)}>
              <Field label={t(`${serviceNs}.fullName`)} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
              <Field label={t(`${serviceNs}.mobile`)} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
              <ContactFields contact={contact} setContact={setContact} t={t} ns={serviceNs} showDrop timeLabel={t(`${serviceNs}.pickupTime`)}/>
            </FormSection>
            <FormSection title={t(`${serviceNs}.section4`)}>
              <TotalBox lines={[{ label: t(`${serviceNs}.subtotalLabel`), value: formatCurrency(type === 'TAXI' ? taxiChartPrice(taxiRoute) : driverPackagePrice(driverPackage)) }]} totalLabel={t(`${serviceNs}.totalLabel`)} total={type === 'TAXI' ? taxiChartPrice(taxiRoute) : driverPackagePrice(driverPackage)}/>
            </FormSection>
            <TermsCard ns={serviceNs} title={t(`${serviceNs}.section6`)} label={t(`${serviceNs}.acceptTerms`)} accepted={acceptTerms} onToggle={() => setAcceptTerms((value) => !value)} />
          </>) : type === 'HORSE' ? (<>
            <FormSection title={t('horseGuestBooking.section1')}>
              <DateField label={t('horseGuestBooking.rideDate')} value={checkIn} onChange={setCheckIn}/>
              <Field label={t('horseGuestBooking.riderCount')} value={adults} onChangeText={setAdults} keyboardType="numeric"/>
            </FormSection>
            <FormSection title={t('horseGuestBooking.section2')}>
              <Field label={t('horseGuestBooking.fullName')} value={leadName} onChangeText={setLeadName} autoCapitalize="words"/>
              <Field label={t('horseGuestBooking.mobile')} value={leadMobile} onChangeText={setLeadMobile} keyboardType="phone-pad"/>
              <ContactFields contact={contact} setContact={setContact} t={t} ns="horseGuestBooking" showAge timeLabel={t('horseGuestBooking.startTime')}/>
            </FormSection>
            <FormSection title={t('horseGuestBooking.section5')}>
              <TotalBox lines={[{ label: t('horseGuestBooking.subtotalLabel'), value: formatCurrency(horseChartPrice(horsePackage)) }]} totalLabel={t('horseGuestBooking.totalLabel')} total={horseChartPrice(horsePackage)}/>
            </FormSection>
            <TermsCard ns="horseGuestBooking" title={t('horseGuestBooking.section6')} label={t('horseGuestBooking.acceptTerms')} accepted={acceptTerms} onToggle={() => setAcceptTerms((value) => !value)} extra={(
              <Pressable onPress={() => setAcceptSafety((value) => !value)} style={styles.safetyRow}>
                <View style={[styles.checkBox, acceptSafety && styles.checkBoxOn]}>{acceptSafety ? <Text style={styles.checkTick}>✓</Text> : null}</View>
                <Text style={styles.safetyText}>{t('horseGuestBooking.acceptSafety')}</Text>
              </Pressable>
            )} />
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
              <DateField label={t('booking.checkIn')} value={checkIn} onChange={setCheckIn}/>
            </FormSection>
            <FormSection title={t('booking.sectionPayment')}>
              <TotalBox lines={[{ label: t('booking.subtotal'), value: formatCurrency(Number(item.comboPrice) || 0) }]} totalLabel={t('booking.total')} total={Number(item.comboPrice) || 0}/>
            </FormSection>
          </>) : (<Field label={t('booking.guests')} value={guests} onChangeText={setGuests} keyboardType="numeric"/>)}
          {stay ? null : <Button title={actionTitle} onPress={onBook} loading={booking}/>}
        </>)}
          </View>
        ) : null}
        </View>
      </ScrollView>
    </Screen>);
}

const styles = StyleSheet.create({
    page: { paddingBottom: 0 },
    detail: { paddingHorizontal: 16, paddingTop: 16 },
    tabsWrap: { marginTop: 8, marginBottom: 8 },
    tabs: { flexDirection: 'row', gap: 18, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    tabBtn: { paddingBottom: 0 },
    tabText: { fontFamily: FONTS.medium, fontSize: 14, color: '#64748B', paddingBottom: 10 },
    tabTextOn: { fontFamily: FONTS.semibold, color: COLORS.action },
    tabLine: { height: 3, backgroundColor: COLORS.action, borderRadius: 2 },
    tabLineOff: { height: 3, backgroundColor: 'transparent' },
    tabBody: { marginTop: 16, gap: 12 },
    tabHeading: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text, marginBottom: 8 },
    overviewText: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 22, color: '#334155' },
    facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    facility: { width: '46%', fontFamily: FONTS.regular, fontSize: 14, color: COLORS.body },
    roomCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, marginBottom: 12 },
    roomCardOn: { borderColor: COLORS.primary, borderWidth: 2 },
    roomCardTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
    roomCardMeta: { fontFamily: FONTS.regular, fontSize: 13, color: '#64748B', marginTop: 4 },
    roomFree: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.success, marginTop: 8 },
    roomCardFoot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 8 },
    roomCardPrice: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    roomPick: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
    roomPickOn: { backgroundColor: COLORS.action, borderColor: COLORS.action },
    roomPickText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.primary },
    roomPickTextOn: { color: '#fff' },
    reviewCard: { borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 12, padding: 12, marginBottom: 8 },
    reviewName: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
    reviewText: { fontFamily: FONTS.regular, fontSize: 13, color: '#475569', marginTop: 4 },
    policyText: { fontFamily: FONTS.regular, fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 8 },
    policyStrong: { fontFamily: FONTS.bold, color: COLORS.text },
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
    scoreWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    scoreLabel: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.text },
    reviews: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B' },
    placeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
    place: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: '#475569', lineHeight: 20 },
    roomLine: { fontFamily: FONTS.medium, fontSize: 12, color: '#64748B', marginTop: 12 },
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
        padding: 16,
        alignItems: 'flex-end',
    },
    from: { fontFamily: FONTS.medium, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: '#64748B' },
    price: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.primary, marginTop: 4 },
    formHint: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 12, textAlign: 'left', alignSelf: 'stretch' },
    formAction: { alignSelf: 'stretch' },
    priceSuffix: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.muted },
    struck: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.muted, textDecorationLine: 'line-through' },
    priceNote: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', marginTop: 4 },
    roomName: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.body, marginTop: 8 },
    formTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: 12 },
    formSection: { marginBottom: 14, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
    formSectionTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text, marginBottom: 12 },
    safetyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
    checkBox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: COLORS.inputBorder, alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: '#fff' },
    checkBoxOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    checkTick: { color: '#fff', fontSize: 12, fontFamily: FONTS.bold },
    safetyText: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.body, lineHeight: 20 },
    choice: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, backgroundColor: '#fff' },
    choiceOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
    choiceTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text },
    payLabel: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.body, marginBottom: 8, marginTop: 4 },
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
