import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getMyKyc, submitKyc } from '../../api/endpoints';
import { Button, Card, Field, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const ROLE_TO_VENDOR_TYPE = {
    HOTEL_VENDOR: 'HOTEL',
    HOMESTAY_VENDOR: 'HOMESTAY',
    TENT_OPERATOR: 'TENT',
    GUIDE: 'GUIDE',
    TAXI_OPERATOR: 'TAXI',
    DRIVER: 'DRIVER',
    HORSE_OPERATOR: 'HORSE',
};

const emptyBank = {
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
    upiId: '',
};

export default function VendorKycScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const vendorType = ROLE_TO_VENDOR_TYPE[user?.role] || 'HOTEL';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState('PENDING');
    const [rejectionReason, setRejectionReason] = useState('');
    const [aadhar, setAadhar] = useState('');
    const [pan, setPan] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [bank, setBank] = useState(emptyBank);

    useEffect(() => {
        getMyKyc()
            .then((current) => {
            if (!current)
                return;
            setStatus(current.status || 'PENDING');
            setRejectionReason(current.rejectionReason || '');
            setAadhar(current.aadhar || '');
            setPan(current.pan || '');
            setGstNumber(current.gstNumber || '');
            if (current.bankDetails)
                setBank((prev) => ({ ...prev, ...current.bankDetails }));
        })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const setBankField = (key, value) => setBank((prev) => ({ ...prev, [key]: value }));

    const onSubmit = async () => {
        setSaving(true);
        try {
            const form = new FormData();
            form.append('vendorType', vendorType);
            form.append('aadhar', aadhar.trim());
            form.append('pan', pan.trim().toUpperCase());
            form.append('gstNumber', gstNumber.trim().toUpperCase());
            form.append('bankDetails', JSON.stringify({
                ...bank,
                accountHolder: bank.accountHolder.trim(),
                accountNumber: bank.accountNumber.trim(),
                ifsc: bank.ifsc.trim().toUpperCase(),
                bankName: bank.bankName.trim(),
                branch: bank.branch.trim(),
                upiId: bank.upiId.trim(),
            }));
            const saved = await submitKyc(form);
            setStatus(saved?.status || 'PENDING');
            setRejectionReason('');
            Alert.alert(t('vendor.kycSubmitted'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setSaving(false);
        }
    };

    if (loading)
        return <Loading />;

    const approved = status === 'APPROVED';
    const tone = status === 'APPROVED' ? styles.ok : status === 'REJECTED' ? styles.bad : styles.pending;
    const toneText = status === 'APPROVED' ? styles.okText : status === 'REJECTED' ? styles.badText : styles.pendingText;

    return (
        <Screen>
            <ScrollView>
                <Text style={styles.pageTitle}>{t('vendor.kycTitle')}</Text>
                <View style={[styles.badge, tone]}>
                    <Text style={[styles.badgeText, toneText]}>{status}</Text>
                </View>
                <Text style={styles.hint}>{t('vendor.kycHint')}</Text>
                {rejectionReason ? (
                    <View style={styles.danger}>
                        <Text style={styles.dangerText}>{t('vendor.rejectionReason')}: {rejectionReason}</Text>
                    </View>
                ) : null}
                <Card>
                    <Field label={t('vendor.aadhaar')} value={aadhar} onChangeText={setAadhar} keyboardType="numeric" />
                    <Field label={t('vendor.pan')} value={pan} onChangeText={(value) => setPan(value.toUpperCase())} autoCapitalize="characters" />
                    <Field label={t('vendor.gst')} value={gstNumber} onChangeText={(value) => setGstNumber(value.toUpperCase())} autoCapitalize="characters" />
                    <Text style={styles.sectionTitle}>{t('vendor.bankDetails')}</Text>
                    <Field label={t('vendor.accountHolder')} value={bank.accountHolder} onChangeText={(value) => setBankField('accountHolder', value)} autoCapitalize="words" />
                    <Field label={t('vendor.accountNumber')} value={bank.accountNumber} onChangeText={(value) => setBankField('accountNumber', value)} keyboardType="numeric" />
                    <Field label={t('vendor.ifsc')} value={bank.ifsc} onChangeText={(value) => setBankField('ifsc', value.toUpperCase())} autoCapitalize="characters" />
                    <Field label={t('vendor.bankName')} value={bank.bankName} onChangeText={(value) => setBankField('bankName', value)} autoCapitalize="words" />
                    <Field label={t('vendor.branch')} value={bank.branch} onChangeText={(value) => setBankField('branch', value)} autoCapitalize="words" />
                    <Field label={t('vendor.upi')} value={bank.upiId} onChangeText={(value) => setBankField('upiId', value)} autoCapitalize="none" />
                    <Button title={t('vendor.submitKyc')} onPress={onSubmit} loading={saving} disabled={approved} />
                </Card>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    pageTitle: { fontFamily: FONTS.bold, fontSize: 24, color: COLORS.text, letterSpacing: -0.4 },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 8, marginBottom: 12, lineHeight: 20 },
    sectionTitle: { fontFamily: FONTS.semibold, fontSize: 16, color: COLORS.text, marginBottom: 8, marginTop: 4 },
    badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginTop: 10 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 12 },
    ok: { backgroundColor: '#F0FDF4' },
    okText: { color: COLORS.success },
    pending: { backgroundColor: '#FFFBEB' },
    pendingText: { color: COLORS.warning },
    bad: { backgroundColor: '#FEF2F2' },
    badText: { color: COLORS.danger },
    danger: { backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 12, marginBottom: 12 },
    dangerText: { fontFamily: FONTS.medium, fontSize: 13, color: '#B91C1C', lineHeight: 18 },
});
