
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { useAddReviewMutation } from '../../../Redux/api/orderApi';

export default function RateDriverScreen() {
    const router = useRouter();
    const { orderId, driverName } = useLocalSearchParams<{ orderId: string; driverName: string }>();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [addReview, { isLoading }] = useAddReviewMutation();

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Error", "Please select a star rating");
            return;
        }

        if (!orderId) {
            Alert.alert("Error", "Missing order ID");
            return;
        }

        try {
            await addReview({
                orderId,
                rating,
                comment: comment.trim() || undefined,
            }).unwrap();

            Alert.alert(
                "Thank You!",
                "Your feedback helps us improve our service.",
                [
                    { text: "OK", onPress: () => router.back() }
                ]
            );
        } catch (error: any) {
            Alert.alert("Error", error?.data?.message || "Failed to submit review");
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.delay(100).duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rate Driver</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.driverSection}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name="person" size={40} color={Colors.primaryDark} />
                    </View>
                    <Text style={styles.driverName}>{driverName || "Driver"}</Text>
                    <Text style={styles.driverRole}>Delivery Partner</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.ratingSection}>
                    <Text style={styles.question}>How was your delivery?</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={rating >= star ? "star" : "star-outline"}
                                    size={40}
                                    color={rating >= star ? "#FFB800" : "#E0E0E0"}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.inputSection}>
                    <Text style={styles.label}>Additional Comments (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Write your experience here..."
                        placeholderTextColor="#ccc"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={comment}
                        onChangeText={setComment}
                    />
                </Animated.View>
            </ScrollView>

            <Animated.View entering={FadeInUp.delay(500).duration(600)} style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.submitButton, (isLoading || rating === 0) && styles.disabledButton]} 
                    onPress={handleSubmit}
                    disabled={isLoading || rating === 0}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.submitText}>Submit Review</Text>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        padding: 24,
    },
    driverSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    driverName: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    driverRole: {
        fontSize: 14,
        color: '#999',
        fontWeight: '600',
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    question: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 20,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    inputSection: {
        width: '100%',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
    },
    input: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        height: 120,
        fontSize: 16,
        color: Colors.text,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    submitButton: {
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    disabledButton: {
        opacity: 0.5,
    }
});
