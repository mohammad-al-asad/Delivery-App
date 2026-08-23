import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import { Colors } from '../../../constants/Colors';
import { useGetCommonContentQuery } from '../../../Redux/api/commonApi';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const { data: contentData, isLoading } = useGetCommonContentQuery({});
    const policy = contentData?.data?.privacyPolicy?.trim();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </Animated.View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading latest privacy policy...</Text>
                </View>
            ) : policy ? (
                <WebView
                    originWhitelist={['*']}
                    source={{
                        html: `
                            <html>
                            <head>
                                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                                <style>
                                    body {
                                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                        color: #4a5568;
                                        line-height: 1.6;
                                        font-size: 15px;
                                        padding: 24px;
                                        margin: 0;
                                        background-color: #fff;
                                    }
                                    h1, h2, h3, h4, h5, h6 {
                                        color: #1a202c;
                                        margin-top: 24px;
                                        margin-bottom: 12px;
                                        font-weight: 700;
                                    }
                                    h1 { font-size: 22px; }
                                    h2 { font-size: 18px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
                                    p { margin-bottom: 16px; }
                                    ul, ol { padding-left: 20px; margin-bottom: 16px; }
                                    li { margin-bottom: 8px; }
                                </style>
                            </head>
                            <body>
                                ${policy}
                            </body>
                            </html>
                        `
                    }}
                    style={styles.webview}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Privacy policy is not available right now.</Text>
                </View>
            )}
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
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    webview: {
        flex: 1,
    },
});
