import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from 'react-native-maps';
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks';
import { DraftStop, setDraftStops, setRouteEstimate } from '../../../Redux/Slice/orderDraftSlice';
import { Colors } from '../../../constants/Colors';

const STEPS = ['Locations', 'Vehicle', 'Checkout', 'Payment'];
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY;
const DEFAULT_COORDINATE = {
    latitude: 25.2048,
    longitude: 55.2708,
};

type Stop = DraftStop;

type GooglePlaceSuggestion = {
    place_id: string;
    structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
    };
    description: string;
};

type LocationSuggestion = {
    id: string;
    name: string;
    address: string;
    description: string;
};

type GoogleDirectionsRoute = {
    overview_polyline?: {
        points?: string;
    };
    legs?: {
        distance?: {
            value?: number;
        };
        duration?: {
            value?: number;
        };
    }[];
};

const formatCoordinate = (coordinate: LatLng) =>
    `${coordinate.latitude},${coordinate.longitude}`;

const decodePolyline = (encoded: string): LatLng[] => {
    const coordinates: LatLng[] = [];
    let index = 0;
    let latitude = 0;
    let longitude = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude += result & 1 ? ~(result >> 1) : result >> 1;
        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude += result & 1 ? ~(result >> 1) : result >> 1;

        coordinates.push({
            latitude: latitude / 1e5,
            longitude: longitude / 1e5,
        });
    }

    return coordinates;
};

export default function AddStopsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { pickup, dropoff, stops: draftStops } = useAppSelector((state) => state.orderDraft);
    const mapRef = useRef<MapView>(null);
    const currentStep = 0; // Locations is active in design
    const [stops, setStops] = useState<Stop[]>(draftStops);
    const [activeStopId, setActiveStopId] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [roadRouteCoordinates, setRoadRouteCoordinates] = useState<LatLng[]>([]);

    const activeStop = stops.find((stop) => stop.id === activeStopId);
    const mapCoordinates = useMemo(() => ([
        pickup?.coordinate,
        ...stops.map((stop) => stop.coordinate),
        dropoff?.coordinate,
    ]
        .filter(Boolean) as LatLng[]), [dropoff?.coordinate, pickup?.coordinate, stops]);
    const routePointKey = mapCoordinates.map(formatCoordinate).join('|');
    const visibleRouteCoordinates = roadRouteCoordinates.length > 1
        ? roadRouteCoordinates
        : mapCoordinates;

    useEffect(() => {
        dispatch(setDraftStops(stops));
    }, [dispatch, stops]);

    useEffect(() => {
        if (mapCoordinates.length < 2 || !GOOGLE_PLACES_API_KEY) {
            setRoadRouteCoordinates([]);
            dispatch(setRouteEstimate({ distanceKm: null, durationMin: null }));
            return;
        }

        const controller = new AbortController();

        const loadRoadRoute = async () => {
            try {
                const origin = mapCoordinates[0];
                const destination = mapCoordinates[mapCoordinates.length - 1];
                const waypoints = mapCoordinates.slice(1, -1);
                const params = new URLSearchParams({
                    origin: formatCoordinate(origin),
                    destination: formatCoordinate(destination),
                    key: GOOGLE_PLACES_API_KEY,
                    mode: 'driving',
                });

                if (waypoints.length > 0) {
                    params.set('waypoints', waypoints.map(formatCoordinate).join('|'));
                }

                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
                    { signal: controller.signal }
                );
                const result = await response.json();
                const route = result?.routes?.[0] as GoogleDirectionsRoute | undefined;
                const encodedRoute = route?.overview_polyline?.points;
                const distanceMeters = route?.legs?.reduce(
                    (total, leg) => total + (leg.distance?.value || 0),
                    0
                ) || 0;
                const durationSeconds = route?.legs?.reduce(
                    (total, leg) => total + (leg.duration?.value || 0),
                    0
                ) || 0;

                setRoadRouteCoordinates(encodedRoute ? decodePolyline(encodedRoute) : []);
                dispatch(setRouteEstimate({
                    distanceKm: distanceMeters ? Number((distanceMeters / 1000).toFixed(2)) : null,
                    durationMin: durationSeconds ? Math.ceil(durationSeconds / 60) : null,
                }));
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    setRoadRouteCoordinates([]);
                    dispatch(setRouteEstimate({ distanceKm: null, durationMin: null }));
                }
            }
        };

        loadRoadRoute();

        return () => controller.abort();
    }, [dispatch, mapCoordinates, routePointKey]);

    useEffect(() => {
        const query = activeStop?.address.trim() || '';

        if (!activeStopId || query.length < 2) {
            setSuggestions([]);
            setIsLoadingSuggestions(false);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            if (!GOOGLE_PLACES_API_KEY) {
                setSuggestions([]);
                setIsLoadingSuggestions(false);
                return;
            }

            setIsLoadingSuggestions(true);

            try {
                const params = new URLSearchParams({
                    input: query,
                    key: GOOGLE_PLACES_API_KEY,
                    components: 'country:ae',
                });
                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
                    { signal: controller.signal }
                );
                const result = await response.json();
                const nextSuggestions = Array.isArray(result.predictions)
                    ? result.predictions.map((item: GooglePlaceSuggestion) => ({
                        id: item.place_id,
                        name: item.structured_formatting?.main_text || item.description,
                        address: item.structured_formatting?.secondary_text || item.description,
                        description: item.description,
                    }))
                    : [];

                setSuggestions(nextSuggestions);
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    setSuggestions([]);
                }
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 350);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [activeStop?.address, activeStopId]);

    const handleAddStop = () => {
        setStops([...stops, { id: Date.now().toString(), address: '', coordinate: null }]);
    };

    const handleRemoveStop = (id: string) => {
        setStops(stops.filter(s => s.id !== id));
    };

    const handleContinue = () => {
        dispatch(setDraftStops(stops));
        router.push('/orders/vehicle-selection');
    };

    const handleStopAddressChange = (id: string, address: string) => {
        setActiveStopId(id);
        setStops(stops.map((stop) => (
            stop.id === id ? { ...stop, address, coordinate: null } : stop
        )));
    };

    const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
        if (!activeStopId) {
            return;
        }

        const selectedStopId = activeStopId;

        setStops(stops.map((stop) => (
            stop.id === selectedStopId ? { ...stop, address: suggestion.description, coordinate: null } : stop
        )));
        setSuggestions([]);
        setActiveStopId(null);

        if (!GOOGLE_PLACES_API_KEY) {
            return;
        }

        try {
            const params = new URLSearchParams({
                place_id: suggestion.id,
                fields: 'geometry',
                key: GOOGLE_PLACES_API_KEY,
            });
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
            );
            const result = await response.json();
            const coordinates = result?.result?.geometry?.location;

            if (typeof coordinates?.lat === 'number' && typeof coordinates?.lng === 'number') {
                const nextCoordinate = {
                    latitude: coordinates.lat,
                    longitude: coordinates.lng,
                };

                setStops((currentStops) => currentStops.map((stop) => (
                    stop.id === selectedStopId ? { ...stop, coordinate: nextCoordinate } : stop
                )));
                mapRef.current?.animateToRegion(
                    {
                        ...nextCoordinate,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    },
                    350
                );
            }
        } catch {
            // Keep the selected stop text even if map details cannot be loaded.
        }
    };

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

    const getContactLine = (location: typeof pickup) => {
        const name = location?.personName?.trim() || 'Contact person';
        const contactPhone = location?.phone?.trim() || 'Phone number';
        return `${name} - ${contactPhone}`;
    };

    const getAddressLine = (address?: string, fallback?: string) =>
        address?.trim() || fallback || 'Location not selected';

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
                        {/* Header */}
                        <View style={styles.journeyHeader}>
                            <Text style={styles.journeyTitle}>Journey Details</Text>
                            <Text style={styles.journeySubtitle}>From Pickup to Drop off</Text>
                        </View>

                        {/* Content */}
                        <View style={styles.journeyContent}>
                            {/* Pickup Location */}
                            <View style={styles.locationRow}>
                                <Image
                                    source={require('../../../assets/pick.png')}
                                    style={{ width: 24, height: 24, marginRight: 12 }}
                                    resizeMode="contain"
                                />
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationPerson}>{getContactLine(pickup)}</Text>
                                    <Text style={styles.locationAddress} numberOfLines={1}>
                                        {getAddressLine(pickup?.address, 'Choose pickup location')}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/orders/pickup-location')}
                                    style={styles.dragIconButton}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="menu" size={20} color="#999" />
                                </TouchableOpacity>
                            </View>

                            {/* Dynamic Stops */}
                            {stops.map((stop, index) => (
                                <View key={stop.id}>
                                    {/* Dotted Line */}
                                    <View style={styles.verticalLineContainer}>
                                        <View style={styles.verticalLine} />
                                    </View>

                                    <View style={styles.locationRow}>
                                        <View style={[styles.timelineDot, styles.dotRed]}>
                                            <Text style={styles.dotText}>{index + 1}</Text>
                                        </View>
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                style={styles.stopInput}
                                                placeholder="Click to add stop"
                                                placeholderTextColor="#999"
                                                value={stop.address}
                                                onFocus={() => setActiveStopId(stop.id)}
                                                onChangeText={(text) => handleStopAddressChange(stop.id, text)}
                                                autoFocus={true}
                                            />
                                        </View>
                                        <TouchableOpacity onPress={() => handleRemoveStop(stop.id)}>
                                            <Ionicons name="close-circle" size={20} color="#999" style={styles.dragIcon} />
                                        </TouchableOpacity>
                                    </View>
                                    {activeStopId === stop.id && (
                                        <View style={styles.suggestionsCard}>
                                            {isLoadingSuggestions && (
                                                <View style={styles.suggestionState}>
                                                    <ActivityIndicator color={Colors.primaryDark} />
                                                </View>
                                            )}

                                            {!isLoadingSuggestions && stop.address.trim().length < 2 && (
                                                <View style={styles.suggestionState}>
                                                    <Text style={styles.suggestionStateText}>Type at least 2 characters</Text>
                                                </View>
                                            )}

                                            {!isLoadingSuggestions && stop.address.trim().length >= 2 && suggestions.length === 0 && (
                                                <View style={styles.suggestionState}>
                                                    <Text style={styles.suggestionStateText}>No Google Maps suggestions found</Text>
                                                </View>
                                            )}

                                            {!isLoadingSuggestions && suggestions.map((item) => (
                                                <TouchableOpacity
                                                    key={item.id}
                                                    style={styles.suggestionItem}
                                                    onPress={() => handleSelectSuggestion(item)}
                                                >
                                                    <View style={styles.suggestionIcon}>
                                                        <Ionicons name="location-outline" size={18} color={Colors.primaryDark} />
                                                    </View>
                                                    <View style={styles.suggestionTextContainer}>
                                                        <Text style={styles.suggestionName}>{item.name}</Text>
                                                        <Text style={styles.suggestionAddress} numberOfLines={1}>
                                                            {item.address}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            ))}

                            {/* Dotted Line */}
                            <View style={styles.verticalLineContainer}>
                                <View style={styles.verticalLine} />
                            </View>

                            {/* Dropoff Location (At the end with red marker icon) */}
                            <View style={styles.locationRow}>
                                <Image
                                    source={require('../../../assets/drop.png')}
                                    style={{ width: 24, height: 24, marginRight: 12 }}
                                    resizeMode="contain"
                                />
                                <View style={styles.locationInfo}>
                                    <Text style={styles.locationPerson}>{getContactLine(dropoff)}</Text>
                                    <Text style={styles.locationAddress} numberOfLines={1}>
                                        {getAddressLine(dropoff?.address, 'Choose dropoff location')}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => router.push('/orders/drop-location')}
                                    style={styles.dragIconButton}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="menu" size={20} color="#999" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Add Stop Button */}
                        <TouchableOpacity style={styles.addStopButton} onPress={handleAddStop}>
                            <Ionicons name="add-circle-outline" size={18} color="#333" />
                            <Text style={styles.addStopButtonText}>Add Stop</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Map */}
                    <View style={styles.mapContainer}>
                        <MapView
                            ref={mapRef}
                            provider={PROVIDER_GOOGLE}
                            style={styles.map}
                            initialRegion={{
                                ...(pickup?.coordinate || dropoff?.coordinate || DEFAULT_COORDINATE),
                                latitudeDelta: 0.08,
                                longitudeDelta: 0.08,
                            }}
                        >
                            {visibleRouteCoordinates.length > 1 && (
                                <Polyline
                                    coordinates={visibleRouteCoordinates}
                                    strokeColor={Colors.primaryDark}
                                    strokeWidth={3}
                                />
                            )}

                            {pickup?.coordinate && (
                                <Marker coordinate={pickup.coordinate}>
                                    <Image
                                        source={require('../../../assets/pick.png')}
                                        style={{ width: 36, height: 36 }}
                                        resizeMode="contain"
                                    />
                                </Marker>
                            )}

                            {dropoff?.coordinate && (
                                <Marker coordinate={dropoff.coordinate}>
                                    <Image
                                        source={require('../../../assets/drop.png')}
                                        style={{ width: 36, height: 36 }}
                                        resizeMode="contain"
                                    />
                                </Marker>
                            )}

                            {stops.map((stop, index) => (
                                stop.coordinate ? (
                                    <Marker key={stop.id} coordinate={stop.coordinate}>
                                        <View style={[styles.mapStopMarker, styles.dotRed]}>
                                            <Text style={styles.dotText}>{index + 1}</Text>
                                        </View>
                                    </Marker>
                                ) : null
                            ))}
                        </MapView>
                    </View>

                    <TouchableOpacity style={[styles.continueButton, { backgroundColor: '#BEFFB6' }]} onPress={handleContinue}>
                        <Text style={styles.continueButtonText}>Continue to Vehicle</Text>
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
        marginBottom: 20,
        overflow: 'hidden',
    },
    journeyHeader: {
        padding: 16,
        paddingBottom: 8,
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
        padding: 16,
        paddingBottom: 10,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: '#fff',
        marginRight: 12,
    },
    dotGreen: {
        borderColor: '#00E676', // Bright Green
    },
    dotRed: {
        borderColor: '#FF3D00', // Bright Red
    },
    dotText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#333',
    },
    locationInfo: {
        flex: 1,
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
    dragIcon: {
        marginLeft: 8,
    },
    dragIconButton: {
        marginLeft: 8,
        padding: 6,
    },
    verticalLineContainer: {
        alignItems: 'flex-start',
        paddingLeft: 11, // Center line under dot (24/2 - 1)
        height: 20,
        justifyContent: 'center',
    },
    verticalLine: {
        width: 1,
        height: '100%',
        backgroundColor: '#333',
        borderStyle: 'dashed',
        borderWidth: 0.5,
    },

    inputContainer: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 12,
    },
    stopInput: {
        fontSize: 13,
        color: '#333',
        outlineWidth: 0,
    },
    suggestionsCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        marginTop: 10,
        marginLeft: 36,
        overflow: 'hidden',
    },
    suggestionState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    suggestionStateText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9F9F9',
    },
    suggestionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    suggestionAddress: {
        fontSize: 12,
        color: '#999',
    },

    addStopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#BEFFB6',
        paddingVertical: 12,
        gap: 6,
    },
    addStopButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },

    mapContainer: {
        height: 300,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#EEE',
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapStopMarker: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        backgroundColor: '#fff',
    },

    continueButton: {
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});
