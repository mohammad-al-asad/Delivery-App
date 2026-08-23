import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';

export default function PaymentSuccessScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="checkmark" size={60} color="#333" />
                </View>

                <Text style={styles.title}>Payment Successful!</Text>
                <Text style={styles.subtitle}>Your order has been placed successfully.</Text>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>#TRX-8859201</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount Paid</Text>
                    <Text style={styles.detailValue}>AED 39.82</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => router.push('/user')}
                >
                    <Text style={styles.secondaryButtonText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    content: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: '#2C3E50',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    subtitle: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginBottom: 40,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16,
    },
    detailLabel: {
        fontSize: 14,
        color: '#999',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },

    footer: {
        gap: 16,
    },
    button: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    secondaryButton: {
        backgroundColor: '#F5F5F5',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
});
