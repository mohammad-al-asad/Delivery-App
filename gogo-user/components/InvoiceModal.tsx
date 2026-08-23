
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface InvoiceModalProps {
    visible: boolean;
    onClose: () => void;
    order: any;
}

const STATUS_LABELS: Record<string, string> = {
    Pending: 'Order Placed',
    Accepted: 'Driver Assigned',
    ArrivedPickup: 'Rider Arrived',
    InProgress: 'In Transit',
    Completed: 'Delivered',
    Cancelled: 'Cancelled',
};

const formatCurrency = (value?: number | string) => `AED ${Number(value || 0).toFixed(2)}`;

const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })}`;
};

const getPersonName = (person?: any) => {
    if (!person) return 'N/A';

    return (
        [person.firstName, person.lastName].filter(Boolean).join(' ') ||
        person.name ||
        person.fullName ||
        'N/A'
    );
};

const getLocationTitle = (location?: any, fallback?: string) =>
    location?.addressLine || fallback || 'N/A';

const getLocationDetails = (location?: any, fallback?: string) =>
    location?.label || fallback || '';

export default function InvoiceModal({ visible, onClose, order }: InvoiceModalProps) {
    if (!visible) return null;

    const orderId = order._id || order.id || order.orderId || '';
    const shortOrderId = orderId ? `#${String(orderId).slice(-8).toUpperCase()}` : 'N/A';
    const customer = order.user || order.customer;
    const rider = order.rider || order.driver;
    const status = STATUS_LABELS[order.status] || order.status || 'N/A';
    const pickupTitle = getLocationTitle(order.pickup, order.pickupAddress);
    const pickupDetails = getLocationDetails(order.pickup, order.pickupAddressDetails);
    const dropoffTitle = getLocationTitle(order.dropoff, order.dropoffAddress);
    const dropoffDetails = getLocationDetails(order.dropoff, order.dropoffAddressDetails);
    const basePrice = order.originalPrice ?? order.price;
    const discountAmount = Number(order.discountAmount || 0);
    const serviceFee = Number(order.serviceFee || 0);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={ZoomIn.duration(300)}
                    style={styles.modalContainer}
                >
                    <View style={styles.invoiceCard}>
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Ionicons name="cube" size={24} color={Colors.primary} />
                                <Text style={styles.logoText}>GOGO</Text>
                            </View>
                            <Text style={styles.invoiceTitle}>INVOICE</Text>
                        </View>

                        <View style={styles.divider} />

                        <ScrollView
                            style={styles.scrollArea}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.row}>
                                <View style={styles.metaColumn}>
                                    <Text style={styles.label}>Order ID</Text>
                                    <Text style={styles.value}>{shortOrderId}</Text>
                                </View>
                                <View style={[styles.metaColumn, styles.alignRight]}>
                                    <Text style={styles.label}>Created</Text>
                                    <Text style={[styles.value, styles.rightText]}>
                                        {formatDateTime(order.createdAt || order.date)}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoGrid}>
                                <InfoItem label="Status" value={status} />
                                <InfoItem label="Payment" value={order.paymentStatus || 'N/A'} />
                                <InfoItem label="Vehicle" value={order.vehicleType || 'N/A'} />
                                <InfoItem
                                    label="Distance"
                                    value={order.distanceKm ? `${Number(order.distanceKm).toFixed(2)} km` : 'N/A'}
                                />
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Customer</Text>
                                <Text style={styles.customerName}>{getPersonName(customer)}</Text>
                                {!!customer?.phoneNumber && (
                                    <Text style={styles.customerInfo}>{customer.phoneNumber}</Text>
                                )}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Driver</Text>
                                <Text style={styles.customerName}>
                                    {rider ? getPersonName(rider) : 'Searching for driver'}
                                </Text>
                                {!!rider?.phoneNumber && (
                                    <Text style={styles.customerInfo}>{rider.phoneNumber}</Text>
                                )}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Delivery Route</Text>
                                <RouteItem label="Pickup" title={pickupTitle} details={pickupDetails} />

                                {Array.isArray(order.stoppages) && order.stoppages.map((stop: any, index: number) => (
                                    <RouteItem
                                        key={stop._id || `${stop.addressLine}-${index}`}
                                        label={`Stop ${index + 1}`}
                                        title={getLocationTitle(stop)}
                                        details={getLocationDetails(stop)}
                                    />
                                ))}

                                <RouteItem label="Dropoff" title={dropoffTitle} details={dropoffDetails} />
                            </View>

                            {!!order.notes && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Notes</Text>
                                    <Text style={styles.customerInfo}>{order.notes}</Text>
                                </View>
                            )}

                            <View style={styles.itemsContainer}>
                                <View style={styles.tableHeader}>
                                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Description</Text>
                                    <Text style={styles.tableHeaderText}>Amount</Text>
                                </View>

                                <PriceRow label="Base Price" amount={formatCurrency(basePrice)} />

                                {discountAmount > 0 && (
                                    <PriceRow
                                        label={`Discount${order.discountType ? ` (${order.discountType})` : ''}`}
                                        amount={`-${formatCurrency(discountAmount)}`}
                                        isDiscount
                                    />
                                )}

                                <PriceRow label="Service Fee" amount={formatCurrency(serviceFee)} />
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total</Text>
                                <Text style={styles.totalAmount}>{formatCurrency(order.price)}</Text>
                            </View>

                            {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Status History</Text>
                                    {order.statusHistory.map((item: any, index: number) => (
                                        <View key={`${item.status}-${index}`} style={styles.historyRow}>
                                            <Text style={styles.historyStatus}>
                                                {STATUS_LABELS[item.status] || item.status}
                                            </Text>
                                            <Text style={styles.historyDate}>{formatDateTime(item.changedAt)}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
{/* 
                        <TouchableOpacity style={styles.downloadButton} >
                            <Ionicons name="download-outline" size={20} color="#fff" />
                            <Text style={styles.downloadText}>Download PDF</Text>
                        </TouchableOpacity> */}

                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoItem}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function RouteItem({ label, title, details }: { label: string; title: string; details?: string }) {
    return (
        <View style={styles.routeItem}>
            <Text style={styles.routeLabel}>{label}</Text>
            <Text style={styles.routeTitle}>{title}</Text>
            {!!details && <Text style={styles.customerInfo}>{details}</Text>}
        </View>
    );
}

function PriceRow({ label, amount, isDiscount }: { label: string; amount: string; isDiscount?: boolean }) {
    return (
        <View style={styles.tableRow}>
            <Text style={[styles.tableText, { flex: 1 }]}>
                {label}
            </Text>
            <Text style={[styles.tableText, isDiscount && styles.discountText]}>{amount}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 400,
        maxHeight: '90%',
    },
    invoiceCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        maxHeight: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: 1,
    },
    invoiceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#999',
        letterSpacing: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    metaColumn: {
        flex: 1,
    },
    alignRight: {
        alignItems: 'flex-end',
    },
    rightText: {
        textAlign: 'right',
    },
    label: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    value: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    scrollArea: {
        marginBottom: 16,
    },
    scrollContent: {
        paddingBottom: 4,
    },
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 20,
        marginBottom: 4,
    },
    infoItem: {
        width: '47%',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    customerName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    customerInfo: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    routeItem: {
        borderLeftWidth: 2,
        borderLeftColor: '#E0E0E0',
        paddingLeft: 12,
        paddingBottom: 14,
    },
    routeLabel: {
        fontSize: 11,
        color: '#999',
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 4,
    },
    routeTitle: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '700',
        lineHeight: 20,
    },
    itemsContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        paddingBottom: 8,
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    tableText: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
    },
    discountText: {
        color: '#2E7D32',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primaryDark,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    historyStatus: {
        flex: 1,
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    historyDate: {
        flex: 1,
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
    },
    downloadButton: {
        backgroundColor: Colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
        marginBottom: 12,
    },
    downloadText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    closeButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    closeText: {
        color: '#999',
        fontSize: 16,
        fontWeight: '600',
    },
});
