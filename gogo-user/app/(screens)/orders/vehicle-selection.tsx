import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks';
import { setSelectedVehicle, swapPickupAndDropoff } from '../../../Redux/Slice/orderDraftSlice';
import { useEstimateOrderPriceQuery } from '../../../Redux/api/orderApi';
import { Colors } from '../../../constants/Colors';

const STEPS = ['Locations', 'Vehicle', 'Checkout', 'Payment'];

const VEHICLES = [
    {
        id: 'bike',
        name: 'Bike Delivery',
        weight: '20Kg',
        time: 'Just 8 mins away',
        price: '32.90',
        image: require('../../../assets/vehicles/moto.png'),
        colors: ['#00E5FF', '#2979FF'] as const,
        icon: 'bicycle'
    },
    {
        id: 'car',
        name: 'Car Delivery',
        weight: '1050Kg',
        time: 'Just 7 mins away',
        price: '39.82',
        image: require('../../../assets/vehicles/car.png'),
        colors: ['#00B0FF', '#0091EA'] as const,
        icon: 'car'
    },
    {
        id: 'truck',
        name: 'Truck Delivery',
        weight: '3510Kg',
        time: 'Just 7 mins away',
        price: '59.82',
        image: require('../../../assets/vehicles/truck.png'),
        colors: ['#2962FF', '#0091EA'] as const,
        icon: 'bus'
    }
];

export default function VehicleSelectionScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const currentStep = 1;
    const {
        pickup,
        dropoff,
        stops,
        selectedVehicleId,
        routeDistanceKm,
        routeDurationMin,
    } = useAppSelector((state) => state.orderDraft);

    const { data: bikeEstimate, isFetching: isBikeFetching } = useEstimateOrderPriceQuery({
        distanceKm: routeDistanceKm ?? 0,
        durationMin: routeDurationMin ?? 0,
        vehicleType: 'Bike',
    }, { skip: routeDistanceKm == null });

    const { data: carEstimate, isFetching: isCarFetching } = useEstimateOrderPriceQuery({
        distanceKm: routeDistanceKm ?? 0,
        durationMin: routeDurationMin ?? 0,
        vehicleType: 'Car',
    }, { skip: routeDistanceKm == null });

    const { data: truckEstimate, isFetching: isTruckFetching } = useEstimateOrderPriceQuery({
        distanceKm: routeDistanceKm ?? 0,
        durationMin: routeDurationMin ?? 0,
        vehicleType: 'Truck',
    }, { skip: routeDistanceKm == null });

    const getVehiclePrice = (vehicleId: string) => {
        if (routeDistanceKm == null) return 'Calculating...';
        switch (vehicleId) {
            case 'bike':
                return isBikeFetching ? 'Calculating...' : bikeEstimate?.data?.price ? `${bikeEstimate.data.price.toFixed(2)}` : 'N/A';
            case 'car':
                return isCarFetching ? 'Calculating...' : carEstimate?.data?.price ? `${carEstimate.data.price.toFixed(2)}` : 'N/A';
            case 'truck':
                return isTruckFetching ? 'Calculating...' : truckEstimate?.data?.price ? `${truckEstimate.data.price.toFixed(2)}` : 'N/A';
            default:
                return '—';
        }
    };

    const missingCheckoutFields = [
        !pickup?.coordinate ? 'pickup location' : null,
        !dropoff?.coordinate ? 'dropoff location' : null,
        !selectedVehicleId ? 'vehicle' : null,
        routeDistanceKm == null ? 'route distance' : null,
        routeDurationMin == null ? 'route duration' : null,
    ].filter(Boolean) as string[];
    const canProceedToCheckout = missingCheckoutFields.length === 0;

    const handleProceedToCheckout = () => {
        if (!canProceedToCheckout) {
            Alert.alert(
                'Complete order details',
                `Please complete ${missingCheckoutFields.join(', ')} before checkout.`
            );
            return;
        }

        router.push('/orders/checkout');
    };

    const getContactLine = (location: typeof pickup) => {
        const name = location?.personName?.trim() || 'Contact person';
        const contactPhone = location?.phone?.trim() || 'Phone number';
        return `${name} - ${contactPhone}`;
    };

    const getAddressLine = (address?: string, fallback?: string) =>
        address?.trim() || fallback || 'Location not selected';

    const renderStepper = () => (
        <View style={styles.stepperContainer}>
            {STEPS.map((step, index) => (
                <React.Fragment key={index}>
                    <View style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            index <= currentStep ? styles.stepActive : styles.stepInactive
                        ]}>
                            <Text style={styles.stepNumber}>{index + 1}</Text>
                        </View>
                        <Text style={[
                            styles.stepLabel,
                            index <= currentStep ? styles.stepLabelActive : styles.stepLabelInactive
                        ]}>{step}</Text>
                    </View>
                    {index < STEPS.length - 1 && (
                        <View style={styles.stepLineContainer} />
                    )}
                </React.Fragment>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CREATE ORDER</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.card}>
                {renderStepper()}

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Journey Details Card */}
                    <View style={styles.journeyCard}>
                        <View style={styles.journeyHeader}>
                            <Text style={styles.journeyTitle}>Journey Details</Text>
                            <Text style={styles.journeySubtitle}>From Pickup to Drop off</Text>
                        </View>

                        <View style={styles.journeyContent}>
                            <View style={styles.locationsWrapper}>
                                {/* Pickup */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image source={require('../../../assets/pick.png')} style={{ width: 20, height: 20, marginRight: 12 }} resizeMode="contain" />
                                    <View style={styles.locationItem}>
                                        <Text style={styles.locationPerson}>{getContactLine(pickup)}</Text>
                                        <Text style={styles.locationAddress} numberOfLines={1}>
                                            {getAddressLine(pickup?.address, 'Choose pickup location')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Stops */}
                                {stops.map((stop, index) => (
                                    <View key={stop.id}>
                                        {/* Connector line */}
                                        <View style={{ paddingLeft: 9, height: 16, justifyContent: 'center' }}>
                                            <View style={{ width: 1, height: '100%', borderColor: '#000', borderWidth: 0.5, borderStyle: 'dashed' }} />
                                        </View>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.timelineDot, styles.dotRed, { marginRight: 12 }]}>
                                                <Text style={styles.dotText}>{index + 1}</Text>
                                            </View>
                                            <View style={styles.locationItem}>
                                                <Text style={styles.locationPerson}>Stop {index + 1}</Text>
                                                <Text style={styles.locationAddress} numberOfLines={1}>
                                                    {getAddressLine(stop.address, 'Choose stop location')}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}

                                {/* Connector line */}
                                <View style={{ paddingLeft: 9, height: 16, justifyContent: 'center' }}>
                                    <View style={{ width: 1, height: '100%', borderColor: '#000', borderWidth: 0.5, borderStyle: 'dashed' }} />
                                </View>

                                {/* Dropoff */}
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Image source={require('../../../assets/drop.png')} style={{ width: 20, height: 20, marginRight: 12 }} resizeMode="contain" />
                                    <View style={styles.locationItem}>
                                        <Text style={styles.locationPerson}>{getContactLine(dropoff)}</Text>
                                        <Text style={styles.locationAddress} numberOfLines={1}>
                                            {getAddressLine(dropoff?.address, 'Choose dropoff location')}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.swapButton}
                                onPress={() => dispatch(swapPickupAndDropoff())}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="swap-vertical" size={16} color="#333" />
                            </TouchableOpacity>
                        </View>


                        <View style={styles.journeyActions}>
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/orders/add-stops')}>
                                <Ionicons name="add-circle-outline" size={18} color="#333" />
                                <Text style={styles.actionButtonText}>Add Stop</Text>
                            </TouchableOpacity>
                            <View style={styles.actionDivider} />
                            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/orders/add-stops')}>
                                <MaterialIcons name="edit" size={18} color="#333" />
                                <Text style={styles.actionButtonText}>Edit Location</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Vehicle Selection */}
                    <Text style={styles.sectionTitle}>Choose your rider</Text>

                    <View style={styles.vehicleList}>
                        {VEHICLES.map((vehicle) => (
                            <TouchableOpacity
                                key={vehicle.id}
                                onPress={() => dispatch(setSelectedVehicle(vehicle.id))}
                                activeOpacity={0.9}
                                style={[
                                    styles.vehicleTouch,
                                    selectedVehicleId === vehicle.id
                                        ? styles.vehicleTouchSelected
                                        : styles.vehicleTouchUnselected
                                ]}
                            >
                                <LinearGradient
                                    colors={vehicle.colors as any}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[
                                        styles.vehicleCard,
                                        selectedVehicleId === vehicle.id
                                            ? styles.vehicleCardSelected
                                            : styles.vehicleCardUnselected
                                    ]}
                                >
                                    <View style={styles.vehicleImageContainer}>
                                        <Image source={vehicle.image} style={styles.vehicleImage} resizeMode="contain" />
                                    </View>
                                    <View style={styles.vehicleInfo}>
                                        <Text style={styles.vehicleName}>{vehicle.name}</Text>
                                        <Text style={styles.vehicleDetails}>{vehicle.weight} • {vehicle.time}</Text>
                                    </View>
                                    <View style={styles.vehiclePriceContainer}>
                                        <Text style={styles.currencySymbol}>AED</Text>
                                        <Text style={styles.vehiclePrice}>{getVehiclePrice(vehicle.id)}</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.continueButton,
                            { backgroundColor: canProceedToCheckout ? '#BEFFB6' : '#F0F0F0' },
                        ]}
                        onPress={handleProceedToCheckout}
                    >
                        <Text style={styles.continueButtonText}>Proceed to Checkout</Text>
                    </TouchableOpacity>

                </ScrollView>
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
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        fontStyle: 'italic',
        color: '#2C3E50',
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingHorizontal: 0,
    },
    stepItem: {
        alignItems: 'center',
        zIndex: 1,
        flex: 1,
    },
    stepCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    stepActive: {
        backgroundColor: Colors.primary,
    },
    stepInactive: {
        backgroundColor: '#E0E0E0',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    stepLabel: {
        fontSize: 10,
        color: '#999',
        fontWeight: '500',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#333',
        fontWeight: '700',
    },
    stepLabelInactive: {
        color: '#999',
    },
    stepLineContainer: {
        flex: 1,
        marginHorizontal: 0,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        height: 1,
    },

    // Journey Card
    journeyCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginBottom: 24,
        overflow: 'hidden',
    },
    journeyHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    journeyTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    journeySubtitle: {
        fontSize: 12,
        color: '#999',
    },
    journeyContent: {
        flexDirection: 'row',
        padding: 16,
    },
    timelineContainer: {
        alignItems: 'center',
        marginRight: 12,
    },
    timelineDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: '#fff',
    },
    dotGreen: {
        borderColor: '#00E676', // Bright Green
    },
    dotRed: {
        borderColor: '#FF3D00', // Bright Red
    },
    dotText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#333',
    },
    timelineLine: {
        width: 1,
        height: 24,
        borderLeftWidth: 1,
        borderColor: '#000',
        borderStyle: 'dashed',
        marginVertical: 4,
    },
    locationsWrapper: {
        flex: 1,
        justifyContent: 'space-between',
    },
    locationItem: {
        justifyContent: 'center',
    },
    locationPerson: {
        fontSize: 11,
        color: '#7f8c8d',
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2C3E50',
    },
    swapButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#BEFFB6',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginLeft: 8,
    },
    journeyActions: {
        flexDirection: 'row',
        backgroundColor: '#BEFFB6',
        paddingVertical: 10,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#333',
    },
    actionDivider: {
        width: 1,
        backgroundColor: '#A0E0A0',
        height: '100%',
    },

    // Vehicle Selection
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2C3E50',
        textAlign: 'center',
        marginBottom: 16,
    },
    vehicleList: {
        gap: 16,
        marginBottom: 24,
    },
    vehicleTouch: {
        borderRadius: 20,
    },
    vehicleTouchSelected: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 10,
    },
    vehicleTouchUnselected: {
        opacity: 0.65,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        height: 80,
        borderWidth: 3,
        borderColor: 'transparent',
    },
    vehicleCardSelected: {
        borderColor: '#000000',
    },
    vehicleCardUnselected: {
        borderColor: 'transparent',
    },
    vehicleImageContainer: {
        width: 80,
        height: 60,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    vehicleImage: {
        width: '100%',
        height: '100%',
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    vehicleDetails: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    vehiclePriceContainer: {
        alignItems: 'flex-end',
    },
    currencySymbol: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
    },
    vehiclePrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },

    continueButton: {
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});
