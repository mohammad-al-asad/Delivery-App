import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';

export default function NotificationsScreen() {
    const router = useRouter();
    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [promoEnabled, setPromoEnabled] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedSettings = await AsyncStorage.getItem('driver_notification_settings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    if (settings.pushEnabled !== undefined) setPushEnabled(settings.pushEnabled);
                    if (settings.emailEnabled !== undefined) setEmailEnabled(settings.emailEnabled);
                    if (settings.smsEnabled !== undefined) setSmsEnabled(settings.smsEnabled);
                    if (settings.promoEnabled !== undefined) setPromoEnabled(settings.promoEnabled);
                }
            } catch (error) {
                console.error('Failed to load notification settings:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        const saveSettings = async () => {
            try {
                const settings = {
                    pushEnabled,
                    emailEnabled,
                    smsEnabled,
                    promoEnabled
                };
                await AsyncStorage.setItem('driver_notification_settings', JSON.stringify(settings));
            } catch (error) {
                console.error('Failed to save notification settings:', error);
            }
        };
        saveSettings();
    }, [pushEnabled, emailEnabled, smsEnabled, promoEnabled, isLoaded]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>General</Text>

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>Push Notifications</Text>
                            <Text style={styles.rowSubLabel}>Receive alerts about your rides and earnings</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: Colors.primary }}
                            thumbColor={pushEnabled ? '#fff' : '#f4f3f4'}
                            onValueChange={setPushEnabled}
                            value={pushEnabled}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>Email Notifications</Text>
                            <Text style={styles.rowSubLabel}>Receive receipts and weekly summaries</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: Colors.primary }}
                            thumbColor={emailEnabled ? '#fff' : '#f4f3f4'}
                            onValueChange={setEmailEnabled}
                            value={emailEnabled}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>SMS Notifications</Text>
                            <Text style={styles.rowSubLabel}>Receive important updates via SMS</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: Colors.primary }}
                            thumbColor={smsEnabled ? '#fff' : '#f4f3f4'}
                            onValueChange={setSmsEnabled}
                            value={smsEnabled}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Marketing</Text>

                    <View style={styles.row}>
                        <View style={styles.rowText}>
                            <Text style={styles.rowLabel}>Promotional Offers</Text>
                            <Text style={styles.rowSubLabel}>Receive updates about promotions and bonuses</Text>
                        </View>
                        <Switch
                            trackColor={{ false: '#767577', true: Colors.primary }}
                            thumbColor={promoEnabled ? '#fff' : '#f4f3f4'}
                            onValueChange={setPromoEnabled}
                            value={promoEnabled}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    rowText: {
        flex: 1,
        marginRight: 16,
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    rowSubLabel: {
        fontSize: 13,
        color: Colors.textLight,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
});
