import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useGetOrdersQuery } from '../../Redux/api/orderApi';
import { DropoffIcon, PickupIcon } from '../../components/LocationIcons';
import { Colors } from '../../constants/Colors';
import { getOrderArray, getOrderTotal, toOrderItem } from '../../utils/orderFormatters';

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'Delivered':
            return {
                bg: '#E8F5E9',
                text: '#2E7D32',
                icon: 'checkmark-circle' as const
            };
        case 'In Transit':
            return {
                bg: '#E3F2FD',
                text: '#1565C0',
                icon: 'bicycle' as const
            };
        case 'Cancelled':
            return {
                bg: '#FFEBEE',
                text: '#C62828',
                icon: 'close-circle' as const
            };
        default:
            return {
                bg: '#F5F5F5',
                text: '#616161',
                icon: 'time' as const
            };
    }
};

export default function OrdersScreen() {
    const router = useRouter();
    const { data, isError, isFetching, refetch } = useGetOrdersQuery({
        page: 1,
        limit: 20,
    });
    console.log(data, "DATA");

    const orders = getOrderArray(data).map(toOrderItem);
    const totalOrders = getOrderTotal(data);

    const renderOrder = (item: ReturnType<typeof toOrderItem>, index: number) => {
        const statusConfig = getStatusConfig(item.status);

        return (
            <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 100).duration(600)}
            >
                <TouchableOpacity
                    style={styles.orderCard}
                    onPress={() => {
                        const activeStatuses = ['Pending', 'Accepted', 'ArrivedPickup', 'InProgress'];
                        if (activeStatuses.includes(item.status)) {
                            router.push(`/orders/running-order?id=${item.id}`);
                        } else {
                            router.push(`/orders/order-details?id=${item.id}`);
                        }
                    }}
                    activeOpacity={0.7}
                >
                    {/* Header */}
                    <View style={styles.orderHeader}>
                        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                            <Ionicons name={statusConfig.icon} size={16} color={statusConfig.text} />
                            <Text style={[styles.statusText, { color: statusConfig.text }]}>
                                {item.status}
                            </Text>
                        </View>
                        <Text style={styles.orderId}>{item.orderId}</Text>
                    </View>

                    {/* Locations */}
                    <View style={styles.locationContainer}>
                        <View style={styles.locationRow}>
                            <PickupIcon size={20} />
                            <View style={styles.locationTextContainer}>
                                <Text style={styles.locationLabel}>Pickup</Text>
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {item.from}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.connector} />

                        <View style={styles.locationRow}>
                            <DropoffIcon size={20} />
                            <View style={styles.locationTextContainer}>
                                <Text style={styles.locationLabel}>Dropoff</Text>
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {item.to}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Footer */}
                    <View style={styles.footer}>
                        <View style={styles.footerLeft}>
                            <Ionicons name="calendar-outline" size={14} color="#999" />
                            <Text style={styles.dateText}>{item.date} • {item.time}</Text>
                        </View>
                        <View style={styles.footerRight}>
                            <View style={styles.vehicleBadge}>
                                <Ionicons name="car-outline" size={12} color={Colors.primaryDark} />
                                <Text style={styles.vehicleText}>{item.vehicle}</Text>
                            </View>
                            <Text style={styles.price}>{item.price}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            <View style={styles.header}>
                <Text style={styles.title}>My Orders</Text>
                <Text style={styles.subtitle}>{totalOrders} orders in total</Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} />
                }
            >
                {isFetching && orders.length === 0 && (
                    <View style={styles.emptyState}>
                        <ActivityIndicator color={Colors.primaryDark} />
                    </View>
                )}

                {isError && orders.length === 0 && (
                    <TouchableOpacity
                        style={styles.emptyState}
                        onPress={refetch}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="bag-handle-outline" size={72} color="#E0E0E0" />
                        <Text style={styles.emptyTitle}>No Orders Yet</Text>
                        <Text style={styles.emptyMessage}>There is no order yet</Text>
                    </TouchableOpacity>
                )}

                {!isFetching && !isError && orders.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="bag-handle-outline" size={72} color="#E0E0E0" />
                        <Text style={styles.emptyTitle}>No Orders Yet</Text>
                        <Text style={styles.emptyMessage}>There is no order yet</Text>
                    </View>
                )}

                {orders.map((item, index) => renderOrder(item, index))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingTop: 40,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#999',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
        gap: 12,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
    },
    orderId: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
    },
    locationContainer: {
        marginBottom: 12,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    locationText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    connector: {
        height: 16,
        width: 2,
        backgroundColor: '#E0E0E0',
        marginLeft: 9,
        marginVertical: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        fontSize: 12,
        color: '#999',
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    vehicleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F0FFF0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    vehicleText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.primaryDark,
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 20,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
});
