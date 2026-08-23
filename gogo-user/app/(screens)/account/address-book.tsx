import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
    useAddSavedAddressMutation,
    useDeleteSavedAddressMutation,
    useGetSavedAddressesQuery,
} from '../../../Redux/api/userApi';
import { AppModal } from '../../../components/ui/modal';
import { Colors } from '../../../constants/Colors';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY;

type SavedAddress = {
    _id: string;
    label?: string;
    addressLine: string;
    latitude?: number;
    longitude?: number;
};

type GooglePlaceSuggestion = {
    place_id: string;
    structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
    };
    description: string;
};

type SelectedPlace = {
    placeId: string;
    name: string;
    addressLine: string;
    latitude: number;
    longitude: number;
};

const PRESET_LABELS = ['Home', 'Work', 'Office', 'Gym', 'Other'];

export default function AddressBookScreen() {
    const router = useRouter();
    const { data, isLoading } = useGetSavedAddressesQuery(undefined);
    const [addSavedAddress, { isLoading: isAdding }] = useAddSavedAddressMutation();
    const [deleteSavedAddress] = useDeleteSavedAddressMutation();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [label, setLabel] = useState('Home');
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<GooglePlaceSuggestion[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);

    const addresses: SavedAddress[] = data?.data ?? [];
    const abortControllerRef = useRef<AbortController | null>(null);
    const isSelectingRef = useRef(false);

    // Fetch Google Places Autocomplete suggestions
    useEffect(() => {
        if (isSelectingRef.current) {
            isSelectingRef.current = false;
            return;
        }

        const query = searchQuery.trim();

        if (selectedPlace && searchQuery === selectedPlace.addressLine) {
            setSuggestions([]);
            setIsLoadingSuggestions(false);
            return;
        }

        if (query.length < 2) {
            setSuggestions([]);
            setIsLoadingSuggestions(false);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

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
                });

                const response = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
                    { signal: controller.signal }
                );
                const result = await response.json();

                if (Array.isArray(result?.predictions)) {
                    setSuggestions(result.predictions);
                } else {
                    setSuggestions([]);
                }
            } catch (error: any) {
                if (error?.name !== 'AbortError') {
                    setSuggestions([]);
                }
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 300);

        return () => {
            controller.abort();
            clearTimeout(timeoutId);
        };
    }, [searchQuery, selectedPlace]);

    const handleSelectPlace = async (item: GooglePlaceSuggestion) => {
        isSelectingRef.current = true;
        abortControllerRef.current?.abort();
        Keyboard.dismiss();
        setSuggestions([]);
        setIsLoadingSuggestions(false);
        setIsFetchingDetails(true);

        try {
            if (!GOOGLE_PLACES_API_KEY) {
                Alert.alert('Error', 'Google Maps API key is missing.');
                setIsFetchingDetails(false);
                return;
            }

            const params = new URLSearchParams({
                place_id: item.place_id,
                fields: 'geometry,formatted_address,name',
                key: GOOGLE_PLACES_API_KEY,
            });

            const response = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`
            );
            const result = await response.json();
            const location = result?.result?.geometry?.location;
            const fullAddress = result?.result?.formatted_address || item.description;
            const placeName = result?.result?.name || item.structured_formatting?.main_text || 'Selected Place';

            if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
                setSelectedPlace({
                    placeId: item.place_id,
                    name: placeName,
                    addressLine: fullAddress,
                    latitude: location.lat,
                    longitude: location.lng,
                });
                setSearchQuery(fullAddress);
            } else {
                Alert.alert('Error', 'Could not get coordinates for this location.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch place details.');
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleClearSelected = () => {
        setSelectedPlace(null);
        setSearchQuery('');
        setSuggestions([]);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setLabel('Home');
        setSearchQuery('');
        setSelectedPlace(null);
        setSuggestions([]);
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSavedAddress(id).unwrap();
                        } catch (error: any) {
                            Alert.alert('Error', error?.data?.message || 'Could not delete address');
                        }
                    },
                },
            ]
        );
    };

    const handleAddAddress = async () => {
        if (!selectedPlace) {
            Alert.alert('Google Location Required', 'Please search and select a verified address from the Google suggestions list.');
            return;
        }

        try {
            await addSavedAddress({
                label: label.trim() || 'Home',
                addressLine: selectedPlace.addressLine,
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
            }).unwrap();

            handleCloseModal();
        } catch (error: any) {
            Alert.alert('Error', error?.data?.message || 'Could not save address');
        }
    };

    const getAddressIcon = (addressLabel?: string) => {
        const normalized = addressLabel?.toLowerCase() || '';
        if (normalized.includes('home')) return 'home';
        if (normalized.includes('office') || normalized.includes('work')) return 'briefcase';
        if (normalized.includes('gym')) return 'barbell';
        return 'location';
    };

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
                <Text style={styles.headerTitle}>Saved Addresses</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
                    <Ionicons name="add" size={26} color="#000" />
                </TouchableOpacity>
            </Animated.View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {isLoading && (
                    <Text style={styles.loadingText}>Loading saved addresses...</Text>
                )}

                {addresses.map((item, index) => (
                    <Animated.View
                        key={item._id}
                        entering={FadeInDown.delay(200 + index * 100).duration(600)}
                        style={styles.addressCard}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={getAddressIcon(item.label) as any} size={22} color="#166534" />
                        </View>
                        <View style={styles.addressInfo}>
                            <Text style={styles.addressName}>{item.label || 'Saved Address'}</Text>
                            <Text style={styles.addressText}>{item.addressLine}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteButton}>
                            <Ionicons name="trash-outline" size={20} color="#FF5252" />
                        </TouchableOpacity>
                    </Animated.View>
                ))}

                {addresses.length === 0 && !isLoading && (
                    <View style={styles.emptyState}>
                        <Ionicons name="location-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No saved addresses yet</Text>
                        <TouchableOpacity style={styles.emptyAddButton} onPress={() => setIsModalVisible(true)}>
                            <Ionicons name="add" size={20} color="#000" />
                            <Text style={styles.emptyAddButtonText}>Add Address</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Reusable AppModal from components/ui/modal */}
            <AppModal
                visible={isModalVisible}
                onClose={handleCloseModal}
                title="Add Address"
                subtitle="Search and select from Google Maps"
                position="center"
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* Label Selector */}
                    <Text style={styles.label}>Address Label</Text>
                    <View style={styles.presetContainer}>
                        {PRESET_LABELS.map((item) => {
                            const isSelected = label === item;
                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                                    onPress={() => setLabel(item)}
                                >
                                    <Ionicons
                                        name={getAddressIcon(item) as any}
                                        size={14}
                                        color={isSelected ? '#000' : '#666'}
                                    />
                                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Custom Label input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Custom label (e.g., Mom's House, Studio)"
                        placeholderTextColor="#999"
                        value={label}
                        onChangeText={setLabel}
                    />

                    {/* Google Places Search Input */}
                    <View style={styles.searchHeaderRow}>
                        <Text style={styles.label}>Google Location</Text>
                        <View style={styles.googleBadge}>
                            <Ionicons name="logo-google" size={12} color="#4285F4" />
                            <Text style={styles.googleBadgeText}>Google Places</Text>
                        </View>
                    </View>

                    <View style={[styles.searchContainer, selectedPlace && styles.searchContainerSelected]}>
                        <Ionicons
                            name={selectedPlace ? 'checkmark-circle' : 'search'}
                            size={20}
                            color={selectedPlace ? '#16a34a' : '#666'}
                            style={styles.searchIcon}
                        />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search location on Google..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                if (selectedPlace && text !== selectedPlace.addressLine) {
                                    setSelectedPlace(null);
                                }
                            }}
                            autoCorrect={false}
                        />
                        {(isLoadingSuggestions || isFetchingDetails) && (
                            <ActivityIndicator size="small" color={Colors.primaryDark} style={styles.inputLoader} />
                        )}
                        {searchQuery.length > 0 && !isLoadingSuggestions && !isFetchingDetails && (
                            <TouchableOpacity onPress={handleClearSelected} style={styles.clearButton}>
                                <Ionicons name="close-circle" size={18} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Verified Location Card when place is selected */}
                    {selectedPlace && (
                        <View style={styles.selectedCard}>
                            <View style={styles.selectedIconWrap}>
                                <Ionicons name="location" size={18} color="#16a34a" />
                            </View>
                            <View style={styles.selectedInfo}>
                                <Text style={styles.selectedName} numberOfLines={1}>{selectedPlace.name}</Text>
                                <Text style={styles.selectedCoords}>
                                    Lat: {selectedPlace.latitude.toFixed(5)}, Lng: {selectedPlace.longitude.toFixed(5)}
                                </Text>
                            </View>
                            <View style={styles.verifiedTag}>
                                <Ionicons name="shield-checkmark" size={12} color="#16a34a" />
                                <Text style={styles.verifiedTagText}>Verified</Text>
                            </View>
                        </View>
                    )}

                    {/* Suggestions Dropdown */}
                    {suggestions.length > 0 && (
                        <View style={styles.suggestionsContainer}>
                            <ScrollView
                                style={styles.suggestionsList}
                                keyboardShouldPersistTaps="handled"
                                nestedScrollEnabled
                            >
                                {suggestions.map((item) => (
                                    <TouchableOpacity
                                        key={item.place_id}
                                        style={styles.suggestionItem}
                                        onPress={() => handleSelectPlace(item)}
                                    >
                                        <View style={styles.suggestionIcon}>
                                            <Ionicons name="location-outline" size={18} color="#666" />
                                        </View>
                                        <View style={styles.suggestionTextContainer}>
                                            <Text style={styles.suggestionMainText} numberOfLines={1}>
                                                {item.structured_formatting?.main_text || item.description}
                                            </Text>
                                            {item.structured_formatting?.secondary_text ? (
                                                <Text style={styles.suggestionSubText} numberOfLines={1}>
                                                    {item.structured_formatting.secondary_text}
                                                </Text>
                                            ) : null}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            (!selectedPlace || isAdding || isFetchingDetails) && styles.saveButtonDisabled,
                        ]}
                        onPress={handleAddAddress}
                        disabled={!selectedPlace || isAdding || isFetchingDetails}
                    >
                        {isAdding ? (
                            <ActivityIndicator size="small" color="#000" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-sharp" size={18} color="#000" style={{ marginRight: 6 }} />
                                <Text style={styles.saveButtonText}>
                                    {selectedPlace ? 'Save Address' : 'Select a Google Location'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </AppModal>
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
        borderBottomColor: '#f0f0f0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: 20,
        paddingTop: 16,
    },
    addressCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EBFDE8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    addressInfo: {
        flex: 1,
    },
    addressName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    deleteButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
        gap: 16,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        fontWeight: '600',
    },
    emptyAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 6,
        marginTop: 8,
    },
    emptyAddButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 14,
    },
    loadingText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
    },
    presetContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    presetChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    presetChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primaryDark,
    },
    presetChipText: {
        fontSize: 13,
        color: '#666',
        fontWeight: '600',
    },
    presetChipTextActive: {
        color: '#000',
        fontWeight: '700',
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 14,
        paddingVertical: 11,
        fontSize: 14,
        color: Colors.text,
        marginBottom: 16,
    },
    searchHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    googleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
    },
    googleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#4F46E5',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    searchContainerSelected: {
        borderColor: '#16a34a',
        backgroundColor: '#F0FDF4',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: Colors.text,
    },
    inputLoader: {
        marginLeft: 6,
    },
    clearButton: {
        padding: 4,
        marginLeft: 4,
    },
    selectedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
        borderRadius: 12,
        padding: 10,
        marginBottom: 14,
        gap: 10,
    },
    selectedIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedInfo: {
        flex: 1,
    },
    selectedName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#14532D',
    },
    selectedCoords: {
        fontSize: 11,
        color: '#166534',
        marginTop: 1,
    },
    verifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    verifiedTagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#16a34a',
    },
    suggestionsContainer: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        maxHeight: 180,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    suggestionsList: {
        flexGrow: 0,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    suggestionIcon: {
        marginRight: 10,
    },
    suggestionTextContainer: {
        flex: 1,
    },
    suggestionMainText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    suggestionSubText: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 2,
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    saveButtonDisabled: {
        backgroundColor: '#E2E8F0',
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#000',
        fontSize: 15,
        fontWeight: '800',
    },
});
