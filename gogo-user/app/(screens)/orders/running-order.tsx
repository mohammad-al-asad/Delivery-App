import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Linking } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import { Colors } from '../../../constants/Colors';
import { useGetOrderByIdQuery, useCancelOrderMutation } from '../../../Redux/api/orderApi';
import CancelOrderModal from '../../../components/CancelOrderModal';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY;

const decodePolyline = (encoded: string): LatLng[] => {
    const coords: LatLng[] = [];
    let index = 0, lat = 0, lng = 0;
    while (index < encoded.length) {
        let shift = 0, result = 0, byte = 0;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lat += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lng += result & 1 ? ~(result >> 1) : result >> 1;
        coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coords;
};

export default function RunningOrderScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
    const [routeDurationText, setRouteDurationText] = useState<string>('');
    const mapRef = useRef<MapView>(null);

    const { data: order, isLoading, isError, refetch } = useGetOrderByIdQuery(id!, {
        skip: !id,
        refetchOnMountOrArgChange: true,
        pollingInterval: 10000,
    });

    const routePoints = useMemo(() => {
        if (!order) return [];
        const points = [];
        if (order.pickup) points.push({ ...order.pickup, type: 'pickup' });
        if (order.stoppages) {
            order.stoppages.forEach((s: any) => points.push({ ...s, type: 'stoppage' }));
        }
        if (order.dropoff) points.push({ ...order.dropoff, type: 'dropoff' });
        return points;
    }, [order]);

    const fallbackDurationText = useMemo(() => {
        const dist = order?.distanceKm || 0;
        if (dist <= 0) return 'Estimated: 15-20 min';
        // Assume average delivery speed of 30 km/h (2 mins per km)
        const durMins = Math.ceil(dist * 2);
        const minTime = Math.max(5, Math.round(durMins * 0.9));
        const maxTime = Math.max(10, Math.round(durMins * 1.2));
        return `Estimated: ${minTime}-${maxTime} min`;
    }, [order?.distanceKm]);

    useEffect(() => {
        if (routePoints.length < 2) return;

        const fetchRoute = async () => {
            try {
                const origin = `${routePoints[0].latitude},${routePoints[0].longitude}`;
                const destination = `${routePoints[routePoints.length - 1].latitude},${routePoints[routePoints.length - 1].longitude}`;
                const waypoints = routePoints.slice(1, -1)
                    .map(p => `${p.latitude},${p.longitude}`)
                    .join('|');

                const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&key=${GOOGLE_API_KEY}`;
                
                const response = await fetch(url);
                const result = await response.json();

                if (result.routes?.[0]?.overview_polyline?.points) {
                    const decoded = decodePolyline(result.routes[0].overview_polyline.points);
                    setRouteCoords(decoded);

                    // Extract and set real-time duration
                    let totalDurationSeconds = 0;
                    if (result.routes[0].legs) {
                        result.routes[0].legs.forEach((leg: any) => {
                            totalDurationSeconds += leg.duration?.value || 0;
                        });
                    }
                    if (totalDurationSeconds > 0) {
                        const durMins = Math.round(totalDurationSeconds / 60);
                        const minTime = Math.max(2, Math.round(durMins * 0.9));
                        const maxTime = Math.max(5, Math.round(durMins * 1.15));
                        setRouteDurationText(`Estimated: ${minTime}-${maxTime} min`);
                    }
                    
                    // Fit map to markers
                    setTimeout(() => {
                        mapRef.current?.fitToCoordinates(decoded, {
                            edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
                            animated: true,
                        });
                    }, 500);
                }
            } catch (error) {
                console.error("Route fetch error:", error);
            }
        };

        fetchRoute();
    }, [routePoints]);

    const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

    const handleCancelOrder = () => {
        setShowCancelModal(true);
    };

    const confirmCancel = async (reason: string) => {
        try {
            await cancelOrder({ id: id!, reason }).unwrap();
            setShowCancelModal(false);
            Alert.alert("Success", "Order cancelled successfully");
            router.replace('/(tab)/orders');
        } catch (error: any) {
            Alert.alert("Error", error?.data?.message || "Failed to cancel order");
        }
    };

    const handleCall = () => {
        const phone = order?.rider?.phoneNumber || order?.driver?.phoneNumber;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        } else {
            Alert.alert("Error", "Phone number not available");
        }
    };

    const handleWhatsApp = () => {
        const phone = order?.rider?.phoneNumber || order?.driver?.phoneNumber;
        if (phone) {
            const formattedPhone = phone.replace(/\D/g, '');
            Linking.openURL(`https://wa.me/${formattedPhone}`).catch(() => {
                Alert.alert("Error", "Failed to open WhatsApp. Please make sure WhatsApp is installed.");
            });
        } else {
            Alert.alert("Error", "WhatsApp number not available");
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading order status...</Text>
            </View>
        );
    }

    if (isError || !order) {
        return (
            <View style={styles.centered}>
                <Ionicons name="alert-circle" size={48} color={Colors.warning} />
                <Text style={styles.errorText}>Something went wrong</Text>
                <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Pending': return { label: 'Order Placed', highlight: 'Processing', color: '#F59E0B' };
            case 'Accepted': return { label: 'Driver Assigned', highlight: 'On Time', color: '#10B981' };
            case 'ArrivedPickup': return { label: 'Arrived at Pickup', highlight: 'Arrived', color: '#10B981' };
            case 'InProgress': return { label: 'In Transit', highlight: 'On the Way', color: '#3B82F6' };
            case 'Completed': return { label: 'Delivered', highlight: 'Finished', color: '#10B981' };
            default: return { label: status, highlight: 'Updating...', color: '#6B7280' };
        }
    };

    const statusInfo = getStatusInfo(order.status);
    const driver = order.rider || order.driver;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Real Map Section */}
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: routePoints[0]?.latitude || 0,
                        longitude: routePoints[0]?.longitude || 0,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {routePoints.map((point, index) => (
                        <Marker
                            key={index}
                            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                            title={point.label || point.type}
                            pinColor={point.type === 'pickup' ? '#10B981' : point.type === 'dropoff' ? '#EF4444' : '#8B5CF6'}
                        />
                    ))}

                    {routeCoords.length > 0 && (
                        <Polyline
                            coordinates={routeCoords}
                            strokeColor={Colors.primary}
                            strokeWidth={4}
                        />
                    )}
                </MapView>
            </View>

            {/* Header - Close Button */}
            <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
            </Animated.View>

            {/* Bottom Content Layer */}
            <View style={styles.bottomContainer}>
                <Animated.View
                    entering={FadeInDown.delay(300).springify().damping(15)}
                    style={styles.cardContainer}
                >
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

                        {/* Arrival Estimate Card */}
                        <LinearGradient
                            colors={['#F0FDF4', '#DCFCE7']} // Light green gradient
                            style={[styles.arrivalCard, { borderColor: statusInfo.color + '40' }]}
                        >
                            <View style={styles.arrivalHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.arrivalLabel}>{statusInfo.label}</Text>
                                    <Text style={styles.arrivalTime}>
                                        {order.status === 'InProgress' ? 'Arriving Soon' : (routeDurationText || fallbackDurationText)}
                                    </Text>
                                    <View style={styles.statusRow}>
                                        <Text style={[styles.statusHighlight, { color: statusInfo.color }]}>{statusInfo.highlight}</Text>
                                        <Text style={styles.statusText}> • Track your driver</Text>
                                    </View>
                                </View>
                                <Image
                                    source={order.vehicleType === 'Bike' ? require('../../../assets/vehicles/moto.png') : require('../../../assets/vehicles/moto.png')}
                                    style={styles.vehicleImage}
                                    resizeMode="contain"
                                />
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.tipContainer}>
                                <View style={styles.tipHeader}>
                                    <Ionicons name="bulb" size={16} color="#F59E0B" />
                                    <Text style={styles.tipLabel}> Did you know?</Text>
                                </View>
                                <Text style={styles.tipText}>"We optimise routes in real time to save minutes."</Text>
                            </View>
                        </LinearGradient>

                        {/* Driver Info Card */}
                        {driver ? (
                            <View style={styles.driverCard}>
                                <View style={styles.driverInfo}>
                                    <View style={styles.avatarContainer}>
                                        <Image
                                            source={{ uri: driver.profileImage || 'https://i.pravatar.cc/150?u=driver' }}
                                            style={styles.avatar}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.driverName}>
                                            {driver.firstName || driver.lastName
                                                ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
                                                : driver.name || 'Your Driver'}
                                        </Text>
                                        <Text style={styles.driverRole}>Delivery Partner • {driver.rating || '5.0'} ★</Text>
                                    </View>
                                </View>
                                <View style={styles.communicationActions}>
                                    <TouchableOpacity onPress={handleWhatsApp} style={styles.actionButton}>
                                        <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleCall} style={[styles.actionButton, { marginLeft: 12 }]}>
                                        <Ionicons name="call" size={24} color="#00C853" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.driverCard}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                                <Text style={[styles.driverName, { marginLeft: 12 }]}>Finding a driver for you...</Text>
                            </View>
                        )}

                        {/* Order Summary */}
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Order Details</Text>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Total Distance</Text>
                                <Text style={styles.summaryValue}>{order.distanceKm?.toFixed(1) || '—'} km</Text>
                            </View>
                            <View style={[styles.summaryRow, { marginTop: 12 }]}>
                                <Text style={styles.summaryLabel}>Vehicle Type</Text>
                                <Text style={styles.summaryValue}>{order.vehicleType || 'Any'}</Text>
                            </View>
                            <View style={[styles.summaryRow, { marginTop: 12 }]}>
                                <Text style={styles.summaryLabel}>Payment</Text>
                                <Text style={styles.summaryValue}>{order.paymentMethod || 'Card'}</Text>
                            </View>
                        </View>

                    </ScrollView>
                </Animated.View>

                {/* Cancel Order Button */}
                {order.status === 'Pending' && (
                    <View style={styles.footer}>
                        <TouchableOpacity onPress={handleCancelOrder} style={styles.cancelButton} disabled={isCancelling}>
                            <Ionicons name="close" size={20} color="#FF3D00" />
                            <Text style={styles.cancelButtonText}>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <CancelOrderModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancel}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    mapContainer: {
        width: '100%',
        height: '45%',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    bottomContainer: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        marginTop: -30, // Overlap the map
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
    },
    cardContainer: {
        flex: 1,
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    arrivalCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    arrivalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    arrivalLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    arrivalTime: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusHighlight: {
        color: '#16A34A',
        fontWeight: '700',
        fontSize: 14,
    },
    statusText: {
        color: '#4B5563',
        fontSize: 14,
    },
    vehicleImage: {
        width: 80,
        height: 60,
        marginTop: -10,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
        marginVertical: 16,
    },
    tipContainer: {
        flexDirection: 'column',
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    tipLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    tipText: {
        fontSize: 13,
        color: '#1F2937',
        fontStyle: 'italic',
        lineHeight: 18,
        textAlign: 'center',
        fontWeight: '500',
    },
    driverCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    driverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        marginRight: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#BEFFB6',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    driverRole: {
        fontSize: 12,
        color: '#6B7280',
    },
    communicationActions: {
        flexDirection: 'row',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    summaryCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    footer: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    cancelButtonText: {
        color: '#FF3D00',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 15,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 16,
    },
    retryBtn: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: '700',
    },
});
