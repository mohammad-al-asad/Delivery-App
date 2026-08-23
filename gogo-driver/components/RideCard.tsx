import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { Ride } from "../types";
import { formatCurrency } from "../utils/mockData";

interface RideCardProps {
  ride: Ride;
  onAccept?: () => void;
  onReject?: () => void;
  onComplete?: () => void;
  onPress?: () => void;
  showActions?: boolean;
  isAccepting?: boolean;
}

export function RideCard({
  ride,
  onAccept,
  onReject,
  onComplete,
  onPress,
  showActions = false,
  isAccepting = false,
}: RideCardProps) {
  const { passenger, pickup, dropoff, fare, distance, status } = ride;

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return Colors.warning;
      case "active":
        return Colors.primary;
      case "completed":
        return Colors.success;
      default:
        return Colors.textLight;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.header}>
        <View style={styles.locationsHeader}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={18} color={Colors.primary} />
            <Text style={styles.headerLocationText} numberOfLines={1}>
              {pickup.address}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={18} color={Colors.error} />
            <Text style={styles.headerLocationText} numberOfLines={1}>
              {dropoff.address}
            </Text>
          </View>
        </View>
        <View
          style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
        >
          <Text style={styles.statusText}>{status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoRow}>
          <Ionicons name="car" size={16} color={Colors.textLight} />
          <Text style={styles.infoText}>{distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Fare:</Text>
          <Text style={styles.fareAmount}>{formatCurrency(fare)}</Text>
        </View>
      </View>

      {(showActions || onAccept || onReject || onComplete) && (
        <View style={styles.actions}>
          {onComplete ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onComplete}
            >
              <Text style={styles.acceptText}>Complete</Text>
            </TouchableOpacity>
          ) : (
            <>
              {(showActions || onReject) && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={onReject}
                >
                  <Text style={styles.rejectText}>Reject</Text>
                </TouchableOpacity>
              )}
              {(showActions || onAccept || isAccepting) && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.acceptButton,
                    isAccepting && { opacity: 0.7 },
                  ]}
                  onPress={onAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <ActivityIndicator size="small" color={Colors.secondary} />
                  ) : (
                    <Text style={styles.acceptText}>Accept</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  locationsHeader: {
    flex: 1,
    gap: 8,
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  headerLocationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  rating: {
    fontSize: 12,
    color: Colors.textLight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 28,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  fareContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fareLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectButton: {
    backgroundColor: Colors.gray[100],
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  rejectText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
