import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';

const SAVED_CARDS = [
    { id: '1', type: 'Visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: '2', type: 'Mastercard', last4: '5678', expiry: '08/24', isDefault: false },
];

export default function CardsScreen() {
    const router = useRouter();
    const [cards] = useState(SAVED_CARDS);

    const getCardIcon = (type: string) => {
        return type === 'Visa' ? 'card' : 'card-outline';
    };

    const getCardColor = (type: string) => {
        return type === 'Visa' ? '#1A1F71' : '#EB001B';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.delay(100).duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cards</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Add New Card Button */}
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    <TouchableOpacity style={styles.addCardButton} activeOpacity={0.7}>
                        <View style={styles.addCardIcon}>
                            <Ionicons name="add" size={28} color={Colors.primaryDark} />
                        </View>
                        <View style={styles.addCardText}>
                            <Text style={styles.addCardTitle}>Add New Card</Text>
                            <Text style={styles.addCardSubtitle}>Link your debit or credit card</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#E0E0E0" />
                    </TouchableOpacity>
                </Animated.View>

                {/* Saved Cards */}
                <Text style={styles.sectionTitle}>Saved Cards</Text>

                {cards.map((card, index) => (
                    <Animated.View
                        key={card.id}
                        entering={FadeInDown.delay(300 + index * 100).duration(600)}
                    >
                        <View style={styles.cardItem}>
                            <View style={[styles.cardIconContainer, { backgroundColor: getCardColor(card.type) + '20' }]}>
                                <Ionicons
                                    name={getCardIcon(card.type) as any}
                                    size={28}
                                    color={getCardColor(card.type)}
                                />
                            </View>

                            <View style={styles.cardInfo}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardType}>{card.type}</Text>
                                    {card.isDefault && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultText}>Default</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.cardNumber}>•••• {card.last4}</Text>
                                <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
                            </View>

                            <TouchableOpacity style={styles.menuButton}>
                                <Ionicons name="ellipsis-vertical" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                ))}

                {cards.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="card-outline" size={80} color="#E0E0E0" />
                        <Text style={styles.emptyTitle}>No Cards Added</Text>
                        <Text style={styles.emptyMessage}>
                            Add your debit or credit card to make payments easier
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    scrollContent: {
        padding: 24,
    },
    addCardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    addCardIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    addCardText: {
        flex: 1,
    },
    addCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    addCardSubtitle: {
        fontSize: 13,
        color: '#999',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 16,
    },
    cardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    cardInfo: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    cardType: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    defaultBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#000',
    },
    cardNumber: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    cardExpiry: {
        fontSize: 12,
        color: '#999',
    },
    menuButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        marginTop: 24,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 40,
    },
});
