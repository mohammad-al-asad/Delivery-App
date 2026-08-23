import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { useSignUpMutation } from "../../Redux/api/authApi";

const VEHICLE_TYPES = [
    { label: "Bike", icon: "bicycle-outline" },
    { label: "Car", icon: "car-outline" },
    { label: "Truck", icon: "bus-outline" },
] as const;

export default function SignUpScreen() {
    const router = useRouter();
    const { phone } = useLocalSearchParams();
    const [signUp, { isLoading }] = useSignUpMutation();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [trnVatNo, setTrnVatNo] = useState("");
    const [emiratesId, setEmiratesId] = useState("");
    const [drivingLicense, setDrivingLicense] = useState("");
    const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]["label"]>("Bike");
    const [referralCode, setReferralCode] = useState("");
    const [phoneNumber, setPhoneNumber] = useState((phone as string) || "");
    const [newPhoneNumber, setNewPhoneNumber] = useState("");

    const [showChangeModal, setShowChangeModal] = useState(false);
    const [showReferralModal, setShowReferralModal] = useState(false);

    const webOutline =
        Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {};

    const handleRegister = async () => {
        if (
            !firstName.trim() ||
            !lastName.trim() ||
            !email.trim() ||
            !phoneNumber.trim() ||
            !emiratesId.trim() ||
            !drivingLicense.trim()
        ) {
            Alert.alert("Error", "Please fill in all required fields");
            return;
        }

        const payload = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
            email: email.trim(),
            companyName: companyName.trim() || undefined,
            trnVatNo: trnVatNo.trim() || undefined,
            referralCode: referralCode.trim() || undefined,
            role: "Rider",
            emaratesId: emiratesId.trim(),
            drivingLicense: drivingLicense.trim(),
            vehicle: {
                type: vehicleType,
            },
        };

        try {
            await signUp(payload).unwrap();
            Alert.alert(
                "Success",
                "Driver account created successfully. Please sign in to complete onboarding.",
            );
            router.replace("/(auth)/sign-in");
        } catch (error: any) {
            console.error("Registration error:", error);
            Alert.alert(
                "Error",
                error?.data?.message || "Registration failed. Please try again.",
            );
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar barStyle="dark-content" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.Image
                    entering={FadeInUp.delay(200).duration(800)}
                    source={require("../../assets/logo/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Animated.View
                    entering={FadeInUp.delay(300).duration(800)}
                    style={styles.phoneRow}
                >
                    <Image
                        source={{ uri: "https://flagcdn.com/w40/ae.png" }}
                        style={styles.flag}
                        resizeMode="cover"
                    />
                    <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            setNewPhoneNumber(phoneNumber);
                            setShowChangeModal(true);
                        }}
                    >
                        <Text style={styles.changeText}>CHANGE</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View
                    entering={FadeInDown.delay(500).duration(800)}
                    style={styles.formContainer}
                >
                    <View style={styles.row}>
                        <View style={[styles.inputWrapper, styles.rowInputLeft]}>
                            <TextInput
                                style={[styles.bottomInput, webOutline]}
                                placeholder="First name"
                                placeholderTextColor="#A0A0A0"
                                value={firstName}
                                onChangeText={setFirstName}
                            />
                        </View>
                        <View style={[styles.inputWrapper, styles.rowInputRight]}>
                            <TextInput
                                style={[styles.bottomInput, webOutline]}
                                placeholder="Last name"
                                placeholderTextColor="#A0A0A0"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.bottomInput, webOutline]}
                            placeholder="Email Id"
                            placeholderTextColor="#A0A0A0"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.bottomInput, webOutline]}
                            placeholder="Company Name (Optional)"
                            placeholderTextColor="#A0A0A0"
                            value={companyName}
                            onChangeText={setCompanyName}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.bottomInput, webOutline]}
                            placeholder="TRN/VAT Number (Optional)"
                            placeholderTextColor="#A0A0A0"
                            value={trnVatNo}
                            onChangeText={setTrnVatNo}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.bottomInput, webOutline]}
                            placeholder="Emirates ID"
                            placeholderTextColor="#A0A0A0"
                            value={emiratesId}
                            onChangeText={setEmiratesId}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.bottomInput, webOutline]}
                            placeholder="Driving License"
                            placeholderTextColor="#A0A0A0"
                            value={drivingLicense}
                            onChangeText={setDrivingLicense}
                        />
                    </View>

                    <View style={styles.vehicleWrapper}>
                        <Text style={styles.smallLabel}>Vehicle Type</Text>
                        <View style={styles.vehicleRow}>
                            {VEHICLE_TYPES.map((vehicle) => {
                                const selected = vehicleType === vehicle.label;
                                return (
                                    <TouchableOpacity
                                        key={vehicle.label}
                                        style={[
                                            styles.vehicleOption,
                                            selected && styles.vehicleOptionSelected,
                                        ]}
                                        onPress={() => setVehicleType(vehicle.label)}
                                    >
                                        <Ionicons
                                            name={vehicle.icon as any}
                                            size={18}
                                            color={selected ? "#000" : "#777"}
                                        />
                                        <Text
                                            style={[
                                                styles.vehicleOptionText,
                                                selected && styles.vehicleOptionTextSelected,
                                            ]}
                                        >
                                            {vehicle.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.referralContainer}
                        onPress={() => setShowReferralModal(true)}
                    >
                        <Text style={styles.referralText}>
                            {referralCode
                                ? `Referral Code: ${referralCode}`
                                : "Have referral code ?"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                        onPress={handleRegister}
                        disabled={isLoading}
                    >
                        <Text style={styles.registerButtonText}>
                            {isLoading ? "REGISTERING..." : "REGISTER"}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            <Modal visible={showChangeModal} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Change Phone Number</Text>
                        <Text style={styles.modalText}>
                            Enter your new phone number below.
                        </Text>
                        <TextInput
                            style={[styles.modalInput, webOutline]}
                            placeholder="New Phone Number"
                            value={newPhoneNumber}
                            onChangeText={setNewPhoneNumber}
                            keyboardType="phone-pad"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setShowChangeModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirm}
                                onPress={() => {
                                    if (newPhoneNumber.trim().length > 0) {
                                        setPhoneNumber(newPhoneNumber.trim());
                                    }
                                    setShowChangeModal(false);
                                }}
                            >
                                <Text style={styles.modalConfirmText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <Modal visible={showReferralModal} transparent animationType="fade">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Enter Referral Code</Text>
                        <TextInput
                            style={[styles.modalInput, webOutline]}
                            placeholder="Referral Code"
                            value={referralCode}
                            onChangeText={setReferralCode}
                            autoCapitalize="characters"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancel}
                                onPress={() => setShowReferralModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirm}
                                onPress={() => setShowReferralModal(false)}
                            >
                                <Text style={styles.modalConfirmText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContent: {
        padding: 30,
        paddingTop: 50,
    },
    logo: {
        width: 160,
        height: 100,
        alignSelf: "center",
        marginTop: 20,
        marginBottom: 30,
    },
    phoneRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 40,
    },
    flag: {
        width: 24,
        height: 16,
        borderRadius: 2,
        marginRight: 12,
    },
    phoneNumber: {
        fontSize: 18,
        color: "#000",
        marginRight: 12,
    },
    changeText: {
        fontSize: 13,
        color: "#2B5FF5",
        fontWeight: "700",
        textTransform: "uppercase",
    },
    formContainer: {
        width: "100%",
    },
    row: {
        flexDirection: "row",
        width: "100%",
    },
    rowInputLeft: {
        flex: 1,
        marginRight: 20,
    },
    rowInputRight: {
        flex: 1,
    },
    inputWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
        height: 40,
        justifyContent: "flex-end",
        paddingBottom: 8,
        marginBottom: 25,
    },
    bottomInput: {
        fontSize: 15,
        color: "#000",
        padding: 0,
    },
    roleWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
        paddingBottom: 8,
        marginBottom: 20,
        marginTop: 5,
    },
    smallLabel: {
        fontSize: 11,
        color: "#888",
        marginBottom: 6,
    },
    roleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    roleValue: {
        fontSize: 15,
        color: "#000",
        fontWeight: "600",
    },
    vehicleWrapper: {
        marginBottom: 25,
    },
    vehicleRow: {
        flexDirection: "row",
        gap: 10,
    },
    vehicleOption: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#E0E0E0",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 6,
        backgroundColor: "#fff",
    },
    vehicleOptionSelected: {
        backgroundColor: "#abffaf",
        borderColor: "#abffaf",
    },
    vehicleOptionText: {
        color: "#777",
        fontSize: 13,
        fontWeight: "700",
    },
    vehicleOptionTextSelected: {
        color: "#000",
    },
    referralContainer: {
        marginTop: 5,
        marginBottom: 25,
    },
    referralText: {
        color: "#2B5FF5",
        fontWeight: "700",
        fontSize: 14,
    },
    registerButton: {
        backgroundColor: "#abffaf",
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 25,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: "#000",
        fontSize: 15,
        fontWeight: "700",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalBox: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#000",
        marginBottom: 16,
        textAlign: "center",
    },
    modalText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 24,
        textAlign: "center",
        lineHeight: 20,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    modalCancel: {
        flex: 1,
        paddingVertical: 14,
        marginRight: 8,
        borderRadius: 24,
        backgroundColor: "#F2F2F2",
        alignItems: "center",
    },
    modalCancelText: {
        color: "#333",
        fontWeight: "700",
        fontSize: 15,
    },
    modalConfirm: {
        flex: 1,
        paddingVertical: 14,
        marginLeft: 8,
        borderRadius: 24,
        backgroundColor: "#abffaf",
        alignItems: "center",
    },
    modalConfirmText: {
        color: "#000",
        fontWeight: "700",
        fontSize: 15,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        marginBottom: 24,
        backgroundColor: "#FAFAFA",
    },
});
