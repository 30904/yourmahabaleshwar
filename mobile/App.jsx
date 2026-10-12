import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import './src/i18n';
import { ConfirmProvider } from './src/components/confirm';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

const logo = require('./assets/logo.png');
const screen = Dimensions.get('screen');
const logoWidth = Math.round(Math.min(screen.width - 72, 320));

SplashScreen.preventAutoHideAsync().catch(() => {});

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
                useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 1400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(logoLift, {
                toValue: 0,
                duration: 1400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [logoOpacity, logoScale, logoLift]);

    useEffect(() => {
        if (!fontsLoaded) return undefined;
        SplashScreen.hideAsync().catch(() => {});
        const timer = setTimeout(() => {
            Animated.timing(splashOpacity, {
                toValue: 0,
                duration: 700,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) setShowSplash(false);
            });
        }, 2200);
        return () => clearTimeout(timer);
    }, [fontsLoaded, splashOpacity]);

    return (
        <SafeAreaProvider initialMetrics={initialWindowMetrics} style={styles.root}>
            <StatusBar style="dark" />
            <View style={styles.root}>
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
                    <Animated.View pointerEvents="auto" style={[styles.splashCover, { opacity: splashOpacity }]}>
                        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }, { translateY: logoLift }] }}>
                            <Image source={logo} style={styles.logo} resizeMode="contain" />
                        </Animated.View>
                    </Animated.View>
                ) : null}
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    splash: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    splashCover: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: screen.width,
        height: screen.height,
        zIndex: 100,
        elevation: 100,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    logo: {
        width: logoWidth,
        height: Math.round(logoWidth * 0.46),
    },
});
