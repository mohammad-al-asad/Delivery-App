
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { Colors } from '../constants/Colors';

interface CancelOrderModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

const CANCEL_REASONS = [
    "Changed my mind",
    "Driver is too far",
    "Wait time is too long",
    "Found another ride",
    "Driver asked to cancel",
    "Other"
];

export default function CancelOrderModal({ visible, onClose, onConfirm }: CancelOrderModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>

                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

                <Animated.View
                    entering={SlideInDown.duration(250)}
                    style={styles.modalContainer}
                >
                    <View style={styles.handle} />

                    <Text style={styles.title}>Cancel Order?</Text>
                    <Text style={styles.subtitle}>Please select a reason for cancellation. A cancellation fee may apply.</Text>

                    <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
                        {CANCEL_REASONS.map((reason, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.reasonItem,
                                    selectedReason === reason && styles.reasonItemSelected
                                ]}
                                onPress={() => setSelectedReason(reason)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.reasonText,
                                    selectedReason === reason && styles.reasonTextSelected
                                ]}>{reason}</Text>
                                <View style={[
                                    styles.radioButton,
                                    selectedReason === reason && styles.radioButtonSelected
                                ]}>
                                    {selectedReason === reason && <View style={styles.radioInner} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.keepButton} onPress={onClose}>
                            <Text style={styles.keepButtonText}>Do not Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                !selectedReason && styles.cancelButtonDisabled
                            ]}
                            onPress={() => selectedReason && onConfirm(selectedReason)}
                            disabled={!selectedReason}
                        >
                            <Text style={styles.cancelButtonText}>Cancel Order</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    reasonsList: {
        marginBottom: 24,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    reasonItemSelected: {
        backgroundColor: '#FFF5F5', // Light red tint for selected
        marginHorizontal: -12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderBottomWidth: 0,
    },
    reasonText: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: '500',
    },
    reasonTextSelected: {
        color: '#FF5252', // Red text
        fontWeight: '700',
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioButtonSelected: {
        borderColor: '#FF5252',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF5252',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
    },
    keepButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    keepButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: '#FF5252',
        alignItems: 'center',
    },
    cancelButtonDisabled: {
        backgroundColor: '#FFCDD2', // Lighter red
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
});
