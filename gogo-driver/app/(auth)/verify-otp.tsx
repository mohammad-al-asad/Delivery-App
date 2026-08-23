import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "../../components/Button";
import { Colors } from "../../constants/Colors";
import { useVerifyUserPhoneMutation } from "../../Redux/api/authApi";
import { useAppDispatch } from "../../Redux/hooks";
import { setUser } from "../../Redux/Slice/authSlice";

declare global {
  interface Window {
    confirmationResult: any;
  }
}

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const phoneNumber = Array.isArray(phone) ? phone[0] : phone;
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [verifyUserPhone] = useVerifyUserPhoneMutation();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      Alert.alert("Error", "Please enter a 6-digit OTP");
      return;
    }

    if (!phoneNumber) {
      Alert.alert("Error", "Phone number is missing. Please sign in again.");
      return;
    }

    setLoading(true);
    try {
      if (!window.confirmationResult) {
        Alert.alert(
          "Error",
          "No verification process found. Please go back and try again.",
        );
        return;
      }

      const userCredential = await window.confirmationResult.confirm(otpCode);
      const idToken = await userCredential.user.getIdToken();

      const response = await verifyUserPhone({
        phoneNumber,
        idToken,
      }).unwrap();
      console.log("Response verify ===> ", response);

      if (response?.success) {
        const { user, accessToken, refreshToken } = response.data ?? {};

        if (!user || !accessToken || !refreshToken) {
          throw new Error("Verification response is missing auth data.");
        }

        // Check if the user is a Driver (Rider)
        if (user.role !== "Rider") {
          Alert.alert(
            "Access Denied",
            "This app is only for Drivers. Please use the GOGO User app.",
          );
          return;
        }

        dispatch(
          setUser({
            user,
            token: accessToken,
            refreshToken,
          }),
        );

        if (user.status !== "Approved") {
          Alert.alert(
            "Complete onboarding",
            "Please complete all required onboarding steps and wait for admin approval before going online.",
          );
        } else {
          Alert.alert("Success", "Verification successful!");
        }
        router.replace("/(tab)/driver");
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      Alert.alert(
        "Error",
        error?.data?.message ||
          error?.message ||
          "Verification failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    router.replace("/(auth)/sign-in");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Verify Code</Text>
        <Text style={styles.subtitle}>
          Please enter the 6-digit code sent to your phone
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title="Verify"
          onPress={handleVerify}
          style={styles.verifyButton}
          loading={loading}
          disabled={otp.some((digit) => !digit)}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.linkText}>Start again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  form: {
    width: "100%",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    backgroundColor: "#F9F9F9",
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: "#fff",
  },
  verifyButton: {
    marginTop: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#666",
    fontSize: 15,
  },
  linkText: {
    color: Colors.primaryDark,
    fontWeight: "700",
    fontSize: 15,
  },
});
