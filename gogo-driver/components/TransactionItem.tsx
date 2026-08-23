import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Transaction } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils/mockData';

interface TransactionItemProps {
    transaction: Transaction;
    onPress?: () => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
    const { type, amount, status, date, description } = transaction;
    const transactionDate = date instanceof Date ? date : new Date(date);

    const getTypeIcon = (): keyof typeof Ionicons.glyphMap => {
        switch (type) {
            case 'ride': return 'car';
            case 'payout': return 'cash';
            case 'bonus': return 'gift';
            case 'adjustment': return 'settings';
            default: return 'document';
        }
    };

    const getTypeColor = () => {
        switch (type) {
            case 'ride': return Colors.primary;
            case 'payout': return Colors.error;
            case 'bonus': return Colors.success;
            case 'adjustment': return Colors.warning;
            default: return Colors.textLight;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'completed': return Colors.success;
            case 'pending': return Colors.warning;
            case 'failed': return Colors.error;
            default: return Colors.textLight;
        }
    };

    const isNegative = amount < 0;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${getTypeColor()}20` }]}>
                <Ionicons name={getTypeIcon()} size={20} color={getTypeColor()} />
            </View>

            <View style={styles.content}>
                <Text style={styles.description}>{description}</Text>
                <View style={styles.metaRow}>
                    <Text style={styles.date}>{formatDate(transactionDate)} • {formatTime(transactionDate)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {status}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.amountContainer}>
                <Text style={[
                    styles.amount,
                    { color: isNegative ? Colors.error : Colors.success }
                ]}>
                    {isNegative ? '-' : '+'}{formatCurrency(amount)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    description: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    date: {
        fontSize: 12,
        color: Colors.textLight,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    amountContainer: {
        marginLeft: 12,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
