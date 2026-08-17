import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { submitKyc } from '../../api/endpoints';
import { Button, Card, Field, Muted, Screen, Title } from '../../components/ui';
export default function VendorKycScreen() {
    const { t } = useTranslation();
    const [aadhar, setAadhar] = useState('');
    const [pan, setPan] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [loading, setLoading] = useState(false);
    const onSubmit = async () => {
        setLoading(true);
        try {
            const form = new FormData();
            form.append('aadhar', aadhar);
            form.append('pan', pan);
            form.append('bankDetails', JSON.stringify({ accountHolder, accountNumber, ifsc }));
            await submitKyc(form);
            Alert.alert('OK', t('vendor.submitKyc'));
        }
        catch (e) {
            Alert.alert(t('common.error'), e.response?.data?.message || e.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (<Screen>
      <ScrollView>
        <Title>{t('nav.kyc')}</Title>
        <Muted>{t('vendor.kycHint')}</Muted>
        <Card>
          <Field label="Aadhaar" value={aadhar} onChangeText={setAadhar} keyboardType="numeric"/>
          <Field label="PAN" value={pan} onChangeText={setPan}/>
          <Field label="Account holder" value={accountHolder} onChangeText={setAccountHolder}/>
          <Field label="Account number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric"/>
          <Field label="IFSC" value={ifsc} onChangeText={setIfsc}/>
          <Muted>Document photo upload: use web KYC or add expo-image-picker in next iteration.</Muted>
          <Button title={t('vendor.submitKyc')} onPress={onSubmit} loading={loading}/>
        </Card>
      </ScrollView>
    </Screen>);
}
