import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout, SlideInRight } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks';
import { setPickupLocation, setDropoffLocation } from '../../../Redux/Slice/orderDraftSlice';
import { useGetSavedAddressesQuery } from '../../../Redux/api/userApi';

const STEPS = ['Locations', 'Vehicle', 'Checkout', 'Payment'];

export default function CreateOrderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const dispatch = useAppDispatch();
    
    // Get locations from Redux
    const draftPickup = useAppSelector((state) => state.orderDraft.pickup);
    const draftDropoff = useAppSelector((state) => state.orderDraft.dropoff);

    const pickup = draftPickup?.address || '';
    const dropoff = draftDropoff?.address || '';

    const [currentStep, setCurrentStep] = useState(0);

    // Fetch saved addresses from API
    const { data: savedAddressesData, isLoading: isLoadingAddresses } = useGetSavedAddressesQuery(undefined);
    const savedAddresses = savedAddressesData?.data ?? [];

    const getAddressIcon = (addressLabel?: string) => {
        const normalized = addressLabel?.toLowerCase() || '';
        if (normalized.includes('home')) return 'home';
        if (normalized.includes('office') || normalized.includes('work') || normalized.includes('job')) return 'briefcase';
        if (normalized.includes('gym') || normalized.includes('fitness') || normalized.includes('workout')) return 'fitness';
        if (normalized.includes('friend') || normalized.includes('love') || normalized.includes('heart')) return 'heart';
        return 'location';
    };

    const handleSelectSavedAddress = (address: string) => {
        Alert.alert(
            "Use Saved Location",
            "Where would you like to set this address?",
            [
                {
                    text: "Set as Pickup",
                    onPress: () => {
                        dispatch(setPickupLocation({
                            address,
                            details: '',
                            personName: '',
                            phone: '',
                            coordinate: null
                        }));
                    }
                },
                {
                    text: "Set as Dropoff",
                    onPress: () => {
                        dispatch(setDropoffLocation({
                            address,
                            details: '',
                            personName: '',
                            phone: '',
                            coordinate: null
                        }));
                    }
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const handleContinue = () => {
        if (!draftPickup?.address) {
            Alert.alert("Pickup Required", "Please select a pickup location.");
            return;
        }
        if (!draftPickup?.personName?.trim() || !draftPickup?.phone?.trim()) {
            Alert.alert(
                "Pickup Contact Required", 
                "Please provide contact person name and phone number for the pickup location.",
                [
                    { text: "Go to Pickup", onPress: () => router.push('/orders/pickup-location') },
                    { text: "Cancel", style: "cancel" }
                ]
            );
            return;
        }
        if (!draftDropoff?.address) {
            Alert.alert("Dropoff Required", "Please select a dropoff location.");
            return;
        }
        if (!draftDropoff?.personName?.trim() || !draftDropoff?.phone?.trim()) {
            Alert.alert(
                "Dropoff Contact Required", 
                "Please provide contact person name and phone number for the dropoff location.",
                [
                    { text: "Go to Dropoff", onPress: () => router.push('/orders/drop-location') },
                    { text: "Cancel", style: "cancel" }
                ]
            );
            return;
        }
        router.push('/orders/vehicle-selection');
    };

    const renderSavedAddresses = () => {
        if (isLoadingAddresses) {
            return <ActivityIndicator size="small" color={Colors.primaryDark} style={{ marginVertical: 20 }} />;
        }

        if (savedAddresses.length === 0) {
            return (
                <TouchableOpacity 
                    style={styles.emptySavedCard}
                    onPress={() => router.push('/account/address-book')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#999" />
                    <Text style={styles.emptySavedText}>Add Saved Address</Text>
                </TouchableOpacity>
            );
        }

        return savedAddresses.map((item: any, index: number) => (
            <TouchableOpacity 
                key={item._id || index} 
                style={styles.savedCard}
                onPress={() => handleSelectSavedAddress(item.addressLine)}
            >
                <View style={styles.savedIconContainer}>
                    <Ionicons name={getAddressIcon(item.label) as any} size={22} color={Colors.primaryDark} />
                </View>
                <Text style={styles.savedName} numberOfLines={1}>{item.label || 'Saved'}</Text>
                <Text style={styles.savedAddress} numberOfLines={1}>{item.addressLine}</Text>
            </TouchableOpacity>
        ));
    };

    const renderStepper = () => (
        <View style={styles.stepperContainer}>
            {STEPS.map((step, index) => (
                <React.Fragment key={index}>
                    <View style={styles.stepItem}>
                        <Animated.View
                            style={[
                                styles.stepCircle,
                                index <= currentStep ? styles.stepActive : styles.stepInactive
                            ]}
                            layout={Layout.springify()}
                        >
                            <Text style={[
                                styles.stepNumber,
                                index <= currentStep && { color: '#000' }
                            ]}>{index + 1}</Text>
                        </Animated.View>
                        <Text style={[
                            styles.stepLabel,
                            index <= currentStep ? styles.stepLabelActive : styles.stepLabelInactive
                        ]}>{step}</Text>
                    </View>
                    {index < STEPS.length - 1 && (
                        <View style={styles.stepLineContainer}>
                            <Animated.View
                                style={[
                                    styles.stepLineFill,
                                    { width: index < currentStep ? '100%' : '0%' }
                                ]}
                            />
                        </View>
                    )}
                </React.Fragment>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.delay(100).duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Order</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <View style={styles.card}>
                {renderStepper()}

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                    <Animated.View entering={FadeInDown.delay(300).duration(600)}>
                        <Text style={styles.sectionTitle}>Delivery location</Text>
                        <Text style={styles.sectionSubtitle}>Choose where to pick up & Drop</Text>

                        {/* Location Inputs */}
                        <View style={styles.locationContainer}>
                            {/* Location Inputs with Custom Icons */}
                            <View style={styles.inputsWrapper}>
                                {/* Pickup Input */}
                                <View style={styles.locationInputCard}>
                                    <View style={styles.locationIconWrapper}>
                                        <View style={styles.pickupIconContainer}>
                                            <Image
                                                source={require('../../../assets/pick.png')}
                                                style={styles.locationIconImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputContent}>
                                        <Text style={styles.inputLabel}>Pickup Location</Text>
                                        <TouchableOpacity
                                            style={styles.inputTouchable}
                                            onPress={() => router.push('/orders/pickup-location')}
                                        >
                                            <Text style={[
                                                styles.inputText,
                                                !pickup && styles.inputPlaceholder
                                            ]}>
                                                {pickup || 'Choose pickup location'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.locationButton}
                                        onPress={() => router.push('/orders/pickup-location')}
                                    >
                                        <Ionicons name="chevron-forward" size={20} color="#999" />
                                    </TouchableOpacity>
                                </View>

                                {/* Connecting Line */}
                                <View style={styles.connectionLine}>
                                    <View style={styles.dashedLine} />
                                </View>

                                {/* Dropoff Input */}
                                <View style={styles.locationInputCard}>
                                    <View style={styles.locationIconWrapper}>
                                        <View style={styles.dropoffIconContainer}>
                                            <Image
                                                source={require('../../../assets/drop.png')}
                                                style={styles.locationIconImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputContent}>
                                        <Text style={styles.inputLabel}>Dropoff Location</Text>
                                        <TouchableOpacity
                                            style={styles.inputTouchable}
                                            onPress={() => router.push('/orders/drop-location')}
                                        >
                                            <Text style={[
                                                styles.inputText,
                                                !dropoff && styles.inputPlaceholder
                                            ]}>
                                                {dropoff || 'Choose dropoff location'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.locationButton}
                                        onPress={() => router.push('/orders/drop-location')}
                                    >
                                        <Ionicons name="chevron-forward" size={20} color="#999" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    <View style={styles.divider} />

                    {/* Saved Addresses */}
                    <Animated.View
                        entering={FadeInDown.delay(500).duration(600)}
                        style={styles.savedAddressesContainer}
                    >
                        <Text style={styles.sectionTitle}>Saved Locations</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                            {renderSavedAddresses()}
                        </ScrollView>
                    </Animated.View>

                    {/* Recent Drops */}
                    <Animated.View
                        entering={FadeInDown.delay(700).duration(600)}
                        style={styles.recentDropsContainer}
                    >
                        <Text style={styles.sectionTitle}>Recent Drops</Text>
                        {[
                            { name: 'Jasani LLC', address: 'Building A, JVC, Dubai' },
                            { name: 'Rashed Al Shamsi Advertising', address: 'Office 305, Bay Square' },
                            { name: 'FitRepublik', address: 'Sports City, Dubai' },
                        ].map((item, index) => (
                            <TouchableOpacity key={index} style={styles.recentDropItem}>
                                <View style={styles.iconContainer}>
                                    <View style={styles.locationPin}>
                                        <View style={styles.locationPinDot} />
                                    </View>
                                </View>
                                <View style={styles.textContainer}>
                                    <Text style={styles.recentDropName}>{item.name}</Text>
                                    <Text style={styles.recentDropAddress}>{item.address}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#E0E0E0" />
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </ScrollView>

                {/* Floating Continue Button */}
                <Animated.View
                    entering={SlideInRight.delay(900)}
                    style={styles.floatingButtonContainer}
                >
                    <TouchableOpacity
                        style={styles.continueButton}
                        activeOpacity={0.8}
                        onPress={handleContinue}
                    >
                        <Text style={styles.continueButtonText}>Continue to Vehicle</Text>
                        <Ionicons name="arrow-forward" size={24} color="#000" />
                    </TouchableOpacity>
                </Animated.View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        overflow: 'hidden',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 32,
    },
    stepItem: {
        alignItems: 'center',
        zIndex: 1,
        width: 60,
    },
    stepCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    stepActive: {
        backgroundColor: Colors.primary,
        borderWidth: 0,
    },
    stepInactive: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#999',
    },
    stepLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: Colors.text,
    },
    stepLabelInactive: {
        color: '#ccc',
    },
    stepLineContainer: {
        flex: 1,
        height: 2, // Thicker line
        backgroundColor: '#F0F0F0',
        marginTop: 15,
        marginHorizontal: -10, // Pull line to connect circles
    },
    stepLineFill: {
        height: '100%',
        backgroundColor: Colors.primary,
    },

    // Form Styling
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#999',
        marginBottom: 24,
    },
    locationContainer: {
        marginBottom: 8,
    },
    inputsWrapper: {
        flex: 1,
    },

    // New Location Input Card Styles
    locationInputCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    locationIconWrapper: {
        marginRight: 12,
    },

    // Pickup Icon Styles
    pickupIconContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Dropoff Icon Styles
    dropoffIconContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },

    locationIconImage: {
        width: '100%',
        height: '100%',
    },

    // Input Content Styles
    inputContent: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    inputTouchable: {
        paddingVertical: 2,
    },
    inputText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    inputPlaceholder: {
        color: '#999',
        fontWeight: '500',
    },
    locationButton: {
        padding: 8,
        marginLeft: 8,
    },

    // Connection Line
    connectionLine: {
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 8,
    },
    dashedLine: {
        width: 2,
        height: '100%',
        backgroundColor: '#E0E0E0',
        marginLeft: 28,
    },
    divider: {
        height: 1,
        backgroundColor: '#F5F5F5',
        marginVertical: 24,
    },

    // Saved Addresses
    savedAddressesContainer: {
        marginBottom: 24,
    },
    hScroll: {
        paddingVertical: 10,
        gap: 12,
    },
    savedCard: {
        width: 100,
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginRight: 4,
    },
    savedIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    savedName: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    savedAddress: {
        fontSize: 10,
        color: '#999',
    },

    // Recent Drops
    recentDropsContainer: {
        marginBottom: 20,
    },
    recentDropItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    iconContainer: {
        marginRight: 16,
    },
    locationPin: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationPinDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#999',
    },
    textContainer: {
        flex: 1,
    },
    recentDropName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    recentDropAddress: {
        fontSize: 13,
        color: '#999',
    },

    // Floating Button
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 40,
        left: 24,
        right: 24,
    },
    continueButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 28,
        gap: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    emptySavedCard: {
        width: 140,
        height: 100,
        backgroundColor: '#F9F9F9',
        borderRadius: 16,
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        marginRight: 4,
    },
    emptySavedText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '600',
        marginTop: 8,
        textAlign: 'center',
    },
});
