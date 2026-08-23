import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Linking } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '../../../constants/Colors';
import { useGetCommonContentQuery } from '@/Redux/api/commonApi';

export default function HelpCenterScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const { data: commonData, isLoading } = useGetCommonContentQuery({});

    const faqs = commonData?.data?.faqs || [];
    const contactPhone = commonData?.data?.contactUs?.phone || '+971 50 123 4567';

    const filteredFAQs = faqs.filter((faq: any) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCallSupport = () => {
        Linking.openURL(`tel:${contactPhone}`);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <Animated.View
                entering={FadeInUp.delay(100).duration(600)}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help Center</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.delay(200).duration(600)}>
                    {/* Search */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#999" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search for help..."
                            placeholderTextColor="#999"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Quick Actions */}
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/driver/contact-us')}
                        >
                            <View style={styles.actionIcon}>
                                <Ionicons name="chatbubble-ellipses" size={24} color={Colors.primaryDark} />
                            </View>
                            <Text style={styles.actionTitle}>Contact Us</Text>
                            <Text style={styles.actionSubtitle}>Get in touch</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleCallSupport}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="call" size={24} color={Colors.primaryDark} />
                            </View>
                            <Text style={styles.actionTitle}>Call Support</Text>
                            <Text style={styles.actionSubtitle}>24/7 Available</Text>
                        </TouchableOpacity>
                    </View>

                    {/* FAQs */}
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

                    {isLoading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={Colors.primaryDark} />
                            <Text style={{ marginTop: 10, color: '#999' }}>Loading FAQs...</Text>
                        </View>
                    ) : filteredFAQs.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color="#ccc" />
                            <Text style={styles.emptyText}>No results found</Text>
                            <Text style={styles.emptySubtext}>Try a different search term</Text>
                        </View>
                    ) : (
                        filteredFAQs.map((faq: any, index: number) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(300 + index * 50).duration(600)}
                            >
                                <TouchableOpacity
                                    style={styles.faqCard}
                                    onPress={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.faqHeader}>
                                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                                        <Ionicons
                                            name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                                            size={20}
                                            color="#999"
                                        />
                                    </View>
                                    {expandedIndex === index && (
                                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}

                    <View style={{ height: 40 }} />
                </Animated.View>
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        marginTop: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 15,
        color: Colors.text,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    actionCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    actionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0FFF0',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#999',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    faqCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginRight: 12,
    },
    faqAnswer: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#999',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 4,
    },
});
