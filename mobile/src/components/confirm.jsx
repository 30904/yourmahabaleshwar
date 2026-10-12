import React, { createContext, useCallback, useContext, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../constants/theme';
import { Button } from './ui';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const [dialog, setDialog] = useState(null);
    const [busy, setBusy] = useState(false);
    const open = useCallback((next) => setDialog(next), []);
    const close = () => {
        if (busy) return;
        setDialog(null);
    };
    const confirm = async () => {
        const run = dialog?.onConfirm;
        const holdMs = dialog?.loadingMs || 0;
        if (!run) {
            setDialog(null);
            return;
        }
        setBusy(true);
        const started = Date.now();
        await new Promise((resolve) => setTimeout(resolve, 50));
        try {
            await run();
        }
        finally {
            const wait = holdMs - (Date.now() - started);
            if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
            setBusy(false);
            setDialog(null);
        }
    };

    return (
        <ConfirmContext.Provider value={open}>
            {children}
            <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={close}>
                <Pressable style={styles.backdrop} onPress={close}>
                    <Pressable style={styles.card} onPress={() => {}}>
                        <Text style={styles.title}>{dialog?.title}</Text>
                        {dialog?.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
                        {busy ? (
                            <View style={styles.loading}>
                                <ActivityIndicator size="large" color={COLORS.danger} />
                                <Text style={styles.loadingText}>{dialog?.loadingText || dialog?.confirmText}</Text>
                            </View>
                        ) : (
                            <View style={styles.actions}>
                                <Button title={dialog?.cancelText} variant="outline" onPress={close} style={styles.action} />
                                <Button
                                    title={dialog?.confirmText}
                                    variant={dialog?.destructive ? 'danger' : 'primary'}
                                    onPress={confirm}
                                    style={styles.action}
                                />
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const open = useContext(ConfirmContext);
    return useCallback((options) => {
        if (Platform.OS !== 'web') {
            Alert.alert(options.title, options.message, [
                { text: options.cancelText, style: 'cancel' },
                {
                    text: options.confirmText,
                    style: options.destructive ? 'destructive' : 'default',
                    onPress: options.onConfirm,
                },
            ]);
            return;
        }
        open?.(options);
    }, [open]);
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.card,
        padding: 20,
    },
    title: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.text,
    },
    message: {
        marginTop: 8,
        fontFamily: FONTS.regular,
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.body,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    action: {
        flex: 1,
        paddingHorizontal: 12,
    },
    loading: {
        marginTop: 20,
        minHeight: 72,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontFamily: FONTS.semibold,
        fontSize: 15,
        color: COLORS.danger,
    },
});
