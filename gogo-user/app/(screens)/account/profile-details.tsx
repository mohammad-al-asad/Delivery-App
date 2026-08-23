import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile Details</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                
                {/* Personal Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="person" size={16} color="#334155" />
                            </View>
                            <Text style={styles.cardTitle}>Personal Details</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.cardBody}>
                        <Text style={styles.primaryText}>hegderoshan6@gmail.com</Text>
                        <Text style={styles.secondaryText}>Roshan Hegde</Text>
                        <View style={styles.badgeGray}>
                            <Text style={styles.badgeGrayText}>552239345</Text>
                        </View>
                    </View>
                </View>

                {/* UAE Tax Document Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="receipt" size={16} color="#334155" />
                                <View style={styles.percentBadge}>
                                    <Text style={styles.percentText}>%</Text>
                                </View>
                            </View>
                            <Text style={styles.cardTitle}>UAE TAX DOCUMENT</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.editText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.cardBody}>
                        <Text style={styles.primaryText}>FURROO FZE-LLC</Text>
                        <Text style={styles.secondaryText}>
                            Business Centre, Sharjah Publishing City Freezone,
                            Sharjah 73111, Sharjah
                        </Text>
                        <View style={styles.badgeBlue}>
                            <Text style={styles.badgeBlueText}>104143405900003</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F5F9', // Soft light blue-grey
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 10,
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        position: 'relative',
    },
    percentBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: '#334155',
        width: 10,
        height: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    percentText: {
        color: '#fff',
        fontSize: 6,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    editText: {
        color: '#0052cc',
        fontSize: 14,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    cardBody: {
        
    },
    primaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 4,
    },
    secondaryText: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 12,
        lineHeight: 20,
    },
    badgeGray: {
        backgroundColor: '#E2E8F0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeGrayText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '600',
    },
    badgeBlue: {
        backgroundColor: '#E6EFFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    badgeBlueText: {
        color: '#0052cc',
        fontSize: 14,
        fontWeight: '700',
    },
});
