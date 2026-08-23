import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Colors } from "../../../constants/Colors";
import { useGetDriverProfileQuery } from "../../../Redux/api/driverApi";

export default function ReferralScreen() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const { data: profileData } = useGetDriverProfileQuery({});
  const user = profileData?.data;
  const referralCode = user?.referralCode || "...";

  const handleCopy = async () => {
    if (!user?.referralCode) return;
    await Clipboard.setStringAsync(user.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!user?.referralCode) return;
    try {
      await Share.share({
        message: `Hey! Use my referral code ${user.referralCode} to sign up as a driver on GOGO and earn a bonus!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Illustration */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={styles.imageContainer}
        >
          <Ionicons name="gift" size={150} color="#4CAF50" />
        </Animated.View>

        {/* Text Content */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          style={styles.textContainer}
        >
          <Text style={styles.title}>Invite Friends</Text>
          <Text style={styles.subtitle}>
            Share your code with friends and get{" "}
            <Text style={styles.highlight}>AED 50.00</Text> when they complete 10
            rides!
          </Text>
        </Animated.View>

        {/* Code Box */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={styles.codeContainer}
        >
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <TouchableOpacity
            style={styles.codeBox}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <Text style={styles.codeText}>{referralCode}</Text>
            <View style={styles.copyButton}>
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={20}
                color={copied ? "#4CAF50" : Colors.primaryDark}
              />
              <Text
                style={[styles.copyText, copied && { color: "#4CAF50" }]}
              >
                {copied ? "Copied" : "Copy"}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Share Button */}
        <Animated.View
          entering={FadeInDown.delay(500)}
          style={styles.actionContainer}
        >
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Text style={styles.shareButtonText}>Share Code</Text>
            <Ionicons name="share-outline" size={20} color="#000" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center", // Center vertically
    marginTop: -60, // Offset header height slightly
  },
  imageContainer: {
    width: "100%",
    height: 250,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  highlight: {
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  codeContainer: {
    width: "100%",
    marginBottom: 40,
  },
  codeLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderStyle: "dashed",
  },
  codeText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    letterSpacing: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  copyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primaryDark,
    marginLeft: 6,
  },
  actionContainer: {
    width: "100%",
  },
  shareButton: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginRight: 12,
  },
});
