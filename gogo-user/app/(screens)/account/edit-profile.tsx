import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useUpdateMyProfileMutation } from '../../../Redux/api/userApi';
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks';
import { updateUser } from '../../../Redux/Slice/authSlice';
import { Colors } from '../../../constants/Colors';

export default function EditProfileScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const [updateMyProfile, { isLoading }] = useUpdateMyProfileMutation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [profileImage, setProfileImage] = useState<string | undefined>();
    const avatarInitials = [firstName, lastName]
        .filter(Boolean)
        .map((name) => name.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';

    useEffect(() => {
        if (!user) {
            return;
        }

        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setPhone(user.phoneNumber || '');
        setCompanyName(user.companyName || '');
        setProfileImage(user.profileImage);
    }, [user]);

    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert('Permission needed', 'Please allow photo access to upload a profile image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!firstName || !lastName || !email || !phone) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('email', email);
        formData.append('phoneNumber', phone);
        if (companyName) {
            formData.append('companyName', companyName);
        }

        if (profileImage && profileImage !== user?.profileImage) {
            const fileName = profileImage.split('/').pop() || 'profile-image.jpg';
            const extension = fileName.split('.').pop() || 'jpg';
            formData.append('profileImage', {
                uri: profileImage,
                name: fileName,
                type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
            } as any);
        }

        try {
            const response = await updateMyProfile(formData).unwrap();
            dispatch(updateUser(response.data));
            Alert.alert('Success', 'Your profile has been updated successfully', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Could not update profile');
        }
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
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>{avatarInitials}</Text>
                            )}
                        </View>
                        <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
                            <Ionicons name="camera" size={16} color={Colors.primaryDark} />
                            <Text style={styles.changePhotoText}>Change Photo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>First Name *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your first name"
                                placeholderTextColor="#999"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Last Name *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your last name"
                                placeholderTextColor="#999"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor="#999"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your phone"
                                placeholderTextColor="#999"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Company Name</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="business-outline" size={20} color="#999" />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your company name"
                                placeholderTextColor="#999"
                                value={companyName}
                                onChangeText={setCompanyName}
                            />
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
                    onPress={handleSave}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
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
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: '#000',
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    changePhotoText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primaryDark,
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
        height: 52,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: Colors.text,
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    preferenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    preferenceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    preferenceText: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.text,
    },
    toggle: {
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#000',
        alignSelf: 'flex-end',
    },
    toggleInactive: {
        backgroundColor: '#E0E0E0',
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
