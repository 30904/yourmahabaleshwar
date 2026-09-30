import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/ui';
import { COLORS } from '../constants/theme';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VendorRegisterScreen from '../screens/auth/VendorRegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HomeScreen from '../screens/customer/HomeScreen';
import SearchScreen from '../screens/customer/SearchScreen';
import ContentScreen from '../screens/customer/ContentScreen';
import CatalogScreen from '../screens/customer/CatalogScreen';
import ListingDetailScreen from '../screens/customer/ListingDetailScreen';
import BookingsScreen from '../screens/customer/BookingsScreen';
import AccountScreen from '../screens/customer/AccountScreen';
import FavoritesScreen from '../screens/customer/FavoritesScreen';
import VendorHubScreen from '../screens/vendor/VendorHubScreen';
import VendorKycScreen from '../screens/vendor/VendorKycScreen';
import VendorListingsScreen from '../screens/vendor/VendorListingsScreen';
import VendorListingFormScreen from '../screens/vendor/VendorListingFormScreen';
import VendorPricingScreen from '../screens/vendor/VendorPricingScreen';
import VendorAvailabilityScreen from '../screens/vendor/VendorAvailabilityScreen';
const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
function AuthNavigator() {
    return (<AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen}/>
      <AuthStack.Screen name="Register" component={RegisterScreen}/>
      <AuthStack.Screen name="VendorRegister" component={VendorRegisterScreen}/>
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen}/>
    </AuthStack.Navigator>);
}
function MainTabs() {
    const { t } = useTranslation();
    const { isVendor, user } = useAuth();
    return (<Tab.Navigator screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarStyle: { borderTopColor: COLORS.border },
        }}>
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{
            title: t('nav.home'),
            tabBarIcon: ({ color }) => <Text style={{ color }}>⌂</Text>,
        }}/>
      <Tab.Screen name="Bookings" component={user ? BookingsScreen : AccountScreen} options={{
            title: t('nav.bookings'),
            tabBarIcon: ({ color }) => <Text style={{ color }}>☰</Text>,
        }}/>
      <Tab.Screen name="VendorTab" component={VendorHubScreen} options={{
            title: t('nav.vendor'),
            tabBarIcon: ({ color }) => <Text style={{ color }}>◆</Text>,
            tabBarButton: isVendor ? undefined : () => null,
        }}/>
      <Tab.Screen name="Account" component={AccountScreen} options={{
            title: t('nav.account'),
            tabBarIcon: ({ color }) => <Text style={{ color }}>●</Text>,
        }}/>
    </Tab.Navigator>);
}
export default function RootNavigator() {
    const { loading } = useAuth();
    if (loading)
        return <Loading />;
    return (<NavigationContainer>
      <RootStack.Navigator>
        <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }}/>
        <RootStack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false, presentation: 'modal' }}/>
        <RootStack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }}/>
        <RootStack.Screen name="Content" component={ContentScreen} options={{ title: 'Info' }}/>
        <RootStack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'Explore' }}/>
        <RootStack.Screen name="ListingDetail" component={ListingDetailScreen} options={{ title: 'Details' }}/>
        <RootStack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Saved' }}/>
        <RootStack.Screen name="VendorHub" component={VendorHubScreen} options={{ title: 'Vendor' }}/>
        <RootStack.Screen name="VendorKyc" component={VendorKycScreen} options={{ title: 'KYC' }}/>
        <RootStack.Screen name="VendorListings" component={VendorListingsScreen} options={{ title: 'Listings' }}/>
        <RootStack.Screen name="VendorListingForm" component={VendorListingFormScreen} options={{ title: 'Listing' }}/>
        <RootStack.Screen name="VendorPricing" component={VendorPricingScreen} options={{ title: 'Prices' }}/>
        <RootStack.Screen name="VendorAvailability" component={VendorAvailabilityScreen} options={{ title: 'Dates' }}/>
      </RootStack.Navigator>
    </NavigationContainer>);
}
