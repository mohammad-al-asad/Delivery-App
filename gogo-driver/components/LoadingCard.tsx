import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withRepeat,
    withTiming,
    useSharedValue,
    withSequence,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { useEffect } from 'react';

interface LoadingCardProps {
    height?: number;
}

export function LoadingCard({ height = 120 }: LoadingCardProps) {
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.3, { duration: 1000 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <View style={[styles.container, { height }]}>
            <Animated.View style={[styles.skeleton, animatedStyle]}>
                <View style={styles.skeletonHeader}>
                    <View style={styles.skeletonCircle} />
                    <View style={styles.skeletonLines}>
                        <View style={[styles.skeletonLine, { width: '60%' }]} />
                        <View style={[styles.skeletonLine, { width: '40%' }]} />
                    </View>
                </View>
                <View style={styles.skeletonBody}>
                    <View style={[styles.skeletonLine, { width: '80%' }]} />
                    <View style={[styles.skeletonLine, { width: '90%' }]} />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginHorizontal: 20,
        marginVertical: 8,
        overflow: 'hidden',
    },
    skeleton: {
        flex: 1,
        padding: 16,
    },
    skeletonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    skeletonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.gray[200],
        marginRight: 12,
    },
    skeletonLines: {
        flex: 1,
    },
    skeletonLine: {
        height: 12,
        backgroundColor: Colors.gray[200],
        borderRadius: 6,
        marginBottom: 8,
    },
    skeletonBody: {
        marginTop: 8,
    },
});
