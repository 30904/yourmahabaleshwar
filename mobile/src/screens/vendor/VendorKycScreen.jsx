import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getMyKyc, submitKyc } from '../../api/endpoints';
import { Button, Card, Field, Loading, Muted, Screen, Title } from '../../components/ui';
import { COLORS } from '../../constants/theme';
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
    const statusColor = status === 'APPROVED' ? COLORS.success : status === 'REJECTED' ? COLORS.danger : COLORS.accent;

    return (<Screen>
      <ScrollView>
        <Title>{t('vendor.kycTitle')}</Title>
        <Text style={{ fontWeight: '700', color: statusColor, marginBottom: 8 }}>{status}</Text>
        <Muted>{t('vendor.kycHint')}</Muted>
        {rejectionReason ? <Muted>{t('vendor.rejectionReason')}: {rejectionReason}</Muted> : null}
        <Card>
          <Field label={t('vendor.aadhaar')} value={aadhar} onChangeText={setAadhar} keyboardType="numeric"/>
          <Field label={t('vendor.pan')} value={pan} onChangeText={(value) => setPan(value.toUpperCase())} autoCapitalize="characters"/>
          <Field label={t('vendor.gst')} value={gstNumber} onChangeText={(value) => setGstNumber(value.toUpperCase())} autoCapitalize="characters"/>
          <Muted>{t('vendor.bankDetails')}</Muted>
          <Field label={t('vendor.accountHolder')} value={bank.accountHolder} onChangeText={(value) => setBankField('accountHolder', value)} autoCapitalize="words"/>
          <Field label={t('vendor.accountNumber')} value={bank.accountNumber} onChangeText={(value) => setBankField('accountNumber', value)} keyboardType="numeric"/>
          <Field label={t('vendor.ifsc')} value={bank.ifsc} onChangeText={(value) => setBankField('ifsc', value.toUpperCase())} autoCapitalize="characters"/>
          <Field label={t('vendor.bankName')} value={bank.bankName} onChangeText={(value) => setBankField('bankName', value)} autoCapitalize="words"/>
          <Field label={t('vendor.branch')} value={bank.branch} onChangeText={(value) => setBankField('branch', value)} autoCapitalize="words"/>
          <Field label={t('vendor.upi')} value={bank.upiId} onChangeText={(value) => setBankField('upiId', value)} autoCapitalize="none"/>
          <Button title={t('vendor.submitKyc')} onPress={onSubmit} loading={saving} disabled={approved}/>
        </Card>
      </ScrollView>
    </Screen>);
}
