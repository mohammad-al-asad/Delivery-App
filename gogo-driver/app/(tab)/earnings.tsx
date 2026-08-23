import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native';
import { TransactionItem } from '../../components/TransactionItem';
import { Colors } from '../../constants/Colors';
import { useGetRiderEarningsQuery } from '../../Redux/api/driverApi';
import { formatCurrency } from '../../utils/mockData';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;
const CHART_HEIGHT = 180;

export default function EarningsScreen() {
    const insets = useSafeAreaInsets();
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
    const { data: earningsData, isLoading, refetch } = useGetRiderEarningsQuery({});

    const earningsRaw = earningsData?.data || {};
    const earnings = {
        total: earningsRaw.total || 0,
        today: earningsRaw.today || 0,
        week: earningsRaw.week || 0,
        month: earningsRaw.month || 0,
        paid: earningsRaw.paid || 0,
        pending: earningsRaw.pending || 0,
        adminDue: earningsRaw.adminDue || 0,
        settlementBalance: earningsRaw.settlementBalance || 0,
        cashPaid: earningsRaw.cashPaid || 0,
        dailyTrend: earningsRaw.dailyTrend || [],
        transactions: earningsRaw.transactions || []
    };
    const hasAdminDue = Number(earnings.adminDue) > 0;
    const settlementLabel = hasAdminDue ? 'You Owe Admin' : 'Admin Owes You';
    const settlementAmount = hasAdminDue ? earnings.adminDue : earnings.pending;

    // Prepare chart data (fill missing days of the week)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const dailyEarnings = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        const dateStr = d.toISOString().split('T')[0];
        const trendItem = (earnings.dailyTrend || []).find((item: any) => item.date === dateStr);
        return {
            date: dateStr,
            day: days[d.getDay()],
            amount: trendItem ? trendItem.amount : 0
        };
    });

    const transactions = earnings.transactions || [];
    
    const maxEarning = Math.max(...dailyEarnings.map(d => d.amount), 1);
    const barWidth = (CHART_WIDTH / dailyEarnings.length) - 8;

    if (isLoading) {
        return (
            <View
                style={[
                    styles.container,
                    styles.loadingContainer,
                    { paddingTop: insets.top, paddingBottom: insets.bottom },
                ]}
            >
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 110 },
                ]}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />
                }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Earnings</Text>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <View style={styles.balanceHeader}>
                    <View>
                        <Text style={styles.balanceLabel}>Total Earnings</Text>
                        <Text style={styles.balanceAmount}>
                            {formatCurrency(earnings.total)}
                        </Text>
                    </View>
                </View>
                <View style={styles.pendingContainer}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.pendingText}>
                        {formatCurrency(earnings.paid)} received
                    </Text>
                </View>
                <View style={styles.pendingContainer}>
                    <Ionicons
                        name={hasAdminDue ? "alert-circle" : "time"}
                        size={16}
                        color={Colors.warning}
                    />
                    <Text style={styles.pendingText}>
                        {formatCurrency(settlementAmount)} {hasAdminDue ? 'you owe admin' : 'admin owes you'}
                    </Text>
                </View>
            </View>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                    onPress={() => setSelectedPeriod('week')}
                >
                    <Text style={[styles.periodText, selectedPeriod === 'week' && styles.periodTextActive]}>
                        This Week
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                    onPress={() => setSelectedPeriod('month')}
                >
                    <Text style={[styles.periodText, selectedPeriod === 'month' && styles.periodTextActive]}>
                        This Month
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Earnings Chart */}
            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Earnings Trend</Text>
                <View style={styles.chart}>
                    <View style={styles.chartBars}>
                        {dailyEarnings.map((day, index) => {
                            const barHeight = (day.amount / maxEarning) * (CHART_HEIGHT - 40);
                            return (
                                <View key={index} style={styles.barContainer}>
                                    <View style={styles.barWrapper}>
                                        <Text style={styles.barAmount}>AED {day.amount.toFixed(0)}</Text>
                                        <View
                                            style={[
                                                styles.bar,
                                                {
                                                    height: barHeight,
                                                    width: barWidth,
                                                    backgroundColor: index === dailyEarnings.length - 1 ? Colors.primary : Colors.gray[300]
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.barLabel}>{day.day}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Breakdown</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Received</Text>
                        <Text style={styles.statValue}>{formatCurrency(earnings.paid)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>{settlementLabel}</Text>
                        <Text
                            style={[
                                styles.statValue,
                                hasAdminDue && styles.adminDueValue,
                            ]}
                        >
                            {formatCurrency(settlementAmount)}
                        </Text>
                    </View>
                </View>
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>Cash Received</Text>
                        <Text style={styles.statValue}>{formatCurrency(earnings.cashPaid)}</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statLabel}>
                            {selectedPeriod === 'week' ? 'This Week' : 'This Month'}
                        </Text>
                        <Text style={styles.statValue}>
                            {formatCurrency(selectedPeriod === 'week' ? earnings.week : earnings.month)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Transaction History */}
            <View style={styles.transactionSection}>
                <View style={styles.transactionHeader}>
                    <Text style={styles.sectionTitle}>Recent Rides</Text>
                </View>
                <View style={styles.transactionList}>
                    {transactions.map((transaction: any) => (
                        <TransactionItem
                            key={transaction.id}
                            transaction={transaction}
                            onPress={() => Alert.alert('Ride Details', `View details for ${transaction.id}`)}
                        />
                    ))}
                    {transactions.length === 0 && (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <Text style={{ color: Colors.textLight }}>No recent transactions</Text>
                        </View>
                    )}
                </View>
            </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        padding: 20,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    balanceCard: {
        margin: 20,
        padding: 24,
        backgroundColor: Colors.primary,
        borderRadius: 16,
    },
    balanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    balanceLabel: {
        fontSize: 14,
        color: Colors.secondary,
        marginBottom: 8,
        opacity: 0.8,
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: 'bold',
        color: Colors.secondary,
    },
    pendingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.secondary,
        opacity: 0.8,
    },
    pendingText: {
        fontSize: 14,
        color: Colors.secondary,
    },
    periodSelector: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    periodText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
    },
    periodTextActive: {
        color: Colors.secondary,
    },
    chartSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 16,
    },
    chart: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    chartBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: CHART_HEIGHT,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        flex: 1,
    },
    bar: {
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    barAmount: {
        fontSize: 10,
        color: Colors.textLight,
        marginBottom: 4,
    },
    barLabel: {
        fontSize: 10,
        color: Colors.textLight,
        marginTop: 8,
    },
    statsSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    adminDueValue: {
        color: Colors.warning,
    },
    statSubtext: {
        fontSize: 10,
        color: Colors.textLight,
    },
    transactionSection: {
        marginBottom: 20,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    transactionList: {
        backgroundColor: Colors.white,
    },
});
