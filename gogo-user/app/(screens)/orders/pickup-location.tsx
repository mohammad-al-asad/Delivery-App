import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type LatLng,
} from "react-native-maps";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
} from "react-native-reanimated";
import { useAppDispatch, useAppSelector } from "../../../Redux/hooks";
import { setPickupLocation } from "../../../Redux/Slice/orderDraftSlice";
import { CustomInput } from "../../../components/CustomInput";
import { Colors } from "../../../constants/Colors";
import { useKeyboardInset } from "../../../hooks/use-keyboard-inset";

const STEPS = ["Locations", "Vehicle", "Checkout", "Payment"];
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY;
const DEFAULT_COORDINATE = {
  latitude: 25.2048,
  longitude: 55.2708,
};

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

export default function PickupLocationScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { keyboardInset } = useKeyboardInset();
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] =
    useState<LatLng>(DEFAULT_COORDINATE);
  const draftPickup = useAppSelector((state) => state.orderDraft.pickup);

  const [details, setDetails] = useState("");
  const [personName, setPersonName] = useState("");
  const [phone, setPhone] = useState("");

  const [addressError, setAddressError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const hasLoadedDraft = useRef(false);
  useEffect(() => {
    if (draftPickup && !hasLoadedDraft.current) {
      if (draftPickup.address) setSearchQuery(draftPickup.address);
      if (draftPickup.details) setDetails(draftPickup.details);
      if (draftPickup.personName) setPersonName(draftPickup.personName);
      if (draftPickup.phone) setPhone(draftPickup.phone);
      if (draftPickup.coordinate) {
        setSelectedCoordinate(draftPickup.coordinate);
        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              ...draftPickup.coordinate!,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            350
          );
        }, 500);
      }
      hasLoadedDraft.current = true;
    }
  }, [draftPickup]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setLocationSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      if (!GOOGLE_PLACES_API_KEY) {
        setLocationSuggestions([]);
        setIsLoadingSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);

      try {
        const params = new URLSearchParams({
          input: query,
          key: GOOGLE_PLACES_API_KEY,
          components: "country:ae",
        });
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
          { signal: controller.signal },
        );
        const result = await response.json();
        const suggestions = Array.isArray(result.predictions)
          ? result.predictions.map((item: GooglePlaceSuggestion) => ({
              id: item.place_id,
              name: item.structured_formatting?.main_text || item.description,
              address:
                item.structured_formatting?.secondary_text || item.description,
              description: item.description,
            }))
          : [];

        setLocationSuggestions(suggestions);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          setLocationSuggestions([]);
        }
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const handleSelectLocation = async (location: LocationSuggestion) => {
    setSearchQuery(location.description);
    setShowDropdown(false);

    if (!GOOGLE_PLACES_API_KEY) {
      return;
    }

    try {
      const params = new URLSearchParams({
        place_id: location.id,
        fields: "geometry",
        key: GOOGLE_PLACES_API_KEY,
      });
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
      );
      const result = await response.json();
      const coordinates = result?.result?.geometry?.location;

      if (
        typeof coordinates?.lat === "number" &&
        typeof coordinates?.lng === "number"
      ) {
        const nextCoordinate = {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
        };

        setSelectedCoordinate(nextCoordinate);
        mapRef.current?.animateToRegion(
          {
            ...nextCoordinate,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          350,
        );
      }
    } catch {
      // Keep the typed location even if map details cannot be loaded.
    }
  };

  const handleContinue = () => {
    let isValid = true;
    if (!searchQuery.trim()) {
      setAddressError("Pickup address is required");
      isValid = false;
    }
    if (!personName.trim()) {
      setNameError("Contact name is required");
      isValid = false;
    }
    if (!phone.trim()) {
      setPhoneError("Phone number is required");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    dispatch(
      setPickupLocation({
        address: searchQuery,
        details,
        personName,
        phone,
        coordinate: selectedCoordinate,
      }),
    );
    router.push("/orders/drop-location");
  };

  const scrollFormIntoView = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const renderStepper = () => (
    <View style={styles.stepperContainer}>
      {STEPS.map((step, index) => (
        <React.Fragment key={index}>
          <View style={styles.stepItem}>
            <Animated.View
              style={[
                styles.stepCircle,
                index <= currentStep ? styles.stepActive : styles.stepInactive,
              ]}
              layout={Layout.springify()}
            >
              <Text
                style={[
                  styles.stepNumber,
                  index <= currentStep && { color: "#000" },
                ]}
              >
                {index + 1}
              </Text>
            </Animated.View>
            <Text
              style={[
                styles.stepLabel,
                index <= currentStep
                  ? styles.stepLabelActive
                  : styles.stepLabelInactive,
              ]}
            >
              {step}
            </Text>
          </View>
          {index < STEPS.length - 1 && (
            <View style={styles.stepLineContainer}>
              <Animated.View
                style={[
                  styles.stepLineFill,
                  { width: index < currentStep ? "100%" : "0%" },
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Location</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      <View style={styles.card}>
        {renderStepper()}

        {/* Title Section with Custom Icon */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(600)}
          style={styles.titleSection}
        >
          <View style={styles.locationIconContainer}>
            <Image
              source={require("../../../assets/pick.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.pageTitle}>Pickup Location</Text>
            <Text style={styles.pageSubtitle}>Choose where to pickup</Text>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(600)}
          style={[styles.searchContainer, { zIndex: 30 }]}
        >
          <CustomInput
            placeholder="Type to search or paste location link"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowDropdown(true);
              if (text.trim()) {
                setAddressError("");
              }
            }}
            onFocus={() => setShowDropdown(true)}
            error={addressError}
            icon={<Ionicons name="search" size={20} color="#999" />}
          />
        </Animated.View>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <TouchableOpacity
              style={styles.dismissOverlay}
              activeOpacity={1}
              onPress={() => setShowDropdown(false)}
            />
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={styles.dropdownOverlay}
            >
              <Text style={styles.recentDropsTitle}>Locations</Text>
              {isLoadingSuggestions && (
                <View style={styles.dropdownState}>
                  <ActivityIndicator color={Colors.primaryDark} />
                </View>
              )}

              {!isLoadingSuggestions && searchQuery.trim().length < 2 && (
                <View style={styles.dropdownState}>
                  <Text style={styles.dropdownStateText}>
                    Type at least 2 characters
                  </Text>
                </View>
              )}

              {!isLoadingSuggestions &&
                searchQuery.trim().length >= 2 &&
                locationSuggestions.length === 0 && (
                  <View style={styles.dropdownState}>
                    <Text style={styles.dropdownStateText}>
                      No Google Maps suggestions found
                    </Text>
                  </View>
                )}

              {!isLoadingSuggestions &&
                locationSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <View style={styles.dropdownIconContainer}>
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={Colors.primaryDark}
                      />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownItemName}>{item.name}</Text>
                      <Text
                        style={styles.dropdownItemAddress}
                        numberOfLines={1}
                      >
                        {item.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </Animated.View>
          </>
        )}

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 40 + keyboardInset },
          ]}
        >
          {/* Map View */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(600)}
            style={styles.mapContainer}
          >
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                ...DEFAULT_COORDINATE,
                latitudeDelta: 0.08,
                longitudeDelta: 0.08,
              }}
              onPress={(event) =>
                setSelectedCoordinate(event.nativeEvent.coordinate)
              }
            >
              <Marker coordinate={selectedCoordinate}>
                <Image
                  source={require("../../../assets/pick.png")}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              </Marker>
            </MapView>
          </Animated.View>

          {/* Form */}
          <Animated.View
            entering={FadeInDown.delay(500).duration(600)}
            style={styles.formContainer}
          >
            <CustomInput
              label="Additional Details"
              placeholder="Landmark, flat no., building name"
              value={details}
              onChangeText={setDetails}
              onFocus={scrollFormIntoView}
              icon={
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color="#999"
                />
              }
            />

            <CustomInput
              label="Contact Person *"
              placeholder="Name of the person"
              value={personName}
              onChangeText={(text) => {
                setPersonName(text);
                if (text.trim()) {
                  setNameError("");
                }
              }}
              error={nameError}
              onFocus={scrollFormIntoView}
              icon={<Ionicons name="person-outline" size={20} color="#999" />}
            />

            <CustomInput
              label="Phone Number *"
              placeholder="+971 XX XXX XXXX"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (text.trim()) {
                  setPhoneError("");
                }
              }}
              error={phoneError}
              keyboardType="phone-pad"
              onFocus={scrollFormIntoView}
              icon={<Ionicons name="call-outline" size={20} color="#999" />}
            />

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>
                Continue to Drop Location
              </Text>
              <Ionicons name="arrow-forward" size={24} color="#000" />
            </TouchableOpacity>
          </Animated.View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  locationIconImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C3E50",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  stepItem: {
    alignItems: "center",
    zIndex: 1,
    width: 60,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepActive: {
    backgroundColor: Colors.primary,
  },
  stepInactive: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#999",
  },
  stepLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "600",
    textAlign: "center",
  },
  stepLabelActive: {
    color: Colors.text,
  },
  stepLabelInactive: {
    color: "#ccc",
  },
  stepLineContainer: {
    flex: 1,
    height: 2,
    backgroundColor: "#F0F0F0",
    marginTop: 15,
    marginHorizontal: -10,
  },
  stepLineFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  locationIconContainer: {
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#999",
  },
  searchContainer: {
    marginBottom: 16,
  },
  mapContainer: {
    height: 250,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    backgroundColor: "#EEE",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  scrollContent: {
    paddingTop: 10,
  },
  formContainer: {
    gap: 4,
  },
  continueButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 28,
    gap: 8,
    marginTop: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
  },
  dismissOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 15,
    backgroundColor: "transparent",
  },
  dropdownOverlay: {
    position: "absolute",
    top: 260,
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    paddingVertical: 12,
    maxHeight: 300,
  },
  recentDropsTitle: {
    fontSize: 12,
    color: "#999",
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F9F9F9",
  },
  dropdownIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0FFF0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  dropdownStateText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  dropdownItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 2,
  },
  dropdownItemAddress: {
    fontSize: 12,
    color: "#999",
  },
});
