import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { useGetDriverProfileQuery, useUpdateDriverProfileMutation } from '../../../Redux/api/driverApi';

const VEHICLE_TYPES = [
    { label: 'Bike', icon: 'bicycle-outline' },
    { label: 'Car', icon: 'car-outline' },
    { label: 'Truck', icon: 'bus-outline' },
] as const;

export default function VehicleInfoScreen() {
    const router = useRouter();
    const { data: profileData } = useGetDriverProfileQuery({});
    const [updateProfile, { isLoading: isUpdating }] = useUpdateDriverProfileMutation();
    
    const user = profileData?.data;
    const [vehicleType, setVehicleType] = useState(user?.vehicle?.type || 'Car');
    const [make, setMake] = useState(user?.vehicle?.make || '');
    const [model, setModel] = useState(user?.vehicle?.model || '');
    const [year, setYear] = useState(user?.vehicle?.year || '');
    const [plateNumber, setPlateNumber] = useState(user?.vehicle?.plateNumber || '');
    const [color, setColor] = useState(user?.vehicle?.color || '');

    useEffect(() => {
        if (user?.vehicle) {
            setVehicleType(user.vehicle.type || 'Car');
            setMake(user.vehicle.make || '');
            setModel(user.vehicle.model || '');
            setYear(user.vehicle.year || '');
            setPlateNumber(user.vehicle.plateNumber || '');
            setColor(user.vehicle.color || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!VEHICLE_TYPES.some((vehicle) => vehicle.label === vehicleType)) {
            Alert.alert('Invalid vehicle', 'Please select Bike, Car, or Truck.');
            return;
        }

        if (!plateNumber.trim()) {
            Alert.alert('Missing plate number', 'Please enter your vehicle plate number.');
            return;
        }

        try {
            await updateProfile({
                vehicle: {
                    type: vehicleType,
                    make,
                    model,
                    year,
                    plateNumber,
                    color
                }
            }).unwrap();

            Alert.alert(
                'Success',
                'Vehicle information updated successfully',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error("Update vehicle error:", error);
            Alert.alert("Error", error?.data?.message || "Failed to update vehicle information");
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
                <Text style={styles.headerTitle}>Vehicle Information</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200)}>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Type</Text>
                        <View style={styles.vehicleTypeRow}>
                            {VEHICLE_TYPES.map((vehicle) => {
                                const selected = vehicleType === vehicle.label;
                                return (
                                    <TouchableOpacity
                                        key={vehicle.label}
                                        style={[
                                            styles.vehicleTypeButton,
                                            selected && styles.vehicleTypeButtonSelected,
                                        ]}
                                        onPress={() => setVehicleType(vehicle.label)}
                                    >
                                        <Ionicons
                                            name={vehicle.icon as any}
                                            size={20}
                                            color={selected ? Colors.secondary : Colors.textLight}
                                        />
                                        <Text
                                            style={[
                                                styles.vehicleTypeText,
                                                selected && styles.vehicleTypeTextSelected,
                                            ]}
                                        >
                                            {vehicle.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>Make</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={make}
                                    onChangeText={setMake}
                                    placeholder="e.g. Toyota"
                                />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>Model</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={model}
                                    onChangeText={setModel}
                                    placeholder="e.g. Camry"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>Year</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={year}
                                    onChangeText={setYear}
                                    placeholder="e.g. 2022"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>Color</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={color}
                                    onChangeText={setColor}
                                    placeholder="e.g. White"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Plate Number</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="card-outline" size={20} color={Colors.textLight} />
                            <TextInput
                                style={styles.input}
                                value={plateNumber}
                                onChangeText={setPlateNumber}
                                placeholder="e.g. DXB A 12345"
                            />
                        </View>
                    </View>

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
                        <Text style={styles.saveButtonText}>Save Changes</Text>
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
        borderColor: '#EEE',
        paddingHorizontal: 16,
        height: 52,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.text,
        marginLeft: 8,
    },
    row: {
        flexDirection: 'row',
    },
    vehicleTypeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    vehicleTypeButton: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    vehicleTypeButtonSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    vehicleTypeText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textLight,
    },
    vehicleTypeTextSelected: {
        color: Colors.secondary,
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
