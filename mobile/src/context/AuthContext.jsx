import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as loginApi, logoutApi, register as registerApi, registerVendor as registerVendorApi, sendOtp as sendOtpApi, updateProfile, verifyOtp as verifyOtpApi, } from '../api/endpoints';
import { clearToken, readToken, writeToken } from '../api/tokenStore';
import { VENDOR_ROLES } from '../constants/theme';
import { registerForPushNotifications, unregisterPushNotifications } from '../services/push';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingOtp, setPendingOtp] = useState(null);
    const persistSession = async (payload) => {
        await writeToken('accessToken', payload.accessToken);
        await writeToken('refreshToken', payload.refreshToken);
        setUser(payload.user);
        setPendingOtp(null);
        registerForPushNotifications(payload.user.role).catch(() => { });
        return payload.user;
    };
    useEffect(() => {
        (async () => {
            try {
                const token = await readToken('accessToken');
                if (!token)
                    return;
                const me = await fetchMe();
                setUser(me);
                registerForPushNotifications(me.role).catch(() => { });
            }
            catch {
                await clearToken('accessToken');
                await clearToken('refreshToken');
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const login = useCallback(async (email, password) => {
        const data = await loginApi(email, password);
        if (data.requiresOtp) {
            setPendingOtp({
                identifier: data.phone || data.email,
                purpose: 'LOGIN',
                phone: data.phone,
                email: data.email,
                devCode: data.devCode,
            });
            return { requiresOtp: true, devCode: data.devCode };
        }
        const user = await persistSession(data);
        return { user };
    }, []);
    const register = useCallback(async (payload) => {
        const data = await registerApi(payload);
        if (data.requiresOtp) {
            setPendingOtp({
                identifier: data.phone || data.email,
                purpose: 'SIGNUP',
                phone: data.phone,
                email: data.email,
                devCode: data.devCode,
            });
            return { requiresOtp: true, devCode: data.devCode };
        }
        const user = await persistSession(data);
        return { user };
    }, []);
    const registerVendor = useCallback(async (payload) => {
        const data = await registerVendorApi(payload);
        if (data.requiresOtp) {
            setPendingOtp({
                identifier: data.phone || data.email,
                purpose: 'SIGNUP',
                phone: data.phone,
                email: data.email,
                devCode: data.devCode,
            });
            return { requiresOtp: true, devCode: data.devCode };
        }
        const user = await persistSession(data);
        return { user };
    }, []);
    const verifyOtp = useCallback(async (code) => {
        if (!pendingOtp)
            throw new Error('No pending OTP');
        const identifier = String(pendingOtp.identifier || '').trim();
        if (!identifier)
            throw new Error('No pending OTP');
        const data = await verifyOtpApi({
            identifier,
            code: String(code || '').replace(/\D/g, ''),
            purpose: pendingOtp.purpose || 'LOGIN',
        });
        return persistSession(data);
    }, [pendingOtp]);
    const resendOtp = useCallback(async () => {
        if (!pendingOtp)
            throw new Error('No pending OTP');
        const channel = pendingOtp.phone ? 'PHONE' : 'EMAIL';
        const data = await sendOtpApi({
            identifier: pendingOtp.identifier,
            channel,
            purpose: pendingOtp.purpose,
        });
        setPendingOtp((p) => (p ? { ...p, devCode: data.devCode } : p));
        return { devCode: data.devCode };
    }, [pendingOtp]);
    const saveProfile = useCallback(async (body) => {
        const updated = await updateProfile(body);
        setUser(updated);
        return updated;
    }, []);
    const logout = useCallback(async () => {
        try {
            await unregisterPushNotifications();
        }
        catch {
            /* ignore */
        }
        try {
            await logoutApi();
        }
        catch {
            /* ignore */
        }
        await clearToken('accessToken');
        await clearToken('refreshToken');
        setUser(null);
    }, []);
    const value = useMemo(() => ({
        user,
        loading,
        pendingOtp,
        isVendor: !!user && VENDOR_ROLES.includes(user.role),
        login,
        register,
        registerVendor,
        verifyOtp,
        resendOtp,
        saveProfile,
        logout,
    }), [user, loading, pendingOtp, login, register, registerVendor, verifyOtp, resendOtp, saveProfile, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error('useAuth requires AuthProvider');
    return ctx;
};
