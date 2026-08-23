import { Ionicons as ExpoIonicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { useGetCommonContentQuery, useCreateReportMutation } from '../../../Redux/api/commonApi';
import { useGetDriverProfileQuery } from '../../../Redux/api/driverApi';

export default function ContactUsScreen() {
    const router = useRouter();
    const { data: contentData } = useGetCommonContentQuery({});
    const { data: profileData } = useGetDriverProfileQuery({});
    const [createReport, { isLoading: isSubmitting }] = useCreateReportMutation();

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const contactEmail = contentData?.data?.contactUs?.email || 'support@gogo.ae';
    const contactPhone = contentData?.data?.contactUs?.phone || '+971 50 123 4567';

    const handleSubmit = async () => {
        if (!subject || !message) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        try {
            await createReport({
                title: subject,
                description: message,
                reporter: profileData?.data?._id,
                reporterRole: 'Rider' // Driver is Rider in backend
            }).unwrap();

            Alert.alert('Success', 'Your message has been sent. We will get back to you shortly.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error("Submit report error:", error);
            Alert.alert("Error", error?.data?.message || "Failed to send message. Please try again.");
        }
    };

    const openPhone = () => {
        Linking.openURL(`tel:${contactPhone}`);
    };

    const openEmail = () => {
        Linking.openURL(`mailto:${contactEmail}`);
    };

    const openWhatsApp = () => {
        const numericPhone = contactPhone.replace(/[^0-9]/g, '');
        Linking.openURL(`https://wa.me/${numericPhone}`);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.delay(100).duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ExpoIonicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contact Us</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <Text style={styles.description}>
                        We're here to help! Reach out to us through any of the following channels.
                    </Text>

                    {/* Contact Methods */}
                    <View style={styles.contactMethods}>
                        <TouchableOpacity style={styles.contactCard} onPress={openPhone}>
                            <View style={styles.contactIcon}>
                                <ExpoIonicons name="call" size={24} color={Colors.primaryDark} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Phone</Text>
                                <Text style={styles.contactValue}>{contactPhone}</Text>
                            </View>
                            <ExpoIonicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} onPress={openEmail}>
                            <View style={styles.contactIcon}>
                                <ExpoIonicons name="mail" size={24} color={Colors.primaryDark} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactValue}>{contactEmail}</Text>
                            </View>
                            <ExpoIonicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.contactCard} onPress={openWhatsApp}>
                            <View style={styles.contactIcon}>
                                <ExpoIonicons name="logo-whatsapp" size={24} color={Colors.primaryDark} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactLabel}>WhatsApp</Text>
                                <Text style={styles.contactValue}>Chat with us</Text>
                            </View>
                            <ExpoIonicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>

                    {/* Contact Form */}
                    <Text style={styles.sectionTitle}>Send us a message</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Subject</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="What is this about?"
                            placeholderTextColor="#999"
                            value={subject}
                            onChangeText={setSubject}
                            editable={!isSubmitting}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Tell us more..."
                            placeholderTextColor="#999"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            editable={!isSubmitting}
                        />
                    </View>

                    {/* Office Hours */}
                    <View style={styles.hoursCard}>
                        <View style={styles.hoursIcon}>
                            <ExpoIonicons name="time-outline" size={24} color={Colors.primaryDark} />
                        </View>
                        <View style={styles.hoursInfo}>
                            <Text style={styles.hoursTitle}>Support Hours</Text>
                            <Text style={styles.hoursText}>Monday - Friday: 9:00 AM - 6:00 PM</Text>
                            <Text style={styles.hoursText}>Saturday: 10:00 AM - 4:00 PM</Text>
                            <Text style={styles.hoursText}>Sunday: Closed</Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </Animated.View>
            </ScrollView>

            {/* Submit Button */}
            <Animated.View
                entering={FadeInUp.delay(400).duration(600)}
                style={styles.buttonContainer}
            >
                <TouchableOpacity
                    style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <>
                            <Text style={styles.submitButtonText}>Send Message</Text>
                            <ExpoIonicons name="send" size={20} color="#000" />
                        </>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
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
        borderBottomColor: '#F0F0F0',
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
        paddingHorizontal: 20,
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginTop: 20,
        marginBottom: 24,
        lineHeight: 20,
    },
    contactMethods: {
        marginBottom: 32,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.text,
    },
    textArea: {
        height: 120,
        paddingTop: 14,
    },
    hoursCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    hoursIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    hoursInfo: {
        flex: 1,
    },
    hoursTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    hoursText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
});
