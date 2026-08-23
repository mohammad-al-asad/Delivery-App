import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Location } from '../types';

interface DriverMapViewProps {
    driverLocation: Location;
    pickup?: Location;
    dropoff?: Location;
    showRoute?: boolean;
}

// Web fallback component
function WebMapFallback({ driverLocation, pickup, dropoff }: DriverMapViewProps) {
    return (
        <View style={styles.webFallback}>
            <Ionicons name="map" size={48} color={Colors.gray[300]} />
            <Text style={styles.webFallbackText}>Map View</Text>
            <Text style={styles.webFallbackSubtext}>
                (Maps are only available on mobile devices)
            </Text>
            {pickup && (
                <View style={styles.webLocationInfo}>
                    <Ionicons name="location" size={16} color={Colors.primary} />
                    <Text style={styles.webLocationText}>{pickup.address}</Text>
                </View>
            )}
            {dropoff && (
                <View style={styles.webLocationInfo}>
                    <Ionicons name="flag" size={16} color={Colors.error} />
                    <Text style={styles.webLocationText}>{dropoff.address}</Text>
                </View>
            )}
        </View>
    );
}

// Only import MapView on native platforms
let MapView: any;
let Marker: any;
let Polyline: any;
let PROVIDER_GOOGLE: any;

if (Platform.OS !== 'web') {
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
    Polyline = maps.Polyline;
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

export function DriverMapView({ driverLocation, pickup, dropoff, showRoute = false }: DriverMapViewProps) {
    const [region, setRegion] = useState({
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    // Return web fallback for web platform
    if (Platform.OS === 'web') {
        return <WebMapFallback driverLocation={driverLocation} pickup={pickup} dropoff={dropoff} showRoute={showRoute} />;
    }

    // Simple route coordinates (in real app, use Google Directions API)
    const getRouteCoordinates = () => {
        if (!pickup || !dropoff) return [];

        return [
            { latitude: driverLocation.latitude, longitude: driverLocation.longitude },
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: dropoff.latitude, longitude: dropoff.longitude },
        ];
    };

    const handleRecenter = () => {
        setRegion({
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        });
    };

    return (
        <View style={styles.container}>
            <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass
                showsTraffic
            >
                {/* Driver Location Marker */}
                <Marker
                    coordinate={{
                        latitude: driverLocation.latitude,
                        longitude: driverLocation.longitude,
                    }}
                    title="Your Location"
                    description="Driver"
                >
                    <View style={styles.driverMarker}>
                        <Ionicons name="car" size={24} color={Colors.white} />
                    </View>
                </Marker>

                {/* Pickup Location Marker */}
                {pickup && (
                    <Marker
                        coordinate={{
                            latitude: pickup.latitude,
                            longitude: pickup.longitude,
                        }}
                        title="Pickup"
                        description={pickup.address}
                        pinColor={Colors.primary}
                    />
                )}

                {/* Dropoff Location Marker */}
                {dropoff && (
                    <Marker
                        coordinate={{
                            latitude: dropoff.latitude,
                            longitude: dropoff.longitude,
                        }}
                        title="Dropoff"
                        description={dropoff.address}
                        pinColor={Colors.error}
                    />
                )}

                {/* Route Polyline */}
                {showRoute && pickup && dropoff && (
                    <Polyline
                        coordinates={getRouteCoordinates()}
                        strokeColor={Colors.primary}
                        strokeWidth={4}
                    />
                )}
            </MapView>

            {/* Recenter Button */}
            <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter}>
                <Ionicons name="locate" size={24} color={Colors.primary} />
            </TouchableOpacity>

            {/* Distance Info */}
            {pickup && (
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="location" size={16} color={Colors.primary} />
                        <Text style={styles.infoText}>Pickup: {pickup.address}</Text>
                    </View>
                    {dropoff && (
                        <View style={styles.infoRow}>
                            <Ionicons name="flag" size={16} color={Colors.error} />
                            <Text style={styles.infoText}>Dropoff: {dropoff.address}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    webFallback: {
        flex: 1,
        backgroundColor: Colors.gray[100],
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    webFallbackText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginTop: 12,
    },
    webFallbackSubtext: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 4,
        textAlign: 'center',
    },
    webLocationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: Colors.white,
        borderRadius: 8,
    },
    webLocationText: {
        fontSize: 12,
        color: Colors.text,
    },
    driverMarker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    recenterButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    infoCard: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 4,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: Colors.text,
    },
});
