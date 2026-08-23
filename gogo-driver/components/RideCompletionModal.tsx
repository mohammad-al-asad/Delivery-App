import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Button } from './Button';

const { width } = Dimensions.get('window');

interface RideCompletionModalProps {
    visible: boolean;
    onClose: () => void;
    onRate: () => void;
    fare: number;
    tip?: number;
}

export function RideCompletionModal({ visible, onClose, onRate, fare, tip = 0 }: RideCompletionModalProps) {
    const total = fare + tip;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
                    </View>

                    <Text style={styles.title}>Ride Completed!</Text>
                    <Text style={styles.subtitle}>Great job on completing this ride</Text>

                    <View style={styles.earningsCard}>
                        <View style={styles.earningRow}>
                            <Text style={styles.earningLabel}>Fare</Text>
                            <Text style={styles.earningValue}>AED {fare.toFixed(2)}</Text>
                        </View>
                        {tip > 0 && (
                            <View style={styles.earningRow}>
                                <Text style={styles.earningLabel}>Tip</Text>
                                <Text style={[styles.earningValue, { color: Colors.success }]}>
                                    +AED {tip.toFixed(2)}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.earningRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total Earned</Text>
                            <Text style={styles.totalValue}>AED {total.toFixed(2)}</Text>
                        </View>
                    </View>

                    <Button
                        title="Rate Passenger"
                        onPress={onRate}
                        variant="primary"
                        style={styles.rateButton}
                    />

                    <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                        <Text style={styles.skipText}>Skip for now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: width - 48,
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 24,
    },
    earningsCard: {
        width: '100%',
        backgroundColor: Colors.gray[50],
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    earningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    earningLabel: {
        fontSize: 14,
        color: Colors.textLight,
    },
    earningValue: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 12,
        marginTop: 4,
        marginBottom: 0,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    rateButton: {
        width: '100%',
    },
    skipButton: {
        marginTop: 12,
        paddingVertical: 12,
    },
    skipText: {
        fontSize: 14,
        color: Colors.textLight,
    },
});
