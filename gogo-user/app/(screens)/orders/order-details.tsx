import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image, Modal } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import CancelOrderModal from '../../../components/CancelOrderModal';
import InvoiceModal from '../../../components/InvoiceModal';
import { DropoffIcon, PickupIcon } from '../../../components/LocationIcons';
import { Colors } from '../../../constants/Colors';
import { useCancelOrderMutation, useGetOrderByIdQuery } from '../../../Redux/api/orderApi';

export default function OrderDetailsScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [showInvoice, setShowInvoice] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isProofImageModalVisible, setIsProofImageModalVisible] = useState(false);

    const { data: order, isLoading, isError, refetch } = useGetOrderByIdQuery(id as string, {
        skip: !id,
        refetchOnMountOrArgChange: true
    });
    const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

    const handleCancelOrder = () => {
        setShowCancelModal(true);
    };

    const confirmCancel = async (reason: string) => {
        const orderId = Array.isArray(id) ? id[0] : id;

        if (!orderId) {
            Alert.alert("Error", "Missing order id.");
            return;
        }

        try {
            await cancelOrder({ id: orderId, reason }).unwrap();
            setShowCancelModal(false);
            Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
            refetch();
        } catch (error: any) {
            Alert.alert("Error", error?.data?.message || "Failed to cancel order. Please try again.");
        }
    };

    const getStatusConfig = (status: string) => {
        // Map backend status to UI labels
        const statusMap: Record<string, string> = {
            'Pending': 'Order Placed',
            'Accepted': 'Driver Assigned',
            'ArrivedPickup': 'Rider Arrived',
            'InProgress': 'In Transit',
            'Completed': 'Delivered',
            'Cancelled': 'Cancelled'
        };

        const displayStatus = statusMap[status] || status;

        switch (displayStatus) {
            case 'Delivered':
                return { label: displayStatus, bg: '#E8F5E9', text: '#2E7D32', icon: 'checkmark-circle' as const };
            case 'In Transit':
                return { label: displayStatus, bg: '#E3F2FD', text: '#1565C0', icon: 'bicycle' as const };
            case 'Cancelled':
                return { label: displayStatus, bg: '#FFEBEE', text: '#C62828', icon: 'close-circle' as const };
            case 'Order Placed':
            case 'Driver Assigned':
            case 'Rider Arrived':
                return { label: displayStatus, bg: '#FFF3E0', text: '#EF6C00', icon: 'time' as const };
            default:
                return { label: displayStatus, bg: '#F5F5F5', text: '#616161', icon: 'help-circle' as const };
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    if (isError || !order) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Ionicons name="alert-circle-outline" size={64} color="#FF5252" />
                <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
                <Text style={styles.errorText}>We couldn't load your order details.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusConfig = getStatusConfig(order.status);
    const orderDisplayId = (order._id || order.id || "").slice(-8).toUpperCase();
    const driver = order.rider || order.driver;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.delay(100).duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Status Card */}
                <Animated.View
                    entering={FadeInDown.delay(200).duration(600)}
                    style={styles.statusCard}
                >
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                        <Ionicons name={statusConfig.icon} size={24} color={statusConfig.text} />
                        <Text style={[styles.statusText, { color: statusConfig.text }]}>
                            {statusConfig.label}
                        </Text>
                    </View>
                    <Text style={styles.orderId}>#{orderDisplayId}</Text>
                    <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </Animated.View>

                {/* Locations */}
                <Animated.View
                    entering={FadeInDown.delay(300).duration(600)}
                    style={styles.card}
                >
                    <Text style={styles.cardTitle}>Delivery Route</Text>

                    <View style={styles.locationContainer}>
                        <View style={styles.locationRow}>
                            <PickupIcon size={24} />
                            <View style={styles.locationTextContainer}>
                                <Text style={styles.locationLabel}>Pickup Location</Text>
                                <Text style={styles.locationText}>{order.pickup?.addressLine || order.pickupAddress}</Text>
                                {(order.pickup?.label || order.pickupAddressDetails) && (
                                    <Text style={styles.locationDetails}>{order.pickup?.label || order.pickupAddressDetails}</Text>
                                )}
                            </View>
                        </View>

                        <View style={styles.connector} />

                        <View style={styles.locationRow}>
                            <DropoffIcon size={24} />
                            <View style={styles.locationTextContainer}>
                                <Text style={styles.locationLabel}>Dropoff Location</Text>
                                <Text style={styles.locationText}>{order.dropoff?.addressLine || order.dropoffAddress}</Text>
                                {(order.dropoff?.label || order.dropoffAddressDetails) && (
                                    <Text style={styles.locationDetails}>{order.dropoff?.label || order.dropoffAddressDetails}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </Animated.View>

                {/* Driver Info */}
                <Animated.View
                    entering={FadeInDown.delay(400).duration(600)}
                    style={styles.card}
                >
                    <Text style={styles.cardTitle}>Driver Information</Text>

                    <View style={styles.driverContainer}>
                        <View style={styles.driverAvatar}>
                            {driver?.profileImage ? (
                                <Image source={{ uri: driver.profileImage }} style={styles.avatarImage} />
                            ) : (
                                <Ionicons name="person" size={32} color={Colors.primaryDark} />
                            )}
                        </View>
                        <View style={styles.driverInfo}>
                            <Text style={styles.driverName}>
                                {order.rider || order.driver
                                    ? ((order.rider?.firstName || order.rider?.lastName)
                                        ? `${order.rider?.firstName || ''} ${order.rider?.lastName || ''}`.trim()
                                        : order.rider?.name || order.driver?.name || 'Your Driver')
                                    : 'Searching for driver...'}
                            </Text>
                            {(order.rider || order.driver) && (
                                <View style={styles.ratingContainer}>
                                    <Ionicons name="star" size={14} color="#FFB800" />
                                    <Text style={styles.ratingText}>{order.rider?.rating || order.driver?.rating || '5.0'}</Text>
                                </View>
                            )}
                        </View>
                        {(order.rider?.phone || order.driver?.phone) && (
                            <TouchableOpacity style={styles.callButton}>
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>

                {/* Delivery Proof */}
                {order.completionProof && (
                    <Animated.View
                        entering={FadeInDown.delay(500).duration(600)}
                        style={styles.card}
                    >
                        <Text style={styles.cardTitle}>Delivery Proof</Text>
                        <TouchableOpacity 
                            activeOpacity={0.9} 
                            onPress={() => setIsProofImageModalVisible(true)}
                            style={styles.proofContainer}
                        >
                            <Image 
                                source={{ uri: order.completionProof }} 
                                style={styles.proofImage} 
                                resizeMode="cover"
                            />
                            <View style={styles.zoomIconContainer}>
                                <Ionicons name="expand" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Price Breakdown */}
                <Animated.View
                    entering={FadeInDown.delay(600).duration(600)}
                    style={styles.card}
                >
                    <Text style={styles.cardTitle}>Price Breakdown</Text>

                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Base Price</Text>
                        <Text style={styles.breakdownAmount}>AED {Number(order.originalPrice || order.price).toFixed(2)}</Text>
                    </View>
                    {order.discountAmount > 0 && (
                        <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Discount ({order.discountType})</Text>
                            <Text style={[styles.breakdownAmount, { color: '#2E7D32' }]}>-AED {Number(order.discountAmount).toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Service Fee</Text>
                        <Text style={styles.breakdownAmount}>AED {Number(order.serviceFee || 0).toFixed(2)}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>AED {Number(order.price).toFixed(2)}</Text>
                    </View>
                </Animated.View>

                {/* Actions */}
                <Animated.View
                    entering={FadeInDown.delay(700).duration(600)}
                    style={styles.actionsContainer}
                >
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setShowInvoice(true)}
                    >
                        <Ionicons name="receipt-outline" size={20} color={Colors.text} />
                        <Text style={styles.actionButtonText}>View Receipt</Text>
                    </TouchableOpacity>

                    {order.status === 'Completed' && (
                        order.review?.rating ? (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonPrimary, { opacity: 0.65 }]}
                                disabled={true}
                            >
                                <Ionicons name="star" size={20} color="#FFB800" />
                                <Text style={styles.actionButtonText}>Rated ({order.review.rating}★)</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.actionButtonPrimary]}
                                onPress={() => router.push({
                                    pathname: '/orders/rate-driver',
                                    params: { 
                                        orderId: order._id || order.id, 
                                        driverName: order.rider
                                            ? ((order.rider.firstName || order.rider.lastName)
                                                ? `${order.rider.firstName || ''} ${order.rider.lastName || ''}`.trim()
                                                : order.rider.name || 'Driver')
                                            : 'Driver'
                                    }
                                })}
                            >
                                <Ionicons name="star-outline" size={20} color={Colors.text} />
                                <Text style={styles.actionButtonText}>Rate Driver</Text>
                            </TouchableOpacity>
                        )
                    )}

                    {order.status === 'Pending' && (
                        <TouchableOpacity
                            style={[styles.actionButton, { borderColor: '#FF5252' }]}
                            onPress={handleCancelOrder}
                            disabled={isCancelling}
                        >
                            <Ionicons name="close-circle-outline" size={20} color="#FF5252" />
                            <Text style={[styles.actionButtonText, { color: '#FF5252' }]}>
                                {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>

            <InvoiceModal
                visible={showInvoice}
                onClose={() => setShowInvoice(false)}
                order={order}
            />

            <CancelOrderModal
                visible={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={confirmCancel}
            />

            {/* Full screen proof image viewer */}
            <Modal
                visible={isProofImageModalVisible}
                transparent={true}
                onRequestClose={() => setIsProofImageModalVisible(false)}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity 
                        style={styles.closeModalButton} 
                        onPress={() => setIsProofImageModalVisible(false)}
                    >
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>
                    {order.completionProof && (
                        <Image 
                            source={{ uri: order.completionProof }} 
                            style={styles.modalImage} 
                            resizeMode="contain" 
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
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#f8f9fa',
    },
    backButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    scrollContent: {
        padding: 24,
        paddingTop: 0,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 24,
        gap: 8,
        marginBottom: 12,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '700',
    },
    orderId: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 14,
        color: '#999',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    locationContainer: {
        gap: 0,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    locationText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    locationDetails: {
        fontSize: 14,
        color: '#666',
    },
    connector: {
        height: 20,
        width: 2,
        backgroundColor: '#E0E0E0',
        marginLeft: 11,
        marginVertical: 8,
    },
    driverContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    driverAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeline: {
        gap: 0,
    },
    timelineItem: {
        flexDirection: 'row',
        gap: 16,
    },
    timelineLeft: {
        alignItems: 'center',
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineDotCompleted: {
        backgroundColor: Colors.primaryDark,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 4,
    },
    timelineLineCompleted: {
        backgroundColor: Colors.primary,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 20,
    },
    timelineStatus: {
        fontSize: 15,
        fontWeight: '600',
        color: '#999',
        marginBottom: 2,
    },
    timelineStatusCompleted: {
        color: Colors.text,
    },
    timelineTime: {
        fontSize: 13,
        color: '#999',
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    breakdownLabel: {
        fontSize: 15,
        color: '#666',
    },
    breakdownAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 12,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    actionButtonPrimary: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    actionButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    retryButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    proofContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#f8f9fa',
        height: 200,
        position: 'relative',
    },
    proofImage: {
        width: '100%',
        height: '100%',
    },
    zoomIconContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 20,
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeModalButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    modalImage: {
        width: '100%',
        height: '80%',
    },
});
