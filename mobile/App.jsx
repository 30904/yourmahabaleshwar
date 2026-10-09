import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { ConfirmProvider } from './src/components/confirm';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const logo = require('./assets/logo.png');

export default function App() {
    const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_700Bold,
        Inter_800ExtraBold,
    });
    const [showSplash, setShowSplash] = useState(true);
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.72)).current;
    const logoLift = useRef(new Animated.Value(18)).current;
    const splashOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 1400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 1400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            Animated.timing(logoLift, {
                toValue: 0,
                duration: 1400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
        ]).start();
    }, [logoOpacity, logoScale, logoLift]);

    useEffect(() => {
        if (!fontsLoaded) return undefined;
        const timer = setTimeout(() => {
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 700,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: false,
            }).start(({ finished }) => {
                if (finished) setShowSplash(false);
            });
        }, 2200);
        return () => clearTimeout(timer);
    }, [fontsLoaded, splashOpacity]);

    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
            <StatusBar style="dark" />
            {fontsLoaded ? (
                <AuthProvider>
                    <ConfirmProvider>
                        <RootNavigator />
                    </ConfirmProvider>
                </AuthProvider>
            ) : (
                <View style={styles.splash} />
            )}
            {showSplash ? (
                <Animated.View style={[styles.splash, styles.splashOverlay, { opacity: splashOpacity }]}>
                    <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }, { translateY: logoLift }] }}>
                        <Image source={logo} style={styles.logo} resizeMode="contain" />
                    </Animated.View>
                </Animated.View>
            ) : null}
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    splashOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    logo: {
        width: 280,
        height: 120,
    },
});
