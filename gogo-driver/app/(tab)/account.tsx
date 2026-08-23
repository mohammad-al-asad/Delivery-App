import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import {
  useDeleteMyAccountMutation,
  useGetDriverProfileQuery,
  useUpdateDriverProfileMutation,
} from "../../Redux/api/driverApi";
import { useAppDispatch, useAppSelector } from "../../Redux/hooks";
import { logout, updateUser } from "../../Redux/Slice/authSlice";

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const { data: profileData, isLoading } = useGetDriverProfileQuery({});
  const [updateDriverProfile, { isLoading: isUpdatingProfile }] =
    useUpdateDriverProfileMutation();
  const [deleteMyAccount, { isLoading: isDeletingAccount }] =
    useDeleteMyAccountMutation();

  const user = profileData?.data || authUser;
  const [isTaxModalVisible, setIsTaxModalVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [trnNo, setTrnNo] = useState("");
  const [trnAddress, setTrnAddress] = useState("");
  const [companyName, setCompanyName] = useState("");

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.name ||
    "Driver";
  const userEmail = user?.email || "No email added";
  const avatarInitials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((name: string) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "D";
  const hasTaxDetails = Boolean(user?.trnVatNo || trnNo);

  useEffect(() => {
    setTrnNo(user?.trnVatNo || "");
    setCompanyName(user?.companyName || "");
  }, [user?.companyName, user?.trnVatNo]);

  const handleConfirmTax = async () => {
    if (!trnNo || !trnAddress || !companyName) {
      Alert.alert("Error", "Please fill in all tax details.");
      return;
    }

    try {
      const response = await updateDriverProfile({
        trnVatNo: trnNo,
        companyName,
      }).unwrap();

      if (response?.data) {
        dispatch(updateUser(response.data));
      }

      setIsTaxModalVisible(false);
      Alert.alert("Success", "Tax details saved successfully.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.data?.message || "Could not save tax details."
      );
    }
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo access to upload a profile image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("profileImage", {
      uri: asset.uri,
      name: asset.fileName || "profile-image.jpg",
      type: asset.mimeType || "image/jpeg",
    } as any);

    try {
      const response = await updateDriverProfile(formData).unwrap();
      if (response?.data) {
        dispatch(updateUser(response.data));
      }
      Alert.alert("Success", "Profile image updated.");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.data?.message || "Could not upload image."
      );
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          dispatch(logout());
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your driver account. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMyAccount({}).unwrap();
              dispatch(logout());
              router.replace("/(auth)/sign-in");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.data?.message || "Could not delete your account."
              );
            }
          },
        },
      ]
    );
  };

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      Alert.alert(
        "Verification Requested",
        "We've sent a verification link to your email."
      );
    }, 1500);
  };

  if (isLoading && !user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={Colors.primaryDark} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.watermarkContainer}>
          <Ionicons
            name="person-circle-outline"
            size={240}
            color="#9ef586"
            style={{ opacity: 0.15, transform: [{ rotate: "-15deg" }] }}
          />
        </View>

        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={handlePickImage}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ActivityIndicator color="#9ef586" />
              ) : user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarInitials}>{avatarInitials}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editIconOverlay}
              onPress={handlePickImage}
              disabled={isUpdatingProfile}
            >
              <Ionicons name="camera" size={14} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.userName}>{userName}</Text>
          <View style={styles.emailRow}>
            <Text style={styles.emailText}>{userEmail}</Text>
            {hasTaxDetails ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedBadgeText}>Verified</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={handleVerify}
                disabled={isVerifying}
              >
                <Text style={styles.verifyText}>
                  {isVerifying ? "Verifying..." : "Verify"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {hasTaxDetails ? (
            <View style={styles.trnBadgeContainer}>
              <Ionicons
                name="shield-checkmark"
                size={16}
                color="#000"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.trnBadgeText}>TRN: {trnNo}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addTaxBtn}
              onPress={() => setIsTaxModalVisible(true)}
            >
              <Ionicons name="document-text" size={18} color="#000" />
              <Text style={styles.addTaxBtnText}>Add UAE Tax Details</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.twoCardRow}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/driver/documents")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="document-text" size={22} color="#2563EB" />
            </View>
            <Text style={styles.gridCardText}>Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/driver/help-center")}
          >
            <View style={[styles.iconCircle, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="help-buoy" size={22} color="#EA580C" />
            </View>
            <Text style={styles.gridCardText}>Help & Support</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.referCard}>
          <View style={styles.referCardLeft}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: "#9ef586", marginBottom: 0, opacity: 0.9 },
              ]}
            >
              <Ionicons name="gift" size={22} color="#000" />
            </View>
            <View style={styles.referTextCombo}>
              <Text style={styles.referTitle}>Refer and earn</Text>
              <Text style={styles.referSubtitle}>
                Get AED 10 for each friend
              </Text>
            </View>
          </View>
          <View style={styles.referCardRight}>
            <TouchableOpacity
              style={styles.inviteBtn}
              onPress={() => router.push("/driver/referral")}
            >
              <Text style={styles.inviteBtnText}>Invite</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/driver/edit-profile")}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#F8FAFC" }]}>
              <Ionicons name="settings-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.menuItemText}>Account Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/driver/vehicle-info")}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#F8FAFC" }]}>
              <Ionicons name="car-outline" size={20} color="#64748B" />
            </View>
            <Text style={styles.menuItemText}>Vehicle Information</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/driver/documents")}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#F8FAFC" }]}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#64748B"
              />
            </View>
            <Text style={styles.menuItemText}>Documents</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/driver/terms-of-service")}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#F8FAFC" }]}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color="#64748B"
              />
            </View>
            <Text style={styles.menuItemText}>Terms & Conditions</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/driver/privacy-policy")}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#F8FAFC" }]}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#64748B"
              />
            </View>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/driver/about-us")}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#F8FAFC" }]}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#64748B"
              />
            </View>
            <Text style={styles.menuItemText}>About Us</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: "#FFF1F2" }]}>
              <Ionicons name="trash-outline" size={20} color="#E11D48" />
            </View>
            <Text style={[styles.menuItemText, { color: "#E11D48" }]}>
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={[styles.menuIconCircle, { backgroundColor: "#FFF1F2" }]}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#E11D48"
                style={{ marginLeft: 3 }}
              />
            </View>
            <Text style={[styles.menuItemText, { color: "#E11D48" }]}>
              Logout
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>App version 1.0.0</Text>
      </ScrollView>

      <Modal
        visible={isTaxModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTaxModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>UAE Tax Details</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your TRN info below
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTaxModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TRN Number</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Ex: 104143405900003"
                placeholderTextColor="#94A3B8"
                value={trnNo}
                onChangeText={setTrnNo}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TRN Registered Address</Text>
              <TextInput
                style={styles.inputField}
                placeholder="Enter full address"
                placeholderTextColor="#94A3B8"
                value={trnAddress}
                onChangeText={setTrnAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Company Name / Personal Name
              </Text>
              <TextInput
                style={styles.inputField}
                placeholder="Ex: My Cargo LLC"
                placeholderTextColor="#94A3B8"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmTax}
              disabled={isUpdatingProfile}
            >
              <Text style={styles.confirmBtnText}>
                {isUpdatingProfile ? "Saving..." : "Save Tax Details"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkContainer: {
    position: "absolute",
    top: -40,
    right: -60,
    zIndex: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
    backgroundColor: "#fcfcfc",
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#9ef586",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "800",
    color: "#9ef586",
  },
  editIconOverlay: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#9ef586",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fcfcfc",
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#000",
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  emailText: {
    fontSize: 15,
    color: "#64748B",
    marginRight: 10,
  },
  verifyBtn: {
    backgroundColor: "#9ef586",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifyText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
    marginLeft: 4,
  },
  addTaxBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "#9ef586",
    borderWidth: 1,
    borderColor: "#000",
  },
  addTaxBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },
  trnBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  trnBadgeText: {
    color: "#9ef586",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  twoCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    flex: 1,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  gridCardText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  referCard: {
    backgroundColor: "#000",
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  referCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  referTextCombo: {
    marginLeft: 16,
    flex: 1,
  },
  referTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#9ef586",
    marginBottom: 2,
  },
  referSubtitle: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.7,
  },
  referCardRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  inviteBtn: {
    backgroundColor: "#9ef586",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  inviteBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },
  menuList: {
    backgroundColor: "#fff",
    borderRadius: 28,
    paddingVertical: 8,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  menuIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginLeft: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F8FAFC",
    marginLeft: 78,
    marginRight: 20,
  },
  versionText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 32,
    padding: 24,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  modalCloseBtn: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputField: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  confirmBtn: {
    backgroundColor: "#000",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 10,
  },
  confirmBtnText: {
    color: "#9ef586",
    fontSize: 16,
    fontWeight: "800",
  },
});
