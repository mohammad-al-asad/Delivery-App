import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';

export default function ChangePasswordScreen() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleChangePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        // Simulate password change
        Alert.alert(
            'Success',
            'Your password has been changed successfully',
            [
                {
                    text: 'OK',
                    onPress: () => router.back()
                }
            ]
        );
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
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <Text style={styles.description}>
                        Create a strong password to keep your account secure
                    </Text>

                    {/* Current Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Current Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter current password"
                                placeholderTextColor="#999"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                secureTextEntry={!showCurrent}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowCurrent(!showCurrent)}
                            >
                                <Ionicons
                                    name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter new password"
                                placeholderTextColor="#999"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNew}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowNew(!showNew)}
                            >
                                <Ionicons
                                    name={showNew ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Confirm New Password</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter new password"
                                placeholderTextColor="#999"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirm}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity
                                style={styles.eyeButton}
                                onPress={() => setShowConfirm(!showConfirm)}
                            >
                                <Ionicons
                                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color="#999"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Password Requirements */}
                    <View style={styles.requirementsCard}>
                        <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={newPassword.length >= 8 ? Colors.primaryDark : '#999'}
                            />
                            <Text style={styles.requirementText}>At least 8 characters</Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={/[A-Z]/.test(newPassword) ? Colors.primaryDark : '#999'}
                            />
                            <Text style={styles.requirementText}>One uppercase letter</Text>
                        </View>
                        <View style={styles.requirement}>
                            <Ionicons
                                name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                                size={16}
                                color={/[0-9]/.test(newPassword) ? Colors.primaryDark : '#999'}
                            />
                            <Text style={styles.requirementText}>One number</Text>
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </Animated.View>
            </ScrollView>

            {/* Save Button */}
            <Animated.View
                entering={FadeInUp.delay(400).duration(600)}
                style={styles.buttonContainer}
            >
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleChangePassword}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveButtonText}>Change Password</Text>
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
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 15,
        color: Colors.text,
    },
    eyeButton: {
        padding: 8,
    },
    requirementsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginTop: 8,
    },
    requirementsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
    },
    requirement: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    requirementText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 8,
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
    saveButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
});
