import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string | number;
    trend?: number; // percentage change
    iconColor?: string;
    style?: StyleProp<ViewStyle>;
}

export function StatCard({ icon, label, value, trend, iconColor = Colors.primary, style }: StatCardProps) {
    const getTrendColor = () => {
        if (!trend) return Colors.textLight;
        return trend > 0 ? Colors.success : Colors.error;
    };

    const getTrendIcon = () => {
        if (!trend) return null;
        return trend > 0 ? 'trending-up' : 'trending-down';
    };

    return (
        <View style={[styles.card, style]}>
            <View style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
            {trend !== undefined && (
                <View style={styles.trendContainer}>
                    <Ionicons name={getTrendIcon()!} size={14} color={getTrendColor()} />
                    <Text style={[styles.trendText, { color: getTrendColor() }]}>
                        {Math.abs(trend)}%
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    value: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    label: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: 'center',
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 8,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
