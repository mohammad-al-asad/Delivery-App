import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { FileUpload } from '../../../components/FileUpload';
import { Colors } from '../../../constants/Colors';
import { useGetDriverProfileQuery, useUpdateDriverDocumentsMutation } from '../../../Redux/api/driverApi';

export default function DocumentsScreen() {
    const router = useRouter();
    const { data: profileData } = useGetDriverProfileQuery({});
    const [updateDocuments, { isLoading: isUpdating }] = useUpdateDriverDocumentsMutation();
    
    const user = profileData?.data;
    const [emiratesId, setEmiratesId] = useState<string | undefined>(undefined);
    const [drivingLicense, setDrivingLicense] = useState<string | undefined>(undefined);
    const [vehicleRegistration, setVehicleRegistration] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (user) {
            setEmiratesId(user.emaratesId);
            setDrivingLicense(user.drivingLicense);
            setVehicleRegistration(user.vehicleRegistration);
        }
    }, [user]);

    const handleSave = async () => {
        const formData = new FormData();
        
        const addFile = (uri: string, field: string) => {
            if (uri && uri.startsWith('file://')) {
                const filename = uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                formData.append(field, {
                    uri,
                    name: filename,
                    type,
                } as any);
            }
        };

        if (emiratesId) addFile(emiratesId, 'emaratesId');
        if (drivingLicense) addFile(drivingLicense, 'drivingLicense');
        if (vehicleRegistration) addFile(vehicleRegistration, 'vehicleRegistration');

        // If no new files were selected, just go back
        if (Array.from((formData as any).entries()).length === 0) {
            router.back();
            return;
        }

        try {
            await updateDocuments(formData).unwrap();
            Alert.alert(
                'Success',
                'Documents uploaded successfully',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error("Document upload error:", error);
            Alert.alert("Error", error?.data?.message || "Failed to upload documents");
        }
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Documents</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200)}>
                    <Text style={styles.helperText}>
                        Please upload clear photos of your original documents.
                    </Text>

                    <FileUpload
                        label="Emirates ID"
                        onImageSelected={(uri) => setEmiratesId(uri)}
                        imageUri={emiratesId}
                    />

                    <FileUpload
                        label="Driving License"
                        onImageSelected={(uri) => setDrivingLicense(uri)}
                        imageUri={drivingLicense}
                    />

                    <FileUpload
                        label="Vehicle Registration (Mulkiya)"
                        onImageSelected={(uri) => setVehicleRegistration(uri)}
                        imageUri={vehicleRegistration}
                    />

                </Animated.View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.saveButton, isUpdating && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={isUpdating}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save Documents</Text>
                    )}
                </TouchableOpacity>
            </View>
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
    helperText: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 24,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    saveButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
