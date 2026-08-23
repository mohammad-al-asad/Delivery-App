import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
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

import { useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { useSignUpMutation } from "../../Redux/api/authApi";
import { COUNTRIES, Country } from "../../constants/countries";

const getCountryFromPhone = (
  phoneNumber?: string,
  countryCode?: string,
): Country => {
  const countryByCode = COUNTRIES.find((country) => country.code === countryCode);
  if (countryByCode) return countryByCode;

  const normalizedPhone = String(phoneNumber || "").trim();
  const countryByDialCode = [...COUNTRIES]
    .sort((a, b) => b.dialCode.length - a.dialCode.length)
    .find((country) => normalizedPhone.startsWith(country.dialCode));

  return countryByDialCode || COUNTRIES[0];
};

export default function SignUpScreen() {
  const router = useRouter();
  const { phone, countryCode } = useLocalSearchParams();
  const [signUp, { isLoading }] = useSignUpMutation();
  const initialPhoneNumber = Array.isArray(phone) ? phone[0] : phone;
  const initialCountryCode = Array.isArray(countryCode) ? countryCode[0] : countryCode;

  // Registration Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("Demo Com");
  const [trnVatNo, setTrnVatNo] = useState("TRN-12345");
  const [whatsappUpdate, setWhatsappUpdate] = useState(true);
  const [requirement, setRequirement] = useState("User");
  const [referralCode, setReferralCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(() =>
    getCountryFromPhone(initialPhoneNumber, initialCountryCode),
  );

  const handleRegister = async () => {
    if (!firstName || !lastName || !email) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const payload = {
      firstName,
      lastName,
      phoneNumber,
      email,
      companyName: companyName || "Demo Co",
      trnVatNo: trnVatNo || "TRN-12345",
      role: requirement,
      referralCode: referralCode || undefined,
    };

    try {
      await signUp(payload).unwrap();
      Alert.alert("Success", "Account created successfully. Please sign in.");
      router.replace("/(auth)/sign-in");
    } catch (error: any) {
      console.error("Registration error:", error);
      Alert.alert(
        "Error",
        error?.data?.message || "Registration failed. Please try again.",
      );
    }
  };

  // Modal Visibility State
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);

  // Web fallback for outlines
  const webOutline =
    Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {};

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
        {/* Logo Area */}
        <Animated.Image
          entering={FadeInUp.delay(200).duration(800)}
          source={require("../../assets/logo/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Phone Header */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(800)}
          style={styles.phoneRow}
        >
          <Image
            source={{ uri: selectedCountry.flag }}
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

        {/* Form Area */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(800)}
          style={styles.formContainer}
        >
          {/* Name Row */}
          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 20 }]}>
              <TextInput
                style={[styles.bottomInput, webOutline]}
                placeholder="First name"
                placeholderTextColor="#A0A0A0"
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <TextInput
                style={[styles.bottomInput, webOutline]}
                placeholder="Last name"
                placeholderTextColor="#A0A0A0"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Email */}
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

          {/* Company Name */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.bottomInput, webOutline]}
              placeholder="Company Name (Optional)"
              placeholderTextColor="#A0A0A0"
              value={companyName}
              onChangeText={setCompanyName}
            />
          </View>

          {/* TRN/VAT Number */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.bottomInput, webOutline]}
              placeholder="TRN/VAT Number (Optional)"
              placeholderTextColor="#A0A0A0"
              value={trnVatNo}
              onChangeText={setTrnVatNo}
            />
          </View>

          {/* Referral Code */}
          <TouchableOpacity
            style={styles.referralContainer}
            onPress={() => setShowReferralModal(true)}
          >
            <Text style={styles.referralText}>
              {referralCode
                ? `Referral Code: ${referralCode}`
                : `Have referral code ?`}
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>
              {isLoading ? "REGISTERING..." : "REGISTER"}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* ---------------- MODALS ---------------- */}

      {/* Change Phone Number Custom Popup */}
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
                    const nextPhoneNumber = newPhoneNumber.trim();
                    setPhoneNumber(nextPhoneNumber);
                    setSelectedCountry(getCountryFromPhone(nextPhoneNumber));
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

      {/* Requirement Selection Popup */}
      <Modal visible={showRequirementModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Requirement</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setRequirement("User");
                setShowRequirementModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>User</Text>
            </TouchableOpacity>
            <View style={styles.modalSeparator} />
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setRequirement("Rider");
                setShowRequirementModal(false);
              }}
            >
              <Text style={styles.modalOptionText}>Rider</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelFull}
              onPress={() => setShowRequirementModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Referral Code Popup */}
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
  requirementWrapper: {
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
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownValue: {
    fontSize: 15,
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
  registerButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "700",
  },
  checkboxRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#2B5FF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: "#2B5FF5",
  },
  checkboxText: {
    fontSize: 13,
    color: "#888",
  },
  otpHelperText: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    lineHeight: 18,
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
  modalOption: {
    paddingVertical: 16,
    alignItems: "center",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  modalSeparator: {
    height: 1,
    backgroundColor: "#EFEFEF",
    width: "100%",
  },
  modalCancelFull: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
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
