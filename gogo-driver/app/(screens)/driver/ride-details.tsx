import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type LatLng } from "react-native-maps";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../../constants/Colors";
import { useGetOrderByIdQuery, useSubmitCompletionProofMutation, useCompleteRideMutation, useMarkCheckpointMutation } from "../../../Redux/api/driverApi";
import { formatCurrency } from "../../../utils/mockData";

const getLabel = (point: any) =>
  point?.addressLine || point?.label || "Unknown location";

const getUserName = (user: any) => {
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return full || user?.name || "Customer";
};

const formatDateTime = (iso: string | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
};

const STATUS_COLORS: Record<string, string> = {
  Pending: Colors.warning,
  Accepted: "#3B82F6",
  ArrivedPickup: "#8B5CF6",
  InProgress: Colors.primary,
  Completed: Colors.success,
  Cancelled: Colors.error,
};

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending",
  Accepted: "Accepted",
  ArrivedPickup: "Arrived at Pickup",
  InProgress: "In Progress",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_MAP_API_KEY;

const decodePolyline = (encoded: string): LatLng[] => {
  const coords: LatLng[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let shift = 0, result = 0, byte = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
};

const EMPTY_ARRAY: any[] = [];

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetOrderByIdQuery(id!);
  const [submitProof, { isLoading: isSubmitting }] = useSubmitCompletionProofMutation();
  const [completeRide] = useCompleteRideMutation();
  const [markCheckpoint, { isLoading: isMarkingCheckpoint }] = useMarkCheckpointMutation();

  const order = data?.data || data;
  const stoppages = order?.stoppages || EMPTY_ARRAY;
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Map markers & coordinates
  const mapRef = useRef<MapView>(null);
  const mapMarkers = useMemo(() => {
    if (!order) return [];
    const points: { lat: number; lng: number; color: string; label: string; type: string }[] = [];
    if (order.pickup?.latitude && order.pickup?.longitude) {
      points.push({ lat: order.pickup.latitude, lng: order.pickup.longitude, color: "green", label: "Pickup", type: "pickup" });
    }
    for (const s of stoppages) {
      if (s.latitude && s.longitude) {
        points.push({ lat: s.latitude, lng: s.longitude, color: "#8B5CF6", label: getLabel(s), type: "stop" });
      }
    }
    if (order.dropoff?.latitude && order.dropoff?.longitude) {
      points.push({ lat: order.dropoff.latitude, lng: order.dropoff.longitude, color: "red", label: "Drop-off", type: "dropoff" });
    }
    return points;
  }, [order, stoppages]);

  const polylineCoords = useMemo(
    () => mapMarkers.map((m) => ({ latitude: m.lat, longitude: m.lng })),
    [mapMarkers],
  );

  const hasValidCoords = mapMarkers.length >= 2 && mapMarkers.every((m) => m.lat !== 0 && m.lng !== 0);

  // Fetch road-following route from Google Directions API
  const [roadRoute, setRoadRoute] = useState<LatLng[]>([]);
  const routeKey = polylineCoords.map((c) => `${c.latitude},${c.longitude}`).join("|");

  useEffect(() => {
    if (!hasValidCoords || !GOOGLE_API_KEY || polylineCoords.length < 2) {
      if (roadRoute.length > 0) {
        setRoadRoute([]);
      }
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        const origin = `${polylineCoords[0].latitude},${polylineCoords[0].longitude}`;
        const dest = `${polylineCoords[polylineCoords.length - 1].latitude},${polylineCoords[polylineCoords.length - 1].longitude}`;
        const params = new URLSearchParams({ origin, destination: dest, key: GOOGLE_API_KEY, mode: "driving" });

        const waypoints = polylineCoords.slice(1, -1);
        if (waypoints.length > 0) {
          params.set("waypoints", waypoints.map((c) => `${c.latitude},${c.longitude}`).join("|"));
        }

        const res = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
          { signal: controller.signal },
        );
        const json = await res.json();
        const encoded = json?.routes?.[0]?.overview_polyline?.points;
        const decoded = encoded ? decodePolyline(encoded) : [];
        setRoadRoute(decoded);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          if (roadRoute.length > 0) {
            setRoadRoute([]);
          }
        }
      }
    })();

    return () => controller.abort();
  }, [routeKey, hasValidCoords]);

  const visibleRoute = roadRoute.length > 1 ? roadRoute : polylineCoords;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load ride details</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || Colors.textLight;
  const customer = order.user;
  const phone = customer?.phoneNumber;

  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
    else Alert.alert("No phone number", "Customer phone not available.");
  };

  const handleCheckpoint = async (pointType: "pickup" | "stoppage" | "dropoff", stoppageId?: string) => {
    const labels: Record<string, string> = { pickup: "Arrived at Pickup", stoppage: "Stoppage reached", dropoff: "Drop-off reached" };
    setActionLoading(stoppageId || pointType);
    try {
      await markCheckpoint({ orderId: id!, pointType, stoppageId }).unwrap();
      Alert.alert("Success", labels[pointType] + "!");
      refetch();
    } catch (err: any) {
      Alert.alert("Error", err?.data?.message || "Failed to update checkpoint.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to take a delivery proof photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets?.[0]) {
      setProofPhoto(result.assets[0].uri);
    }
  };

  const handleDeliver = async () => {
    if (!proofPhoto) {
      Alert.alert("Photo required", "Please take a photo as delivery proof before submitting.");
      return;
    }
    try {
      const formData = new FormData();
      const uri = proofPhoto;
      const filename = uri.split("/").pop() || "proof.jpg";
      const match = /\.([\w]+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("images", {
        uri,
        name: filename,
        type: mimeType,
      } as any);

      await submitProof({ orderId: id!, formData }).unwrap();
      Alert.alert("Success", "Delivery proof submitted!", [
        { text: "OK", onPress: () => { refetch(); setProofPhoto(null); } },
      ]);
    } catch (err: any) {
      console.error("Deliver error:", err);
      Alert.alert("Error", err?.data?.message || "Failed to submit delivery proof.");
    }
  };

  // Determine which actions to show based on order status
  const pendingStoppages = stoppages.filter((s: any) => !s.reachedAt);
  const hasCompletionProof = !!(order as any).completionProof;
  const isActiveRide = ["Accepted", "ArrivedPickup", "InProgress", "Completed"].includes(order.status);

  const routePoints = [
    { type: "pickup", label: getLabel(order.pickup), reached: !!order.pickupReachedAt, time: order.pickupReachedAt },
    ...stoppages.map((s: any, i: number) => ({
      type: "stoppage",
      label: getLabel(s),
      reached: !!s.reachedAt,
      time: s.reachedAt,
      sequence: s.sequence || i + 1,
    })),
    { type: "dropoff", label: getLabel(order.dropoff), reached: !!order.dropoffReachedAt, time: order.dropoffReachedAt },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
          <Text style={styles.statusChipText}>
            {STATUS_LABELS[order.status] || order.status}
          </Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.mapContainer}>
          {hasValidCoords ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: mapMarkers[0].lat,
                longitude: mapMarkers[0].lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onMapReady={() => {
                if (mapMarkers.length >= 2) {
                  mapRef.current?.fitToCoordinates(
                    mapMarkers.map((m) => ({ latitude: m.lat, longitude: m.lng })),
                    { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true },
                  );
                }
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {mapMarkers.map((m, i) => (
                <Marker
                  key={i}
                  coordinate={{ latitude: m.lat, longitude: m.lng }}
                  title={m.label}
                  pinColor={m.color}
                />
              ))}
              {visibleRoute.length >= 2 && (
                <Polyline
                  coordinates={visibleRoute}
                  strokeColor={Colors.gray[600]}
                  strokeWidth={3}
                />
              )}
            </MapView>
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={48} color={Colors.gray[300]} />
              <Text style={styles.mapFallbackText}>No location data</Text>
            </View>
          )}
        </Animated.View>

        {/* Customer Card */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.card}>
          <View style={styles.customerRow}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={22} color={Colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{getUserName(customer)}</Text>
              <Text style={styles.customerSub}>Customer</Text>
            </View>
            {phone && (
              <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
                <Ionicons name="call" size={20} color={Colors.success} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Route Timeline */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.card}>
          <Text style={styles.sectionTitle}>Route</Text>
          {routePoints.map((point, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === routePoints.length - 1;
            const iconName = isFirst ? "location" : isLast ? "flag" : "ellipse";
            const iconColor = isFirst ? Colors.success : isLast ? Colors.error : "#8B5CF6";

            return (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, { backgroundColor: point.reached ? iconColor : Colors.gray[200] }]}>
                    <Ionicons name={iconName as any} size={isFirst || isLast ? 14 : 8} color={Colors.white} />
                  </View>
                  {!isLast && (
                    <View style={[styles.timelineLine, point.reached ? { backgroundColor: iconColor } : {}]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>
                    {isFirst ? "Pickup" : isLast ? "Drop-off" : `Stop ${(point as any).sequence || idx}`}
                  </Text>
                  <Text style={styles.timelineAddress} numberOfLines={2}>{point.label}</Text>
                  {point.reached && point.time && (
                    <Text style={styles.timelineTime}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.success} /> {formatDateTime(point.time)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>

        {/* Order Summary */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.card}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Distance</Text>
            <Text style={styles.summaryValue}>
              {order.distanceKm ? `${Number(order.distanceKm).toFixed(1)} km` : "—"}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle Type</Text>
            <Text style={styles.summaryValue}>{order.vehicleType || "—"}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method</Text>
            <Text style={styles.summaryValue}>{order.paymentMethod || "—"}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Status</Text>
            <View style={[styles.payBadge, { backgroundColor: order.paymentStatus === "Paid" ? Colors.success : Colors.warning }]}>
              <Text style={styles.payBadgeText}>{order.paymentStatus || "Unpaid"}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { fontWeight: "700", color: Colors.text }]}>Fare</Text>
            <Text style={styles.fareValue}>{formatCurrency(order.price || 0)}</Text>
          </View>

          {order.notes ? (
            <>
              <View style={styles.divider} />
              <View style={{ paddingTop: 8 }}>
                <Text style={styles.summaryLabel}>Notes</Text>
                <Text style={[styles.summaryValue, { marginTop: 4 }]}>{order.notes}</Text>
              </View>
            </>
          ) : null}
        </Animated.View>

        {/* Timestamps */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)} style={[styles.card, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {[
            { label: "Requested", time: order.createdAt },
            { label: "Accepted", time: order.acceptedAt },
            { label: "Pickup Reached", time: order.pickupReachedAt },
            { label: "Trip Started", time: order.tripStartedAt },
            { label: "Completed", time: order.completedAt },
            { label: "Cancelled", time: order.cancelledAt },
          ]
            .filter((t) => t.time)
            .map((t, i) => (
              <View key={i} style={styles.timeRow}>
                <Ionicons name="time-outline" size={16} color={Colors.textLight} />
                <Text style={styles.timeLabel}>{t.label}</Text>
                <Text style={styles.timeValue}>{formatDateTime(t.time)}</Text>
              </View>
            ))}
        </Animated.View>

        {/* Actions */}
        {isActiveRide && (
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.deliverSection}>
            <Text style={styles.sectionTitle}>Actions</Text>

            {/* Step 1: Arrived at Pickup */}
            {order.status === "Accepted" && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#3B82F6" }]}
                onPress={() => handleCheckpoint("pickup")}
                disabled={actionLoading === "pickup"}
              >
                {actionLoading === "pickup" ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="navigate" size={20} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Arrived at Pickup</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Step 2: Mark stoppages */}
            {(order.status === "ArrivedPickup" || order.status === "InProgress") && pendingStoppages.length > 0 && (
              <View style={{ gap: 10 }}>
                <Text style={styles.subLabel}>
                  {pendingStoppages.length} stoppage{pendingStoppages.length > 1 ? "s" : ""} remaining
                </Text>
                {pendingStoppages.map((s: any, i: number) => (
                  <TouchableOpacity
                    key={s._id || i}
                    style={[styles.actionBtn, { backgroundColor: "#8B5CF6" }]}
                    onPress={() => handleCheckpoint("stoppage", s._id)}
                    disabled={actionLoading === s._id}
                  >
                    {actionLoading === s._id ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <Ionicons name="flag-outline" size={20} color={Colors.white} />
                        <Text style={styles.actionBtnText} numberOfLines={1}>
                          Reached: {getLabel(s)}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Step 3: Drop-off (all stoppages done) */}
            {(order.status === "ArrivedPickup" || order.status === "InProgress") && pendingStoppages.length === 0 && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                onPress={() => handleCheckpoint("dropoff")}
                disabled={actionLoading === "dropoff"}
              >
                {actionLoading === "dropoff" ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-done-circle" size={20} color={Colors.white} />
                    <Text style={styles.actionBtnText}>Complete Drop-off</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Step 4: Submit delivery proof (after Completed) */}
            {order.status === "Completed" && !hasCompletionProof && (
              <>
                {proofPhoto ? (
                  <View style={styles.proofPreview}>
                    <Image source={{ uri: proofPhoto }} style={styles.proofImage} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={handleTakePhoto}>
                      <Ionicons name="camera-reverse-outline" size={18} color={Colors.text} />
                      <Text style={styles.retakeBtnText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.takePhotoBtn} onPress={handleTakePhoto}>
                    <Ionicons name="camera-outline" size={28} color={Colors.primary} />
                    <Text style={styles.takePhotoBtnText}>Take Proof Photo</Text>
                    <Text style={styles.takePhotoSub}>Tap to open camera</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.deliverBtn, (!proofPhoto || isSubmitting) && styles.deliverBtnDisabled]}
                  onPress={handleDeliver}
                  disabled={!proofPhoto || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload" size={22} color={Colors.white} />
                      <Text style={styles.deliverBtnText}>Submit Delivery Proof</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {order.status === "Completed" && hasCompletionProof && (
              <View style={styles.proofDone}>
                <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
                <Text style={styles.proofDoneText}>Delivery proof submitted</Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.background },
  errorText: { fontSize: 16, color: Colors.textLight, marginTop: 12 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 8 },
  retryText: { fontWeight: "600", color: Colors.secondary },

  header: {
    flexDirection: "row", alignItems: "center", paddingTop: 54, paddingBottom: 16,
    paddingHorizontal: 20, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "700", color: Colors.text },
  statusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusChipText: { fontSize: 11, fontWeight: "700", color: Colors.white },

  scroll: { flex: 1, padding: 16 },

  mapContainer: {
    height: 220, borderRadius: 16, overflow: "hidden", marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  map: { flex: 1 },
  mapFallback: {
    flex: 1, backgroundColor: Colors.gray[100],
    alignItems: "center", justifyContent: "center",
  },
  mapFallbackText: { fontSize: 14, color: Colors.gray[400], marginTop: 8 },

  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 16 },

  customerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  customerName: { fontSize: 17, fontWeight: "700", color: Colors.text },
  customerSub: { fontSize: 13, color: Colors.textLight, marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#ECFDF5",
    alignItems: "center", justifyContent: "center",
  },

  timelineItem: { flexDirection: "row", minHeight: 60 },
  timelineLeft: { width: 32, alignItems: "center" },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center", zIndex: 1,
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: Colors.gray[200], marginVertical: 2,
  },
  timelineContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  timelineLabel: { fontSize: 13, fontWeight: "600", color: Colors.textLight, marginBottom: 2 },
  timelineAddress: { fontSize: 15, fontWeight: "600", color: Colors.text },
  timelineTime: { fontSize: 12, color: Colors.success, marginTop: 4 },

  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: Colors.textLight },
  summaryValue: { fontSize: 14, fontWeight: "600", color: Colors.text },
  fareValue: { fontSize: 20, fontWeight: "800", color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.border },

  payBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  payBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.white },

  timeRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  timeLabel: { flex: 1, fontSize: 14, color: Colors.textLight },
  timeValue: { fontSize: 13, fontWeight: "600", color: Colors.text },

  deliverSection: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 20,
    marginBottom: 40, borderWidth: 1, borderColor: Colors.border,
  },
  takePhotoBtn: {
    alignItems: "center", justifyContent: "center", paddingVertical: 28,
    borderWidth: 2, borderColor: Colors.gray[200], borderStyle: "dashed",
    borderRadius: 12, backgroundColor: Colors.gray[50], marginBottom: 16,
  },
  takePhotoBtnText: { fontSize: 15, fontWeight: "700", color: Colors.text, marginTop: 8 },
  takePhotoSub: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  proofPreview: { marginBottom: 16 },
  proofImage: { width: "100%", height: 200, borderRadius: 12, backgroundColor: Colors.gray[100] },
  retakeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 8, marginTop: 8,
  },
  retakeBtnText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  deliverBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.success, paddingVertical: 16, paddingHorizontal: 16, borderRadius: 14,
    gap: 8, shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  deliverBtnDisabled: { opacity: 0.5 },
  deliverBtnText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, gap: 8,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  actionBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white, flexShrink: 1 },
  subLabel: { fontSize: 13, color: Colors.textLight, marginBottom: 4 },
  proofDone: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16,
  },
  proofDoneText: { fontSize: 15, fontWeight: "600", color: Colors.success },
});
