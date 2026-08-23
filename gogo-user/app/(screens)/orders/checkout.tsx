import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { useAppSelector } from '../../../Redux/hooks';
import { useCreateOrderMutation, useEstimateOrderPriceQuery } from '../../../Redux/api/orderApi';
import { Colors } from '../../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = ['Locations', 'Vehicle', 'Checkout', 'Payment'];
const VEHICLES = {
    bike: {
        name: 'Bike Delivery',
        vehicleType: 'Bike' as const,
        image: require('../../../assets/vehicles/moto.png'),
    },
    car: {
        name: 'Car Delivery',
        vehicleType: 'Car' as const,
        image: require('../../../assets/vehicles/car.png'),
    },
    truck: {
        name: 'Truck Delivery',
        vehicleType: 'Truck' as const,
        image: require('../../../assets/vehicles/truck.png'),
    },
};

export default function CheckoutScreen() {
    const router = useRouter();
    const currentStep = 2;
    const {
        pickup,
        dropoff,
        stops,
        selectedVehicleId,
        routeDistanceKm,
        routeDurationMin,
    } = useAppSelector((state) => state.orderDraft);
    const selectedVehicle = selectedVehicleId
        ? VEHICLES[selectedVehicleId as keyof typeof VEHICLES]
        : undefined;
    const selectedVehicleDisplay = selectedVehicle || VEHICLES.car;
    const missingCheckoutFields = [
        !pickup?.coordinate ? 'pickup location' : null,
        !dropoff?.coordinate ? 'dropoff location' : null,
        !selectedVehicleId ? 'vehicle' : null,
        routeDistanceKm == null ? 'route distance' : null,
        routeDurationMin == null ? 'route duration' : null,
    ].filter(Boolean) as string[];
    const canCheckout = missingCheckoutFields.length === 0 && !!selectedVehicle;
    const { data: estimateData, isError: isEstimateError, isFetching: isEstimateFetching } = useEstimateOrderPriceQuery({
        distanceKm: routeDistanceKm ?? 0,
        durationMin: routeDurationMin ?? 0,
        vehicleType: selectedVehicle?.vehicleType ?? 'Car',
    }, { skip: !canCheckout });
    const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();

    const handleProceedToPayment = async () => {
        if (!canCheckout || !pickup?.coordinate || !dropoff?.coordinate || !selectedVehicle) {
            Alert.alert(
                'Complete order details',
                `Please complete ${missingCheckoutFields.join(', ')} before payment.`
            );
            return;
        }

        if (!estimate) {
            Alert.alert('Error', 'Price estimate not available');
            return;
        }

        const orderPayload = {
            pickup: {
                latitude: pickup.coordinate.latitude,
                longitude: pickup.coordinate.longitude,
                addressLine: pickup?.address,
                label: pickup?.details || pickup?.personName,
            },
            dropoff: {
                latitude: dropoff.coordinate.latitude,
                longitude: dropoff.coordinate.longitude,
                addressLine: dropoff?.address,
                label: dropoff?.details || dropoff?.personName,
            },
            stoppages: stops.filter((stop) => stop.coordinate).map((stop) => ({
                latitude: stop.coordinate!.latitude,
                longitude: stop.coordinate!.longitude,
                addressLine: stop.address,
                label: stop.address,
            })),
            price: estimate.price,
            vehicleType: selectedVehicle.vehicleType,
            distanceKm: routeDistanceKm,
        };

        router.push({
            pathname: '/orders/payment',
            params: { 
                orderPayload: JSON.stringify(orderPayload),
                amount: estimate.price.toString()
            }
        });
    };

    const estimate = estimateData?.data;

    React.useEffect(() => {
        if (estimate) {
            console.log("\n====== PRICE CALCULATION LOG ======");
            console.log(`Route Segment Details:`);
            console.log(`  - Pickup Address: ${pickup?.address || 'N/A'}`);
            stops.forEach((stop, i) => {
                console.log(`  - Stop ${i + 1} Address: ${stop.address || 'N/A'}`);
            });
            console.log(`  - Dropoff Address: ${dropoff?.address || 'N/A'}`);
            console.log(`-----------------------------------`);
            console.log(`Vehicle Selection: ${selectedVehicle?.name || 'N/A'} (${estimate.vehicleType})`);
            console.log(`Total Distance: ${estimate.distanceKm} km`);
            console.log(`Total Duration: ${estimate.durationMin} mins`);
            console.log(`-----------------------------------`);
            console.log(`Formula Logic:`);
            console.log(`  Price = Base Fee + (Distance * Rate)`);
            console.log(`  Price = ${estimate.baseCharge ?? 'N/A'} AED + (${estimate.distanceKm} km * ${estimate.ratePerKm ?? 'N/A'} AED/km)`);
            console.log(`  Calculated Price: ${estimate.price} ${estimate.currency}`);
            console.log("===================================\n");
        }
    }, [estimate, pickup?.address, dropoff?.address, stops, selectedVehicle]);
    const formattedPrice = estimate
        ? `${estimate.currency} ${estimate.price.toFixed(2)}`
        : !canCheckout
            ? 'Complete details'
        : isEstimateError
            ? 'Price unavailable'
            : 'Calculating...';
    const routeDurationText = routeDurationMin
        ? `Just ${routeDurationMin} mins away`
        : 'Time unavailable';

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
        <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <Animated.View 
            entering={FadeInUp.delay(100).duration(600)} 
            style={styles.header}
        >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Checkout</Text>
            <View style={{ width: 24 }} />
        </Animated.View>

            <View style={styles.card}>
                {renderStepper()}

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                    {/* Order Summary */}
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        {/* Vehicle Info */}
                        <View style={styles.vehicleRow}>
                            <Image source={selectedVehicleDisplay.image} style={styles.vehicleImage} resizeMode="contain" />
                            <View style={styles.vehicleInfo}>
                                <Text style={styles.vehicleName}>
                                    {selectedVehicle?.name || 'Select a vehicle'}
                                </Text>
                                <Text style={styles.vehicleDetails}>
                                    {isEstimateFetching ? 'Calculating price...' : routeDurationText}
                                </Text>
                            </View>
                            <Text style={styles.priceText}>{formattedPrice}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Route Info */}
                        <View style={styles.routeRow}>
                            <View style={styles.routePoint}>
                                <View style={[styles.dot, styles.dotGreen]} />
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {getAddressLine(pickup?.address, 'Choose pickup location')}
                                </Text>
                            </View>
                            {stops.map((stop, index) => (
                                <React.Fragment key={stop.id}>
                                    <View style={styles.routeLine} />
                                    <View style={styles.routePoint}>
                                        <View style={[styles.dot, styles.dotOrange]} />
                                        <Text style={styles.routeText} numberOfLines={1}>
                                            {getAddressLine(stop.address, `Stop ${index + 1}`)}
                                        </Text>
                                    </View>
                                </React.Fragment>
                            ))}
                            <View style={styles.routeLine} />
                            <View style={styles.routePoint}>
                                <View style={[styles.dot, styles.dotRed]} />
                                <Text style={styles.routeText} numberOfLines={1}>
                                    {getAddressLine(dropoff?.address, 'Choose dropoff location')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Total */}
                    <View style={styles.totalContainer}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalValue}>{formattedPrice}</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.payButton,
                            { backgroundColor: canCheckout && estimate && !isCreatingOrder ? '#BEFFB6' : '#F0F0F0' },
                        ]}
                        onPress={handleProceedToPayment}
                        disabled={!canCheckout || !estimate || isCreatingOrder}
                    >
                        {isCreatingOrder ? (
                            <ActivityIndicator color="#333" />
                        ) : (
                            <Text style={styles.payButtonText}>CONTINUE TO PAYMENT</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#2C3E50',
        marginBottom: 12,
        marginTop: 8,
    },

    // Summary Card
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 16,
        marginBottom: 24,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleImage: {
        width: 60,
        height: 40,
        marginRight: 12,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
    },
    vehicleDetails: {
        fontSize: 12,
        color: '#7f8c8d',
    },
    priceText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    routeRow: {
        gap: 8,
    },
    routePoint: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    dotGreen: {
        backgroundColor: '#00E676',
    },
    dotRed: {
        backgroundColor: '#FF3D00',
    },
    dotOrange: {
        backgroundColor: '#FF9100',
    },
    routeText: {
        fontSize: 12,
        color: '#666',
        flex: 1,
    },
    routeLine: {
        width: 1,
        height: 10,
        backgroundColor: '#DDD',
        marginLeft: 3.5,
    },

    // Total
    totalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    totalLabel: {
        fontSize: 16,
        color: '#666',
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#333',
    },

    payButton: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    payButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});
