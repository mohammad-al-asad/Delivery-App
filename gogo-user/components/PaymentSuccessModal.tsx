import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface PaymentSuccessModalProps {
    visible: boolean;
    onClose: () => void;
    amount?: string;
    isCash?: boolean;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
    visible,
    onClose,
    amount = 'AED 39.82',
    isCash = false,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    entering={ZoomIn.duration(400).springify()}
                    style={styles.modalContainer}
                >
                    <Animated.View
                        entering={ZoomIn.delay(200).duration(600).springify()}
                        style={styles.iconContainer}
                    >
                        <View style={styles.successCircle}>
                            <Ionicons name="checkmark" size={60} color="#fff" />
                        </View>
                    </Animated.View>

                    <Animated.Text
                        entering={FadeInDown.delay(400).duration(600)}
                        style={styles.title}
                    >
                        {isCash ? 'Order Confirmed!' : 'Payment Successful!'}
                    </Animated.Text>

                    <Animated.Text
                        entering={FadeInDown.delay(500).duration(600)}
                        style={styles.subtitle}
                    >
                        Your order has been placed successfully
                    </Animated.Text>

                    <Animated.View
                        entering={FadeInDown.delay(600).duration(600)}
                        style={styles.amountContainer}
                    >
                        <Text style={styles.amountLabel}>{isCash ? 'Amount to Pay' : 'Amount Paid'}</Text>
                        <Text style={styles.amountValue}>{amount}</Text>
                    </Animated.View>

                    <Animated.View
                        entering={FadeInDown.delay(700).duration(600)}
                        style={styles.buttonContainer}
                    >
                        <TouchableOpacity
                            style={styles.button}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.buttonText}>Track Order</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: 24,
    },
    successCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    amountContainer: {
        width: '100%',
        backgroundColor: '#F9F9F9',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
    },
    amountLabel: {
        fontSize: 14,
        color: '#999',
        marginBottom: 4,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#000',
    },
});
