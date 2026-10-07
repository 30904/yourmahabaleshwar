import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Svg, { Line, Path } from 'react-native-svg/src/index';
import { useTranslation } from 'react-i18next';
import { getDocumentRequirements, getMyKyc, submitKyc } from '../../api/endpoints';
import { Button, Card, Field, Loading, Screen } from '../../components/ui';
import { COLORS, FONTS, RADIUS } from '../../constants/theme';
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

const CODE_TO_FIELD = {
    AADHAAR: 'aadharDoc',
    PAN: 'panDoc',
    GST: 'gstDoc',
    BANK: 'bankProofDoc',
    BUSINESS_REG: 'businessRegDoc',
    HOTEL_LICENSE: 'hotelLicenseDoc',
    GUIDE_LICENSE: 'guideLicenseDoc',
    ADDRESS: 'addressProofDoc',
    RC: 'rcDoc',
    INSURANCE: 'insuranceDoc',
    FITNESS: 'fitnessDoc',
    PERMIT: 'permitDoc',
    LICENSE: 'licenseDoc',
    PUC: 'pucDoc',
};

const FALLBACK_DOCS = {
    HOTEL: [
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'GST', label: 'GST Certificate' },
        { code: 'BANK', label: 'Bank Proof' },
        { code: 'BUSINESS_REG', label: 'Business Registration' },
        { code: 'HOTEL_LICENSE', label: 'Hotel License' },
    ],
    RESORT: [
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'GST', label: 'GST Certificate' },
        { code: 'BANK', label: 'Bank Proof' },
        { code: 'BUSINESS_REG', label: 'Business Registration' },
        { code: 'HOTEL_LICENSE', label: 'Hotel License' },
    ],
    HOMESTAY: [
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'ADDRESS', label: 'Address Proof' },
        { code: 'BANK', label: 'Bank Proof' },
    ],
    TENT: [
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'BANK', label: 'Bank Proof' },
    ],
    GUIDE: [
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'GUIDE_LICENSE', label: 'Guide License' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'BANK', label: 'Bank Proof' },
    ],
    TAXI: [
        { code: 'LICENSE', label: 'Driving License' },
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'RC', label: 'Vehicle RC' },
        { code: 'INSURANCE', label: 'Insurance' },
        { code: 'FITNESS', label: 'Fitness' },
        { code: 'PERMIT', label: 'Permit' },
        { code: 'BANK', label: 'Bank Proof' },
    ],
    DRIVER: [
        { code: 'LICENSE', label: 'Driving License' },
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'RC', label: 'Vehicle RC' },
        { code: 'INSURANCE', label: 'Insurance' },
        { code: 'PUC', label: 'PUC Certificate' },
        { code: 'BANK', label: 'Bank Proof' },
    ],
    HORSE: [
        { code: 'AADHAAR', label: 'Aadhaar Card' },
        { code: 'PAN', label: 'PAN Card' },
        { code: 'BANK', label: 'Bank Proof' },
    ],
};

const emptyBank = {
    accountHolder: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
    upiId: '',
};

function UploadGlyph() {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M7 8l5-5 5 5" stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            <Line x1="12" y1="3" x2="12" y2="15" stroke={COLORS.primary} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function fileFromDrop(event) {
    const transfer = event?.dataTransfer || event?.nativeEvent?.dataTransfer;
    return transfer?.files?.[0] || null;
}

const FILE_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';

const webFileInput = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    zIndex: 2,
};

function KycDropzone({ label, file, existing, onChange }) {
    const { t } = useTranslation();
    const name = file?.name || '';

    const pickNative = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['image/*', 'application/pdf'],
            copyToCacheDirectory: true,
            multiple: false,
        });
        if (result.canceled || !result.assets?.[0]) return;
        onChange(result.assets[0]);
    };

    const dropProps = Platform.OS === 'web'
        ? {
            onDragOver: (event) => {
                event.preventDefault?.();
            },
            onDrop: (event) => {
                event.preventDefault?.();
                const dropped = fileFromDrop(event);
                if (dropped) onChange(dropped);
            },
        }
        : {};

    return (
        <View style={styles.dropWrap}>
            <Text style={styles.dropLabel}>{label}</Text>
            <View style={styles.drop} {...dropProps}>
                {name ? (
                    <Text style={styles.fileName} pointerEvents="none">{name}</Text>
                ) : existing ? (
                    <Text style={styles.uploaded} pointerEvents="none">{t('vendor.alreadyUploaded')}</Text>
                ) : (
                    <View style={styles.placeholder} pointerEvents="none">
                        <UploadGlyph />
                        <Text style={styles.dropTitle}>Drag & drop or click to upload</Text>
                        <Text style={styles.dropHint}>JPG, PNG or PDF</Text>
                    </View>
                )}
                {Platform.OS === 'web' ? React.createElement('input', {
                    type: 'file',
                    accept: FILE_ACCEPT,
                    onChange: (event) => {
                        const next = event.target.files?.[0] || null;
                        event.target.value = '';
                        if (next) onChange(next);
                    },
                    style: webFileInput,
                }) : (
                    <Pressable style={StyleSheet.absoluteFill} onPress={pickNative} />
                )}
            </View>
            {name ? (
                <Pressable onPress={() => onChange(null)}>
                    <Text style={styles.clear}>Remove</Text>
                </Pressable>
            ) : null}
        </View>
    );
}

function appendKycFile(form, field, file) {
    if (!file) return;
    if (Platform.OS === 'web') {
        form.append(field, file);
        return;
    }
    form.append(field, {
        uri: file.uri,
        name: file.name || 'document',
        type: file.mimeType || 'application/octet-stream',
    });
}

export default function VendorKycScreen() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const vendorType = ROLE_TO_VENDOR_TYPE[user?.role] || 'HOTEL';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [kyc, setKyc] = useState(null);
    const [docs, setDocs] = useState(FALLBACK_DOCS[vendorType] || FALLBACK_DOCS.HOTEL);
    const [files, setFiles] = useState({});
    const [status, setStatus] = useState('PENDING');
    const [rejectionReason, setRejectionReason] = useState('');
    const [aadhar, setAadhar] = useState('');
    const [pan, setPan] = useState('');
    const [gstNumber, setGstNumber] = useState('');
    const [bank, setBank] = useState(emptyBank);

    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([
            getMyKyc().catch(() => null),
            getDocumentRequirements(vendorType).catch(() => null),
        ]).then(([current, requirements]) => {
            if (!active) return;
            if (current) {
                setKyc(current);
                setStatus(current.status || 'PENDING');
                setRejectionReason(current.rejectionReason || '');
                setAadhar(current.aadhar || '');
                setPan(current.pan || '');
                setGstNumber(current.gstNumber || '');
                if (current.bankDetails) setBank((prev) => ({ ...prev, ...current.bankDetails }));
            }
            const required = requirements?.requiredDocs;
            if (Array.isArray(required) && required.length) setDocs(required);
        }).catch(() => {
            if (active) Alert.alert(t('common.error'), t('vendor.kycLoadFailed'));
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [vendorType, t]);

    const setBankField = (key, value) => setBank((prev) => ({ ...prev, [key]: value }));

    const uploaded = useMemo(() => {
        const map = {};
        docs.forEach((doc) => {
            const field = CODE_TO_FIELD[doc.code];
            if (field && kyc?.[field]) map[doc.code] = kyc[field];
        });
        return map;
    }, [docs, kyc]);

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
            Object.entries(files).forEach(([code, file]) => {
                const field = CODE_TO_FIELD[code];
                if (field) appendKycFile(form, field, file);
            });
            const saved = await submitKyc(form);
            setKyc(saved);
            setStatus(saved?.status || 'PENDING');
            setRejectionReason('');
            setFiles({});
            Alert.alert(t('vendor.kycSubmitted'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message || t('vendor.kycFailed'));
        }
        finally {
            setSaving(false);
        }
    };

    if (loading) return <Loading />;

    const tone = status === 'APPROVED' ? styles.ok : status === 'REJECTED' ? styles.bad : styles.pending;
    const toneText = status === 'APPROVED' ? styles.okText : status === 'REJECTED' ? styles.badText : styles.pendingText;

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Card>
                    <View style={styles.head}>
                        <View style={styles.headCopy}>
                            <Text style={styles.pageTitle}>{t('vendor.kycTitle')}</Text>
                            <Text style={styles.hint}>{t('vendor.kycHint')}</Text>
                        </View>
                        <View style={[styles.badge, tone]}>
                            <Text style={[styles.badgeText, toneText]}>{status}</Text>
                        </View>
                    </View>
                    {rejectionReason ? (
                        <View style={styles.danger}>
                            <Text style={styles.dangerText}>{t('vendor.rejectionReason')}: {rejectionReason}</Text>
                        </View>
                    ) : null}
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
                    {docs.map((doc) => (
                        <KycDropzone
                            key={doc.code}
                            label={doc.label}
                            file={files[doc.code]}
                            existing={uploaded[doc.code]}
                            onChange={(file) => setFiles((prev) => ({ ...prev, [doc.code]: file }))}
                        />
                    ))}
                    <Button title={t('vendor.submitKyc')} onPress={onSubmit} loading={saving} />
                </Card>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    scroll: { paddingBottom: 24 },
    head: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 16 },
    headCopy: { flexGrow: 1, flexShrink: 1, minWidth: 180 },
    pageTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
    hint: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.muted, marginTop: 8, lineHeight: 20 },
    sectionTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.text, marginBottom: 8, marginTop: 8 },
    badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
    badgeText: { fontFamily: FONTS.semibold, fontSize: 12 },
    ok: { backgroundColor: '#ECFDF5' },
    okText: { color: '#047857' },
    pending: { backgroundColor: '#FFFBEB' },
    pendingText: { color: '#92400E' },
    bad: { backgroundColor: '#FFF1F2' },
    badText: { color: '#BE123C' },
    danger: { backgroundColor: '#FFF1F2', borderRadius: 12, padding: 12, marginBottom: 12 },
    dangerText: { fontFamily: FONTS.medium, fontSize: 13, color: '#9F1239', lineHeight: 18 },
    dropWrap: { marginBottom: 14 },
    dropLabel: { fontFamily: FONTS.medium, fontSize: 14, color: '#334155', marginBottom: 8 },
    drop: {
        position: 'relative',
        minHeight: 120,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#CBD5E1',
        borderRadius: RADIUS.input,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 16,
    },
    placeholder: { alignItems: 'center', gap: 6 },
    dropTitle: { fontFamily: FONTS.semibold, fontSize: 14, color: '#1E293B', textAlign: 'center' },
    dropHint: { fontFamily: FONTS.regular, fontSize: 12, color: '#64748B', textAlign: 'center' },
    fileName: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text, textAlign: 'center' },
    uploaded: { fontFamily: FONTS.semibold, fontSize: 13, color: '#059669', textAlign: 'center' },
    clear: { fontFamily: FONTS.semibold, fontSize: 12, color: COLORS.action, marginTop: 6 },
});
