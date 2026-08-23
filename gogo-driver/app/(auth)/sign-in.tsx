import { Ionicons } from "@expo/vector-icons";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingSlider } from "../../components/OnboardingSlider";
import { Colors } from "../../constants/Colors";
import { COUNTRIES, Country } from "../../constants/countries";
import {
    useCheckUserByPhoneMutation,
    useLogInMutation,
} from "../../Redux/api/authApi";

declare global {
    interface Window {
        recaptchaVerifier: any;
        confirmationResult: any;
    }
}

export default function SignInScreen() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const [checkUserByPhone, { isLoading: isChecking }] =
        useCheckUserByPhoneMutation();
    const [logInMutation] = useLogInMutation();

    const filteredCountries = COUNTRIES.filter(
        (country) =>
            country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            country.dialCode.includes(searchQuery),
    );

    const handleContinue = async () => {
        if (!phone || phone.length < 8) {
            Alert.alert("Error", "Enter a valid phone number");
            return;
        }

        const fullPhoneNumber = `${selectedCountry.dialCode}${phone}`;
        setIsLoggingIn(true);

        try {
            const checkResponse = await checkUserByPhone({
                phoneNumber: fullPhoneNumber,
            }).unwrap();

            if (checkResponse?.data?.exists) {
                const authInstance = getAuth();
                if (__DEV__) {
                    authInstance.settings.appVerificationDisabledForTesting = true;
                }

                window.confirmationResult = await signInWithPhoneNumber(
                    authInstance,
                    fullPhoneNumber,
                );

                const result = await logInMutation({ phoneNumber: fullPhoneNumber }).unwrap();
                console.log(result);
                router.push({
                    pathname: "/(auth)/verify-otp",
                    params: { phone: fullPhoneNumber },
                });
            } else {
                router.push({
                    pathname: "/(auth)/sign-up",
                    params: { phone: fullPhoneNumber },
                });
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert(
                "Error",
                error?.data?.message || error?.message || "Something went wrong. Try again.",
            );
        } finally {
            setIsLoggingIn(false);
        }
    };

    const isBusy = isChecking || isLoggingIn;

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <StatusBar barStyle="dark-content" backgroundColor="#fff" />

                <View style={styles.content}>
                    <View style={styles.sliderContainer}>
                        <OnboardingSlider />
                    </View>

                    <View style={styles.bottomCard}>
                        <Text style={styles.welcomeText}>Welcome</Text>
                        <Text style={styles.subtitleText}>
                            Enter your phone number to continue
                        </Text>

                        <View style={styles.inputContainer}>
                            <TouchableOpacity
                                style={styles.countryPicker}
                                onPress={() => setShowCountryPicker(true)}
                                activeOpacity={0.7}
                            >
                                <Image
                                    source={{ uri: selectedCountry.flag }}
                                    style={styles.flagIcon}
                                />
                                <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                                <Ionicons
                                    name="chevron-down"
                                    size={16}
                                    color={Colors.icon}
                                    style={styles.chevron}
                                />
                            </TouchableOpacity>

                            <TextInput
                                style={styles.phoneInput}
                                placeholder="Mobile Number"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                                placeholderTextColor={Colors.icon}
                                maxLength={15}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.continueButton, isBusy && styles.continueButtonDisabled]}
                            onPress={handleContinue}
                            disabled={isBusy}
                            activeOpacity={0.8}
                        >
                            {isBusy ? (
                                <ActivityIndicator color={Colors.secondary} />
                            ) : (
                                <>
                                    <Text style={styles.continueButtonText}>Continue</Text>
                                    <Ionicons name="arrow-forward" size={20} color={Colors.secondary} />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={showCountryPicker} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity
                                onPress={() => setShowCountryPicker(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchContainer}>
                            <Ionicons
                                name="search"
                                size={20}
                                color={Colors.icon}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor={Colors.icon}
                            />
                        </View>

                        <FlatList
                            data={filteredCountries}
                            keyExtractor={(item) => item.code}
                            contentContainerStyle={styles.countryList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.countryItem,
                                        selectedCountry.code === item.code && styles.countryItemSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedCountry(item);
                                        setShowCountryPicker(false);
                                        setSearchQuery("");
                                    }}
                                >
                                    <View style={styles.countryItemLeft}>
                                        <Image source={{ uri: item.flag }} style={styles.listFlagIcon} />
                                        <Text style={styles.countryItemName}>{item.name}</Text>
                                    </View>
                                    <Text style={styles.countryItemCode}>{item.dialCode}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "space-between",
    },
    sliderContainer: {
        flex: 1,
    },
    bottomCard: {
        padding: 24,
        backgroundColor: "#fff",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 15,
    },
    welcomeText: {
        fontSize: 28,
        fontWeight: "800",
        color: Colors.text,
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 16,
        color: Colors.icon,
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    countryPicker: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.backgroundAlt,
        paddingHorizontal: 12,
        paddingVertical: 16,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    flagIcon: {
        width: 24,
        height: 16,
        borderRadius: 2,
        marginRight: 8,
    },
    dialCode: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.text,
        marginRight: 4,
    },
    chevron: {
        marginLeft: 2,
    },
    phoneInput: {
        flex: 1,
        backgroundColor: Colors.backgroundAlt,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        color: Colors.text,
        fontWeight: "500",
    },
    continueButton: {
        backgroundColor: Colors.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    continueButtonDisabled: {
        opacity: 0.7,
    },
    continueButtonText: {
        color: Colors.secondary,
        fontSize: 18,
        fontWeight: "700",
        marginRight: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: "80%",
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.text,
    },
    closeButton: {
        padding: 4,
        backgroundColor: Colors.backgroundAlt,
        borderRadius: 20,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.backgroundAlt,
        marginHorizontal: 24,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.text,
    },
    countryList: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    countryItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    countryItemSelected: {
        backgroundColor: Colors.backgroundAlt,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginHorizontal: -12,
        borderBottomWidth: 0,
    },
    countryItemLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    listFlagIcon: {
        width: 28,
        height: 20,
        borderRadius: 4,
        marginRight: 12,
    },
    countryItemName: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: "500",
    },
    countryItemCode: {
        fontSize: 16,
        color: Colors.icon,
        fontWeight: "600",
    },
});
