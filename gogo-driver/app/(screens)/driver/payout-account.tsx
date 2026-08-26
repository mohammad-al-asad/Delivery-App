import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import {
  useGetDriverProfileQuery,
  useGetDriverStripeAccountQuery,
  useGetStripeLoginLinkMutation,
  useGetStripeOnboardingLinkMutation,
} from "../../../Redux/api/driverApi";

export default function PayoutAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetDriverProfileQuery({});
  const {
    data: stripeData,
    isLoading: isStripeLoading,
    refetch: refetchStripe,
  } = useGetDriverStripeAccountQuery({});

  const [getOnboardingLink] = useGetStripeOnboardingLinkMutation();
  const [getLoginLink, { isLoading: isOpeningDashboard }] =
    useGetStripeLoginLinkMutation();

  const user = profileData?.data || {};
  const payoutAccount = user?.payoutAccount || {};
  const isConnected =
    payoutAccount.status === "Connected" && payoutAccount.payoutsEnabled;
  const isPending =
    payoutAccount.status === "Pending" ||
    (payoutAccount.stripeAccountId && !payoutAccount.payoutsEnabled);

  const handleRefresh = async () => {
    await Promise.all([refetchProfile(), refetchStripe()]);
  };

  const handleStartStripeOnboarding = async () => {
    setIsProcessing(true);
    try {
      const res = await getOnboardingLink({}).unwrap();
      if (res?.data?.url) {
        // Open Stripe Express onboarding inside in-app WebView
        setOnboardingUrl(res.data.url);
      } else {
        Alert.alert("Error", "Could not generate Stripe onboarding link.");
      }
    } catch (error: any) {
      console.error("Stripe Onboarding error:", error);
      Alert.alert(
        "Onboarding Error",
        error?.data?.message || error.message || "Failed to launch Stripe setup."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      const res = await getLoginLink({}).unwrap();
      if (res?.data?.url) {
        setOnboardingUrl(res.data.url);
      } else {
        Alert.alert("Error", "Could not generate Stripe dashboard link.");
      }
    } catch (error: any) {
      console.error("Dashboard link error:", error);
      Alert.alert(
        "Error",
        error?.data?.message || "Failed to open Stripe dashboard."
      );
    }
  };

  const isLoading = isProfileLoading || isStripeLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout Account</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Status Hero Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIconBox,
                isConnected
                  ? styles.statusIconBoxSuccess
                  : isPending
                  ? styles.statusIconBoxWarning
                  : styles.statusIconBoxNeutral,
              ]}
            >
              <Ionicons
                name={
                  isConnected
                    ? "shield-checkmark"
                    : isPending
                    ? "time"
                    : "card-outline"
                }
                size={32}
                color={
                  isConnected
                    ? Colors.success
                    : isPending
                    ? "#D97706"
                    : "#64748B"
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.providerName}>Stripe Connect</Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusBadge,
                    isConnected
                      ? styles.statusBadgeSuccess
                      : isPending
                      ? styles.statusBadgeWarning
                      : styles.statusBadgeNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isConnected
                        ? styles.statusBadgeTextSuccess
                        : isPending
                        ? styles.statusBadgeTextWarning
                        : styles.statusBadgeTextNeutral,
                    ]}
                  >
                    {isConnected
                      ? "Direct Payouts Active"
                      : isPending
                      ? "Verification In Progress"
                      : "Setup Required"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.statusDescription}>
            {isConnected
              ? "Your Stripe Connected Account is active. Earnings from online card deliveries are automatically transferred directly to your bank account."
              : isPending
              ? "Your Stripe account is created but requires additional information or verification before payouts can be activated."
              : "Connect your bank account via Stripe to receive instant, automatic payouts for every delivery."}
          </Text>
        </View>

        {/* Bank & Account Details (If Connected) */}
        {isConnected && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Linked Payout Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Name</Text>
              <Text style={styles.detailValue}>
                {payoutAccount.bankName || "Linked Bank Account"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Account Number</Text>
              <Text style={styles.detailValue}>
                •••• •••• {payoutAccount.accountNumberLast4 || "••••"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Currency</Text>
              <Text style={styles.detailValue}>
                {payoutAccount.currency || "AED"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Country</Text>
              <Text style={styles.detailValue}>
                {payoutAccount.country || "AE"}
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!isConnected && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                isProcessing && styles.buttonDisabled,
              ]}
              onPress={handleStartStripeOnboarding}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#000" />
                  <Text style={styles.primaryButtonText}>
                    {isPending
                      ? "Complete Stripe Verification"
                      : "Connect Stripe Payout Account"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {isConnected && (
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                isOpeningDashboard && styles.buttonDisabled,
              ]}
              onPress={handleOpenStripeDashboard}
              disabled={isOpeningDashboard}
              activeOpacity={0.8}
            >
              {isOpeningDashboard ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name="open-outline"
                    size={20}
                    color={Colors.text}
                  />
                  <Text style={styles.secondaryButtonText}>
                    Manage Payouts in Stripe Dashboard
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={18} color="#64748B" />
            <Text style={styles.refreshButtonText}>Refresh Account Status</Text>
          </TouchableOpacity>
        </View>

        {/* Informational Guidelines */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#2D8C3C"
          />
          <Text style={styles.infoBoxText}>
            Payouts for card orders are automatically split based on the
            platform delivery parameters and sent straight to your connected
            bank account.
          </Text>
        </View>
      </ScrollView>

      {/* Stripe In-App WebView Modal */}
      <Modal
        visible={Boolean(onboardingUrl)}
        animationType="slide"
        onRequestClose={() => {
          setOnboardingUrl(null);
          handleRefresh();
        }}
      >
        <View style={[styles.webViewContainer, { paddingTop: insets.top }]}>
          <View style={styles.webViewHeader}>
            <Text style={styles.webViewTitle}>Stripe Payout Setup</Text>
            <TouchableOpacity
              onPress={() => {
                setOnboardingUrl(null);
                handleRefresh();
              }}
              style={styles.webViewCloseButton}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {onboardingUrl && (
            <WebView
              source={{ uri: onboardingUrl }}
              onShouldStartLoadWithRequest={(request) => {
                const url = request.url;
                if (
                  url.includes("stripe-connect/return") ||
                  url.includes("stripe-connect/success") ||
                  url.startsWith("gogodriver://")
                ) {
                  setOnboardingUrl(null);
                  handleRefresh();
                  Alert.alert(
                    "Setup Completed",
                    "Your Stripe payout account details were submitted. Refreshing your status..."
                  );
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(navState) => {
                const url = navState.url;
                if (
                  url.includes("stripe-connect/return") ||
                  url.includes("stripe-connect/success") ||
                  url.startsWith("gogodriver://")
                ) {
                  setOnboardingUrl(null);
                  handleRefresh();
                  Alert.alert(
                    "Setup Completed",
                    "Your Stripe payout account details were submitted. Refreshing your status..."
                  );
                }
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webViewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  webViewTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
  },
  webViewCloseButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  webViewLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  statusCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  statusIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  statusIconBoxSuccess: {
    backgroundColor: "#DCFCE7",
  },
  statusIconBoxWarning: {
    backgroundColor: "#FEF3C7",
  },
  statusIconBoxNeutral: {
    backgroundColor: "#F1F5F9",
  },
  providerName: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeSuccess: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeWarning: {
    backgroundColor: "#FEF3C7",
  },
  statusBadgeNeutral: {
    backgroundColor: "#F1F5F9",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgeTextSuccess: {
    color: "#166534",
  },
  statusBadgeTextWarning: {
    color: "#B45309",
  },
  statusBadgeTextNeutral: {
    color: "#64748B",
  },
  statusDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textLight,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  refreshButtonText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#F0FDF4",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCFCE7",
    alignItems: "flex-start",
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#166534",
  },
});
